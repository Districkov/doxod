import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import type { Currency } from '@/generated/prisma'

interface MonthComparisonProps {
  current: { totalIncome: number; totalExpense: number; formatted: { income: string; expense: string } }
  prev: { totalIncome: number; totalExpense: number; formatted: { income: string; expense: string } }
  incomeChange: number
  expenseChange: number
  currency: Currency
}

function ChangeBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0
  const isNeutral = value === 0
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
  const color = label === 'расходы'
    ? (isPositive ? 'text-rose-400' : 'text-emerald-400')
    : (isPositive ? 'text-emerald-400' : 'text-rose-400')

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3 w-3 ${color}`} />
      <span className={`text-[11px] font-medium ${color}`}>
        {isPositive ? '+' : ''}{value}% {label}
      </span>
    </div>
  )
}

export function MonthComparison({
  current,
  prev,
  incomeChange,
  expenseChange,
  currency,
}: MonthComparisonProps) {
  const savingsRate = current.totalIncome > 0
    ? Math.round(((current.totalIncome - current.totalExpense) / current.totalIncome) * 100)
    : 0
  const prevSavingsRate = prev.totalIncome > 0
    ? Math.round(((prev.totalIncome - prev.totalExpense) / prev.totalIncome) * 100)
    : 0

  return (
    <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-4">
      <h3 className="text-sm font-semibold text-zinc-200 mb-3">Сравнение с прошлым месяцем</h3>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Доходы</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-400">{current.formatted.income}</span>
            <ChangeBadge value={incomeChange} label="доходы" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Расходы</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-rose-400">{current.formatted.expense}</span>
            <ChangeBadge value={expenseChange} label="расходы" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#1e1e2a]">
          <span className="text-xs text-zinc-500">Норма сбережений</span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {savingsRate}%
            </span>
            {savingsRate !== prevSavingsRate && (
              <span className={`text-[11px] ${savingsRate > prevSavingsRate ? 'text-emerald-400' : 'text-rose-400'}`}>
                {savingsRate > prevSavingsRate ? '+' : ''}{savingsRate - prevSavingsRate}п.п.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
