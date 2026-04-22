'use server'

import { prisma } from '@/lib/prisma'
import { requireFamily } from '@/services/auth'
import { goalSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

type GoalResult = { success: boolean; error?: string }

export async function createGoal(
  _: GoalResult,
  formData: FormData
): Promise<GoalResult> {
  const { user, family } = await requireFamily()

  const raw = {
    name: formData.get('name') as string,
    targetAmount: parseFloat(formData.get('targetAmount') as string),
    currency: formData.get('currency') as 'RUB' | 'USD' | 'EUR' | 'GBP' | 'KZT' | 'UAH',
    deadline: formData.get('deadline') ? new Date(formData.get('deadline') as string) : undefined,
  }

  const validated = goalSchema.safeParse(raw)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message }
  }

  await prisma.goal.create({
    data: {
      name: validated.data.name,
      targetAmount: validated.data.targetAmount,
      currency: validated.data.currency,
      deadline: validated.data.deadline,
      familyId: family.id,
      createdById: user.id,
    },
  })

  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteGoal(formData: FormData): Promise<void> {
  const { family } = await requireFamily()
  const id = formData.get('id') as string

  await prisma.goal.deleteMany({
    where: { id, familyId: family.id },
  })

  revalidatePath('/goals')
  revalidatePath('/dashboard')
}
