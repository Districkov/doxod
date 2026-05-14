const express = require('express')
const puppeteer = require('puppeteer-core')
const chromium = require('@sparticuz/chromium')

const app = express()
app.use(express.json())

const AUTH_TOKEN = process.env.WORKER_AUTH_TOKEN || 'changeme'

function auth(req, res, next) {
  if (req.headers.authorization !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  next()
}

async function getChromiumPath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  try {
    return await chromium.executablePath()
  } catch {
    const paths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ]
    for (const p of paths) {
      try {
        require('fs').accessSync(p)
        return p
      } catch {}
    }
    throw new Error('Chrome not found')
  }
}

const sessions = new Map()

function cleanupOldSessions() {
  const now = Date.now()
  for (const [id, s] of sessions) {
    if (now - s.createdAt > 300000) {
      s.browser?.close().catch(() => {})
      sessions.delete(id)
    }
  }
}

setInterval(cleanupOldSessions, 60000)

app.post('/start', auth, async (req, res) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'phone required' })

  let browser
  try {
    const executablePath = await getChromiumPath()
    const isServerless = !!process.env.VERCEL || !!process.env.RENDER || !!process.env.RAILWAY_ENVIRONMENT

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: isServerless
        ? [...chromium.args, '--disable-gpu', '--disable-dev-shm-usage']
        : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    await page.setViewport({ width: 1280, height: 800 })

    await page.goto('https://www.tbank.ru/login/', { waitUntil: 'networkidle2', timeout: 30000 })

    await page.waitForSelector('input[name="phone"], input[inputmode="tel"], input[placeholder*="телефон"], input[type="tel"]', { timeout: 10000 })

    const phoneInput = await page.$('input[name="phone"], input[inputmode="tel"], input[placeholder*="телефон"], input[type="tel"]')
    if (!phoneInput) {
      await browser.close()
      return res.status(400).json({ error: 'Не найдено поле ввода телефона' })
    }

    await phoneInput.click({ clickCount: 3 })
    await phoneInput.type(phone, { delay: 50 })

    await page.waitForSelector('button[type="submit"], button[data-qa-file="loginForm"] button, button[data-qa-type="button"]', { timeout: 5000 })

    const submitBtn = await page.$('button[type="submit"], button[data-qa-file="loginForm"] button, button[data-qa-type="button"]')
    if (submitBtn) await submitBtn.click()

    const sessionId = crypto.randomUUID()
    sessions.set(sessionId, { browser, page, createdAt: Date.now() })

    res.json({ status: 'sms_sent', sessionId })
  } catch (e) {
    if (browser) await browser.close()
    res.status(500).json({ error: e.message || 'Unknown error' })
  }
})

app.post('/confirm', auth, async (req, res) => {
  const { sessionId, code } = req.body
  if (!sessionId || !code) return res.status(400).json({ error: 'sessionId and code required' })

  const s = sessions.get(sessionId)
  if (!s) return res.status(400).json({ error: 'Сессия истекла. Начните заново.' })

  try {
    const { page, browser } = s

    await page.waitForSelector('input[name="code"], input[inputmode="numeric"], input[placeholder*="код"], input[type="text"]', { timeout: 10000 })

    const codeInput = await page.$('input[name="code"], input[inputmode="numeric"], input[placeholder*="код"], input[type="text"]')
    if (!codeInput) {
      throw new Error('Не найдено поле ввода кода')
    }

    await codeInput.click({ clickCount: 3 })
    await codeInput.type(code, { delay: 50 })

    const submitBtn = await page.$('button[type="submit"], button[data-qa-type="button"]')
    if (submitBtn) await submitBtn.click()

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      .catch(() => new Promise(r => setTimeout(r, 5000)))

    const cookies = await page.cookies('https://www.tbank.ru')
    const sessionCookie = cookies.find(c => c.name === 'sessionId' || c.name === 'sso_sid')

    if (!sessionCookie?.value) {
      const html = await page.content()
      const hasError = html.includes('Неверный') || html.includes('неверный') || html.includes('Ошибка')
      throw new Error(hasError ? 'Неверный SMS-код' : 'Не удалось войти. Попробуйте снова.')
    }

    sessions.delete(sessionId)
    await browser.close()

    res.json({ sessionId: sessionCookie.value })
  } catch (e) {
    if (e.message.includes('Неверный') || e.message.includes('Не удалось')) {
      res.status(400).json({ error: e.message })
    } else {
      sessions.delete(sessionId)
      s.browser.close().catch(() => {})
      res.status(500).json({ error: e.message || 'Unknown error' })
    }
  }
})

app.get('/', (req, res) => res.json({ service: 'tinkoff-worker', status: 'ok' }))
app.get('/health', (req, res) => res.json({ ok: true }))

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`Tinkoff worker listening on ${port}`))
