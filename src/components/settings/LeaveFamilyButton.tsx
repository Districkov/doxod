'use client'

import { leaveFamily } from '@/app/(dashboard)/_actions/settings-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LeaveFamilyButton() {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLeave = async () => {
    const result = await leaveFamily()
    if (result.error) {
      setError(result.error)
      setConfirming(false)
    } else {
      router.push('/dashboard')
    }
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-rose-400">{error}</p>
        <button
          onClick={() => setError(null)}
          className="text-xs text-zinc-500 hover:text-zinc-400"
        >
          Закрыть
        </button>
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-amber-400">Вы уверены? Вы покинете семью.</p>
        <div className="flex gap-2">
          <button
            onClick={handleLeave}
            className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/30 active:bg-rose-500/40"
          >
            Покинуть семью
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg bg-[#1a1a24] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-[#22222e]"
          >
            Отмена
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-zinc-600 hover:text-rose-400 transition-colors"
    >
      Покинуть семью
    </button>
  )
}
