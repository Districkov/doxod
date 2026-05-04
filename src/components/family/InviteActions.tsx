'use client'

import { acceptInvite, rejectInvite } from '@/app/(dashboard)/_actions/family-actions'
import { Check, X } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type InviteActionsProps = {
  token: string
}

export function InviteActions({ token }: InviteActionsProps) {
  const router = useRouter()

  const handleAccept = async () => {
    const formData = new FormData()
    formData.set('token', token)
    
    try {
      await acceptInvite(formData)
      await signOut({ redirect: false })
      router.push('/login?message=invite-accepted')
    } catch (error) {
      console.error('Error accepting invite:', error)
    }
  }

  const handleReject = async () => {
    const formData = new FormData()
    formData.set('token', token)
    
    try {
      await rejectInvite(formData)
      router.refresh()
    } catch (error) {
      console.error('Error rejecting invite:', error)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleAccept}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 active:bg-emerald-500/40"
      >
        <Check className="h-3.5 w-3.5" />
        Принять
      </button>
      <button
        onClick={handleReject}
        className="flex items-center gap-1.5 rounded-lg bg-[#1a1a24] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-[#22222e] active:bg-[#2a2a36]"
      >
        <X className="h-3.5 w-3.5" />
        Отклонить
      </button>
    </div>
  )
}
