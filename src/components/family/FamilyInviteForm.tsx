'use client'

import { useActionState } from 'react'
import { createFamilyInvite } from '@/app/(dashboard)/_actions/family-actions'
import { UserPlus, Copy, Check } from 'lucide-react'
import { useState } from 'react'

type FamilyInviteState = { success: boolean; error?: string; inviteLink?: string }

export function FamilyInviteForm() {
  const [state, formAction, pending] = useActionState<FamilyInviteState, FormData>(
    createFamilyInvite,
    { success: false }
  )
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (state.inviteLink) {
      navigator.clipboard.writeText(state.inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="email@example.com"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          Пригласить
        </button>
      </form>

      {state.error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{state.error}</p>
      )}

      {state.inviteLink && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
          <input
            type="text"
            readOnly
            value={state.inviteLink}
            className="flex-1 bg-transparent text-sm text-emerald-700 outline-none dark:text-emerald-400"
          />
          <button
            onClick={handleCopy}
            className="text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  )
}
