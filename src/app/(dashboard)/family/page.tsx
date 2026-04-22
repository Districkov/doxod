import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FamilyInviteForm } from '@/components/family/FamilyInviteForm'
import { InviteActions } from '@/components/family/InviteActions'
import { Users } from 'lucide-react'

export default async function FamilyPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  // Получаем текущую семью пользователя (если есть)
  const currentFamily = session.user.familyId ? await prisma.family.findUnique({
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
  }) : null

  // Получаем входящие приглашения для текущего пользователя
  const incomingInvites = await prisma.familyInvite.findMany({
    where: {
      inviteeId: session.user.id,
      accepted: false,
      expiresAt: { gt: new Date() }
    },
    include: {
      family: {
        include: {
          members: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl text-zinc-900 dark:text-zinc-100">Семья</h1>

      {/* Входящие приглашения */}
      {incomingInvites.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6 dark:border-amber-800 dark:bg-amber-900/20">
          <h2 className="mb-4 font-semibold text-amber-900 dark:text-amber-100">
            Приглашения ({incomingInvites.length})
          </h2>
          <div className="space-y-3">
            {incomingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg bg-white p-4 dark:bg-zinc-900"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {invite.family.name}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {invite.family.members.length} участник{invite.family.members.length === 1 ? '' : invite.family.members.length < 5 ? 'а' : 'ов'}
                  </p>
                </div>
                <InviteActions token={invite.token} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Текущая семья */}
      {currentFamily ? (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Участники ({currentFamily.members.length})
            </h2>
            <div className="space-y-3">
              {currentFamily.members.map((member) => (
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

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              Пригласить участника
            </h2>
            <FamilyInviteForm />

            {currentFamily.invites.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Ожидают подтверждения
                </p>
                {currentFamily.invites.map((invite) => (
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
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">
            У вас нет семьи. Примите приглашение выше или создайте новую семью.
          </p>
        </div>
      )}
    </div>
  )
}
