'use client'

import { deleteGoal } from '@/app/(dashboard)/_actions/goal-actions'
import type { ReactNode } from 'react'

export function DeleteGoalWrapper({ goalId, children }: { goalId: string; children: ReactNode }) {
  const handleDelete = async () => {
    const formData = new FormData()
    formData.set('id', goalId)
    await deleteGoal(formData)
  }

  return (
    <form action={deleteGoal} className="contents">
      <input type="hidden" name="id" value={goalId} />
      {children}
    </form>
  )
}
