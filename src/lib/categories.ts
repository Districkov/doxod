export const TRANSACTION_CATEGORIES = {
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

export type CategoryValue = typeof TRANSACTION_CATEGORIES.INCOME[number]['value'] | typeof TRANSACTION_CATEGORIES.EXPENSE[number]['value']
