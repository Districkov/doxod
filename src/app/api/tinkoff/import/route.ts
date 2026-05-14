import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOperations } from '@/services/tinkoff'
import { mccToCategory } from '@/lib/mcc-categories'
import type { Currency } from '@/generated/prisma'

export const maxDuration = 60

const TBANK_CURRENCY_MAP: Record<string, Currency> = {
  RUB: 'RUB', USD: 'USD', EUR: 'EUR', GBP: 'GBP', KZT: 'KZT', UAH: 'UAH',
  RUR: 'RUB',
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, familyId: true },
  })
  if (!user?.familyId) return NextResponse.json({ error: 'Нет семьи' }, { status: 400 })

  const conn = await prisma.bankConnection.findFirst({
    where: { userId: user.id, bank: 'tinkoff', isActive: true },
  })
  if (!conn?.accessToken) {
    return NextResponse.json({ error: 'Т-Банк не подключён' }, { status: 400 })
  }

  const body = await req.json()
  const { accountId, days = 30 } = body

  if (!accountId) return NextResponse.json({ error: 'Укажите accountId' }, { status: 400 })

  const from = new Date()
  from.setDate(from.getDate() - days)

  try {
    const operations = await getOperations(conn.accessToken, accountId, from)

    const existingExternalIds = new Set(
      (await prisma.transaction.findMany({
        where: { familyId: user.familyId, source: 'tinkoff' },
        select: { externalId: true },
      })).map(t => t.externalId).filter(Boolean) as string[]
    )

    let imported = 0
    let skipped = 0

    for (const op of operations) {
      if (op.status !== 'HOLD' && op.status !== 'DONE') continue
      if (existingExternalIds.has(op.id)) { skipped++; continue }

      const isDebit = op.type === 'DebitRemittance' || op.type === 'Purchase'
      const isCredit = op.type === 'CreditRemittance' || op.type === 'Income'
      if (!isDebit && !isCredit) { skipped++; continue }

      const txType = isDebit ? 'EXPENSE' : 'INCOME'
      const currencyStr = op.accountAmount?.currency?.strCode || 'RUB'
      const currency: Currency = TBANK_CURRENCY_MAP[currencyStr] || 'RUB'
      const amount = Math.abs(op.accountAmount?.value || op.amount?.value || 0)
      const category = mccToCategory(op.mcc, txType === 'INCOME' ? 'other_income' : 'other_expense')
      const description = op.merchant?.name || op.description || ''

      await prisma.transaction.create({
        data: {
          amount,
          type: txType as 'EXPENSE' | 'INCOME',
          category,
          description,
          currency,
          date: new Date(op.operationTime.milliseconds),
          userId: user.id,
          familyId: user.familyId,
          source: 'tinkoff',
          externalId: op.id,
        },
      })
      imported++
    }

    await prisma.bankConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({ imported, skipped, total: operations.length })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
