import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/currency'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const familyId = session.user.familyId
  const format = req.nextUrl.searchParams.get('format') || 'csv'

  const transactions = await prisma.transaction.findMany({
    where: { familyId },
    orderBy: { date: 'desc' },
    include: { user: { select: { name: true } } },
  })

  if (format === 'csv') {
    const header = 'Дата,Тип,Категория,Описание,Сумма,Валюта,Пользователь'
    const rows = transactions.map((tx) =>
      [
        tx.date.toLocaleDateString('ru-RU'),
        tx.type === 'INCOME' ? 'Доход' : 'Расход',
        tx.category,
        tx.description ?? '',
        tx.amount.toFixed(2),
        tx.currency,
        tx.user.name ?? '',
      ]
        .map((v) => `"${v}"`)
        .join(',')
    )

    const csv = [header, ...rows].join('\n')
    const bom = '\uFEFF'

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
}
