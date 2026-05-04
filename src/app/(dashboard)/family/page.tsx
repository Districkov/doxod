import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FamilyInviteForm } from '@/components/family/FamilyInviteForm'
import { InviteActions } from '@/components/family/InviteActions'
import { Users, Mail, UserPlus } from 'lucide-react'

export default async function FamilyPage() {
  const session = await auth()
  if (!session?.user?.id) return null

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

  const incomingInvites = await prisma.familyInvite.findMany({
    where: {
      inviteeId: session.user.id,
      accepted: false,
      expiresAt: { gt: new Date() }
    },
    select: {
      id: true,
      token: true,
      family: {
        select: {
          name: true,
          members: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Семья</h1>

      {incomingInvites.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="text-sm font-semibold text-amber-300 mb-3">
            Приглашения ({incomingInvites.length})
          </h2>
          <div className="space-y-2">
            {incomingInvites.map((invite) => (
              <div key={invite.id} className="flex flex-col gap-2 rounded-xl bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-amber-200">{invite.family.name}</p>
                  <p className="text-[11px] text-amber-400/60">
                    {invite.family.members.map(m => m.name).join(', ')}
                  </p>
                </div>
                <InviteActions token={invite.token} />
              </div>
            ))}
          </div>
        </div>
      )}

      {currentFamily ? (
        <>
          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-200">{currentFamily.name}</h2>
              <span className="text-[11px] text-zinc-600 ml-auto">{currentFamily.baseCurrency}</span>
            </div>
            <div className="space-y-1">
              {currentFamily.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-[#1a1a24] transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15">
                    <span className="text-xs font-semibold text-indigo-400">
                      {member.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200 truncate">{member.name}</p>
                    <p className="text-[11px] text-zinc-600 truncate">{member.email}</p>
                  </div>
                  {member.id === session.user.id && (
                    <span className="text-[10px] font-medium text-indigo-400/70 bg-indigo-500/10 px-2 py-0.5 rounded-full">Вы</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Пригласить участника</h2>
            </div>
            <FamilyInviteForm />
          </div>

          {currentFamily.invites.length > 0 && (
            <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
              <h2 className="text-sm font-semibold text-zinc-200 mb-3">Ожидающие приглашения</h2>
              <div className="space-y-1">
                {currentFamily.invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-zinc-600" />
                      <span className="text-sm text-zinc-400">{invite.invitee.email}</span>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-600 bg-[#1a1a24] px-2 py-0.5 rounded-full">Ожидает</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] flex flex-col items-center py-16">
          <Users className="mb-2 h-8 w-8 text-zinc-700" />
          <p className="text-sm text-zinc-600">Сначала создайте или присоединитесь к семье</p>
        </div>
      )}
    </div>
  )
}
