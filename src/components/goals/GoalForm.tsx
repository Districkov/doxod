'use client'

import { useActionState } from 'react'
import { createGoal } from '@/app/(dashboard)/_actions/goal-actions'
import type { Currency } from '@/generated/prisma'

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'RUB', label: '₽ Рубли' },
  { value: 'USD', label: '$ Доллары' },
  { value: 'EUR', label: '€ Евро' },
  { value: 'GBP', label: '£ Фунты' },
  { value: 'KZT', label: '₸ Тенге' },
  { value: 'UAH', label: '₴ Гривны' },
]

const inputCls = "w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
const selectCls = "w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
const labelCls = "mb-1.5 block text-xs font-medium text-zinc-500"

export function GoalForm() {
  const [state, formAction, pending] = useActionState(createGoal, { success: false })

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400">
          {state.error}
        </div>
      )}

      <div>
        <label className={labelCls}>Название цели</label>
        <input
          type="text"
          name="name"
          required
          placeholder="Например: Отпуск, Машина"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Целевая сумма</label>
          <input
            type="number"
            name="targetAmount"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Валюта</label>
          <select name="currency" defaultValue="RUB" className={selectCls}>
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Дедлайн</label>
        <input
          type="date"
          name="deadline"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700 active:from-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
      >
        {pending ? 'Создаём...' : 'Создать цель'}
      </button>
    </form>
  )
}
