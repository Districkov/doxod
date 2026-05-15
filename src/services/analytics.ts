import { prisma } from '@/lib/prisma'
import { convertCurrency, formatCurrency } from '@/lib/currency'
import type { Currency } from '@/generated/prisma'

export async function getFamilyBalance(familyId: string, baseCurrency: Currency) {
  const [incomeAgg, expenseAgg, goals] = await Promise.all([
    prisma.transaction.aggregate({
      where: { familyId, type: 'INCOME', goalId: null },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { familyId, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.goal.findMany({
      where: { familyId },
      select: { currentAmount: true, currency: true },
    }),
  ])

  const totalIncome = convertCurrency(incomeAgg._sum.amount || 0, baseCurrency, baseCurrency)
  const totalExpense = convertCurrency(expenseAgg._sum.amount || 0, baseCurrency, baseCurrency)
  let totalInGoals = 0
  for (const goal of goals) {
    totalInGoals += convertCurrency(goal.currentAmount, goal.currency, baseCurrency)
  }

  const freeBalance = totalIncome - totalExpense - totalInGoals

  return {
    balance: Math.round(freeBalance * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    totalInGoals: Math.round(totalInGoals * 100) / 100,
    formatted: {
      balance: formatCurrency(freeBalance, baseCurrency),
      income: formatCurrency(totalIncome, baseCurrency),
      expense: formatCurrency(totalExpense, baseCurrency),
      inGoals: formatCurrency(totalInGoals, baseCurrency),
    },
  }
}

export async function getCategoryBreakdown(
  familyId: string,
  baseCurrency: Currency,
  type: 'EXPENSE' | 'INCOME'
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
  since.setDate(1)

  const [transactions, initialIncome, initialExpense, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { familyId, date: { gte: since } },
      select: { amount: true, type: true, currency: true, goalId: true, date: true },
      orderBy: { date: 'asc' },
    }),
    prisma.transaction.aggregate({
      where: { familyId, type: 'INCOME', goalId: null, date: { lt: since } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { familyId, type: 'EXPENSE', date: { lt: since } },
      _sum: { amount: true },
    }),
    prisma.goal.findMany({
      where: { familyId },
      select: { currentAmount: true, currency: true },
    }),
  ])

  let totalInGoals = 0
  for (const goal of goals) {
    totalInGoals += convertCurrency(goal.currentAmount, goal.currency, baseCurrency)
  }

  const balanceBefore = convertCurrency(initialIncome._sum.amount || 0, baseCurrency, baseCurrency)
    - convertCurrency(initialExpense._sum.amount || 0, baseCurrency, baseCurrency)
    - totalInGoals

  const points: { date: string; balance: number }[] = []
  let running = balanceBefore

  for (const tx of transactions) {
    const converted = convertCurrency(tx.amount, tx.currency, baseCurrency)
    running += tx.type === 'INCOME' && !tx.goalId ? converted : tx.type === 'EXPENSE' ? -converted : 0
    const dateStr = tx.date.toISOString().split('T')[0]
    const last = points[points.length - 1]
    if (last && last.date === dateStr) {
      last.balance = Math.round(running * 100) / 100
    } else {
      points.push({ date: dateStr, balance: Math.round(running * 100) / 100 })
    }
  }

  return points
}

export async function getFamilyBalanceForPeriod(
  familyId: string,
  baseCurrency: Currency,
  from: Date,
  to: Date
) {
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { familyId, type: 'INCOME', goalId: null, date: { gte: from, lt: to } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { familyId, type: 'EXPENSE', date: { gte: from, lt: to } },
      _sum: { amount: true },
    }),
  ])

  const totalIncome = convertCurrency(incomeAgg._sum.amount || 0, baseCurrency, baseCurrency)
  const totalExpense = convertCurrency(expenseAgg._sum.amount || 0, baseCurrency, baseCurrency)
  const balance = totalIncome - totalExpense

  return {
    balance: Math.round(balance * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    totalInGoals: 0,
    formatted: {
      balance: formatCurrency(balance, baseCurrency),
      income: formatCurrency(totalIncome, baseCurrency),
      expense: formatCurrency(totalExpense, baseCurrency),
      inGoals: formatCurrency(0, baseCurrency),
    },
  }
}

export async function getCategoryBreakdownForPeriod(
  familyId: string,
  baseCurrency: Currency,
  type: 'EXPENSE' | 'INCOME',
  from: Date,
  to: Date
) {
  const transactions = await prisma.transaction.findMany({
    where: { familyId, type, date: { gte: from, lt: to } },
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

export async function getMonthlyComparisonTwo(
  familyId: string,
  baseCurrency: Currency,
  currentMonth: string,
  prevMonth: string
) {
  const transactions = await prisma.transaction.findMany({
    where: {
      familyId,
      date: {
        gte: new Date(`${prevMonth}-01`),
        lt: new Date(`${currentMonth}-01`).getTime() > 0
          ? new Date(`${currentMonth}-01`)
          : new Date(),
      },
    },
    select: { amount: true, type: true, currency: true, date: true },
  })

  let curIncome = 0, curExpense = 0, prevIncome = 0, prevExpense = 0

  for (const tx of transactions) {
    const converted = convertCurrency(tx.amount, tx.currency, baseCurrency)
    const monthKey = tx.date.toISOString().slice(0, 7)
    if (monthKey === currentMonth) {
      if (tx.type === 'INCOME') curIncome += converted; else curExpense += converted
    } else if (monthKey === prevMonth) {
      if (tx.type === 'INCOME') prevIncome += converted; else prevExpense += converted
    }
  }

  const incomeChange = prevIncome > 0
    ? Math.round((curIncome - prevIncome) / prevIncome * 100)
    : curIncome > 0 ? 100 : 0
  const expenseChange = prevExpense > 0
    ? Math.round((curExpense - prevExpense) / prevExpense * 100)
    : curExpense > 0 ? 100 : 0

  return {
    current: {
      totalIncome: Math.round(curIncome * 100) / 100,
      totalExpense: Math.round(curExpense * 100) / 100,
      formatted: {
        income: formatCurrency(curIncome, baseCurrency),
        expense: formatCurrency(curExpense, baseCurrency),
      },
    },
    prev: {
      totalIncome: Math.round(prevIncome * 100) / 100,
      totalExpense: Math.round(prevExpense * 100) / 100,
      formatted: {
        income: formatCurrency(prevIncome, baseCurrency),
        expense: formatCurrency(prevExpense, baseCurrency),
      },
    },
    incomeChange,
    expenseChange,
  }
}
