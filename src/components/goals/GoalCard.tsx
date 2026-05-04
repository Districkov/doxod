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
      ? 'bg-indigo-500'
      : progress >= 50
        ? 'bg-amber-500'
        : 'bg-rose-500'

  const progressGlow = isCompleted
    ? 'shadow-emerald-500/20'
    : 'shadow-indigo-500/10'

  return (
    <div className={`group rounded-xl border border-[#1e1e2a] bg-[#0c0c12] p-4 transition-all hover:border-[#2a2a3a] ${isCompleted ? `shadow-lg ${progressGlow}` : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isCompleted ? 'bg-emerald-500/15' : 'bg-indigo-500/15'}`}>
            <Target className={`h-4 w-4 ${isCompleted ? 'text-emerald-400' : 'text-indigo-400'}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">{goal.name}</h3>
            {daysLeft !== null && (
              <p className="text-[11px] text-zinc-600">
                {isCompleted ? '✓ Достигнуто' : `${daysLeft} дн. осталось`}
              </p>
            )}
          </div>
        </div>

        {onDeleteAction && (
          <button
            onClick={() => onDeleteAction(goal.id)}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
            aria-label="Удалить цель"
          >
            <Trash2 className="h-3.5 w-3.5 text-zinc-600 hover:text-rose-400 active:text-rose-500" />
          </button>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-end justify-between text-xs">
          <span className="font-semibold text-zinc-200">
            {formatCurrency(goal.currentAmount, goal.currency)}
          </span>
          <span className="text-zinc-600">
            из {formatCurrency(goal.targetAmount, goal.currency)}
          </span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a24]">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-500">
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}
