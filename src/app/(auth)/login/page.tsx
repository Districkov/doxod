'use client'

import { useActionState } from 'react'
import { loginUser } from '../_actions/auth-actions'
import Link from 'next/link'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginUser, { success: false })

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Вход</h1>
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
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Нет аккаунта?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
