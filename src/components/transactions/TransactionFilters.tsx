'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'

export function TransactionFilters({
  categories,
  type,
  category,
  search,
  dateFrom,
  dateTo,
}: {
  categories: string[]
  type?: string
  category?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`/transactions?${params.toString()}`)
    },
    [router, sp]
  )

  const clearAll = () => {
    router.push('/transactions')
  }

  const hasFilters = type || category || search || dateFrom || dateTo

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
          <input
            type="text"
            placeholder="Поиск по описанию..."
            defaultValue={search ?? ''}
            onChange={(e) => update('search', e.target.value)}
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <select
          value={type ?? ''}
          onChange={(e) => update('type', e.target.value)}
          className="rounded-lg border border-[#1e1e2a] bg-[#111118] px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="">Все типы</option>
          <option value="INCOME">Доходы</option>
          <option value="EXPENSE">Расходы</option>
        </select>

        <select
          value={category ?? ''}
          onChange={(e) => update('category', e.target.value)}
          className="rounded-lg border border-[#1e1e2a] bg-[#111118] px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom ?? ''}
          onChange={(e) => update('dateFrom', e.target.value)}
          className="rounded-lg border border-[#1e1e2a] bg-[#111118] px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          title="С"
        />
        <input
          type="date"
          value={dateTo ?? ''}
          onChange={(e) => update('dateTo', e.target.value)}
          className="rounded-lg border border-[#1e1e2a] bg-[#111118] px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          title="По"
        />

        {hasFilters && (
          <button
            onClick={clearAll}
            className="rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  )
}
