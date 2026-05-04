import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertCurrency, formatCurrency } from '@/lib/currency'
import type { TransactionType, Currency } from '@/generated/prisma'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

function verifyTelegramWebhook(req: NextRequest): boolean {
  if (!BOT_TOKEN) return false
  return true
}

const CURRENCY_MAP: Record<string, Currency> = {
  '₽': 'RUB', 'rub': 'RUB', 'р': 'RUB',
  '$': 'USD', 'usd': 'USD',
  '€': 'EUR', 'eur': 'EUR',
  '£': 'GBP', 'gbp': 'GBP',
  '₸': 'KZT', 'kzt': 'KZT',
  '₴': 'UAH', 'uah': 'UAH',
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  'зарплат': 'salary', 'аванс': 'salary', 'оклад': 'salary',
  'фриланс': 'freelance', 'подработк': 'freelance',
  'продуктов': 'food', 'магазин': 'food', 'пятерочк': 'food', 'магни': 'food', 'ашан': 'food',
  'ресторан': 'food', 'кафе': 'food', 'кофе': 'food', 'пицц': 'food',
  'транспорт': 'transport', 'такси': 'transport', 'яндекс': 'transport', 'метро': 'transport', 'бензин': 'transport',
  'аренд': 'housing', 'квартир': 'housing', 'ипотек': 'housing',
  'развлечен': 'entertainment', 'кино': 'entertainment', 'подписк': 'entertainment',
  'здоровь': 'health', 'врач': 'health', 'аптек': 'health', 'лекарств': 'health',
  'образовани': 'education', 'курс': 'education',
  'одежд': 'clothing', 'обувь': 'clothing',
  'коммуналк': 'utilities', 'электричеств': 'utilities', 'интернет': 'utilities',
}

function parseAmount(text: string): { amount: number; currency: Currency; rest: string } | null {
  const match = text.match(/([\d]+(?:[.,]\d+)?)\s*([₽$€£₸₴]|\w{3})?/i)
  if (!match) return null

  const amount = parseFloat(match[1].replace(',', '.'))
  const currStr = (match[2] || '').toLowerCase()
  const currency = CURRENCY_MAP[currStr] || 'RUB'
  const rest = text.replace(match[0], '').trim()

  return { amount, currency, rest }
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase()
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category
  }
  return 'other_expense'
}

async function findUserByChatId(chatId: number) {
  return prisma.user.findFirst({
    where: { telegramChatId: String(chatId) },
    include: { family: true },
  })
}

export async function POST(req: NextRequest) {
  if (!verifyTelegramWebhook(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const message = body.message
  if (!message?.text || !message?.from?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const text = message.text.trim()
  const tgUserId = message.from.id

  if (text.startsWith('/start')) {
    return sendMarkdown(
      chatId,
      '👋 *Доход — Семейные финансы*\n\nОтправь расход или доход:\n`-500 кофе`\n`+50000 зарплата`\n\nКоманды:\n/balance — баланс семьи\n/help — помощь'
    )
  }

  if (text.startsWith('/help')) {
    return sendMarkdown(
      chatId,
      '📝 *Команды:*\n\n`-500 продукты` — расход\n`+50000 зарплата` — доход\n`-1000 такси $` — в долларах\n/balance — баланс\n/goals — копилки'
    )
  }

  if (text.startsWith('/link')) {
    const parts = text.split(' ')
    const email = parts[1]
    if (!email) {
      return sendMarkdown(chatId, '⚠️ Укажи email: `/link your@email.com`')
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return sendMarkdown(chatId, '❌ Пользователь не найден')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: String(chatId) },
    })

    return sendMarkdown(chatId, '✅ Аккаунт привязан! Теперь можешь добавлять транзакции.')
  }

  const user = await findUserByChatId(chatId)
  if (!user || !user.familyId) {
    return sendMarkdown(chatId, '⚠️ Сначала привяжи аккаунт: `/link your@email.com`')
  }

  if (text.startsWith('/balance')) {
    const family = user.family
    if (!family) {
      return sendMarkdown(chatId, '❌ Семья не найдена')
    }
    const txs = await prisma.transaction.findMany({
      where: { familyId: family.id },
      select: { amount: true, type: true, currency: true },
    })

    let income = 0, expense = 0
    for (const tx of txs) {
      const c = convertCurrency(tx.amount, tx.currency, family.baseCurrency)
      if (tx.type === 'INCOME') income += c
      else expense += c
    }

    return sendMarkdown(
      chatId,
      `💰 *Баланс семьи ${family.name}*\n\nДоходы: ${formatCurrency(income, family.baseCurrency)}\nРасходы: ${formatCurrency(expense, family.baseCurrency)}\nБаланс: ${formatCurrency(income - expense, family.baseCurrency)}`
    )
  }

  if (text.startsWith('/goals')) {
    const goals = await prisma.goal.findMany({
      where: { familyId: user.familyId },
      take: 5,
    })

    if (goals.length === 0) {
      return sendMarkdown(chatId, '🎯 Нет активных копилок')
    }

    const list = goals.map((g) => {
      const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount * 100).toFixed(0) : '0'
      return `🎯 ${g.name}: ${formatCurrency(g.currentAmount, g.currency)} / ${formatCurrency(g.targetAmount, g.currency)} (${pct}%)`
    }).join('\n')

    return sendMarkdown(chatId, list)
  }

  const isIncome = text.startsWith('+')
  const isExpense = text.startsWith('-')
  if (!isIncome && !isExpense) {
    return sendMarkdown(chatId, '⚠️ Используй `+` или `-` перед суммой. Пример: `-500 кофе`')
  }

  const rawText = text.slice(1).trim()
  const parsed = parseAmount(rawText)

  if (!parsed || parsed.amount <= 0) {
    return sendMarkdown(chatId, '⚠️ Не удалось распознать сумму. Пример: `-500 кофе`')
  }

  const type: TransactionType = isIncome ? 'INCOME' : 'EXPENSE'
  const category = detectCategory(parsed.rest)
  const description = parsed.rest || null

  await prisma.transaction.create({
    data: {
      amount: parsed.amount,
      type,
      category,
      description,
      currency: parsed.currency,
      userId: user.id,
      familyId: user.familyId,
    },
  })

  const typeEmoji = type === 'INCOME' ? '🟢' : '🔴'
  const typeLabel = type === 'INCOME' ? 'Доход' : 'Расход'

  return sendMarkdown(
    chatId,
    `${typeEmoji} *${typeLabel} добавлен*\n\n${formatCurrency(parsed.amount, parsed.currency)}\nКатегория: ${category}${description ? `\nОписание: ${description}` : ''}`
  )
}

async function sendMarkdown(chatId: number, text: string) {
  if (!BOT_TOKEN) return NextResponse.json({ ok: true })

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    })
  } catch {}

  return NextResponse.json({ ok: true })
}
