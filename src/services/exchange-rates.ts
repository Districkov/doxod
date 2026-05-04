import { prisma } from '@/lib/prisma'
import type { Currency } from '@/generated/prisma'

const FALLBACK_RATES: Record<string, number> = {
  'RUB_USD': 0.011,
  'RUB_EUR': 0.010,
  'RUB_GBP': 0.0087,
  'RUB_KZT': 5.0,
  'RUB_UAH': 0.44,
  'USD_RUB': 90,
  'USD_EUR': 0.92,
  'USD_GBP': 0.79,
  'USD_KZT': 455,
  'USD_UAH': 39.5,
  'EUR_RUB': 98,
  'EUR_USD': 1.09,
  'EUR_GBP': 0.86,
  'EUR_KZT': 495,
  'EUR_UAH': 43,
  'GBP_RUB': 114,
  'GBP_USD': 1.27,
  'GBP_EUR': 1.16,
  'GBP_KZT': 573,
  'GBP_UAH': 50,
  'KZT_RUB': 0.20,
  'KZT_USD': 0.0022,
  'KZT_EUR': 0.0020,
  'KZT_GBP': 0.0017,
  'KZT_UAH': 0.087,
  'UAH_RUB': 2.28,
  'UAH_USD': 0.025,
  'UAH_EUR': 0.023,
  'UAH_GBP': 0.020,
  'UAH_KZT': 11.4,
}

async function fetchLiveRates(base: Currency): Promise<Record<string, number> | null> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://api.exchangerate.host/latest?base=${base}&access_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.rates ?? null
  } catch {
    return null
  }
}

export async function getExchangeRate(from: Currency, to: Currency): Promise<number> {
  if (from === to) return 1

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cached = await prisma.exchangeRate.findFirst({
    where: { from, to, date: { gte: today } },
    orderBy: { date: 'desc' },
  })

  if (cached) return cached.rate

  const rates = await fetchLiveRates(from)
  if (rates && rates[to]) {
    const rate = rates[to]

    await prisma.exchangeRate.upsert({
      where: { from_to_date: { from, to, date: today } },
      update: { rate },
      create: { from, to, rate, date: today },
    })

    return rate
  }

  const key = `${from}_${to}`
  return FALLBACK_RATES[key] ?? 1
}

export async function refreshRates(): Promise<void> {
  const currencies: Currency[] = ['RUB', 'USD', 'EUR', 'GBP', 'KZT', 'UAH']
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const from of currencies) {
    const rates = await fetchLiveRates(from)
    if (!rates) continue

    for (const to of currencies) {
      if (from === to) continue
      const rate = rates[to]
      if (!rate) continue

      await prisma.exchangeRate.upsert({
        where: { from_to_date: { from, to, date: today } },
        update: { rate },
        create: { from, to, rate, date: today },
      })
    }
  }
}
