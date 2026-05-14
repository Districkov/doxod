'use client'

import { useState } from 'react'
import { Building2, Download, Trash2, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

const inputCls = "w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
const btnCls = "flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2.5 text-sm font-medium text-black transition-all hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50"
const btnDangerCls = "flex items-center justify-center gap-2 w-full rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/20 disabled:opacity-50"

interface TinkoffSettingsProps {
  isConnected: boolean
  lastSyncAt?: string | null
}

export function TinkoffSettings({ isConnected, lastSyncAt }: TinkoffSettingsProps) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [accounts, setAccounts] = useState<{ id: string; name: string; accountType: string; moneyAmount?: { value: number; currency: { name: string } } }[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [importDays, setImportDays] = useState('30')
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/tinkoff/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Т-Банк подключён!')
      loadAccounts()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tinkoff/accounts')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAccounts(data.accounts || [])
      if (data.accounts?.length > 0) setSelectedAccount(data.accounts[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки счетов')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!selectedAccount) return
    setLoading(true)
    setError('')
    setImportResult(null)
    try {
      const res = await fetch('/api/tinkoff/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedAccount, days: parseInt(importDays) || 30 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImportResult({ imported: data.imported, skipped: data.skipped })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка импорта')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    setError('')
    try {
      await fetch('/api/tinkoff/auth', { method: 'DELETE' })
      setAccounts([])
      setImportResult(null)
      setSuccess('')
      setPhone('')
      setPassword('')
    } catch {
      setError('Ошибка отключения')
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-semibold text-zinc-200">Т-Банк</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-400">
            <AlertCircle className="h-3 w-3 shrink-0" /> {error}
          </div>
        )}

        <p className="text-xs text-zinc-500">
          Введите телефон и пароль от веб-версии Т-Банка (tbank.ru), не PIN-код от приложения.
        </p>

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+79991234567"
          className={inputCls}
        />

        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль от Т-Банка (не PIN)"
            className={inputCls + ' pr-10'}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <button onClick={handleLogin} disabled={loading || !phone || !password} className={btnCls}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
          Подключить Т-Банк
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-semibold text-zinc-200">Т-Банк</span>
        <span className="ml-2 flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Подключён
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-400">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
          <CheckCircle2 className="h-3 w-3 shrink-0" /> {success}
        </div>
      )}

      {lastSyncAt && (
        <p className="text-[11px] text-zinc-600">Последняя синхронизация: {new Date(lastSyncAt).toLocaleString('ru-RU')}</p>
      )}

      {accounts.length === 0 && (
        <button onClick={loadAccounts} disabled={loading} className={btnCls}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Загрузить счета
        </button>
      )}

      {accounts.length > 0 && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-500">Счёт</label>
            <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className={inputCls}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.accountType}) — {a.moneyAmount ? `${a.moneyAmount.value.toFixed(2)} ${a.moneyAmount.currency.name}` : '—'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-500">За период</label>
            <select value={importDays} onChange={(e) => setImportDays(e.target.value)} className={inputCls}>
              <option value="7">7 дней</option>
              <option value="30">30 дней</option>
              <option value="90">3 месяца</option>
              <option value="180">6 месяцев</option>
            </select>
          </div>

          <button onClick={handleImport} disabled={loading || !selectedAccount} className={btnCls}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Импортировать операции
          </button>

          {importResult && (
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
              Импортировано: {importResult.imported}, пропущено (дубли): {importResult.skipped}
            </div>
          )}
        </div>
      )}

      <button onClick={handleDisconnect} disabled={loading} className={btnDangerCls}>
        <Trash2 className="h-4 w-4" />
        Отключить Т-Банк
      </button>
    </div>
  )
}
