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

  const stats = [
    { title: 'Общий баланс', value: balance.formatted.balance, color: 'text-white' },
    { title: 'Накопления', value: balance.formatted.income, color: 'text-emerald-400' },
    { title: 'Траты', value: balance.formatted.expense, color: 'text-rose-400' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Аналитика</h1>
        <p className="text-xs text-zinc-600 mt-1">Валюта: {family.baseCurrency}</p>
      </div>

      <div className="grid gap-3 grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.title} className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-4">
            <p className="text-[11px] text-zinc-600">{stat.title}</p>
            <p className={`mt-1 text-base font-bold truncate ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
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
