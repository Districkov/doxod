'use client'

import { Target, Trash2 } from 'lucide-react'
import { formatCurrency, convertCurrency } from '@/lib/currency'
import type { Goal } from '@/generated/prisma'
import type { Transaction } from '@/generated/prisma'
import type { Currency } from '@/generated/prisma'

type GoalWithTransactions = Goal & { transactions: Transaction[] }

interface GoalCardProps {
  goal: GoalWithTransactions
  baseCurrency: Currency
  onDelete?: (goalId: string) => void
  now?: number
}

export function GoalCard({ goal, baseCurrency, onDelete, now }: GoalCardProps) {
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

  const glowColor = isCompleted
    ? 'shadow-emerald-500/20'
    : 'shadow-blue-500/10'

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-6 dark:border-zinc-800 dark:bg-zinc-900 ${isCompleted ? glowColor : ''}`}
    >
      {isCompleted && (
        <div className="absolute top-3 right-3 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
          Достигнуто!
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-blue-100 dark:bg-blue-900/40'}`}
          >
            <Target
              className={`h-5 w-5 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{goal.name}</h3>
            {daysLeft !== null && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isCompleted ? 'Цель достигнута' : `${daysLeft} дн. осталось`}
              </p>
            )}
          </div>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(goal.id)}
            className="opacity-60 transition-opacity group-hover:opacity-100 lg:opacity-0"
            aria-label="Удалить цель"
          >
            <Trash2 className="h-4 w-4 text-zinc-400 hover:text-rose-500 active:text-rose-600" />
          </button>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatCurrency(goal.currentAmount, goal.currency)}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            из {formatCurrency(goal.targetAmount, goal.currency)}
          </span>
        </div>

        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {progress.toFixed(1)}%
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {goal.currency !== baseCurrency && (
              <>≈ {formatCurrency(currentInBase, baseCurrency)} / {formatCurrency(targetInBase, baseCurrency)}</>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
