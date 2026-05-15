import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getFamilyBalance,
  getCategoryBreakdown,
  getCategoryBreakdownForPeriod,
  getBalanceHistory,
  getMonthlyComparison,
  getFamilyBalanceForPeriod,
} from '@/services/analytics'
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts'
import { AnalyticsPeriodSelector } from '@/components/analytics/AnalyticsPeriodSelector'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; dateFrom?: string; dateTo?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user?.familyId) return null

  const family = await prisma.family.findUnique({
    where: { id: session.user.familyId },
  })
  if (!family) return null

  const period = params.period || 'all'
  let from: Date | undefined
  let to: Date | undefined

  if (period === 'month') {
    from = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    to = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  } else if (period === '3months') {
    from = new Date()
    from.setMonth(from.getMonth() - 3)
    to = new Date()
  } else if (period === '6months') {
    from = new Date()
    from.setMonth(from.getMonth() - 6)
    to = new Date()
  } else if (period === 'year') {
    from = new Date(new Date().getFullYear(), 0, 1)
    to = new Date(new Date().getFullYear() + 1, 0, 1)
  } else if (period === 'custom' && params.dateFrom && params.dateTo) {
    from = new Date(params.dateFrom)
    to = new Date(params.dateTo)
  }

  const [overallBalance, expenseCategories, incomeCategories, balanceHistory, monthlyData, periodBalance, periodExpenseCategories, periodIncomeCategories] = await Promise.all([
    getFamilyBalance(family.id, family.baseCurrency),
    getCategoryBreakdown(family.id, family.baseCurrency, 'EXPENSE'),
    getCategoryBreakdown(family.id, family.baseCurrency, 'INCOME'),
    getBalanceHistory(family.id, family.baseCurrency, 6),
    getMonthlyComparison(family.id, family.baseCurrency, 6),
    from && to ? getFamilyBalanceForPeriod(family.id, family.baseCurrency, from, to) : null,
    from && to ? getCategoryBreakdownForPeriod(family.id, family.baseCurrency, 'EXPENSE', from, to) : null,
    from && to ? getCategoryBreakdownForPeriod(family.id, family.baseCurrency, 'INCOME', from, to) : null,
  ])

  const displayBalance = periodBalance || overallBalance
  const displayExpense = periodExpenseCategories || expenseCategories
  const displayIncome = periodIncomeCategories || incomeCategories

  const savingsRate = displayBalance.totalIncome > 0
    ? ((displayBalance.totalIncome - displayBalance.totalExpense) / displayBalance.totalIncome * 100)
    : 0

  const prevMonthSavings = overallBalance.totalIncome > 0
    ? ((overallBalance.totalIncome - overallBalance.totalExpense) / overallBalance.totalIncome * 100)
    : 0

  const topExpense = displayExpense[0]
  const topExpenseShare = topExpense && displayBalance.totalExpense > 0
    ? (topExpense.value / displayBalance.totalExpense * 100).toFixed(0)
    : '0'

  const stats = [
    { title: period === 'all' ? 'Общий баланс' : 'Баланс за период', value: displayBalance.formatted.balance, color: 'text-white' },
    { title: 'Доходы', value: displayBalance.formatted.income, color: 'text-emerald-400' },
    { title: 'Расходы', value: displayBalance.formatted.expense, color: 'text-rose-400' },
    { title: 'Норма сбережений', value: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 0 ? 'text-amber-400' : 'text-rose-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Аналитика</h1>
          <p className="text-xs text-zinc-600 mt-1">Валюта: {family.baseCurrency}</p>
        </div>
        <AnalyticsPeriodSelector period={period} />
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-4">
            <p className="text-[11px] text-zinc-600">{stat.title}</p>
            <p className={`mt-1 text-base font-bold truncate ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {topExpense && (
        <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-zinc-600">Крупнейшая категория расходов</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">{topExpense.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-rose-400">{topExpense.value.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} {family.baseCurrency === 'RUB' ? '₽' : family.baseCurrency}</p>
              <p className="text-[11px] text-zinc-600">{topExpenseShare}% от всех расходов</p>
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[#1a1a24]">
            <div
              className="h-1.5 rounded-full bg-rose-500 transition-all"
              style={{ width: `${Math.min(Number(topExpenseShare), 100)}%` }}
            />
          </div>
        </div>
      )}

      <AnalyticsCharts
        expenseCategories={displayExpense}
        incomeCategories={displayIncome}
        balanceHistory={balanceHistory}
        monthlyData={monthlyData}
        currency={family.baseCurrency}
      />
    </div>
  )
}
