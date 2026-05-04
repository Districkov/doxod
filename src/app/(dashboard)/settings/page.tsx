import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { FamilySettingsForm } from '@/components/settings/FamilySettingsForm'
import { LeaveFamilyButton } from '@/components/settings/LeaveFamilyButton'
import { CategoryManager } from '@/components/settings/CategoryManager'
import { Settings, User, Users, Tag } from 'lucide-react'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, familyId: true },
  })
  if (!user) return null

  const family = user.familyId
    ? await prisma.family.findUnique({
        where: { id: user.familyId },
        include: {
          members: { select: { id: true } },
          categories: true,
        },
      })
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-indigo-400" />
        <h1 className="text-xl font-bold text-white">Настройки</h1>
      </div>

      <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Профиль</h2>
        </div>
        <ProfileForm user={user} />
      </div>

      {family && (
        <>
          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Семья</h2>
            </div>
            <FamilySettingsForm
              familyName={family.name}
              currency={family.baseCurrency}
              memberCount={family.members.length}
            />
            <div className="border-t border-[#1e1e2a] pt-4 mt-5">
              <LeaveFamilyButton />
            </div>
          </div>

          <div className="rounded-2xl border border-[#1e1e2a] bg-[#0c0c12] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Категории</h2>
            </div>
            <CategoryManager categories={family.categories} />
          </div>
        </>
      )}

      {!family && (
        <div className="rounded-2xl border border-dashed border-[#1e1e2a] bg-[#0c0c12] flex flex-col items-center py-12">
          <Users className="mb-2 h-8 w-8 text-zinc-700" />
          <p className="text-sm text-zinc-600">Вы не состоите в семье</p>
        </div>
      )}
    </div>
  )
}
