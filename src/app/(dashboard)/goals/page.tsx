import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoalCard } from '@/components/goals/GoalCard'
import { GoalForm } from '@/components/goals/GoalForm'
import { deleteGoal } from '../_actions/goal-actions'
import { Plus } from 'lucide-react'

export default async function GoalsPage() {
  const session = await auth()
  if (!session?.user?.familyId) return null

  const family = await prisma.family.findUnique({
    where: { id: session.user.familyId },
    include: { goals: { include: { transactions: true }, orderBy: { createdAt: 'desc' } } },
  })
  if (!family) return null

  const now = new Date().getTime()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Копилки</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Новая цель
              </h2>
            </div>
            <GoalForm />
          </div>
        </div>

        <div className="lg:col-span-2">
          {family.goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
              <p className="text-sm text-zinc-400">Создайте первую финансовую цель</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {family.goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  baseCurrency={family.baseCurrency}
                  now={now}
                  onDelete={async (goalId) => {
                    'use server'
                    const fd = new FormData()
                    fd.set('id', goalId)
                    await deleteGoal(fd)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
