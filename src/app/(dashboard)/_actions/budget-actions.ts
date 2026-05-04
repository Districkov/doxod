'use server'

import { prisma } from '@/lib/prisma'
import { requireFamily } from '@/services/auth'
import { revalidatePath } from 'next/cache'

type BudgetResult = { success: boolean; error?: string }

export async function createBudget(
  _: BudgetResult,
  formData: FormData
): Promise<BudgetResult> {
  const { family } = await requireFamily()
  const category = (formData.get('category') as string)?.trim()
  const amount = parseFloat(formData.get('amount') as string)
  const period = (formData.get('period') as string) || 'monthly'

  if (!category) return { success: false, error: 'Укажите категорию' }
  if (!amount || amount <= 0) return { success: false, error: 'Укажите сумму' }

  await prisma.budget.upsert({
    where: { category_familyId_period: { category, familyId: family.id, period } },
    update: { amount },
    create: { category, amount, period, familyId: family.id },
  })

  revalidatePath('/dashboard')
  revalidatePath('/analytics')
  return { success: true }
}

export async function deleteBudget(formData: FormData): Promise<void> {
  const { family } = await requireFamily()
  const id = formData.get('id') as string

  await prisma.budget.delete({
    where: { id, familyId: family.id },
  })

  revalidatePath('/dashboard')
  revalidatePath('/analytics')
}
