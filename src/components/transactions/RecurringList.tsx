'use client'

import { toggleRecurring, deleteRecurring } from '@/app/(dashboard)/_actions/recurring-actions'
import { formatCurrency } from '@/lib/currency'
import { Pause, Play, Trash2, Repeat } from 'lucide-react'
import type { RecurringTransaction } from '@/generated/prisma'

const FREQ_LABELS: Record<string, string> = {
  DAILY: 'ежедневно',
  WEEKLY: 'еженедельно',
  MONTHLY: 'ежемесячно',
  YEARLY: 'ежегодно',
}

export function RecurringList({ recurring }: { recurring: RecurringTransaction[] }) {
  return (
    <div className="space-y-1.5">
      {recurring.map((rt) => (
        <div
          key={rt.id}
          className="flex items-center justify-between rounded-lg bg-[#1a1a24] px-3 py-2"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Repeat className="h-3 w-3 text-indigo-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-200 truncate">{rt.category}</span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {FREQ_LABELS[rt.frequency]} · {formatCurrency(rt.amount, rt.currency)} · {new Date(rt.nextDate).toLocaleDateString('ru-RU')}
            </p>
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
            <form action={toggleRecurring}>
              <input type="hidden" name="id" value={rt.id} />
              <input type="hidden" name="isActive" value={String(rt.isActive)} />
              <button
                type="submit"
                className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors"
                title={rt.isActive ? 'Приостановить' : 'Возобновить'}
              >
                {rt.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
            </form>
            <form action={deleteRecurring}>
              <input type="hidden" name="id" value={rt.id} />
              <button
                type="submit"
                className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                title="Удалить"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  )
}
