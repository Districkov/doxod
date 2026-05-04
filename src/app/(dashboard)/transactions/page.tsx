import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/currency'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { RecurringList } from '@/components/transactions/RecurringList'
import { RecurringForm } from '@/components/transactions/RecurringForm'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { ExportButton } from '@/components/transactions/ExportButton'
import { deleteTransaction } from '../_actions/transaction-actions'
import { ArrowLeftRight, Trash2, Repeat } from 'lucide-react'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const session = await auth()
  if (!session?.user?.familyId) return null

  const family = await prisma.family.findUnique({
    where: { id: session.user.familyId },
    include: {
      goals: true,
      categories: true,
      recurring: { where: { isActive: true }, orderBy: { nextDate: 'asc' } },
    },
  })
  if (!family) return null

  const typeFilter = params.type as string | undefined
  const categoryFilter = params.category as string | undefined
  const searchFilter = params.search as string | undefined
  const dateFrom = params.dateFrom as string | undefined
  const dateTo = params.dateTo as string | undefined

  const where: Record<string, unknown> = { familyId: family.id }
  if (typeFilter) where.type = typeFilter
  if (categoryFilter) where.category = categoryFilter
  if (searchFilter) where.description = { contains: searchFilter, mode: 'insensitive' }
  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom)
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo)
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { user: { select: { name: true } } },
    take: 100,
  })

  const allCategories = await prisma.transaction.findMany({
    where: { familyId: family.id },
    select: { category: true },
    distinct: ['category'],
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Транзакции</h1>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Новая транзакция</h2>
            <TransactionForm goals={family.goals} familyCategories={family.categories} />
          </div>

          {family.recurring.length > 0 && (
            <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Repeat className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Автоповторы</h2>
              </div>
              <RecurringList recurring={family.recurring} />
            </div>
          )}

          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Repeat className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Новый повтор</h2>
            </div>
            <RecurringForm />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-200">
                Все транзакции <span className="text-zinc-600 ml-1">{transactions.length}</span>
              </h2>
              <ExportButton familyId={family.id} />
            </div>

            <TransactionFilters
              categories={allCategories.map((c) => c.category)}
              type={typeFilter}
              category={categoryFilter}
              search={searchFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />

            {transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">Нет транзакций</p>
            ) : (
              <div className="space-y-1 mt-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-[#1a1a24] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${tx.type === 'INCOME' ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                        <ArrowLeftRight className={`h-3.5 w-3.5 ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{tx.category}</p>
                        <p className="text-[11px] text-zinc-600">
                          {tx.description ?? '—'} · {tx.user.name} · {tx.date.toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={tx.id} />
                        <button type="submit" className="text-zinc-700 hover:text-rose-400 transition-colors p-1">
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
