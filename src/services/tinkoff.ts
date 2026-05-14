const BASE_URL = 'https://www.tbank.ru/api'

interface CommonResponse<T> {
  resultCode: string
  errorMessage?: string
  payload: T
  operationTicket?: string
}

async function apiCall<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  sessionId?: string
): Promise<CommonResponse<T>> {
  const url = new URL(BASE_URL + path)
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '') url.searchParams.set(key, String(val))
  }
  if (sessionId) url.searchParams.set('sessionId', sessionId)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'application/json',
      'Referer': 'https://www.tbank.ru/',
      'Origin': 'https://www.tbank.ru',
    },
  })

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

export interface TinkoffSession {
  sessionId: string
}

export async function createSession(): Promise<TinkoffSession> {
  const resp = await apiCall<string>('/common/v1/session', {})
  return { sessionId: resp.payload }
}

export async function phoneSignUp(
  sessionId: string,
  phone: string
): Promise<{ operationTicket: string }> {
  const resp = await apiCall<unknown>('/common/v1/sign_up', { phone }, sessionId)
  if (resp.resultCode !== 'WAITING_CONFIRMATION') {
    throw new Error('Не удалось отправить SMS: ' + (resp.errorMessage || resp.resultCode))
  }
  return { operationTicket: resp.operationTicket || '' }
}

export async function confirmSms(
  sessionId: string,
  code: string,
  operationTicket: string
): Promise<void> {
  const resp = await apiCall<unknown>(
    '/common/v1/confirm',
    {
      initialOperation: 'sign_up',
      initialOperationTicket: operationTicket,
      confirmationData: JSON.stringify({ SMSBYID: code }),
    },
    sessionId
  )
  if (resp.resultCode !== 'OK') {
    throw new Error('Неверный код: ' + (resp.errorMessage || resp.resultCode))
  }
}

export async function passwordSignUp(
  sessionId: string,
  password: string
): Promise<void> {
  const resp = await apiCall<unknown>('/common/v1/sign_up', { password }, sessionId)
  if (resp.resultCode !== 'OK') {
    throw new Error('Ошибка пароля: ' + (resp.errorMessage || resp.resultCode))
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
  const resp = await apiCall<TinkoffAccount[]>('/common/v1/accounts_light_ib', {}, sessionId)
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

  const resp = await apiCall<TinkoffOperation[]>('/common/v1/operations', params, sessionId)
  return resp.payload || []
}

export interface TinkoffPingResult {
  accessLevel: string
}

export async function ping(sessionId: string): Promise<TinkoffPingResult> {
  const resp = await apiCall<TinkoffPingResult>('/common/v1/ping', {}, sessionId)
  return resp.payload
}
