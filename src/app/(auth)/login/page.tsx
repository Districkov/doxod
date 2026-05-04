'use client'

import { useActionState } from 'react'
import { loginUser } from '../_actions/auth-actions'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl sm:text-2xl">Вход</CardTitle>
        <CardDescription>Войдите в свой аккаунт</CardDescription>
      </CardHeader>
      <CardContent>
        {state.error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Пароль
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={pending || isSigningIn}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50"
          >
            {pending ? 'Проверяем...' : isSigningIn ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
