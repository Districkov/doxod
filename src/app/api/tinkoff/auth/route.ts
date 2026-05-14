import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSession, phoneSignUp, confirmSms, passwordSignUp } from '@/services/tinkoff'

async function getUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const body = await req.json()
  const { step, phone, code, password, operationTicket, sessionId: sid } = body

  try {
    if (step === 'start') {
      if (!phone) return NextResponse.json({ error: 'Укажите телефон' }, { status: 400 })
      const session = await createSession()
      const { operationTicket: ticket } = await phoneSignUp(session.sessionId, phone)

      await prisma.bankConnection.upsert({
        where: { id: `tinkoff_${user.id}` },
        update: { sessionSecret: session.sessionId, accessToken: null },
        create: {
          id: `tinkoff_${user.id}`,
          userId: user.id,
          bank: 'tinkoff',
          sessionSecret: session.sessionId,
        },
      })

      return NextResponse.json({
        step: 'sms_sent',
        sessionId: session.sessionId,
        operationTicket: ticket,
      })
    }

    if (step === 'confirm_sms') {
      if (!code || !operationTicket || !sid) {
        return NextResponse.json({ error: 'Укажите код' }, { status: 400 })
      }
      await confirmSms(sid, code, operationTicket)
      return NextResponse.json({ step: 'sms_confirmed' })
    }

    if (step === 'set_password') {
      if (!password || !sid) {
        return NextResponse.json({ error: 'Укажите пароль' }, { status: 400 })
      }
      await passwordSignUp(sid, password)

      await prisma.bankConnection.upsert({
        where: { id: `tinkoff_${user.id}` },
        update: { accessToken: sid, sessionSecret: sid },
        create: {
          id: `tinkoff_${user.id}`,
          userId: user.id,
          bank: 'tinkoff',
          accessToken: sid,
          sessionSecret: sid,
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
