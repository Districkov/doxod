import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertCurrency, formatCurrency } from '@/lib/currency'
import { categorizeByRules } from '@/lib/categorize'
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

  // Text transaction
  if (!text && !message.photo) {
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
  const category = categorizeByRules(parsed.rest, type)
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
