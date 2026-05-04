import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getFamilyBalance,
  getCategoryBreakdown,
  getBalanceHistory,
  getMonthlyComparison,
} from '@/services/analytics'
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts'
import { Card, CardContent } from '@/components/ui/card'

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
    { title: 'Общий баланс', value: balance.formatted.balance, color: '' },
    { title: 'Накопления', value: balance.formatted.income, color: 'text-emerald-600 dark:text-emerald-400' },
    { title: 'Траты', value: balance.formatted.expense, color: 'text-rose-600 dark:text-rose-400' },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Аналитика</h1>
        <div className="text-xs sm:text-sm text-muted-foreground">
          Валюта: {family.baseCurrency}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground sm:text-sm">{stat.title}</p>
              <p className={`mt-1 text-lg font-bold sm:text-2xl truncate ${stat.color}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
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
