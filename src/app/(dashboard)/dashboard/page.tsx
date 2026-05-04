import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFamilyBalance, getBalanceHistory, getCategoryBreakdown } from '@/services/analytics'
import { formatCurrency } from '@/lib/currency'
import { convertCurrency } from '@/lib/currency'
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight, Target, PiggyBank, PieChart } from 'lucide-react'
import { GoalCard } from '@/components/goals/GoalCard'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { BudgetManager } from '@/components/dashboard/BudgetManager'
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
      budgets: true,
    },
  })

  if (!family) return null

  const [balance, balanceHistory] = await Promise.all([
    getFamilyBalance(family.id, family.baseCurrency),
    getBalanceHistory(family.id, family.baseCurrency, 3),
  ])

  const recentTransactions = await prisma.transaction.findMany({
    where: { familyId: family.id },
    orderBy: { date: 'desc' },
    take: 5,
    include: { user: { select: { name: true } } },
  })

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const spentByCategory: Record<string, number> = {}
  if (family.budgets.length > 0) {
    const monthExpenses = await prisma.transaction.findMany({
      where: {
        familyId: family.id,
        type: 'EXPENSE',
        date: { gte: monthStart },
      },
      select: { amount: true, category: true, currency: true },
    })
    for (const tx of monthExpenses) {
      const converted = convertCurrency(tx.amount, tx.currency, family.baseCurrency)
      spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + converted
    }
  }

  const totalBalance = balance.balance + balance.totalInGoals
  const savingsRate = balance.totalIncome > 0
    ? ((balance.totalIncome - balance.totalExpense) / balance.totalIncome * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">{family.name}</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {formatCurrency(totalBalance, family.baseCurrency)}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Общий баланс · {family.members.length} участник{family.members.length === 1 ? '' : family.members.length < 5 ? 'а' : 'ов'}
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
              <Wallet className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-xs text-indigo-300/70">Свободно</span>
          </div>
          <p className="text-lg font-bold text-white">{balance.formatted.balance}</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
              <PiggyBank className="h-4 w-4 text-purple-400" />
            </div>
            <span className="text-xs text-purple-300/70">В копилках</span>
          </div>
          <p className="text-lg font-bold text-white">{balance.formatted.inGoals}</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-xs text-emerald-300/70">Доходы</span>
          </div>
          <p className="text-lg font-bold text-emerald-400">{balance.formatted.income}</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20">
              <TrendingDown className="h-4 w-4 text-rose-400" />
            </div>
            <span className="text-xs text-rose-300/70">Расходы</span>
          </div>
          <p className="text-lg font-bold text-rose-400">{balance.formatted.expense}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-zinc-200">Баланс</h2>
          <span className={`text-xs font-medium ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            Сбережения {savingsRate.toFixed(0)}%
          </span>
        </div>
        <DashboardChart data={balanceHistory} currency={family.baseCurrency} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Бюджеты</h2>
            <Link
              href="/analytics"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Аналитика →
            </Link>
          </div>
          <BudgetManager
            budgets={family.budgets}
            spent={spentByCategory}
            currency={family.baseCurrency}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-200">Последние транзакции</h2>
              <Link
                href="/transactions"
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Все →
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-600">Нет транзакций</p>
            ) : (
              <div className="space-y-1">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-[#1a1a24] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tx.type === 'INCOME' ? 'bg-emerald-500/15' : 'bg-rose-500/15'} shrink-0`}>
                        <ArrowLeftRight className={`h-3 w-3 ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 truncate">{tx.category}</p>
                        <p className="text-[10px] text-zinc-600">
                          {tx.user.name} · {tx.date.toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ml-2 ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-200">Копилки</h2>
              <Link
                href="/goals"
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Все →
              </Link>
            </div>
            {family.goals.length === 0 ? (
              <div className="flex flex-col items-center py-4">
                <Target className="mb-1 h-6 w-6 text-zinc-700" />
                <p className="text-xs text-zinc-600">Нет целей</p>
              </div>
            ) : (
              <div className="space-y-2">
                {family.goals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} baseCurrency={family.baseCurrency} now={now} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
