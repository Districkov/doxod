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
    <div className="space-y-3">
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder="email@example.com"
          className="flex-1 rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
        >
          <UserPlus className="h-4 w-4" />
          Пригласить
        </button>
      </form>

      {state.error && (
        <p className="text-xs text-rose-400">{state.error}</p>
      )}

      {state.inviteLink && (
        <div className="flex items-center gap-2 rounded-lg bg-[#1a1a24] p-3">
          <code className="flex-1 text-xs text-indigo-300 break-all">{state.inviteLink}</code>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg bg-indigo-500/20 p-2 text-indigo-400 transition-colors hover:bg-indigo-500/30 active:bg-indigo-500/40"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  )
}
