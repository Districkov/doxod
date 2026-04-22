import { Currency } from '@/generated/prisma'

const BASE_CURRENCY: Currency = 'RUB'

const FIXED_RATES: Record<string, Record<string, number>> = {
  RUB: { RUB: 1, USD: 0.011, EUR: 0.010, GBP: 0.0086, KZT: 5.5, UAH: 0.44 },
  USD: { RUB: 91, USD: 1, EUR: 0.92, GBP: 0.79, KZT: 500, UAH: 40 },
  EUR: { RUB: 99, USD: 1.09, EUR: 1, GBP: 0.86, KZT: 545, UAH: 43.5 },
  GBP: { RUB: 115, USD: 1.27, EUR: 1.16, GBP: 1, KZT: 633, UAH: 50.5 },
  KZT: { RUB: 0.18, USD: 0.002, EUR: 0.0018, GBP: 0.0016, KZT: 1, UAH: 0.08 },
  UAH: { RUB: 2.27, USD: 0.025, EUR: 0.023, GBP: 0.020, KZT: 12.5, UAH: 1 },
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency = BASE_CURRENCY
): number {
  if (from === to) return amount
  const rate = FIXED_RATES[from]?.[to]
  if (!rate) throw new Error(`No rate for ${from} -> ${to}`)
  return Math.round(amount * rate * 100) / 100
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    RUB: '₽', USD: '$', EUR: '€', GBP: '£', KZT: '₸', UAH: '₴',
  }
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbols[currency]}`
}
