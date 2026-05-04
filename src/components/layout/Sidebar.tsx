'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, ArrowLeftRight, Target, BarChart3, Users, LogOut, Menu, X, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Обзор', icon: LayoutDashboard },
  { href: '/transactions', label: 'Транзакции', icon: ArrowLeftRight },
  { href: '/goals', label: 'Копилки', icon: Target },
  { href: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/family', label: 'Семья', icon: Users },
  { href: '/settings', label: 'Настройки', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    setIsStandalone(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-[#1e1e2a] bg-[#050507]/80 backdrop-blur-xl px-4 lg:hidden"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-white">Доход</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-[#1a1a24] active:bg-[#22222e]"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className="hidden h-full w-64 flex-col border-r border-[#1e1e2a] bg-[#050507] lg:flex">
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-white">Доход</span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 shadow-sm shadow-indigo-500/5'
                    : 'text-zinc-500 hover:bg-[#1a1a24] hover:text-zinc-300 active:bg-[#22222e]'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[#1e1e2a] p-3">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-[#1a1a24] hover:text-zinc-300 active:bg-[#22222e]"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>

      <aside
        className={`fixed top-14 left-0 z-40 w-64 transform border-r border-[#1e1e2a] bg-[#050507]/95 backdrop-blur-xl transition-transform duration-200 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-zinc-500 hover:bg-[#1a1a24] hover:text-zinc-300'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mt-4 flex items-center gap-3 rounded-xl border-t border-[#1e1e2a] px-3 py-3 pt-4 text-sm font-medium text-zinc-500 transition-colors hover:bg-[#1a1a24] hover:text-zinc-300 active:bg-[#22222e]"
          >
            <LogOut className="h-5 w-5" />
            Выйти
          </button>
        </nav>
      </aside>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#1e1e2a] bg-[#050507]/80 backdrop-blur-xl px-1 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs font-medium transition-all active:scale-[0.95] min-w-0 flex-1 ${
                isActive
                  ? 'text-indigo-400'
                  : 'text-zinc-600'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate text-[10px] leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
