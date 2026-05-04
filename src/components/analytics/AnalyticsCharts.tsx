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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/currency'
import type { Currency } from '@/generated/prisma'

const CHART_COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(0, 84%, 60%)',
  'hsl(38, 92%, 50%)',
  'hsl(160, 84%, 39%)',
  'hsl(262, 83%, 58%)',
  'hsl(330, 81%, 60%)',
  'hsl(173, 80%, 40%)',
  'hsl(25, 95%, 53%)',
  'hsl(245, 58%, 51%)',
  'hsl(84, 81%, 44%)',
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
      color: 'hsl(160, 84%, 39%)',
    },
    expense: {
      label: 'Расходы',
      color: 'hsl(0, 84%, 60%)',
    },
  }

  const balanceConfig: ChartConfig = {
    balance: {
      label: 'Баланс',
      color: 'hsl(221, 83%, 53%)',
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
      <Card>
        <CardHeader>
          <CardTitle>Расходы по категориям</CardTitle>
          <CardDescription>Распределение ваших трат</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ChartContainer config={categoryConfig} className="mx-auto aspect-square max-h-[280px]">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="40%"
                  outerRadius="80%"
                  paddingAngle={2}
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
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Доходы vs Расходы</CardTitle>
          <CardDescription>Сравнение по месяцам</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ChartContainer config={monthlyConfig} className="aspect-video w-full max-h-[280px]">
              <BarChart data={formattedMonthlyData} barCategoryGap="20%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => `${v}${symbol}`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value), currency)}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Динамика баланса</CardTitle>
          <CardDescription>Изменение баланса за последние 6 месяцев</CardDescription>
        </CardHeader>
        <CardContent>
          {balanceHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <ChartContainer config={balanceConfig} className="aspect-video w-full max-h-[300px]">
              <AreaChart data={formattedBalanceHistory}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(v) => `${v}${symbol}`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value), currency)}
                    />
                  }
                />
                <defs>
                  <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.05} />
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
        </CardContent>
      </Card>
    </div>
  )
}
