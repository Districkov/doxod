import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startLogin, confirmLogin } from '@/services/tinkoff'

async function getUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const body = await req.json()
  const { step, phone, code, workerSessionId } = body

  try {
    if (step === 'start') {
      if (!phone) return NextResponse.json({ error: 'Укажите телефон' }, { status: 400 })
      const { workerSessionId } = await startLogin(phone)
      return NextResponse.json({ step: 'sms_sent', workerSessionId })
    }

    if (step === 'confirm') {
      if (!code || !workerSessionId) {
        return NextResponse.json({ error: 'Укажите SMS-код' }, { status: 400 })
      }
      const { sessionId } = await confirmLogin(workerSessionId, code)

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
    }

    return NextResponse.json({ error: 'Неизвестный шаг' }, { status: 400 })
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
