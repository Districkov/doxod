'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Calendar } from 'lucide-react'

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Всё время' },
  { value: 'month', label: 'Месяц' },
  { value: '3months', label: '3 мес.' },
  { value: '6months', label: '6 мес.' },
  { value: 'year', label: 'Год' },
  { value: 'custom', label: 'Свой' },
]

export function AnalyticsPeriodSelector({ period }: { period: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const [showCustom, setShowCustom] = useState(period === 'custom')
  const [dateFrom, setDateFrom] = useState(sp.get('dateFrom') || '')
  const [dateTo, setDateTo] = useState(sp.get('dateTo') || '')

  const changePeriod = (value: string) => {
    const params = new URLSearchParams(sp.toString())
    params.set('period', value)

    if (value === 'custom') {
      setShowCustom(true)
      if (dateFrom && dateTo) {
        params.set('dateFrom', dateFrom)
        params.set('dateTo', dateTo)
        router.push(`/analytics?${params.toString()}`)
      }
      return
    }

    setShowCustom(false)
    params.delete('dateFrom')
    params.delete('dateTo')
    router.push(`/analytics?${params.toString()}`)
  }

  const applyCustom = () => {
    if (!dateFrom || !dateTo) return
    const params = new URLSearchParams(sp.toString())
    params.set('period', 'custom')
    params.set('dateFrom', dateFrom)
    params.set('dateTo', dateTo)
    router.push(`/analytics?${params.toString()}`)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => changePeriod(opt.value)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              period === opt.value
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                : 'bg-[#1a1a24] text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-[#1e1e2a] bg-[#111118] px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
          <span className="text-[11px] text-zinc-600">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-[#1e1e2a] bg-[#111118] px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
          <button
            onClick={applyCustom}
            disabled={!dateFrom || !dateTo}
            className="rounded-lg bg-indigo-500/15 px-2.5 py-1.5 text-[11px] font-medium text-indigo-400 hover:bg-indigo-500/25 disabled:opacity-50 transition-colors"
          >
            Применить
          </button>
        </div>
      )}
    </div>
  )
}
