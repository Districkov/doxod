import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FamilyInviteForm } from '@/components/family/FamilyInviteForm'
import { Users } from 'lucide-react'

export default async function FamilyPage() {
  const session = await auth()
  if (!session?.user?.familyId) return null

  const family = await prisma.family.findUnique({
    where: { id: session.user.familyId },
    include: {
      members: {
        select: { id: true, name: true, email: true, image: true },
      },
      invites: {
        where: { accepted: false, expiresAt: { gt: new Date() } },
        include: { invitee: { select: { name: true, email: true } } },
      },
    },
  })
  if (!family) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Семья</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
            Участники ({family.members.length})
          </h2>
          <div className="space-y-3">
            {family.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                  {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {member.name || member.email}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
            Пригласить участника
          </h2>
          <FamilyInviteForm />

          {family.invites.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Ожидают подтверждения
              </p>
              {family.invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20"
                >
                  <Users className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">
                    {invite.invitee.name || invite.invitee.email}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
