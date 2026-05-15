import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convertCurrency, formatCurrency } from '@/lib/currency'
import { categorizeByRules } from '@/lib/categorize'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import { ocrReceipt, parseReceiptItems } from '@/lib/receipt-parser'
import type { TransactionType, Currency } from '@/generated/prisma'

export const maxDuration = 60

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

function buildInlineKeyboard(buttons: Array<{ text: string; callback_data: string }>) {
  return { inline_keyboard: buttons.map((b) => [b]) }
}

const QUICK_EXPENSE_CATS = DEFAULT_CATEGORIES.EXPENSE.slice(0, 6)
const QUICK_INCOME_CATS = DEFAULT_CATEGORIES.INCOME.slice(0, 4)

async function sendTelegram(chatId: number, text: string, replyMarkup?: Record<string, unknown>) {
  if (!BOT_TOKEN) return
  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }
    if (replyMarkup) body.reply_markup = replyMarkup

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {}
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  if (!BOT_TOKEN) return
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text: text || '' }),
    })
  } catch {}
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'No bot token' }, { status: 401 })
  }

  const body = await req.json()

  if (body.callback_query) {
    return handleCallback(body.callback_query)
  }

  const message = body.message
  if (!message?.from?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const text = (message.text || '').trim()

  if (text.startsWith('/start')) {
    const replyMarkup = buildInlineKeyboard([
      { text: '➕ Расход', callback_data: 'quick_expense' },
      { text: '➕ Доход', callback_data: 'quick_income' },
      { text: '💰 Баланс', callback_data: 'balance' },
      { text: '🎯 Копилки', callback_data: 'goals' },
    ])

    await sendTelegram(
      chatId,
      [
        '👋 *Доход — Семейные финансы*',
        '',
        'Привяжи аккаунт через настройки в приложении, или отправь:',
        '/link doxod_твой_код',
        '',
        'После привязки используй кнопки ниже или команды:',
        '-500 кофе — расход',
        '+50000 зарплата — доход',
      ].join('\n'),
      replyMarkup
    )
    return NextResponse.json({ ok: true })
  }

  if (text.startsWith('/link ')) {
    const token = text.slice(6).trim()
    if (!token.startsWith('doxod_')) {
      await sendMarkdown(chatId, '⚠️ Неверный код. Скопируй код из настроек приложения.')
      return NextResponse.json({ ok: true })
    }

    const user = await prisma.user.findFirst({
      where: { telegramLinkToken: token },
    })

    if (!user) {
      await sendMarkdown(chatId, '❌ Код не найден. Сгенерируй новый в настройках.')
      return NextResponse.json({ ok: true })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: String(chatId),
        telegramLinkToken: null,
      },
    })

    const replyMarkup = buildInlineKeyboard([
      { text: '➕ Расход', callback_data: 'quick_expense' },
      { text: '➕ Доход', callback_data: 'quick_income' },
    ])

    await sendTelegram(
      chatId,
      [
        '✅ Аккаунт привязан, ' + (user.name || user.email) + '!',
        '',
        'Теперь можешь добавлять расходы через кнопки или текстом:',
        '-500 кофе — расход',
        '+50000 зарплата — доход',
      ].join('\n'),
      replyMarkup
    )
    return NextResponse.json({ ok: true })
  }

  if (text.startsWith('/help')) {
    const replyMarkup = buildInlineKeyboard([
      { text: '➕ Расход', callback_data: 'quick_expense' },
      { text: '➕ Доход', callback_data: 'quick_income' },
      { text: '💰 Баланс', callback_data: 'balance' },
      { text: '🎯 Копилки', callback_data: 'goals' },
    ])

    await sendTelegram(
      chatId,
      [
        '📝 *Команды:*',
        '',
        '-500 продукты — расход',
        '+50000 зарплата — доход',
        '-1000 такси $ — в долларах',
        '/balance — баланс',
        '/goals — копилки',
        '',
        'Или используй кнопки 👇',
      ].join('\n'),
      replyMarkup
    )
    return NextResponse.json({ ok: true })
  }

  const user = await findUserByChatId(chatId)
  if (!user || !user.familyId) {
    await sendMarkdown(chatId, '⚠️ Сначала привяжи аккаунт через настройки приложения')
    return NextResponse.json({ ok: true })
  }

  if (text.startsWith('/balance')) {
    return await handleBalance(chatId, { familyId: user.familyId, family: user.family })
  }

  if (text.startsWith('/goals')) {
    return await handleGoals(chatId, { familyId: user.familyId })
  }

  if (!text && !message.photo) {
    return NextResponse.json({ ok: true })
  }

  if (message.photo) {
    return await handleReceiptPhoto(chatId, message, { id: user.id, familyId: user.familyId! })
  }

  if (!text) {
    return NextResponse.json({ ok: true })
  }

  const isIncome = text.startsWith('+')
  const isExpense = text.startsWith('-')
  if (!isIncome && !isExpense) {
    const replyMarkup = buildInlineKeyboard([
      { text: '➕ Расход', callback_data: 'quick_expense' },
      { text: '➕ Доход', callback_data: 'quick_income' },
    ])
    await sendTelegram(chatId, '⚠️ Используй `+` или `-` перед суммой, или нажми кнопку 👇', replyMarkup)
    return NextResponse.json({ ok: true })
  }

  const rawText = text.slice(1).trim()
  const parsed = parseAmount(rawText)

  if (!parsed || parsed.amount <= 0) {
    await sendMarkdown(chatId, '⚠️ Не удалось распознать сумму. Пример: `-500 кофе`')
    return NextResponse.json({ ok: true })
  }

  const type: TransactionType = isIncome ? 'INCOME' : 'EXPENSE'
  const autoCategory = categorizeByRules(parsed.rest, type)

  await prisma.transaction.create({
    data: {
      amount: parsed.amount,
      type,
      category: autoCategory,
      description: parsed.rest || null,
      currency: parsed.currency,
      userId: user.id,
      familyId: user.familyId,
    },
  })

  const typeEmoji = type === 'INCOME' ? '🟢' : '🔴'
  const typeLabel = type === 'INCOME' ? 'Доход' : 'Расход'
  const catLabel = getCategoryLabel(autoCategory, type)

  const replyMarkup = buildInlineKeyboard([
    { text: '✏️ Изменить категорию', callback_data: `changecat_${type.toLowerCase()}_${parsed.amount}` },
    { text: '💰 Баланс', callback_data: 'balance' },
  ])

  await sendTelegram(
    chatId,
    `${typeEmoji} *${typeLabel} добавлен*\n\n${formatCurrency(parsed.amount, parsed.currency)}\n📁 Категория: ${catLabel}${parsed.rest ? `\n📝 ${parsed.rest}` : ''}`,
    replyMarkup
  )

  return NextResponse.json({ ok: true })
}

