import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/currency'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { deleteTransaction } from '../_actions/transaction-actions'
import { Trash2 } from 'lucide-react'

export default async function TransactionsPage() {
  const session = await auth()
  if (!session?.user?.familyId) return null

  const family = await prisma.family.findUnique({
    where: { id: session.user.familyId },
    include: { goals: true },
  })
  if (!family) return null

  const transactions = await prisma.transaction.findMany({
    where: { familyId: family.id },
    orderBy: { date: 'desc' },
    include: { user: { select: { name: true } } },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Транзакции</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Новая транзакция
            </h2>
            <TransactionForm goals={family.goals} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Все транзакции ({transactions.length})
              </h2>
            </div>
            {transactions.length === 0 ? (
              <p className="p-6 text-center text-sm text-zinc-400">Нет транзакций</p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {tx.category}
                        {tx.description && (
                          <span className="ml-2 text-zinc-400">— {tx.description}</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {tx.user.name} · {tx.date.toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-semibold ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={tx.id} />
                        <button
                          type="submit"
                          className="text-zinc-400 transition-colors hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
