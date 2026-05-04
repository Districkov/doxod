import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FamilyInviteForm } from '@/components/family/FamilyInviteForm'
import { InviteActions } from '@/components/family/InviteActions'
import { Users, Crown, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">Семья</h1>

      {incomingInvites.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100">
              Приглашения ({incomingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomingInvites.map((invite) => (
                <div key={invite.id} className="flex flex-col gap-2 rounded-lg bg-white/60 p-3 dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">{invite.family.name}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Участники: {invite.family.members.map(m => m.name).join(', ')}
                    </p>
                  </div>
                  <InviteActions token={invite.token} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentFamily ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>{currentFamily.name}</CardTitle>
              </div>
              <CardDescription>
                Валюта: {currentFamily.baseCurrency}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentFamily.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-lg p-2 active:bg-muted/50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <span className="text-sm font-medium">
                        {member.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {member.id === session.user.id && (
                      <Badge variant="secondary" className="shrink-0">Вы</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>Пригласить участника</CardTitle>
              </div>
              <CardDescription>Отправьте приглашение по email</CardDescription>
            </CardHeader>
            <CardContent>
              <FamilyInviteForm />
            </CardContent>
          </Card>

          {currentFamily.invites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ожидающие приглашения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentFamily.invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{invite.invitee.email}</span>
                      </div>
                      <Badge variant="outline">Ожидает</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Сначала создайте или присоединитесь к семье</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
