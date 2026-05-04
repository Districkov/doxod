'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

type TgResult = { success: boolean; error?: string; token?: string }

export async function generateTelegramLinkToken(): Promise<TgResult> {
  const user = await requireAuth()
  const token = 'doxod_' + crypto.randomBytes(6).toString('hex')

  await prisma.user.update({
    where: { id: user.id },
    data: { telegramLinkToken: token },
  })

  revalidatePath('/settings')
  return { success: true, token }
}

export async function unlinkTelegram(): Promise<TgResult> {
  const user = await requireAuth()

  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: null, telegramLinkToken: null },
  })

  revalidatePath('/settings')
  return { success: true }
}
