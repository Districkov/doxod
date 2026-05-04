'use client'

import { useActionState, useState, useCallback } from 'react'
import { addTransaction } from '@/app/(dashboard)/_actions/transaction-actions'
import { DEFAULT_CATEGORIES, mergeCategories } from '@/lib/categories'
import type { Currency, TransactionType, Category } from '@/generated/prisma'
import type { Goal } from '@/generated/prisma'
import { Sparkles } from 'lucide-react'

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

interface TransactionFormProps {
  goals?: Goal[]
  familyCategories?: Category[]
}

export function TransactionForm({ goals, familyCategories = [] }: TransactionFormProps) {
  const [state, formAction, pending] = useActionState(addTransaction, { success: false })
  const [txType, setTxType] = useState<TransactionType>('EXPENSE')
  const [aiLoading, setAiLoading] = useState(false)

  const allCats = mergeCategories(DEFAULT_CATEGORIES, familyCategories.map((c) => ({ name: c.name, type: c.type })))
  const categories = txType === 'INCOME' ? allCats.INCOME : allCats.EXPENSE

  const handleAiCategorize = useCallback(async (desc: string) => {
    if (!desc.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, type: txType }),
      })
      const data = await res.json()
      if (data.category) {
        const select = document.querySelector('select[name="category"]') as HTMLSelectElement | null
        if (select) {
          const option = Array.from(select.options).find((o) => o.value === data.category)
          if (option) {
            select.value = data.category
          } else {
            select.value = data.category
          }
        }
      }
    } catch {
    } finally {
      setAiLoading(false)
    }
  }, [txType])

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400">{state.error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Тип</label>
          <select
            name="type"
            value={txType}
            onChange={(e) => setTxType(e.target.value as TransactionType)}
            className={selectCls}
          >
            <option value="EXPENSE">Расход</option>
            <option value="INCOME">Доход</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Категория</label>
          <select name="category" required className={selectCls}>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}{cat.isCustom ? ' ✦' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Сумма</label>
          <input
            type="number"
            name="amount"
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
        <label className={labelCls}>
          Описание
          <button
            type="button"
            onClick={() => {
              const input = document.querySelector('input[name="description"]') as HTMLInputElement | null
              if (input) handleAiCategorize(input.value)
            }}
            disabled={aiLoading}
            className="ml-2 inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
            title="ИИ-категоризация"
          >
            <Sparkles className="h-3 w-3" />
            <span className="text-[10px]">{aiLoading ? '...' : 'ИИ'}</span>
          </button>
        </label>
        <input
          type="text"
          name="description"
          placeholder="Необязательно"
          className={inputCls}
          onBlur={(e) => {
            if (e.target.value.trim()) handleAiCategorize(e.target.value)
          }}
        />
      </div>

      <div>
        <label className={labelCls}>Дата</label>
        <input
          type="date"
          name="date"
          defaultValue={new Date().toISOString().split('T')[0]}
          className={inputCls}
        />
      </div>

      {goals && goals.length > 0 && (
        <div>
          <label className={labelCls}>Копилка</label>
          <select name="goalId" className={selectCls}>
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
        className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700 active:from-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
      >
        {pending ? 'Добавляем...' : 'Добавить'}
      </button>
    </form>
  )
}
