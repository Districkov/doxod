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
    <div className="flex overflow-hidden bg-white dark:bg-zinc-950" style={{ height: '100dvh' }}>
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto overscroll-contain p-4 pb-20 pt-[calc(56px+1rem)] lg:p-8 lg:pb-8 lg:pt-8"
        style={{
          paddingTop: 'calc(56px + env(safe-area-inset-top, 0px) + 1rem)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>
    </div>
  )
}
