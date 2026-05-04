'use server'

import { prisma } from '@/lib/prisma'
import { requireFamily } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import type { TransactionType } from '@/generated/prisma'

type CatResult = { success: boolean; error?: string }

export async function createCategory(
  _: CatResult,
  formData: FormData
): Promise<CatResult> {
  const { family } = await requireFamily()
  const name = (formData.get('name') as string)?.trim()
  const type = formData.get('type') as TransactionType
  const icon = (formData.get('icon') as string)?.trim() || null

  if (!name) return { success: false, error: 'Укажите название' }
  if (!type || !['INCOME', 'EXPENSE'].includes(type)) return { success: false, error: 'Укажите тип' }

  const existing = await prisma.category.findFirst({
    where: { name, familyId: family.id, type },
  })
  if (existing) return { success: false, error: 'Категория уже существует' }

  await prisma.category.create({
    data: { name, type, icon, familyId: family.id },
  })

  revalidatePath('/settings')
  revalidatePath('/transactions')
  return { success: true }
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const { family } = await requireFamily()
  const id = formData.get('id') as string

  await prisma.category.delete({
    where: { id, familyId: family.id },
  })

  revalidatePath('/settings')
  revalidatePath('/transactions')
}
