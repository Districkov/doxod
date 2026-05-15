'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

const BANK_OPTIONS = [
  { value: 'auto', label: 'Авто-определение' },
  { value: 'sberbank', label: 'Сбербанк' },
  { value: 'alfabank', label: 'Альфа-Банк' },
  { value: 'tinkoff', label: 'Т-Банк' },
  { value: 'vtb', label: 'ВТБ' },
]

export function CsvImport() {
  const [file, setFile] = useState<File | null>(null)
  const [bankFormat, setBankFormat] = useState('auto')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bankFormat', bankFormat)

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult({ imported: data.imported, skipped: data.skipped, errors: data.errors || [] })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка импорта')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1e1e2a] bg-[#111118]/50 py-6 cursor-pointer transition-colors hover:border-indigo-500/30 hover:bg-[#111118]"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-6 w-6 text-zinc-600 mb-2" />
        <p className="text-xs text-zinc-500">
          {file ? file.name : 'Нажмите или перетащите CSV-файл'}
        </p>
        <p className="text-[10px] text-zinc-700 mt-1">
          Выписка из любого банка (CSV, разделители: , ; табуляция)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null)
            setResult(null)
            setError('')
          }}
          className="hidden"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-zinc-500">Формат банка</label>
        <select
          value={bankFormat}
          onChange={(e) => setBankFormat(e.target.value)}
          className="w-full rounded-lg border border-[#1e1e2a] bg-[#111118] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {BANK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-400">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg bg-emerald-500/10 p-3 space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Импортировано: {result.imported}, пропущено: {result.skipped}
          </div>
          {result.errors.length > 0 && (
            <div className="text-[10px] text-amber-400 mt-1">
              Ошибки: {result.errors.join('; ')}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={loading || !file}
        className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {loading ? 'Импортируем...' : 'Импортировать'}
      </button>
    </div>
  )
}
