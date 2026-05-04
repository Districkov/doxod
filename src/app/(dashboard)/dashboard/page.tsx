import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFamilyBalance } from '@/services/analytics'
import { formatCurrency } from '@/lib/currency'
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight, Target } from 'lucide-react'
import { GoalCard } from '@/components/goals/GoalCard'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.familyId) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-zinc-500">Сначала создайте или присоединитесь к семье</p>
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl text-zinc-900 dark:text-zinc-100">
          {family.name}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {family.members.length} участник{family.members.length === 1 ? '' : family.members.length < 5 ? 'а' : 'ов'}
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 sm:h-10 sm:w-10">
              <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">Свободно</p>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 sm:text-xl truncate">
                {balance.formatted.balance}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40 sm:h-10 sm:w-10">
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">В копилках</p>
              <p className="text-base font-bold text-purple-600 dark:text-purple-400 sm:text-xl truncate">
                {balance.formatted.inGoals}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 sm:h-10 sm:w-10">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">Доходы</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 sm:text-xl truncate">
                {balance.formatted.income}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40 sm:h-10 sm:w-10">
              <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">Расходы</p>
              <p className="text-base font-bold text-rose-600 dark:text-rose-400 sm:text-xl truncate">
                {balance.formatted.expense}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Последние транзакции
            </h2>
            <Link
              href="/transactions"
              className="text-sm text-blue-600 hover:text-blue-700 active:text-blue-800 dark:text-blue-400"
            >
              Все
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-400">Нет транзакций</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 sm:px-3 active:bg-zinc-100 dark:active:bg-zinc-800"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <ArrowLeftRight className="h-4 w-4 text-zinc-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {tx.category}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Копилки
            </h2>
            <Link
              href="/goals"
              className="text-sm text-blue-600 hover:text-blue-700 active:text-blue-800 dark:text-blue-400"
            >
              Все
            </Link>
          </div>
          {family.goals.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Target className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm text-zinc-400">Нет активных целей</p>
            </div>
          ) : (
            <div className="space-y-4">
              {family.goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} baseCurrency={family.baseCurrency} now={now} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
