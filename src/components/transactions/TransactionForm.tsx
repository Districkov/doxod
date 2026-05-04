'use client'

import { useActionState } from 'react'
import { addTransaction } from '@/app/(dashboard)/_actions/transaction-actions'
import { TRANSACTION_CATEGORIES } from '@/lib/categories'
import type { Currency } from '@/generated/prisma'
import type { Goal } from '@/generated/prisma'

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'RUB', label: '₽ Рубли' },
  { value: 'USD', label: '$ Доллары' },
  { value: 'EUR', label: '€ Евро' },
  { value: 'GBP', label: '£ Фунты' },
  { value: 'KZT', label: '₸ Тенге' },
  { value: 'UAH', label: '₴ Гривны' },
]

interface TransactionFormProps {
  goals?: Goal[]
}

export function TransactionForm({ goals }: TransactionFormProps) {
  const [state, formAction, pending] = useActionState(addTransaction, { success: false })

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Тип
          </label>
          <select
            name="type"
            id="tx-type"
            defaultValue="EXPENSE"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="EXPENSE">Расход</option>
            <option value="INCOME">Доход</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Категория
          </label>
          <select
            name="category"
            id="tx-category"
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {TRANSACTION_CATEGORIES.EXPENSE.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
            {TRANSACTION_CATEGORIES.INCOME.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Сумма
          </label>
          <input
            type="number"
            name="amount"
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
            id="tx-currency"
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
          Описание
        </label>
        <input
          type="text"
          name="description"
          placeholder="Необязательно"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Дата
        </label>
        <input
          type="date"
          name="date"
          defaultValue={new Date().toISOString().split('T')[0]}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {goals && goals.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Копилка
          </label>
          <select
            name="goalId"
            id="tx-goal"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Не привязывать</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.name}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50"
      >
        {pending ? 'Добавляем...' : 'Добавить'}
      </button>
    </form>
  )
}
