'use server'

import { prisma } from '@/lib/prisma'
import { requireFamily } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import type { TransactionType, Currency, Frequency } from '@/generated/prisma'

type RecurringResult = { success: boolean; error?: string }

export async function createRecurring(
  _: RecurringResult,
  formData: FormData
): Promise<RecurringResult> {
  const { user, family } = await requireFamily()
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as TransactionType
  const category = (formData.get('category') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const currency = (formData.get('currency') as Currency) || family.baseCurrency
  const frequency = (formData.get('frequency') as Frequency) || 'MONTHLY'
  const nextDate = formData.get('nextDate') as string

  if (!amount || amount <= 0) return { success: false, error: 'Укажите сумму' }
  if (!category) return { success: false, error: 'Укажите категорию' }
  if (!nextDate) return { success: false, error: 'Укажите дату следующего платежа' }

  await prisma.recurringTransaction.create({
    data: {
      amount,
      type,
      category,
      description,
      currency,
      frequency,
      nextDate: new Date(nextDate),
      userId: user.id,
      familyId: family.id,
    },
  })

  revalidatePath('/transactions')
  return { success: true }
}

export async function toggleRecurring(formData: FormData): Promise<void> {
  const { family } = await requireFamily()
  const id = formData.get('id') as string
  const isActive = formData.get('isActive') === 'true'

  await prisma.recurringTransaction.update({
    where: { id, familyId: family.id },
    data: { isActive: !isActive },
  })

  revalidatePath('/transactions')
}

export async function deleteRecurring(formData: FormData): Promise<void> {
  const { family } = await requireFamily()
  const id = formData.get('id') as string

  await prisma.recurringTransaction.delete({
    where: { id, familyId: family.id },
  })

  revalidatePath('/transactions')
}

export async function processRecurringTransactions(): Promise<number> {
  const now = new Date()
  const due = await prisma.recurringTransaction.findMany({
    where: { isActive: true, nextDate: { lte: now } },
  })

  let created = 0
  for (const rt of due) {
    await prisma.transaction.create({
      data: {
        amount: rt.amount,
        type: rt.type,
        category: rt.category,
        description: rt.description ?? `${rt.frequency} — авто`,
        currency: rt.currency,
        date: rt.nextDate,
        userId: rt.userId,
        familyId: rt.familyId,
      },
    })

    const next = new Date(rt.nextDate)
    switch (rt.frequency) {
      case 'DAILY': next.setDate(next.getDate() + 1); break
      case 'WEEKLY': next.setDate(next.getDate() + 7); break
      case 'MONTHLY': next.setMonth(next.getMonth() + 1); break
      case 'YEARLY': next.setFullYear(next.getFullYear() + 1); break
    }

    await prisma.recurringTransaction.update({
      where: { id: rt.id },
      data: { nextDate: next },
    })

    created++
  }

  if (created > 0) {
    revalidatePath('/dashboard')
    revalidatePath('/transactions')
  }

  return created
}
