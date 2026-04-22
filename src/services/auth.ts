import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireFamily() {
  const user = await requireAuth()
  if (!user.familyId) throw new Error('No family assigned')

  const family = await prisma.family.findUnique({
    where: { id: user.familyId },
    include: { members: true },
  })

  if (!family) throw new Error('Family not found')
  return { user, family }
}