async function handleCallback(callback: { id: string; from: { id: number }; data?: string; message?: { chat: { id: number } } }) {
  const chatId = callback.message?.chat?.id
  const data = callback.data || ''

  if (!chatId) {
    await answerCallbackQuery(callback.id)
    return NextResponse.json({ ok: true })
  }

  if (data === 'balance') {
    const user = await findUserByChatId(chatId)
    if (!user?.familyId) {
      await answerCallbackQuery(callback.id, '⚠️ Аккаунт не привязан')
      return NextResponse.json({ ok: true })
    }
    await answerCallbackQuery(callback.id)
    return await handleBalance(chatId, { familyId: user.familyId, family: user.family })
  }

  if (data === 'goals') {
    const user = await findUserByChatId(chatId)
    if (!user?.familyId) {
      await answerCallbackQuery(callback.id, '⚠️ Аккаунт не привязан')
      return NextResponse.json({ ok: true })
    }
    await answerCallbackQuery(callback.id)
    return await handleGoals(chatId, { familyId: user.familyId })
  }

  if (data === 'quick_expense') {
    await answerCallbackQuery(callback.id)
    const buttons = QUICK_EXPENSE_CATS.map((cat) => ({
      text: cat.label,
      callback_data: `addcat_expense_${cat.value}`,
    }))
    const replyMarkup = { inline_keyboard: [buttons.slice(0, 3), buttons.slice(3)] }
    await sendTelegram(chatId, '🔴 *Расход* — выбери категорию:', replyMarkup)
    return NextResponse.json({ ok: true })
  }

  if (data === 'quick_income') {
    await answerCallbackQuery(callback.id)
    const buttons = QUICK_INCOME_CATS.map((cat) => ({
      text: cat.label,
      callback_data: `addcat_income_${cat.value}`,
    }))
    const replyMarkup = { inline_keyboard: [buttons.slice(0, 3), buttons.slice(3)] }
    await sendTelegram(chatId, '🟢 *Доход* — выбери категорию:', replyMarkup)
    return NextResponse.json({ ok: true })
  }

  if (data.startsWith('addcat_')) {
    const parts = data.split('_')
    const txType = parts[1] as 'expense' | 'income'
    const category = parts.slice(2).join('_')

    await answerCallbackQuery(callback.id)
    await sendMarkdown(chatId, `Отправь сумму (например: 500 или 1500.50):`)
    await prisma.user.update({
      where: { id: (await findUserByChatId(chatId))!.id },
      data: { telegramLinkToken: `pending_${txType}_${category}` },
    })
    return NextResponse.json({ ok: true })
  }

  if (data.startsWith('changecat_')) {
    const parts = data.split('_')
    const txType = parts[1] as 'expense' | 'income'
    const buttons = (txType === 'expense' ? QUICK_EXPENSE_CATS : QUICK_INCOME_CATS).map((cat) => ({
      text: cat.label,
      callback_data: `recat_${cat.value}`,
    }))
    const replyMarkup = { inline_keyboard: [buttons.slice(0, 3), buttons.slice(3)] }
    await answerCallbackQuery(callback.id)
    await sendTelegram(chatId, '📁 Выбери новую категорию:', replyMarkup)
    return NextResponse.json({ ok: true })
  }

  if (data.startsWith('recat_')) {
    const newCat = data.slice(6)
    const user = await findUserByChatId(chatId)
    if (!user?.familyId) {
      await answerCallbackQuery(callback.id, '⚠️ Аккаунт не привязан')
      return NextResponse.json({ ok: true })
    }

    const lastTx = await prisma.transaction.findFirst({
      where: { userId: user.id, familyId: user.familyId },
      orderBy: { createdAt: 'desc' },
    })

    if (lastTx) {
      await prisma.transaction.update({
        where: { id: lastTx.id },
        data: { category: newCat },
      })
      await answerCallbackQuery(callback.id, `✅ Категория: ${getCategoryLabel(newCat, lastTx.type)}`)
      await sendMarkdown(chatId, `✅ Категория изменена на: *${getCategoryLabel(newCat, lastTx.type)}*`)
    } else {
      await answerCallbackQuery(callback.id, 'Транзакция не найдена')
    }
    return NextResponse.json({ ok: true })
  }

  if (data.startsWith('receipt_ok_')) {
    const sessionKey = data.slice(11)
    const session = RECEIPT_SESSIONS.get(sessionKey)
    if (!session) {
      await answerCallbackQuery(callback.id, '❌ Сессия истекла. Отправь фото заново.')
      return NextResponse.json({ ok: true })
    }

    await answerCallbackQuery(callback.id, '✅ Создаю транзакции...')

    let created = 0
    for (const item of session.items) {
      await prisma.transaction.create({
        data: {
          amount: item.amount,
          type: 'EXPENSE',
          category: item.category,
          description: item.name,
          currency: 'RUB',
          userId: session.userId,
          familyId: session.familyId,
          source: 'telegram_receipt',
        },
      })
      created++
    }

    RECEIPT_SESSIONS.delete(sessionKey)
    const total = session.items.reduce((s, i) => s + i.amount, 0)
    await sendMarkdown(chatId, `✅ Добавлено ${created} расходов (${total.toFixed(2)} ₽) из чека`)
    return NextResponse.json({ ok: true })
  }

  if (data.startsWith('receipt_cancel_')) {
    const sessionKey = data.slice(15)
    RECEIPT_SESSIONS.delete(sessionKey)
    await answerCallbackQuery(callback.id, '❌ Отменено')
    await sendMarkdown(chatId, '❌ Чек отменён')
    return NextResponse.json({ ok: true })
  }

  await answerCallbackQuery(callback.id)
  return NextResponse.json({ ok: true })
}

