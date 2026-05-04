import { NextRequest, NextResponse } from 'next/server'

const CATEGORY_MAP: Record<string, string> = {
  salary: 'salary', зарплат: 'salary', аванс: 'salary', оклад: 'salary',
  freelance: 'freelance', фриланс: 'freelance', подработк: 'freelance',
  инвестици: 'investment', вклад: 'investment', дивиденд: 'investment', акци: 'investment',
  подарок: 'gift', дар: 'gift', премия: 'gift',
  продуктов: 'food', магазин: 'food', пятерочк: 'food', перекрест: 'food',
  ашан: 'food', лента: 'food', магни: 'food', сыр: 'food', мясо: 'food', овощ: 'food',
  ресторан: 'food', кафе: 'food', кофе: 'food', пицц: 'food', бургер: 'food', макдоналд: 'food',
  транспорт: 'transport', такси: 'transport', яндекс: 'transport', убер: 'transport',
  метро: 'transport', автобус: 'transport', бензин: 'transport', газ: 'transport', парковк: 'transport',
  аренд: 'housing', квартир: 'housing', ипотек: 'housing', коммуналк: 'utilities',
  электричеств: 'utilities', свет: 'utilities', вода: 'utilities', отоплен: 'utilities',
  интернет: 'utilities', телефон: 'utilities',
  развлечен: 'entertainment', кино: 'entertainment', театр: 'entertainment',
  концерт: 'entertainment', игра: 'entertainment', подписк: 'entertainment',
  здоровь: 'health', врач: 'health', аптек: 'health', лекарств: 'health',
  стоматолог: 'health', больниц: 'health', анали: 'health',
  образовани: 'education', курс: 'education', учебник: 'education', школ: 'education',
  университет: 'education', тренинг: 'education',
  одежд: 'clothing', обувь: 'clothing', зара: 'clothing', h_m: 'clothing', спортмастер: 'clothing',
}

function ruleBasedCategorize(description: string): string | null {
  const lower = description.toLowerCase()
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return category
  }
  return null
}

const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1'
const AI_MODEL = process.env.AI_MODEL || 'google/gemma-3-4b-it:free'

export async function POST(req: NextRequest) {
  const { description, type } = await req.json()

  if (!description) {
    return NextResponse.json({ category: null })
  }

  const ruleResult = ruleBasedCategorize(description)
  if (ruleResult) {
    return NextResponse.json({ category: ruleResult, source: 'rules' })
  }

  if (!AI_API_KEY) {
    return NextResponse.json({ category: type === 'INCOME' ? 'other_income' : 'other_expense', source: 'fallback' })
  }

  try {
    const categories = type === 'INCOME'
      ? 'salary, freelance, investment, gift, other_income'
      : 'food, transport, housing, entertainment, health, education, clothing, utilities, other_expense'

    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
        ...(AI_BASE_URL.includes('openrouter') ? { 'HTTP-Referer': process.env.NEXTAUTH_URL || 'https://doxod.app' } : {}),
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a transaction categorizer for a Russian finance app. Given a transaction description, return ONLY one category from: ' + categories + '. Respond with just the category name, nothing else.',
          },
          { role: 'user', content: description },
        ],
        max_tokens: 20,
        temperature: 0,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ category: type === 'INCOME' ? 'other_income' : 'other_expense', source: 'fallback' })
    }

    const data = await res.json()
    const category = data.choices?.[0]?.message?.content?.trim().toLowerCase()
    return NextResponse.json({ category: category || (type === 'INCOME' ? 'other_income' : 'other_expense'), source: 'ai' })
  } catch {
    return NextResponse.json({ category: type === 'INCOME' ? 'other_income' : 'other_expense', source: 'fallback' })
  }
}
