import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const params = await searchParams
  if (!params.token) redirect('/dashboard')

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Приглашение в семью
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Нажмите кнопку ниже, чтобы принять приглашение
        </p>
        <form
          action={async () => {
            'use server'
            const { acceptInvite } = await import('@/app/(dashboard)/_actions/family-actions')
            await acceptInvite(params.token!)
            redirect('/dashboard')
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Принять приглашение
          </button>
        </form>
      </div>
    </div>
  )
}
