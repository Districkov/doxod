'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, ArrowLeftRight, Target, BarChart3, Users, LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Обзор', icon: LayoutDashboard },
  { href: '/transactions', label: 'Транзакции', icon: ArrowLeftRight },
  { href: '/goals', label: 'Копилки', icon: Target },
  { href: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/family', label: 'Семья', icon: Users },
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
      {/* Mobile Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 backdrop-blur-lg px-4 lg:hidden dark:border-zinc-800 dark:bg-zinc-950/90"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Доход</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:active:bg-zinc-700"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden h-full w-64 flex-col border-r border-zinc-200 bg-zinc-50 lg:flex dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Доход</span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-14 left-0 z-40 w-64 transform border-r border-zinc-200 bg-zinc-50/95 backdrop-blur-lg transition-transform duration-200 ease-out lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95 ${
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
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors active:scale-[0.98] ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mt-4 flex items-center gap-3 rounded-lg border-t border-zinc-200 px-3 py-3 pt-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700"
          >
            <LogOut className="h-5 w-5" />
            Выйти
          </button>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-zinc-200 bg-white/90 backdrop-blur-lg px-1 lg:hidden dark:border-zinc-800 dark:bg-zinc-950/90"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors active:scale-[0.95] min-w-0 flex-1 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-zinc-500 dark:text-zinc-400'
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
