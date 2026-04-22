import { prisma } from '@/lib/prisma'
import { convertCurrency, formatCurrency } from '@/lib/currency'
import type { Currency } from '@/generated/prisma'

export async function getFamilyBalance(familyId: string, baseCurrency: Currency) {
  const transactions = await prisma.transaction.findMany({
    where: { familyId },
    select: { amount: true, type: true, currency: true },
  })

  let totalIncome = 0
  let totalExpense = 0

  for (const tx of transactions) {
    const converted = convertCurrency(tx.amount, tx.currency, baseCurrency)
    if (tx.type === 'INCOME') totalIncome += converted
    else totalExpense += converted
  }

  return {
    balance: Math.round((totalIncome - totalExpense) * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    formatted: {
      balance: formatCurrency(totalIncome - totalExpense, baseCurrency),
      income: formatCurrency(totalIncome, baseCurrency),
      expense: formatCurrency(totalExpense, baseCurrency),
    },
  }
}

export async function getCategoryBreakdown(
  familyId: string,
  baseCurrency: Currency,
  type: 'EXPENSE' | 'INCOME' = 'EXPENSE'
) {
  const transactions = await prisma.transaction.findMany({
    where: { familyId, type },
    select: { amount: true, category: true, currency: true },
  })

  const categoryMap = new Map<string, number>()
  for (const tx of transactions) {
    const converted = convertCurrency(tx.amount, tx.currency, baseCurrency)
    categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + converted)
  }

  return Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

export async function getBalanceHistory(
  familyId: string,
  baseCurrency: Currency,
  months: number = 6
) {
  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const transactions = await prisma.transaction.findMany({
    where: { familyId, date: { gte: since } },
    orderBy: { date: 'asc' },
    select: { amount: true, type: true, currency: true, date: true },
  })

  let runningBalance = 0
  const points: { date: string; balance: number }[] = []

  const allBalance = await getFamilyBalance(familyId, baseCurrency)
  const balanceBeforePeriod = allBalance.balance - transactions.reduce((acc: number, tx: { amount: number; type: string; currency: Currency }) => {
    const converted = convertCurrency(tx.amount, tx.currency, baseCurrency)
    return acc + (tx.type === 'INCOME' ? converted : -converted)
  }, 0)

  runningBalance = balanceBeforePeriod

  for (const tx of transactions) {
    const converted = convertCurrency(tx.amount, tx.currency, baseCurrency)
    runningBalance += tx.type === 'INCOME' ? converted : -converted
    const dateStr = tx.date.toISOString().split('T')[0]
    const last = points[points.length - 1]
    if (last && last.date === dateStr) {
      last.balance = Math.round(runningBalance * 100) / 100
    } else {
      points.push({ date: dateStr, balance: Math.round(runningBalance * 100) / 100 })
    }
  }

  return points
}

export async function getMonthlyComparison(
  familyId: string,
  baseCurrency: Currency,
  months: number = 6
) {
  const since = new Date()
  since.setMonth(since.getMonth() - months)
  since.setDate(1)

  const transactions = await prisma.transaction.findMany({
    where: { familyId, date: { gte: since } },
    select: { amount: true, type: true, currency: true, date: true },
  })

  const monthMap = new Map<string, { income: number; expense: number }>()

  for (const tx of transactions) {
    const converted = convertCurrency(tx.amount, tx.currency, baseCurrency)
    const monthKey = tx.date.toISOString().slice(0, 7)

    const existing = monthMap.get(monthKey) || { income: 0, expense: 0 }
    if (tx.type === 'INCOME') existing.income += converted
    else existing.expense += converted
    monthMap.set(monthKey, existing)
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      income: Math.round(data.income * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
    }))
}
