import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const { auth } = await import('@/lib/auth')
    const session = await auth()
    if (!session?.user) {
      redirect('/login')
    }
  } catch (error) {
    console.error('Auth error in dashboard layout:', error)
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 pb-20 pt-16 lg:p-8 lg:pb-8 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
