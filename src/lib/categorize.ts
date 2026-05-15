import type { TransactionType } from '@/generated/prisma'

const CATEGORY_KEYWORDS: Record<string, string> = {
  'зарплат': 'salary', 'аванс': 'salary', 'оклад': 'salary',
  'фриланс': 'freelance', 'подработк': 'freelance',
  'инвестици': 'investment', 'вклад': 'investment', 'дивиденд': 'investment', 'акци': 'investment',
  'подарок': 'gift', 'дар': 'gift', 'премия': 'gift',
  'продуктов': 'food', 'магазин': 'food', 'пятерочк': 'food', 'перекрест': 'food',
  'ашан': 'food', 'лента': 'food', 'магни': 'food', 'сыр': 'food', 'мяс': 'food', 'овощ': 'food',
  'супермаркет': 'food', 'гипермаркет': 'food', 'гастроном': 'food', 'бакале': 'food', 'дикси': 'food',
  'ресторан': 'food', 'кафе': 'food', 'кофе': 'food', 'пицц': 'food', 'бургер': 'food',
  'транспорт': 'transport', 'такси': 'transport', 'яндекс': 'transport', 'убер': 'transport',
  'метро': 'transport', 'автобус': 'transport', 'бензин': 'transport', 'газ': 'transport', 'парковк': 'transport',
  'аренд': 'housing', 'квартир': 'housing', 'ипотек': 'housing',
  'коммуналк': 'utilities', 'электричеств': 'utilities', 'свет': 'utilities',
  'вод': 'utilities', 'отоплен': 'utilities', 'интернет': 'utilities', 'телефон': 'utilities',
  'развлечен': 'entertainment', 'кино': 'entertainment', 'театр': 'entertainment',
  'концерт': 'entertainment', 'игра': 'entertainment', 'подписк': 'entertainment',
  'здоровь': 'health', 'врач': 'health', 'аптек': 'health', 'лекарств': 'health',
  'стоматолог': 'health', 'больниц': 'health', 'анали': 'health',
  'образовани': 'education', 'курс': 'education', 'учебник': 'education',
  'школ': 'education', 'университет': 'education', 'тренинг': 'education',
  'одежд': 'clothing', 'обувь': 'clothing', 'спортмастер': 'clothing',
}

const INCOME_CATEGORIES = new Set(['salary', 'freelance', 'investment', 'gift', 'other_income'])
const EXPENSE_CATEGORIES = new Set(['food', 'transport', 'housing', 'entertainment', 'health', 'education', 'clothing', 'utilities', 'other_expense'])

export function categorizeByRules(description: string, type: TransactionType): string {
  const lower = description.toLowerCase().replace(/ё/g, 'е')
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      if (type === 'INCOME' && EXPENSE_CATEGORIES.has(category)) return 'other_income'
      if (type === 'EXPENSE' && INCOME_CATEGORIES.has(category)) return 'other_expense'
      return category
    }
  }
  return type === 'INCOME' ? 'other_income' : 'other_expense'
}
