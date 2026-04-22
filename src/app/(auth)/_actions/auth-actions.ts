'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema, loginSchema } from '@/lib/validations'

type ActionResult = { success: boolean; error?: string; email?: string; password?: string }

export async function registerUser(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  console.log('Registration attempt for email:', raw.email)

  const validated = registerSchema.safeParse(raw)
  if (!validated.success) {
    console.log('Validation failed:', validated.error.issues[0].message)
    return { success: false, error: validated.error.issues[0].message }
  }

  const existing = await prisma.user.findUnique({ where: { email: raw.email } })
  if (existing) {
    console.log('User already exists:', existing.email)
    return { success: false, error: 'Пользователь с таким email уже существует' }
  }

  const passwordHash = await bcrypt.hash(raw.password, 12)

  try {
    const family = await prisma.family.create({
      data: { name: `Семья ${raw.name}` },
    })
    console.log('Created family:', family.id)

    const user = await prisma.user.create({
      data: {
        name: raw.name,
        email: raw.email,
        passwordHash,
        familyId: family.id,
      },
    })
    console.log('Created user:', user.id, user.email)

    return { success: true, email: raw.email, password: raw.password }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Ошибка при создании пользователя' }
  }
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

  const user = await prisma.user.findUnique({ where: { email: raw.email } })
  if (!user || !user.passwordHash) {
    return { success: false, error: 'Неверный email или пароль' }
  }

  const isValid = await bcrypt.compare(raw.password, user.passwordHash)
  if (!isValid) {
    return { success: false, error: 'Неверный email или пароль' }
  }

  return { success: true, email: raw.email, password: raw.password }
}
