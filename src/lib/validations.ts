import { z } from 'zod/v4'

export const loginSchema = z.object({
  email: z.email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  email: z.email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  confirmPassword: z.string().min(6, 'Минимум 6 символов'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

export const transactionSchema = z.object({
  amount: z.number().positive('Сумма должна быть положительной'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Выберите категорию'),
  description: z.string().optional(),
  currency: z.enum(['RUB', 'USD', 'EUR', 'GBP', 'KZT', 'UAH']),
  date: z.date(),
  goalId: z.string().optional(),
})

export const goalSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  targetAmount: z.number().positive('Целевая сумма должна быть положительной'),
  currency: z.enum(['RUB', 'USD', 'EUR', 'GBP', 'KZT', 'UAH']),
  deadline: z.date().optional(),
})

export const familySchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  baseCurrency: z.enum(['RUB', 'USD', 'EUR', 'GBP', 'KZT', 'UAH']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
export type GoalInput = z.infer<typeof goalSchema>
export type FamilyInput = z.infer<typeof familySchema>
