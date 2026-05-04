'use client'

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/currency'
import type { Currency } from '@/generated/prisma'

const CHART_COLORS = [
  '#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

interface CategoryData {
  name: string
  value: number
}

interface BalancePoint {
  date: string
  balance: number
}

interface MonthlyData {
  month: string
  income: number
  expense: number
}

interface AnalyticsChartsProps {
  categoryData: CategoryData[]
  balanceHistory: BalancePoint[]
  monthlyData: MonthlyData[]
  currency: Currency
}

function getCategoryChartConfig(data: CategoryData[]): ChartConfig {
  const config: ChartConfig = {}
  data.forEach((item, i) => {
    config[item.name] = {
      label: item.name,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }
  })
  return config
}

function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    RUB: '₽', USD: '$', EUR: '€', GBP: '£', KZT: '₸', UAH: '₴',
  }
  return symbols[currency]
}

export function AnalyticsCharts({
  categoryData,
  balanceHistory,
  monthlyData,
  currency,
}: AnalyticsChartsProps) {
  const categoryConfig = getCategoryChartConfig(categoryData)
  const symbol = getCurrencySymbol(currency)

  const monthlyConfig: ChartConfig = {
    income: {
      label: 'Доходы',
      color: '#10b981',
    },
    expense: {
      label: 'Расходы',
      color: '#f43f5e',
    },
  }

  const balanceConfig: ChartConfig = {
    balance: {
      label: 'Баланс',
      color: '#6366f1',
    },
  }

  const formattedBalanceHistory = balanceHistory.map((p) => ({
    ...p,
    date: new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  }))

  const formattedMonthlyData = monthlyData.map((m) => ({
    ...m,
    month: new Date(m.month + '-01').toLocaleDateString('ru-RU', { month: 'short' }),
  }))

  return (
    <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-1">Расходы по категориям</h3>
        <p className="text-xs text-zinc-600 mb-4">Распределение ваших трат</p>
        {categoryData.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">Нет данных</p>
        ) : (
          <ChartContainer config={categoryConfig} className="mx-auto aspect-square max-h-[260px]">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                innerRadius="45%"
                outerRadius="80%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value), currency)}
                    nameKey="name"
                    className="bg-[#1a1a24] border-[#2a2a3a] text-zinc-200"
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        )}
      </div>

      <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-1">Доходы vs Расходы</h3>
        <p className="text-xs text-zinc-600 mb-4">Сравнение по месяцам</p>
        {monthlyData.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">Нет данных</p>
        ) : (
          <ChartContainer config={monthlyConfig} className="aspect-video w-full max-h-[260px]">
            <BarChart data={formattedMonthlyData} barCategoryGap="20%">
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e1e2a" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} stroke="#71717a" />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} stroke="#71717a" tickFormatter={(v) => `${v}${symbol}`} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value), currency)}
                    className="bg-[#1a1a24] border-[#2a2a3a] text-zinc-200"
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </div>

      <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5 col-span-full">
        <h3 className="text-sm font-semibold text-zinc-200 mb-1">Динамика баланса</h3>
        <p className="text-xs text-zinc-600 mb-4">Изменение за последние 6 месяцев</p>
        {balanceHistory.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">Нет данных</p>
        ) : (
          <ChartContainer config={balanceConfig} className="aspect-video w-full max-h-[280px]">
            <AreaChart data={formattedBalanceHistory}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e1e2a" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} stroke="#71717a" />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} stroke="#71717a" tickFormatter={(v) => `${v}${symbol}`} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value), currency)}
                    className="bg-[#1a1a24] border-[#2a2a3a] text-zinc-200"
                  />
                }
              />
              <defs>
                <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area
                dataKey="balance"
                type="monotone"
                fill="url(#balanceFill)"
                stroke="var(--color-balance)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}
