import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { categorizeByRules } from '@/lib/categorize'
import type { TransactionType, Currency } from '@/generated/prisma'

const CURRENCY_MAP: Record<string, Currency> = {
  RUB: 'RUB', RUR: 'RUB', USD: 'USD', EUR: 'EUR', GBP: 'GBP', KZT: 'KZT', UAH: 'UAH',
  '₽': 'RUB', '$': 'USD', '€': 'EUR', '£': 'GBP', '₸': 'KZT', '₴': 'UAH',
}

function parseLine(line: string, delimiter: string): string[] | null {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())

  return fields
}

function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  const tabs = (firstLine.match(/\t/g) || []).length

  if (tabs > semicolons && tabs > commas) return '\t'
  if (semicolons > commas) return ';'
  return ','
}

function parseRussianDate(str: string): Date | null {
  const ddmmyyyy = str.match(/^(\d{2})[./](\d{2})[./](\d{4})$/)
  if (ddmmyyyy) return new Date(+ddmmyyyy[3], +ddmmyyyy[2] - 1, +ddmmyyyy[1])

  const yyyymmdd = str.match(/^(\d{4})[./-](\d{2})[./-](\d{2})$/)
  if (yyyymmdd) return new Date(+yyyymmdd[1], +yyyymmdd[2] - 1, +yyyymmdd[3])

  const iso = Date.parse(str)
  if (!isNaN(iso)) return new Date(iso)

  return null
}

function findColumn(headers: string[], keywords: string[]): number {
  const lower = headers.map(h => h.toLowerCase().replace(/['"]/g, ''))
  for (const kw of keywords) {
    const idx = lower.findIndex(h => h.includes(kw))
    if (idx !== -1) return idx
  }
  return -1
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, familyId: true },
  })
  if (!user?.familyId) return NextResponse.json({ error: 'Нет семьи' }, { status: 400 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const bankFormat = (formData.get('bankFormat') as string) || 'auto'

  if (!file) return NextResponse.json({ error: 'Загрузите файл' }, { status: 400 })

  const text = await file.text()
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return NextResponse.json({ error: 'Файл пуст или слишком короткий' }, { status: 400 })

  const delimiter = detectDelimiter(lines[0])
  const headers = parseLine(lines[0], delimiter)
  if (!headers) return NextResponse.json({ error: 'Не удалось распознать заголовки' }, { status: 400 })

  let dateCol: number, amountCol: number, typeCol: number, descCol: number, catCol: number, currencyCol: number

  if (bankFormat === 'sberbank') {
    dateCol = findColumn(headers, ['дата', 'date'])
    typeCol = findColumn(headers, ['категория', 'category'])
    descCol = findColumn(headers, ['описание', 'description', 'название'])
    amountCol = findColumn(headers, ['сумма', 'amount', 'приход', 'расход'])
    currencyCol = findColumn(headers, ['валюта', 'currency'])
    catCol = -1
  } else if (bankFormat === 'alfabank') {
    dateCol = findColumn(headers, ['дата', 'date'])
    descCol = findColumn(headers, ['описание', 'description', 'назначение'])
    amountCol = findColumn(headers, ['сумма', 'amount'])
    currencyCol = findColumn(headers, ['валюта', 'currency'])
    typeCol = findColumn(headers, ['тип', 'type'])
    catCol = findColumn(headers, ['категория', 'category'])
  } else if (bankFormat === 'tinkoff') {
    dateCol = findColumn(headers, ['дата операции', 'дата', 'date'])
    descCol = findColumn(headers, ['описание', 'description'])
    amountCol = findColumn(headers, ['сумма платежа', 'сумма', 'amount'])
    currencyCol = findColumn(headers, ['валюта', 'currency'])
    catCol = findColumn(headers, ['категория', 'category', 'mcc'])
    typeCol = -1
  } else {
    dateCol = findColumn(headers, ['дата', 'date', 'datetime', 'дата операции'])
    amountCol = findColumn(headers, ['сумма', 'amount', 'сумма платежа', 'приход', 'расход', 'value'])
    typeCol = findColumn(headers, ['тип', 'type', 'категория', 'category'])
    descCol = findColumn(headers, ['описание', 'description', 'название', 'назначение', 'комментарий', 'note', 'merchant'])
    catCol = findColumn(headers, ['категория', 'category', 'mcc', 'mcc описание'])
    currencyCol = findColumn(headers, ['валюта', 'currency', 'валюта операции'])
  }

  if (dateCol === -1) return NextResponse.json({ error: 'Не найдена колонка с датой' }, { status: 400 })
  if (amountCol === -1) return NextResponse.json({ error: 'Не найдена колонка с суммой' }, { status: 400 })

  const existingExternalIds = new Set(
    (await prisma.transaction.findMany({
      where: { familyId: user.familyId, source: 'csv_import' },
      select: { externalId: true },
    })).map(t => t.externalId).filter(Boolean) as string[]
  )

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = parseLine(lines[i], delimiter)
    if (!fields) { skipped++; continue }

    const rawDate = fields[dateCol] || ''
    const rawAmount = fields[amountCol] || ''
    const rawDesc = descCol !== -1 ? fields[descCol] || '' : ''
    const rawType = typeCol !== -1 ? fields[typeCol] || '' : ''
    const rawCat = catCol !== -1 ? fields[catCol] || '' : ''
    const rawCurrency = currencyCol !== -1 ? fields[currencyCol] || 'RUB' : 'RUB'

    const date = parseRussianDate(rawDate)
    if (!date) { skipped++; continue }

    const amountStr = rawAmount.replace(/[^\d.,-]/g, '').replace(',', '.')
    const amount = Math.abs(parseFloat(amountStr))
    if (!amount || isNaN(amount)) { skipped++; continue }

    const isNegative = rawAmount.includes('-') || rawType.toLowerCase().includes('расход') || rawType.toLowerCase().includes('expense') || rawType.toLowerCase().includes('покупк') || rawType.toLowerCase().includes('списание')
    const isPositive = rawAmount.includes('+') || rawType.toLowerCase().includes('доход') || rawType.toLowerCase().includes('income') || rawType.toLowerCase().includes('зачислен')

    const txType: TransactionType = isNegative ? 'EXPENSE' : isPositive ? 'INCOME' : 'EXPENSE'
    const description = rawDesc || null
    const currency: Currency = CURRENCY_MAP[rawCurrency.toUpperCase()] || CURRENCY_MAP[rawCurrency] || 'RUB'

    let category = rawCat || ''
    if (!category || category === description) {
      category = categorizeByRules(description || rawDesc, txType)
    }

    const externalId = `csv_${i}_${date.toISOString()}_${amount}`
    if (existingExternalIds.has(externalId)) { skipped++; continue }

    try {
      await prisma.transaction.create({
        data: {
          amount,
          type: txType,
          category,
          description,
          currency,
          date,
          userId: user.id,
          familyId: user.familyId,
          source: 'csv_import',
          externalId,
        },
      })
      imported++
    } catch (e) {
      errors.push(`Строка ${i + 1}: ${e instanceof Error ? e.message : 'Ошибка'}`)
      skipped++
    }
  }

  return NextResponse.json({ imported, skipped, errors: errors.slice(0, 10), total: lines.length - 1 })
}
