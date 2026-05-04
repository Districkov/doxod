'use client'

import { useActionState } from 'react'
import { registerUser } from '../_actions/auth-actions'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { LayoutDashboard } from 'lucide-react'

type RegisterState = { success: boolean; error?: string; email?: string; password?: string }

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(registerUser, { success: false })
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
    <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-6 sm:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-white">Регистрация</h1>
        <p className="mt-1 text-sm text-zinc-600">Создайте аккаунт и семью</p>
      </div>

      {state.error && (
        <div className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Имя
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Иван"
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Пароль
          </label>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••"
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Подтвердите пароль
          </label>
          <input
            type="password"
            name="confirmPassword"
            required
            placeholder="••••••"
            className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <button
          type="submit"
          disabled={pending || isSigningIn}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700 active:from-indigo-700 active:to-indigo-800 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
        >
          {pending ? 'Создаём...' : isSigningIn ? 'Входим...' : 'Создать аккаунт'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-600">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
          Войти
        </Link>
      </p>
    </div>
  )
}
