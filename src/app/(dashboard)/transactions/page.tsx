import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/currency'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { deleteTransaction } from '../_actions/transaction-actions'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">Транзакции</h1>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Новая транзакция</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionForm goals={family.goals} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Все транзакции <Badge variant="secondary" className="ml-2">{transactions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Нет транзакций</p>
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 active:bg-muted/50 -mx-2 px-2 sm:-mx-3 sm:px-3 rounded-lg"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{tx.category}</p>
                          <Badge variant={tx.type === 'INCOME' ? 'secondary' : 'outline'} className={`text-[10px] ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                            {tx.type === 'INCOME' ? 'Доход' : 'Расход'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tx.user.name} · {tx.date.toLocaleDateString('ru-RU')}
                          {tx.description && ` · ${tx.description}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
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
                            className="text-muted-foreground transition-colors hover:text-destructive active:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
