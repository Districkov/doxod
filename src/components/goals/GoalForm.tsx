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

export function GoalForm() {
  const [state, formAction, pending] = useActionState(createGoal, { success: false })

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Название цели
        </label>
        <input
          type="text"
          name="name"
          required
          placeholder="Например: Отпуск, Машина"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Целевая сумма
          </label>
          <input
            type="number"
            name="targetAmount"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Валюта
          </label>
          <select
            name="currency"
            defaultValue="RUB"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Дедлайн
        </label>
        <input
          type="date"
          name="deadline"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50"
      >
        {pending ? 'Создаём...' : 'Создать цель'}
      </button>
    </form>
  )
}