function getCategoryLabel(catValue: string, type: string): string {
  const allCats = type === 'INCOME' || type === 'income'
    ? [...DEFAULT_CATEGORIES.INCOME]
    : [...DEFAULT_CATEGORIES.EXPENSE]
  const found = allCats.find((c) => c.value === catValue)
  return found?.label || catValue
}

async function handleBalance(chatId: number, user: { familyId: string; family: { id: string; name: string; baseCurrency: Currency } | null }) {
  const family = user.family
  if (!family) {
    await sendMarkdown(chatId, '❌ Семья не найдена')
    return NextResponse.json({ ok: true })
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

  const replyMarkup = buildInlineKeyboard([
    { text: '➕ Расход', callback_data: 'quick_expense' },
    { text: '➕ Доход', callback_data: 'quick_income' },
    { text: '🎯 Копилки', callback_data: 'goals' },
  ])

  await sendTelegram(
    chatId,
    `💰 *${family.name}*\n\n🟢 Доходы: ${formatCurrency(income, family.baseCurrency)}\n🔴 Расходы: ${formatCurrency(expense, family.baseCurrency)}\n📊 Баланс: ${formatCurrency(income - expense, family.baseCurrency)}`,
    replyMarkup
  )

  return NextResponse.json({ ok: true })
}

async function handleGoals(chatId: number, user: { familyId: string }) {
  const goals = await prisma.goal.findMany({
    where: { familyId: user.familyId },
    take: 5,
  })

  if (goals.length === 0) {
    await sendMarkdown(chatId, '🎯 Нет активных копилок')
    return NextResponse.json({ ok: true })
  }

  const list = goals.map((g) => {
    const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount * 100).toFixed(0) : '0'
    return `🎯 ${g.name}: ${formatCurrency(g.currentAmount, g.currency)} / ${formatCurrency(g.targetAmount, g.currency)} (${pct}%)`
  }).join('\n')

  const replyMarkup = buildInlineKeyboard([
    { text: '💰 Баланс', callback_data: 'balance' },
  ])

  await sendTelegram(chatId, list, replyMarkup)
  return NextResponse.json({ ok: true })
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

interface ReceiptSession {
  items: { name: string; amount: number; category: string }[]
  userId: string
  familyId: string
  ts: number
}

const RECEIPT_SESSIONS = new Map<string, ReceiptSession>()

function cleanupReceiptSessions() {
  const now = Date.now()
  for (const [key, val] of RECEIPT_SESSIONS) {
    if (now - val.ts > 300000) RECEIPT_SESSIONS.delete(key)
  }
}
setInterval(cleanupReceiptSessions, 120000)

async function handleReceiptPhoto(
  chatId: number,
  message: { photo?: { file_id: string; file_size?: number; width?: number; height?: number }[] },
  user: { id: string; familyId: string }
) {
  const photos = message.photo
  if (!photos || photos.length === 0) {
    await sendMarkdown(chatId, '⚠️ Не удалось получить фото')
    return NextResponse.json({ ok: true })
  }

  const photo = photos[photos.length - 1]

  await sendMarkdown(chatId, '🔍 Распознаю чек...')

  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photo.file_id}`)
    const fileData = await fileRes.json()
    if (!fileData.ok) throw new Error('getFile failed')

    const filePath = fileData.result.file_path
    const photoRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`)
    if (!photoRes.ok) throw new Error('download failed')

    const arrayBuffer = await photoRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const ocrText = await ocrReceipt(buffer)
    const items = parseReceiptItems(ocrText)

    if (items.length === 0) {
      await sendMarkdown(chatId, '⚠️ Не удалось распознать позиции чека. Попробуй:\n- Более чёткое фото\n- Или добавь вручную: `-500 кофе`')
      return NextResponse.json({ ok: true })
    }

    const total = items.reduce((s, i) => s + i.amount, 0)
    const sessionKey = `receipt_${chatId}_${Date.now()}`

    for (const item of items) {
      item.category = categorizeByRules(item.name, 'EXPENSE')
    }

    RECEIPT_SESSIONS.set(sessionKey, { items, userId: user.id, familyId: user.familyId, ts: Date.now() })

    const lines = items.map((item, i) =>
      `${i + 1}. ${item.name} — *${item.amount.toFixed(2)} ₽* [${getCategoryLabel(item.category, 'EXPENSE')}]`
    )

    const buttons = [
      { text: '✅ Подтвердить все', callback_data: `receipt_ok_${sessionKey}` },
      { text: '❌ Отменить', callback_data: `receipt_cancel_${sessionKey}` },
    ]

    const replyMarkup = { inline_keyboard: [buttons] }

    await sendTelegram(
      chatId,
      `🧾 *Распознано ${items.length} позиций* (итого: *${total.toFixed(2)} ₽*)\n\n${lines.join('\n')}`,
      replyMarkup
    )
  } catch (e) {
    console.error('Receipt OCR error:', e)
    const msg = e instanceof Error && e.message.includes('Timeout')
      ? '⏱️ Распознавание заняло слишком долго. Попробуй фото получше или добавь вручную: `-500 кофе`'
      : '❌ Ошибка распознавания. Попробуй ещё раз или добавь вручную: `-500 кофе`'
    await sendMarkdown(chatId, msg)
  }

  return NextResponse.json({ ok: true })
}
