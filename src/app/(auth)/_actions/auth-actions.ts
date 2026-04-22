'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import { registerSchema, loginSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

type ActionResult = { success: boolean; error?: string }

export async function registerUser(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const validated = registerSchema.safeParse(raw)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message }
  }

  const existing = await prisma.user.findUnique({ where: { email: raw.email } })
  if (existing) {
    return { success: false, error: 'Пользователь с таким email уже существует' }
  }

  const passwordHash = await bcrypt.hash(raw.password, 12)

  const family = await prisma.family.create({
    data: { name: `Семья ${raw.name}` },
  })

  await prisma.user.create({
    data: {
      name: raw.name,
      email: raw.email,
      passwordHash,
      familyId: family.id,
    },
  })

  await signIn('credentials', { email: raw.email, password: raw.password, redirect: false })
  revalidatePath('/')
  return { success: true }
}

export async function loginUser(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validated = loginSchema.safeParse(raw)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message }
  }

  try {
    await signIn('credentials', { email: raw.email, password: raw.password, redirect: false })
    revalidatePath('/')
    return { success: true }
  } catch {
    return { success: false, error: 'Неверный email или пароль' }
  }
}
