import type { TransactionType } from '@/generated/prisma'

export const DEFAULT_CATEGORIES = {
  INCOME: [
    { value: 'salary', label: 'Зарплата' },
    { value: 'freelance', label: 'Фриланс' },
    { value: 'investment', label: 'Инвестиции' },
    { value: 'gift', label: 'Подарок' },
    { value: 'other_income', label: 'Другое' },
  ],
  EXPENSE: [
    { value: 'food', label: 'Еда' },
    { value: 'transport', label: 'Транспорт' },
    { value: 'housing', label: 'Жильё' },
    { value: 'entertainment', label: 'Развлечения' },
    { value: 'health', label: 'Здоровье' },
    { value: 'education', label: 'Образование' },
    { value: 'clothing', label: 'Одежда' },
    { value: 'utilities', label: 'Коммунальные' },
    { value: 'other_expense', label: 'Другое' },
  ],
} as const

export type CategoryValue = typeof DEFAULT_CATEGORIES.INCOME[number]['value'] | typeof DEFAULT_CATEGORIES.EXPENSE[number]['value']

export type CategoryOption = { value: string; label: string; isCustom?: boolean }

export function mergeCategories(
  defaults: typeof DEFAULT_CATEGORIES,
  custom: { name: string; type: TransactionType }[]
): { INCOME: CategoryOption[]; EXPENSE: CategoryOption[] } {
  const customIncome = custom
    .filter((c) => c.type === 'INCOME')
    .map((c) => ({ value: c.name, label: c.name, isCustom: true }))

  const customExpense = custom
    .filter((c) => c.type === 'EXPENSE')
    .map((c) => ({ value: c.name, label: c.name, isCustom: true }))

  return {
    INCOME: [
      ...defaults.INCOME.map((c) => ({ value: c.value, label: c.label })),
      ...customIncome,
    ],
    EXPENSE: [
      ...defaults.EXPENSE.map((c) => ({ value: c.value, label: c.label })),
      ...customExpense,
    ],
  }
}
