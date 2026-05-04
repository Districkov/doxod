'use client'

import { useActionState } from 'react'
import { createCategory, deleteCategory } from '@/app/(dashboard)/_actions/category-actions'
import { X } from 'lucide-react'
import type { Category } from '@/generated/prisma'

type Result = { success: boolean; error?: string }

export function CategoryManager({
  categories,
}: {
  categories: Category[]
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(createCategory, { success: false })

  const income = categories.filter((c) => c.type === 'INCOME')
  const expense = categories.filter((c) => c.type === 'EXPENSE')

  return (
    <div className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400">{state.error}</div>
      )}
      {state.success && (
        <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400">Категория создана</div>
      )}

      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500">Название</label>
          <input
            type="text"
            name="name"
            required
            placeholder="Новая категория"
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Тип</label>
          <select
            name="type"
            defaultValue="EXPENSE"
            className="rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="EXPENSE">Расход</option>
            <option value="INCOME">Доход</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
        >
          Добавить
        </button>
      </form>

      <div className="grid gap-4 grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold text-zinc-500 mb-2">Расходы</h4>
          <div className="space-y-1">
            {expense.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-lg bg-[#1a1a24] px-3 py-1.5">
                <span className="text-sm text-zinc-300">{cat.name}</span>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={cat.id} />
                  <button type="submit" className="text-zinc-600 hover:text-rose-400 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            ))}
            {expense.length === 0 && <p className="text-xs text-zinc-700">Нет кастомных</p>}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-zinc-500 mb-2">Доходы</h4>
          <div className="space-y-1">
            {income.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-lg bg-[#1a1a24] px-3 py-1.5">
                <span className="text-sm text-zinc-300">{cat.name}</span>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={cat.id} />
                  <button type="submit" className="text-zinc-600 hover:text-rose-400 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            ))}
            {income.length === 0 && <p className="text-xs text-zinc-700">Нет кастомных</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
