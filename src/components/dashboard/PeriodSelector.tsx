'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export function PeriodSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const monthParam = searchParams.get('month')

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  let year: number
  let month: number

  if (monthParam) {
    const [y, m] = monthParam.split('-').map(Number)
    year = y
    month = m - 1
  } else {
    year = currentYear
    month = currentMonth
  }

  const goTo = (y: number, m: number) => {
    const mStr = String(m + 1).padStart(2, '0')
    router.push(`/dashboard?month=${y}-${mStr}`)
  }

  const isCurrentMonth = year === currentYear && month === currentMonth
  const label = `${MONTHS_RU[month]} ${year}`

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          const d = new Date(year, month - 1, 1)
          goTo(d.getFullYear(), d.getMonth())
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-[#1a1a24] hover:text-zinc-300 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium text-zinc-200 min-w-[130px] text-center">{label}</span>
      <button
        onClick={() => {
          const d = new Date(year, month + 1, 1)
          goTo(d.getFullYear(), d.getMonth())
        }}
        disabled={isCurrentMonth}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-[#1a1a24] hover:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => goTo(currentYear, currentMonth)}
          className="ml-1 rounded-lg px-2 py-1 text-[11px] text-indigo-400 hover:bg-indigo-500/10 transition-colors"
        >
          Сейчас
        </button>
      )}
    </div>
  )
}
