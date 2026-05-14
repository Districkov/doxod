import puppeteer from 'puppeteer-core'

const BASE_URL = 'https://www.tbank.ru/api'

function getChromiumPath(): string {
  const paths = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ]
  for (const p of paths) {
    if (p) return p
  }
  return '/usr/bin/google-chrome'
}

interface ApiCookies {
  sessionId?: string
}

function makeCookieHeader(cookies: ApiCookies): string {
  const parts: string[] = []
  if (cookies.sessionId) parts.push(`sessionId=${cookies.sessionId}`)
  return parts.join('; ')
}

interface CommonResponse<T> {
  resultCode: string
  errorMessage?: string
  payload: T
  operationTicket?: string
}

async function apiCall<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  cookies: ApiCookies
): Promise<CommonResponse<T>> {
  const url = new URL(BASE_URL + path)
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '') url.searchParams.set(key, String(val))
  }
  if (cookies.sessionId) url.searchParams.set('sessionId', cookies.sessionId)

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Referer': 'https://www.tbank.ru/',
    'Origin': 'https://www.tbank.ru',
  }
  const cookieStr = makeCookieHeader(cookies)
  if (cookieStr) headers['Cookie'] = cookieStr

  const res = await fetch(url.toString(), { method: 'GET', headers })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tinkoff API ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  if (data.resultCode && data.resultCode !== 'OK' && data.resultCode !== 'WAITING_CONFIRMATION') {
    throw new Error(`Tinkoff ${data.resultCode}: ${data.errorMessage || 'unknown'}`)
  }

  return data
}

export async function loginWithPuppeteer(
  phone: string,
  password: string
): Promise<{ sessionId: string }> {
  const browser = await puppeteer.launch({
    executablePath: getChromiumPath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })

  try {
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
      throw new Error(hasError ? 'Неверный телефон или пароль' : 'Не удалось получить sessionId. Проверьте телефон/пароль.')
    }

    return { sessionId: sessionCookie.value }
  } finally {
    await browser.close()
  }
}

export interface TinkoffAccount {
  id: string
  name: string
  accountType: string
  moneyAmount?: { value: number; currency: { code: number; name: string; strCode: string } }
  cards?: { id: string; name: string; value: string }[]
}

export async function getAccounts(sessionId: string): Promise<TinkoffAccount[]> {
  const resp = await apiCall<TinkoffAccount[]>('/common/v1/accounts_light_ib', {}, { sessionId })
  return resp.payload || []
}

export interface TinkoffOperation {
  id: string
  type: string
  description: string
  amount: { value: number; currency: { code: number; name: string; strCode: string } }
  accountAmount: { value: number; currency: { code: number; name: string; strCode: string } }
  mcc: number
  mccString: string
  operationTime: { milliseconds: number }
  merchant?: { name: string; region?: { city?: string; country?: string } }
  category: { id: string; name: string }
  spendingCategory: { id: string; name: string }
  status: string
  account: string
}

export async function getOperations(
  sessionId: string,
  accountId: string,
  from: Date,
  to?: Date
): Promise<TinkoffOperation[]> {
  const params: Record<string, string | number | undefined> = {
    account: accountId,
    start: from.getTime(),
  }
  if (to) params.end = to.getTime()

  const resp = await apiCall<TinkoffOperation[]>('/common/v1/operations', params, { sessionId })
  return resp.payload || []
}
