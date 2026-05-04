'use client'

import { useActionState } from 'react'
import { createBudget, deleteBudget } from '@/app/(dashboard)/_actions/budget-actions'
import { formatCurrency } from '@/lib/currency'
import { X, Plus } from 'lucide-react'
import type { Budget } from '@/generated/prisma'

type Result = { success: boolean; error?: string }

export function BudgetManager({
  budgets,
  spent,
  currency,
}: {
  budgets: Budget[]
  spent: Record<string, number>
  currency: string
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(createBudget, { success: false })

  return (
    <div className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-400">{state.error}</div>
      )}

      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-medium text-zinc-500">Категория</label>
          <input
            type="text"
            name="category"
            required
            placeholder="food, transport..."
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div className="w-28">
          <label className="mb-1 block text-[11px] font-medium text-zinc-500">Лимит</label>
          <input
            type="number"
            name="amount"
            step="0.01"
            required
            placeholder="0.00"
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-1 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Лимит
        </button>
      </form>

      {budgets.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-4">Нет бюджетов</p>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const currentSpent = spent[budget.category] ?? 0
            const pct = budget.amount > 0 ? Math.min((currentSpent / budget.amount) * 100, 100) : 0
            const isOver = currentSpent > budget.amount
            const barColor = isOver
              ? 'bg-rose-500'
              : pct > 75
              ? 'bg-amber-500'
              : 'bg-emerald-500'

            return (
              <div key={budget.id} className="rounded-lg bg-[#1a1a24] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-200">{budget.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500">
                      {formatCurrency(currentSpent, currency as any)} / {formatCurrency(budget.amount, currency as any)}
                    </span>
                    <form action={deleteBudget}>
                      <input type="hidden" name="id" value={budget.id} />
                      <button type="submit" className="text-zinc-600 hover:text-rose-400 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </form>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-[#0c0c12] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {isOver && (
                  <p className="mt-1 text-[10px] text-rose-400">Превышен на {formatCurrency(currentSpent - budget.amount, currency as any)}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
