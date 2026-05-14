import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { loginWithPuppeteer } from '@/services/tinkoff'

export const maxDuration = 60

async function getUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const body = await req.json()
  const { phone, password } = body

  if (!phone || !password) {
    return NextResponse.json({ error: 'Укажите телефон и пароль' }, { status: 400 })
  }

  try {
    const { sessionId } = await loginWithPuppeteer(phone, password)

    await prisma.bankConnection.upsert({
      where: { id: `tinkoff_${user.id}` },
      update: { accessToken: sessionId, sessionSecret: sessionId, lastSyncAt: new Date() },
      create: {
        id: `tinkoff_${user.id}`,
        userId: user.id,
        bank: 'tinkoff',
        accessToken: sessionId,
        sessionSecret: sessionId,
      },
    })

    return NextResponse.json({ step: 'authorized' })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  await prisma.bankConnection.deleteMany({
    where: { userId: user.id, bank: 'tinkoff' },
  })

  return NextResponse.json({ ok: true })
}
