'use client'

import { useActionState } from 'react'
import { loginUser } from '../_actions/auth-actions'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'

type LoginState = { success: boolean; error?: string; email?: string; password?: string }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginUser, { success: false })
  const router = useRouter()
  const [isSigningIn, startSignIn] = useTransition()

  useEffect(() => {
    if (state.success && state.email && state.password) {
      startSignIn(async () => {
        const result = await signIn('credentials', {
          email: state.email,
          password: state.password,
          redirect: false,
        })
        if (result?.ok) {
          router.push('/dashboard')
        }
      })
    }
  }, [state.success, state.email, state.password, router])

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold sm:text-2xl text-zinc-900 dark:text-zinc-100">Вход</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Войдите в свой аккаунт
        </p>
      </div>

      {state.error && (
        <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Пароль
          </label>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <button
          type="submit"
          disabled={pending || isSigningIn}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? 'Проверяем...' : isSigningIn ? 'Входим...' : 'Войти'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-blue-600 hover:underline dark:text-blue-400">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
