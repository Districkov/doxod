'use client'

import { useActionState } from 'react'
import { createRecurring } from '@/app/(dashboard)/_actions/recurring-actions'
import type { Frequency } from '@/generated/prisma'

type Result = { success: boolean; error?: string }

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'DAILY', label: 'Ежедневно' },
  { value: 'WEEKLY', label: 'Еженедельно' },
  { value: 'MONTHLY', label: 'Ежемесячно' },
  { value: 'YEARLY', label: 'Ежегодно' },
]

export function RecurringForm() {
  const [state, formAction, pending] = useActionState<Result, FormData>(createRecurring, { success: false })

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <div className="rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-400">{state.error}</div>
      )}
      {state.success && (
        <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-400">Повтор создан</div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-500">Сумма</label>
          <input
            type="number"
            name="amount"
            step="0.01"
            required
            placeholder="0.00"
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-500">Тип</label>
          <select
            name="type"
            defaultValue="EXPENSE"
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="EXPENSE">Расход</option>
            <option value="INCOME">Доход</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-zinc-500">Категория</label>
        <input
          type="text"
          name="category"
          required
          placeholder="Например: Зарплата"
          className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-500">Частота</label>
          <select
            name="frequency"
            defaultValue="MONTHLY"
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {FREQ_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-500">След. дата</label>
          <input
            type="date"
            name="nextDate"
            required
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
      >
        {pending ? 'Создаём...' : 'Создать повтор'}
      </button>
    </form>
  )
}
