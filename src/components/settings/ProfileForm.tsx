'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/(dashboard)/_actions/settings-actions'
import type { User } from '@/generated/prisma'

type ProfileFormProps = {
  user: Pick<User, 'name' | 'email'>
}

type Result = { success: boolean; error?: string }

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState<Result, FormData>(updateProfile, { success: false })

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400">{state.error}</div>
      )}
      {state.success && (
        <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-400">Имя обновлено</div>
      )}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-500">Имя</label>
        <input
          type="text"
          name="name"
          defaultValue={user.name ?? ''}
          placeholder="Ваше имя"
          className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-500">Email</label>
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full rounded-lg border border-[#1e1e2a] bg-[#0c0c12] px-3 py-2 text-sm text-zinc-600 cursor-not-allowed"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? 'Сохраняем...' : 'Сохранить'}
      </button>
    </form>
  )
}
