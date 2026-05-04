'use client'

import { Target, Trash2 } from 'lucide-react'
import { formatCurrency, convertCurrency } from '@/lib/currency'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Goal } from '@/generated/prisma'
import type { Transaction } from '@/generated/prisma'
import type { Currency } from '@/generated/prisma'

type GoalWithTransactions = Goal & { transactions: Transaction[] }

interface GoalCardProps {
  goal: GoalWithTransactions
  baseCurrency: Currency
  onDeleteAction?: (goalId: string) => Promise<void>
  now?: number
}

export function GoalCard({ goal, baseCurrency, onDeleteAction, now }: GoalCardProps) {
  const currentInBase = convertCurrency(goal.currentAmount, goal.currency, baseCurrency)
  const targetInBase = convertCurrency(goal.targetAmount, goal.currency, baseCurrency)
  const progress = targetInBase > 0 ? Math.min((currentInBase / targetInBase) * 100, 100) : 0
  const isCompleted = progress >= 100
  const currentTime = now ?? 0
  const daysLeft = goal.deadline
    ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - currentTime) / (1000 * 60 * 60 * 24)))
    : null

  const progressColor = isCompleted
    ? 'bg-emerald-500'
    : progress >= 75
      ? 'bg-blue-500'
      : progress >= 50
        ? 'bg-amber-500'
        : 'bg-rose-500'

  const iconBg = isCompleted
    ? 'bg-emerald-100 dark:bg-emerald-900/40'
    : 'bg-blue-100 dark:bg-blue-900/40'
  const iconColor = isCompleted
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-blue-600 dark:text-blue-400'

  const handleDelete = () => {
    if (onDeleteAction) onDeleteAction(goal.id)
  }

  return (
    <Card className={`relative overflow-hidden ${isCompleted ? 'ring-1 ring-emerald-500/30' : ''}`}>
      {isCompleted && (
        <Badge variant="secondary" className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
          Достигнуто!
        </Badge>
      )}

      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
              <Target className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <h3 className="font-semibold">{goal.name}</h3>
              {daysLeft !== null && (
                <p className="text-xs text-muted-foreground">
                  {isCompleted ? 'Цель достигнута' : `${daysLeft} дн. осталось`}
                </p>
              )}
            </div>
          </div>

          {onDeleteAction && (
            <button
              onClick={handleDelete}
              className="opacity-60 transition-opacity hover:opacity-100"
              aria-label="Удалить цель"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive active:text-destructive" />
            </button>
          )}
        </div>

        <div className="mt-5">
          <div className="flex items-end justify-between text-sm">
            <span className="font-medium">
              {formatCurrency(goal.currentAmount, goal.currency)}
            </span>
            <span className="text-muted-foreground">
              из {formatCurrency(goal.targetAmount, goal.currency)}
            </span>
          </div>

          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {progress.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">
              {goal.currency !== baseCurrency && (
                <>≈ {formatCurrency(currentInBase, baseCurrency)} / {formatCurrency(targetInBase, baseCurrency)}</>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
