'use client'

import { useActionState } from 'react'
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
      // Выходим и перезагружаем страницу для обновления сессии
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
        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        <Check className="h-4 w-4" />
        Принять
      </button>
      <button
        onClick={handleReject}
        className="flex items-center gap-2 rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
      >
        <X className="h-4 w-4" />
        Отклонить
      </button>
    </div>
  )
}
