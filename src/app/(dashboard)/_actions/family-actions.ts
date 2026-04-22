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

  console.log('Searching for user with email:', email)
  const invitee = await prisma.user.findUnique({ where: { email } })
  console.log('Found user:', invitee ? `ID: ${invitee.id}, Email: ${invitee.email}, FamilyId: ${invitee.familyId}` : 'null')
  
  if (!invitee) return { success: false, error: `Пользователь с email ${email} не найден в базе данных` }
  if (invitee.familyId === family.id) return { success: false, error: 'Пользователь уже в этой семье' }
  
  // Проверяем, есть ли уже активное приглашение
  const existingInvite = await prisma.familyInvite.findFirst({
    where: {
      familyId: family.id,
      inviteeId: invitee.id,
      accepted: false,
      expiresAt: { gt: new Date() }
    }
  })
  
  if (existingInvite) {
    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite?token=${existingInvite.token}`
    return { success: true, inviteLink }
  }

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

export async function acceptInvite(formData: FormData): Promise<void> {
  const token = formData.get('token') as string
  const user = await requireAuth()

  const invite = await prisma.familyInvite.findUnique({
    where: { token },
    include: { family: true },
  })

  if (!invite) throw new Error('Приглашение не найдено')
  if (invite.inviteeId !== user.id) throw new Error('Это приглашение не для вас')
  if (invite.accepted) throw new Error('Приглашение уже принято')
  if (invite.expiresAt < new Date()) throw new Error('Приглашение истекло')

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

  revalidatePath('/family')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/goals')
  revalidatePath('/analytics')
  
  const { redirect } = await import('next/navigation')
  redirect('/dashboard')
}

export async function rejectInvite(formData: FormData): Promise<void> {
  const token = formData.get('token') as string
  const user = await requireAuth()

  const invite = await prisma.familyInvite.findUnique({
    where: { token },
  })

  if (!invite) throw new Error('Приглашение не найдено')
  if (invite.inviteeId !== user.id) throw new Error('Это приглашение не для вас')

  await prisma.familyInvite.delete({
    where: { token },
  })

  revalidatePath('/family')
}
