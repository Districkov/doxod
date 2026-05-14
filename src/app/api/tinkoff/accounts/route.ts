import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAccounts } from '@/services/tinkoff'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const conn = await prisma.bankConnection.findFirst({
    where: { userId: session.user.id, bank: 'tinkoff', isActive: true },
  })
  if (!conn?.accessToken) {
    return NextResponse.json({ error: 'Т-Банк не подключён' }, { status: 400 })
  }

  try {
    const accounts = await getAccounts(conn.accessToken)
    return NextResponse.json({ accounts })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
