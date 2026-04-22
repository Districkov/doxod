import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getFamilyBalance,
  getCategoryBreakdown,
  getBalanceHistory,
  getMonthlyComparison,
} from '@/services/analytics'
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.familyId) return null

  const family = await prisma.family.findUnique({
    where: { id: session.user.familyId },
  })
  if (!family) return null

  const [balance, categoryData, balanceHistory, monthlyData] = await Promise.all([
    getFamilyBalance(family.id, family.baseCurrency),
    getCategoryBreakdown(family.id, family.baseCurrency),
    getBalanceHistory(family.id, family.baseCurrency),
    getMonthlyComparison(family.id, family.baseCurrency),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Аналитика</h1>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Валюта: {family.baseCurrency}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Общий баланс</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {balance.formatted.balance}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Накопления</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {balance.formatted.income}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Траты</p>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {balance.formatted.expense}
          </p>
        </div>
      </div>

      <AnalyticsCharts
        categoryData={categoryData}
        balanceHistory={balanceHistory}
        monthlyData={monthlyData}
        currency={family.baseCurrency}
      />
    </div>
  )
}
