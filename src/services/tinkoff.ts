const BASE_URL = 'https://www.tbank.ru/api'
const WORKER_URL = process.env.TINKOFF_WORKER_URL || ''
const WORKER_AUTH_TOKEN = process.env.WORKER_AUTH_TOKEN || 'changeme'

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

async function workerFetch(path: string, body: any, retries = 2): Promise<any> {
  if (!WORKER_URL) {
    throw new Error('TINKOFF_WORKER_URL не настроен. Деплойте worker/ на Render/Railway.')
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    let res: Response
    try {
      res = await fetch(`${WORKER_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WORKER_AUTH_TOKEN}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000),
      })
    } catch {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 5000))
        continue
      }
      throw new Error('Воркер не отвечает. Подождите минуту (Render просыпается) и попробуйте снова.')
    }

    const text = await res.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      if (attempt < retries && (text.includes('<html') || text.includes('<!DOCTYPE'))) {
        await new Promise(r => setTimeout(r, 5000))
        continue
      }
      throw new Error('Воркер вернул не JSON. Возможно, Render ещё просыпается — подождите минуту.')
    }

    if (!res.ok) throw new Error(data.error || 'Ошибка')

    return data
  }

  throw new Error('Воркер не отвечает после нескольких попыток.')
}

export async function startLogin(phone: string): Promise<{ workerSessionId: string }> {
  const data = await workerFetch('/start', { phone })
  return { workerSessionId: data.sessionId }
}

export async function confirmLogin(workerSessionId: string, code: string): Promise<{ sessionId: string }> {
  const data = await workerFetch('/confirm', { sessionId: workerSessionId, code })
  return { sessionId: data.sessionId }
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
