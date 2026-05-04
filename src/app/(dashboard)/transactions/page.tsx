import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/currency'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { deleteTransaction } from '../_actions/transaction-actions'
import { Trash2, ArrowDownRight, ArrowUpRight } from 'lucide-react'

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
      <h1 className="text-xl font-bold text-white">Транзакции</h1>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Новая транзакция</h2>
            <TransactionForm goals={family.goals} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">
              Все транзакции <span className="text-zinc-600 ml-1">{transactions.length}</span>
            </h2>
            {transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">Нет транзакций</p>
            ) : (
              <div className="space-y-0.5">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-[#1a1a24] active:bg-[#22222e] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${tx.type === 'INCOME' ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                        {tx.type === 'INCOME'
                          ? <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                          : <ArrowDownRight className="h-4 w-4 text-rose-400" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{tx.category}</p>
                        <p className="text-[11px] text-zinc-600">
                          {tx.user.name} · {tx.date.toLocaleDateString('ru-RU')}
                          {tx.description && ` · ${tx.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span
                        className={`text-sm font-semibold ${
                          tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={tx.id} />
                        <button
                          type="submit"
                          className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity text-zinc-600 hover:text-rose-400 active:text-rose-500"
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
