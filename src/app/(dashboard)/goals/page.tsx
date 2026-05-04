import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoalCard } from '@/components/goals/GoalCard'
import { GoalForm } from '@/components/goals/GoalForm'
import { deleteGoal } from '../_actions/goal-actions'
import { Plus } from 'lucide-react'
import { DeleteGoalWrapper } from '@/components/goals/DeleteGoalWrapper'

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
      <h1 className="text-xl font-bold text-white">Копилки</h1>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Новая цель</h2>
            </div>
            <GoalForm />
          </div>
        </div>

        <div className="lg:col-span-2">
          {family.goals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1e1e2a] bg-[#0c0c12] flex flex-col items-center justify-center py-16">
              <p className="text-sm text-zinc-600">Создайте первую финансовую цель</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {family.goals.map((goal) => (
                <DeleteGoalWrapper key={goal.id} goalId={goal.id}>
                  <GoalCard
                    goal={goal}
                    baseCurrency={family.baseCurrency}
                    now={now}
                  />
                </DeleteGoalWrapper>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
