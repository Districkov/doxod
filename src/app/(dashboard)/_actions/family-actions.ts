'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamily } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

type FamilyResult = { success: boolean; error?: string; inviteLink?: string }

export async function createFamilyInvite(
  _: FamilyResult,
  formData: FormData
): Promise<FamilyResult> {
  const { family } = await requireFamily()
  const email = formData.get('email') as string

  if (!email) return { success: false, error: 'Укажите email' }

  const invitee = await prisma.user.findUnique({ where: { email } })
  if (!invitee) return { success: false, error: 'Пользователь не найден' }
  if (invitee.familyId) return { success: false, error: 'Пользователь уже в семье' }

  const token = crypto.randomBytes(32).toString('hex')

  await prisma.familyInvite.create({
    data: {
      token,
      familyId: family.id,
      inviteeId: invitee.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite?token=${token}`
  revalidatePath('/family')
  return { success: true, inviteLink }
}

export async function acceptInvite(token: string): Promise<FamilyResult> {
  const user = await requireAuth()

  const invite = await prisma.familyInvite.findUnique({
    where: { token },
    include: { family: true },
  })

  if (!invite) return { success: false, error: 'Приглашение не найдено' }
  if (invite.inviteeId !== user.id) return { success: false, error: 'Это приглашение не для вас' }
  if (invite.accepted) return { success: false, error: 'Приглашение уже принято' }
  if (invite.expiresAt < new Date()) return { success: false, error: 'Приглашение истекло' }

  await prisma.$transaction([
    prisma.familyInvite.update({
      where: { token },
      data: { accepted: true },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { familyId: invite.familyId },
    }),
  ])

  revalidatePath('/')
  return { success: true }
}
