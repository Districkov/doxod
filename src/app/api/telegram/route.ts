import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertCurrency, formatCurrency } from '@/lib/currency'
import type { TransactionType, Currency } from '@/generated/prisma'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

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

function detectCategory(text: string): string {
  const lower = text.toLowerCase()
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category
  }
  return 'other_expense'
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

async function findUserByChatId(chatId: number) {
  return prisma.user.findFirst({
    where: { telegramChatId: String(chatId) },
    include: { family: true },
  })
}

async function downloadTelegramFile(fileId: string): Promise<Buffer | null> {
  try {
    const fileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    )
    const fileData = await fileRes.json()
    if (!fileData.ok) return null

    const filePath = fileData.result.file_path
    const imgRes = await fetch(
      `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`
    )
    if (!imgRes.ok) return null

    const arrayBuf = await imgRes.arrayBuffer()
    return Buffer.from(arrayBuf)
  } catch {
    return null
  }
}

async function recognizeReceipt(imageBuffer: Buffer): Promise<{
  amount: number
  category: string
  description: string
} | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const base64 = imageBuffer.toString('base64')

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a receipt scanner for a Russian finance app. Extract the total amount, store/shop name, and category from the receipt image. Respond ONLY in JSON format: {"amount": number, "description": "store name", "category": "one of: food,transport,housing,entertainment,health,education,clothing,utilities,other_expense"}. If you cannot read the receipt, respond with null.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: 'low',
                },
              },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0,
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content || content === 'null') return null

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'No bot token' }, { status: 401 })
  }

  const body = await req.json()
  const message = body.message
  if (!message?.from?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const text = (message.text || '').trim()

  if (text.startsWith('/start')) {
    return sendMarkdown(
      chatId,
      [
        '👋 *Доход — Семейные финансы*',
        '',
        'Привяжи аккаунт через настройки в приложении, или отправь:',
        '/link doxod_твой_код',
        '',
        'После привязки:',
        '-500 кофе — расход',
        '+50000 зарплата — доход',
        '📸 Фото чека — авто-распознавание',
        '/balance — баланс',
        '/goals — копилки',
      ].join('\n')
    )
  }

  if (text.startsWith('/link ')) {
    const token = text.slice(6).trim()
    if (!token.startsWith('doxod_')) {
      return sendMarkdown(chatId, '⚠️ Неверный код. Скопируй код из настроек приложения.')
    }

    const user = await prisma.user.findFirst({
      where: { telegramLinkToken: token },
    })

    if (!user) {
      return sendMarkdown(chatId, '❌ Код не найден. Сгенерируй новый в настройках.')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: String(chatId),
        telegramLinkToken: null,
      },
    })

    return sendMarkdown(
      chatId,
      [
        '✅ Аккаунт привязан, ' + (user.name || user.email) + '!',
        '',
        'Теперь можешь добавлять расходы:',
        '-500 кофе — расход',
        '+50000 зарплата — доход',
        '📸 Отправь фото чека — я распознаю автоматически',
      ].join('\n')
    )
  }

  if (text.startsWith('/help')) {
    return sendMarkdown(
      chatId,
      [
        '📝 *Команды:*',
        '',
        '-500 продукты — расход',
        '+50000 зарплата — доход',
        '-1000 такси $ — в долларах',
        '📸 Фото чека — авто-распознавание',
        '/balance — баланс',
        '/goals — копилки',
      ].join('\n')
    )
  }

  const user = await findUserByChatId(chatId)
  if (!user || !user.familyId) {
    return sendMarkdown(chatId, '⚠️ Сначала привяжи аккаунт через настройки приложения')
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
      `💰 *${family.name}*\n\n🟢 Доходы: ${formatCurrency(income, family.baseCurrency)}\n🔴 Расходы: ${formatCurrency(expense, family.baseCurrency)}\n📊 Баланс: ${formatCurrency(income - expense, family.baseCurrency)}`
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

  // Photo receipt recognition
  if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
    const photo = message.photo[message.photo.length - 1]
    const fileId = photo.file_id

    await sendMarkdown(chatId, '🔍 Распознаю чек...')

    const imageBuffer = await downloadTelegramFile(fileId)
    if (!imageBuffer) {
      return sendMarkdown(chatId, '❌ Не удалось скачать фото. Попробуй ещё раз.')
    }

    const receipt = await recognizeReceipt(imageBuffer)
    if (!receipt || !receipt.amount) {
      return sendMarkdown(chatId, '❌ Не удалось распознать чек. Попробуй:\n— Чёткое фото чека\n— Или добавь вручную: `-500 кофе`')
    }

    const category = receipt.category || detectCategory(receipt.description || '')

    await prisma.transaction.create({
      data: {
        amount: receipt.amount,
        type: 'EXPENSE',
        category,
        description: receipt.description || 'Чек (фото)',
        currency: user.family?.baseCurrency || 'RUB',
        userId: user.id,
        familyId: user.familyId,
      },
    })

    return sendMarkdown(
      chatId,
      `📸 *Чек распознан*\n\n🔴 Расход: ${formatCurrency(receipt.amount, user.family?.baseCurrency || 'RUB')}\n📁 Категория: ${category}\n📝 Описание: ${receipt.description || '—'}`
    )
  }

  // Text transaction
  if (!text) {
    return NextResponse.json({ ok: true })
  }

  const isIncome = text.startsWith('+')
  const isExpense = text.startsWith('-')
  if (!isIncome && !isExpense) {
    return sendMarkdown(chatId, '⚠️ Используй `+` или `-` перед суммой, или отправь 📸 фото чека')
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
    `${typeEmoji} *${typeLabel} добавлен*\n\n${formatCurrency(parsed.amount, parsed.currency)}\n📁 Категория: ${category}${description ? `\n📝 ${description}` : ''}`
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
