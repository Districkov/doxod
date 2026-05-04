import type { Currency } from '@/generated/prisma'

const FIXED_RATES: Record<string, Record<string, number>> = {
  RUB: { RUB: 1, USD: 0.011, EUR: 0.010, GBP: 0.0086, KZT: 5.5, UAH: 0.44 },
  USD: { RUB: 91, USD: 1, EUR: 0.92, GBP: 0.79, KZT: 500, UAH: 40 },
  EUR: { RUB: 99, USD: 1.09, EUR: 1, GBP: 0.86, KZT: 545, UAH: 43.5 },
  GBP: { RUB: 115, USD: 1.27, EUR: 1.16, GBP: 1, KZT: 633, UAH: 50.5 },
  KZT: { RUB: 0.18, USD: 0.002, EUR: 0.0018, GBP: 0.0016, KZT: 1, UAH: 0.08 },
  UAH: { RUB: 2.27, USD: 0.025, EUR: 0.023, GBP: 0.020, KZT: 12.5, UAH: 1 },
}

const liveRatesCache: Map<string, { rates: Record<string, number>; ts: number }> = new Map()
const CACHE_TTL = 3600_000

export async function getLiveRate(from: Currency, to: Currency): Promise<number | null> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY
  if (!apiKey) return null

  const cacheKey = from
  const cached = liveRatesCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.rates[to] ?? null
  }

  try {
    const res = await fetch(
      `https://api.exchangerate.host/latest?base=${from}&access_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const rates = data.rates
    if (!rates) return null

    liveRatesCache.set(cacheKey, { rates, ts: Date.now() })
    return rates[to] ?? null
  } catch {
    return null
  }
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency = 'RUB' as Currency
): number {
  if (from === to) return amount
  const rate = FIXED_RATES[from]?.[to]
  if (!rate) throw new Error(`No rate for ${from} -> ${to}`)
  return Math.round(amount * rate * 100) / 100
}

export async function convertCurrencyLive(
  amount: number,
  from: Currency,
  to: Currency = 'RUB' as Currency
): Promise<number> {
  if (from === to) return amount

  const liveRate = await getLiveRate(from, to)
  if (liveRate) {
    return Math.round(amount * liveRate * 100) / 100
  }

  return convertCurrency(amount, from, to)
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    RUB: '₽', USD: '$', EUR: '€', GBP: '£', KZT: '₸', UAH: '₴',
  }
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbols[currency]}`
}
