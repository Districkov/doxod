'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, ArrowLeftRight, Target, BarChart3, Users, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

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

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Доход</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
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
        className={`fixed top-14 bottom-16 left-0 z-40 w-64 transform border-r border-zinc-200 bg-zinc-50 transition-transform lg:hidden dark:border-zinc-800 dark:bg-zinc-950 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
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
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mt-4 flex items-center gap-3 rounded-lg border-t border-zinc-200 px-3 py-2.5 pt-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-zinc-200 bg-white px-2 py-2 lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
