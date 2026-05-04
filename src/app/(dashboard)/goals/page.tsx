import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoalCard } from '@/components/goals/GoalCard'
import { GoalForm } from '@/components/goals/GoalForm'
import { deleteGoal } from '../_actions/goal-actions'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">Копилки</h1>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <CardTitle>Новая цель</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <GoalForm />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {family.goals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Создайте первую финансовую цель</p>
              </CardContent>
            </Card>
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
