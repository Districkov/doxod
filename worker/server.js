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

app.post('/login', auth, async (req, res) => {
  const { phone, password } = req.body
  if (!phone || !password) {
    return res.status(400).json({ error: 'phone and password required' })
  }

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

    await page.waitForSelector('input[name="phone"], input[inputmode="tel"], input[placeholder*="телефон"]', { timeout: 10000 })
      .catch(() => null)

    const phoneInput = await page.$('input[name="phone"], input[inputmode="tel"], input[placeholder*="телефон"]')
    if (phoneInput) {
      await phoneInput.click({ clickCount: 3 })
      await phoneInput.type(phone, { delay: 50 })
    }

    await page.waitForSelector('button[type="submit"], button[data-qa-file="loginForm"] button', { timeout: 5000 })
      .catch(() => null)

    const submitBtn = await page.$('button[type="submit"], button[data-qa-file="loginForm"] button')
    if (submitBtn) await submitBtn.click()

    await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 15000 })
      .catch(() => null)

    const passwordInput = await page.$('input[type="password"], input[name="password"]')
    if (passwordInput) {
      await passwordInput.type(password, { delay: 50 })
    }

    const pwSubmitBtn = await page.$('button[type="submit"], button[data-qa-file="loginForm"] button')
    if (pwSubmitBtn) await pwSubmitBtn.click()

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      .catch(() => new Promise(r => setTimeout(r, 5000)))

    const cookies = await page.cookies('https://www.tbank.ru')
    const sessionCookie = cookies.find(c => c.name === 'sessionId' || c.name === 'sso_sid')

    if (!sessionCookie?.value) {
      const html = await page.content()
      const hasError = html.includes('Неверный') || html.includes('Ошибка') || html.includes('error')
      return res.status(400).json({ error: hasError ? 'Неверный телефон или пароль' : 'Не удалось получить sessionId' })
    }

    res.json({ sessionId: sessionCookie.value })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Unknown error' })
  } finally {
    if (browser) await browser.close()
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`Tinkoff worker listening on ${port}`))
