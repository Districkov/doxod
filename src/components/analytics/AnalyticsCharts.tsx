'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { formatCurrency } from '@/lib/currency'
import type { Currency } from '@/generated/prisma'

const COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6',
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

export function AnalyticsCharts({
  categoryData,
  balanceHistory,
  monthlyData,
  currency,
}: AnalyticsChartsProps) {
  return (
    <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
          Расходы по категориям
        </h3>
        {categoryData.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currency)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
          Доходы vs Расходы
        </h3>
        {monthlyData.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currency)}
              />
              <Bar dataKey="income" name="Доходы" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Расходы" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="col-span-full rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
          Динамика баланса
        </h3>
        {balanceHistory.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <AreaChart data={balanceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currency)}
              />
              <Area
                type="monotone"
                dataKey="balance"
                name="Баланс"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
