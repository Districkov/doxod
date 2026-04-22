'use server'

import { prisma } from '@/lib/prisma'
import { requireFamily } from '@/services/auth'
import { convertCurrency } from '@/lib/currency'
import { transactionSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import type { Currency } from '@/generated/prisma/enums'

type TransactionResult = { success: boolean; error?: string }

export async function addTransaction(
  _: TransactionResult,
  formData: FormData
): Promise<TransactionResult> {
  const { user, family } = await requireFamily()

  const raw = {
    amount: parseFloat(formData.get('amount') as string),
    type: formData.get('type') as 'INCOME' | 'EXPENSE',
    category: formData.get('category') as string,
    description: (formData.get('description') as string) || undefined,
    currency: formData.get('currency') as Currency,
    date: new Date(formData.get('date') as string),
    goalId: (formData.get('goalId') as string) || undefined,
  }

  const validated = transactionSchema.safeParse(raw)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message }
  }

  const data = validated.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
    await tx.transaction.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description,
        currency: data.currency,
        date: data.date,
        goalId: data.goalId,
        userId: user.id,
        familyId: family.id,
      },
    })

    if (data.goalId) {
      const goal = await tx.goal.findUnique({ where: { id: data.goalId } })
      if (goal && data.type === 'INCOME') {
        const contribution = convertCurrency(data.amount, data.currency, goal.currency)
        const newAmount = Math.min(goal.currentAmount + contribution, goal.targetAmount)
        await tx.goal.update({
          where: { id: data.goalId },
          data: { currentAmount: newAmount },
        })
      }
    }
  })

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/goals')
  revalidatePath('/analytics')
  return { success: true }
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const { family } = await requireFamily()
  const id = formData.get('id') as string

  const transaction = await prisma.transaction.findFirst({
    where: { id, familyId: family.id },
  })

  if (!transaction) throw new Error('Transaction not found')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
    if (transaction.goalId && transaction.type === 'INCOME') {
      const goal = await tx.goal.findUnique({ where: { id: transaction.goalId } })
      if (goal) {
        const contribution = convertCurrency(transaction.amount, transaction.currency, goal.currency)
        await tx.goal.update({
          where: { id: transaction.goalId },
          data: { currentAmount: Math.max(0, goal.currentAmount - contribution) },
        })
      }
    }

    await tx.transaction.delete({ where: { id } })
  })

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/goals')
  revalidatePath('/analytics')
}
