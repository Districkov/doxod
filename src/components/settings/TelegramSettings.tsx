'use client'

import { useState, useTransition } from 'react'
import { generateTelegramLinkToken, unlinkTelegram } from '@/app/(dashboard)/_actions/telegram-actions'
import { MessageCircle, Unlink, Copy, Check } from 'lucide-react'

export function TelegramSettings({
  chatId,
  linkToken,
  botUsername,
}: {
  chatId: string | null
  linkToken: string | null
  botUsername: string
}) {
  const [token, setToken] = useState(linkToken)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateTelegramLinkToken()
      if (res.success && res.token) setToken(res.token)
    })
  }

  const handleUnlink = () => {
    startTransition(async () => {
      await unlinkTelegram()
      setToken(null)
    })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (chatId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
          <MessageCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-xs text-emerald-400">Telegram привязан</span>
        </div>
        <button
          onClick={handleUnlink}
          disabled={pending}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-400 transition-colors disabled:opacity-50"
        >
          <Unlink className="h-3.5 w-3.5" />
          Отвязать Telegram
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-amber-500/10 px-3 py-2">
        <p className="text-xs text-amber-400">Telegram не привязан</p>
      </div>

      {!token ? (
        <button
          onClick={handleGenerate}
          disabled={pending}
          className="w-full rounded-lg bg-indigo-500 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          Получить код привязки
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-500">
            1. Откройте бота <span className="text-indigo-400">@{botUsername}</span> в Telegram
          </p>
          <p className="text-[11px] text-zinc-500">
            2. Отправьте команду:
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-[#1a1a24] px-3 py-2">
            <code className="flex-1 text-xs text-indigo-300">/link {token}</code>
            <button
              onClick={() => handleCopy(`/link ${token}`)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            3. После привязки можно будет добавлять расходы сообщениями и фото чеков
          </p>
          <div className="border-t border-[#1e1e2a] pt-2 mt-2">
            <p className="text-[10px] text-zinc-600">Примеры сообщений боту:</p>
            <div className="mt-1 space-y-0.5 text-[11px] text-zinc-500">
              <p><code className="text-zinc-400">-500 кофе</code> — расход</p>
              <p><code className="text-zinc-400">+50000 зарплата</code> — доход</p>
              <p><code className="text-zinc-400">📸 фото чека</code> — авто-распознавание</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
