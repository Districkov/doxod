'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireFamily } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import type { Currency } from '@/generated/prisma'

type SettingsResult = { success: boolean; error?: string }

export async function updateProfile(
  _: SettingsResult,
  formData: FormData
): Promise<SettingsResult> {
  const user = await requireAuth()
  const name = formData.get('name') as string

  if (!name?.trim()) return { success: false, error: 'Имя не может быть пустым' }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: name.trim() },
  })

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateFamilyName(
  _: SettingsResult,
  formData: FormData
): Promise<SettingsResult> {
  const { family } = await requireFamily()
  const name = formData.get('name') as string

  if (!name?.trim()) return { success: false, error: 'Название семьи не может быть пустым' }

  await prisma.family.update({
    where: { id: family.id },
    data: { name: name.trim() },
  })

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/family')
  return { success: true }
}

export async function updateFamilyCurrency(
  _: SettingsResult,
  formData: FormData
): Promise<SettingsResult> {
  const { family } = await requireFamily()
  const currency = formData.get('currency') as Currency

  const validCurrencies: Currency[] = ['RUB', 'USD', 'EUR', 'GBP', 'KZT', 'UAH']
  if (!validCurrencies.includes(currency)) return { success: false, error: 'Неверная валюта' }

  await prisma.family.update({
    where: { id: family.id },
    data: { baseCurrency: currency },
  })

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/analytics')
  return { success: true }
}

export async function leaveFamily(): Promise<SettingsResult> {
  const { user, family } = await requireFamily()

  const memberCount = await prisma.user.count({
    where: { familyId: family.id },
  })

  if (memberCount <= 1) {
    return { success: false, error: 'Вы единственный участник. Удалите семью или передайте права.' }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { familyId: null },
  })

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
