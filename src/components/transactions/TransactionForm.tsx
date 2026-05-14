'use client'

import { useActionState, useState, useCallback } from 'react'
import { addTransaction } from '@/app/(dashboard)/_actions/transaction-actions'
import { DEFAULT_CATEGORIES, mergeCategories } from '@/lib/categories'
import type { Currency, TransactionType, Category } from '@/generated/prisma'
import type { Goal } from '@/generated/prisma'

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

const CATEGORY_KEYWORDS: Record<string, string> = {
  'зарплат': 'salary', 'аванс': 'salary', 'оклад': 'salary',
  'фриланс': 'freelance', 'подработк': 'freelance',
  'инвестици': 'investment', 'вклад': 'investment', 'дивиденд': 'investment',
  'подарок': 'gift', 'премия': 'gift',
  'продуктов': 'food', 'магазин': 'food', 'пятерочк': 'food', 'магни': 'food', 'ашан': 'food',
  'ресторан': 'food', 'кафе': 'food', 'кофе': 'food', 'пицц': 'food',
  'транспорт': 'transport', 'такси': 'transport', 'метро': 'transport', 'бензин': 'transport',
  'аренд': 'housing', 'квартир': 'housing', 'ипотек': 'housing',
  'коммуналк': 'utilities', 'электричеств': 'utilities', 'интернет': 'utilities',
  'развлечен': 'entertainment', 'кино': 'entertainment', 'подписк': 'entertainment',
  'здоровь': 'health', 'врач': 'health', 'аптек': 'health', 'лекарств': 'health',
  'образовани': 'education', 'курс': 'education',
  'одежд': 'clothing', 'обувь': 'clothing',
}

interface TransactionFormProps {
  goals?: Goal[]
  familyCategories?: Category[]
}

export function TransactionForm({ goals, familyCategories = [] }: TransactionFormProps) {
  const [state, formAction, pending] = useActionState(addTransaction, { success: false })
  const [txType, setTxType] = useState<TransactionType>('EXPENSE')
  const [selectedCategory, setSelectedCategory] = useState('')

  const allCats = mergeCategories(DEFAULT_CATEGORIES, familyCategories.map((c) => ({ name: c.name, type: c.type })))
  const categories = txType === 'INCOME' ? allCats.INCOME : allCats.EXPENSE

  const autoCategorize = useCallback((desc: string) => {
    if (!desc.trim()) return
    const lower = desc.toLowerCase()
    for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
      if (lower.includes(keyword)) {
        const catValues = categories.map(c => c.value)
        if (catValues.includes(category)) {
          setSelectedCategory(category)
          return
        }
      }
    }
  }, [categories])

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
            onChange={(e) => {
              setTxType(e.target.value as TransactionType)
              setSelectedCategory('')
            }}
            className={selectCls}
          >
            <option value="EXPENSE">Расход</option>
            <option value="INCOME">Доход</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Категория</label>
          <select
            name="category"
            required
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={selectCls}
          >
            <option value="">Выберите...</option>
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
        <label className={labelCls}>Описание</label>
        <input
          type="text"
          name="description"
          placeholder="Необязательно"
          className={inputCls}
          onBlur={(e) => autoCategorize(e.target.value)}
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
