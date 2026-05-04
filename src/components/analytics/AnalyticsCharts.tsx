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
  RadialBar,
  RadialBarChart,
  Label,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/currency'
import { useState } from 'react'
import type { Currency } from '@/generated/prisma'

const COLORS = [
  '#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
]

interface CategoryData {
  name: string
  value: number
  fill?: string
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

interface Props {
  expenseCategories: CategoryData[]
  incomeCategories: CategoryData[]
  balanceHistory: BalancePoint[]
  monthlyData: MonthlyData[]
  currency: Currency
}

function makeConfig(data: CategoryData[]): ChartConfig {
  const c: ChartConfig = {}
  data.forEach((d, i) => {
    c[d.name] = { label: d.name, color: COLORS[i % COLORS.length] }
  })
  return c
}

const sym: Record<Currency, string> = {
  RUB: '₽', USD: '$', EUR: '€', GBP: '£', KZT: '₸', UAH: '₴',
}

export function AnalyticsCharts({
  expenseCategories,
  incomeCategories,
  balanceHistory,
  monthlyData,
  currency,
}: Props) {
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense')
  const categories = categoryType === 'expense' ? expenseCategories : incomeCategories
  const categoryConfig = makeConfig(categories)

  const monthlyConfig: ChartConfig = {
    income: { label: 'Доходы', color: '#10b981' },
    expense: { label: 'Расходы', color: '#f43f5e' },
  }

  const balanceConfig: ChartConfig = {
    balance: { label: 'Баланс', color: '#6366f1' },
  }

  const totalExpenses = expenseCategories.reduce((s, c) => s + c.value, 0)
  const topExpense = expenseCategories[0]

  const pieData = categories.map((c, i) => ({
    ...c,
    fill: COLORS[i % COLORS.length],
  }))

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })

  const fmtMonth = (m: string) =>
    new Date(m + '-01').toLocaleDateString('ru-RU', { month: 'short' })

  const balanceData = balanceHistory.map((p) => ({
    ...p,
    date: fmtDate(p.date),
  }))

  const monthlyBarData = monthlyData.map((m) => ({
    ...m,
    month: fmtMonth(m.month),
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">По категориям</h3>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {categoryType === 'expense' ? 'Расходы' : 'Доходы'}
              </p>
            </div>
            <Tabs value={categoryType} onValueChange={(v) => setCategoryType(v as 'expense' | 'income')}>
              <TabsList className="h-7 bg-[#1a1a24] p-0.5">
                <TabsTrigger
                  value="expense"
                  className="h-6 rounded-md px-2.5 text-[11px] data-[selected]:bg-rose-500/15 data-[selected]:text-rose-400"
                >
                  Расходы
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="h-6 rounded-md px-2.5 text-[11px] data-[selected]:bg-emerald-500/15 data-[selected]:text-emerald-400"
                >
                  Доходы
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">Нет данных</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <ChartContainer config={categoryConfig} className="mx-auto aspect-square max-h-[220px]">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="50%"
                    outerRadius="85%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          const top = categoryType === 'expense' ? topExpense : categories[0]
                          return (
                            <g>
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy - 6}
                                textAnchor="middle"
                                className="fill-zinc-400 text-[11px]"
                              >
                                {top?.name ?? ''}
                              </text>
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy + 10}
                                textAnchor="middle"
                                className="fill-zinc-200 text-sm font-bold"
                              >
                                {top ? formatCurrency(top.value, currency) : ''}
                              </text>
                            </g>
                          )
                        }
                        return null
                      }}
                    />
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => formatCurrency(Number(v), currency)}
                        nameKey="name"
                        className="bg-[#1a1a24] border-[#2a2a3a] text-zinc-200"
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>

              <div className="space-y-2">
                {categories.slice(0, 6).map((cat, i) => {
                  const pct = totalExpenses > 0 ? (cat.value / (categoryType === 'expense' ? totalExpenses : categories.reduce((s, c) => s + c.value, 0))) * 100 : 0
                  return (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-[11px] text-zinc-400 flex-1 truncate">{cat.name}</span>
                      <span className="text-[11px] text-zinc-500 tabular-nums">{pct.toFixed(0)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-zinc-200">Доходы vs Расходы</h3>
            <p className="text-[11px] text-zinc-600 mt-0.5">Сравнение по месяцам</p>
          </div>

          {monthlyData.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">Нет данных</p>
          ) : (
            <ChartContainer config={monthlyConfig} className="aspect-video w-full max-h-[240px]">
              <BarChart data={monthlyBarData} barCategoryGap="25%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e1e2a" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                  stroke="#52525b"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                  stroke="#52525b"
                  tickFormatter={(v) => `${v}${sym[currency]}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => formatCurrency(Number(v), currency)}
                      className="bg-[#1a1a24] border-[#2a2a3a] text-zinc-200"
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent className="text-zinc-400" />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-200">Динамика баланса</h3>
          <p className="text-[11px] text-zinc-600 mt-0.5">Изменение за последние 6 месяцев</p>
        </div>

        {balanceHistory.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600">Нет данных</p>
        ) : (
          <ChartContainer config={balanceConfig} className="aspect-video w-full max-h-[280px]">
            <AreaChart data={balanceData}>
              <defs>
                <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e1e2a" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                stroke="#52525b"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                stroke="#52525b"
                tickFormatter={(v) => `${v}${sym[currency]}`}
              />
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
