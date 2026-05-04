import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFamilyBalance } from '@/services/analytics'
import { formatCurrency } from '@/lib/currency'
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight, Target } from 'lucide-react'
import { GoalCard } from '@/components/goals/GoalCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.familyId) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-muted-foreground">Сначала создайте или присоединитесь к семье</p>
      </div>
    )
  }

  const now = new Date().getTime()

  const family = await prisma.family.findUnique({
    where: { id: session.user.familyId },
    include: {
      members: { select: { id: true, name: true, email: true } },
      goals: { include: { transactions: true }, take: 3, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!family) return null

  const balance = await getFamilyBalance(family.id, family.baseCurrency)

  const recentTransactions = await prisma.transaction.findMany({
    where: { familyId: family.id },
    orderBy: { date: 'desc' },
    take: 5,
    include: { user: { select: { name: true } } },
  })

  const stats = [
    {
      title: 'Свободно',
      value: balance.formatted.balance,
      icon: Wallet,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/40',
    },
    {
      title: 'В копилках',
      value: balance.formatted.inGoals,
      icon: Target,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/40',
    },
    {
      title: 'Доходы',
      value: balance.formatted.income,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    },
    {
      title: 'Расходы',
      value: balance.formatted.expense,
      icon: TrendingDown,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-900/40',
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{family.name}</h1>
        <p className="text-sm text-muted-foreground">
          {family.members.length} участник{family.members.length === 1 ? '' : family.members.length < 5 ? 'а' : 'ов'}
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} size="sm">
            <CardContent className="flex items-center gap-2 sm:gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg} sm:h-10 sm:w-10 shrink-0`}>
                <stat.icon className={`h-4 w-4 ${stat.color} sm:h-5 sm:w-5`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground sm:text-sm">{stat.title}</p>
                <p className="text-base font-bold sm:text-xl truncate">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Последние транзакции</CardTitle>
              <Link
                href="/transactions"
                className="text-sm text-primary hover:underline active:opacity-80"
              >
                Все
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Нет транзакций</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg px-2 py-2 sm:px-3 active:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tx.type === 'INCOME' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'} shrink-0`}>
                        <ArrowLeftRight className={`h-3.5 w-3.5 ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.user.name} · {tx.date.toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold shrink-0 ${
                        tx.type === 'INCOME'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Копилки</CardTitle>
              <Link
                href="/goals"
                className="text-sm text-primary hover:underline active:opacity-80"
              >
                Все
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {family.goals.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Target className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Нет активных целей</p>
              </div>
            ) : (
              <div className="space-y-4">
                {family.goals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} baseCurrency={family.baseCurrency} now={now} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
