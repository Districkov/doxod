'use client'

import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/currency'
import type { Currency } from '@/generated/prisma'

interface BalancePoint {
  date: string
  balance: number
}

interface Props {
  data: BalancePoint[]
  currency: Currency
}

const config: ChartConfig = {
  balance: { label: 'Баланс', color: '#6366f1' },
}

const sym: Record<Currency, string> = {
  RUB: '₽', USD: '$', EUR: '€', GBP: '£', KZT: '₸', UAH: '₴',
}

export function DashboardChart({ data, currency }: Props) {
  const formatted = data.map((p) => ({
    ...p,
    date: new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-zinc-600">
        Недостаточно данных для графика
      </div>
    )
  }

  return (
    <ChartContainer config={config} className="aspect-[2/1] w-full">
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e1e2a" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          fontSize={10}
          stroke="#52525b"
          interval="preserveStartEnd"
        />
        <YAxis hide />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) => formatCurrency(Number(v), currency)}
              className="bg-[#1a1a24] border-[#2a2a3a] text-zinc-200"
            />
          }
        />
        <Area
          dataKey="balance"
          type="monotone"
          fill="url(#dashFill)"
          stroke="var(--color-balance)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
