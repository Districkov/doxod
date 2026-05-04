'use client'

import { Download } from 'lucide-react'

export function ExportButton({ familyId }: { familyId: string }) {
  const handleExport = (format: string) => {
    window.open(`/api/export?format=${format}`, '_blank')
  }

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => handleExport('csv')}
        className="flex items-center gap-1.5 rounded-lg bg-[#1a1a24] px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-[#22222e] hover:text-zinc-200 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        CSV
      </button>
    </div>
  )
}
