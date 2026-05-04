'use client'

import { useActionState } from 'react'
import { updateFamilyName, updateFamilyCurrency } from '@/app/(dashboard)/_actions/settings-actions'
import type { Currency } from '@/generated/prisma'

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'RUB', label: '₽ Рубли' },
  { value: 'USD', label: '$ Доллары' },
  { value: 'EUR', label: '€ Евро' },
  { value: 'GBP', label: '£ Фунты' },
  { value: 'KZT', label: '₸ Тенге' },
  { value: 'UAH', label: '₴ Гривны' },
]

type Result = { success: boolean; error?: string }

export function FamilySettingsForm({
  familyName,
  currency,
  memberCount,
}: {
  familyName: string
  currency: Currency
  memberCount: number
}) {
  const [nameState, nameAction, namePending] = useActionState<Result, FormData>(updateFamilyName, { success: false })
  const [currState, currAction, currPending] = useActionState<Result, FormData>(updateFamilyCurrency, { success: false })

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Название семьи</h3>
        <form action={nameAction} className="space-y-3">
          {nameState.error && (
            <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400">{nameState.error}</div>
          )}
          {nameState.success && (
            <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400">Название обновлено</div>
          )}
          <input
            type="text"
            name="name"
            defaultValue={familyName}
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button
            type="submit"
            disabled={namePending}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
          >
            {namePending ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>
      </div>

      <div className="border-t border-[#1e1e2a] pt-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Базовая валюта</h3>
        <form action={currAction} className="space-y-3">
          {currState.error && (
            <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400">{currState.error}</div>
          )}
          {currState.success && (
            <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400">Валюта обновлена</div>
          )}
          <select
            name="currency"
            defaultValue={currency}
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={currPending}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
          >
            {currPending ? 'Сохраняем...' : 'Изменить валюту'}
          </button>
        </form>
      </div>

      <div className="border-t border-[#1e1e2a] pt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Участников</span>
          <span className="text-zinc-200 font-medium">{memberCount}</span>
        </div>
      </div>
    </div>
  )
}
