import type { Metadata } from 'next'
import { requireAuth } from '@/actions/auth.actions'
import { TeamDashboard } from '@/features/ai-log/components/TeamDashboard'

export const metadata: Metadata = { title: 'Team dashboard' }

export default async function TeamDashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  await requireAuth()
  const { teamId } = await params
  return (
    <div className="max-w-4xl">
      <TeamDashboard teamId={teamId} />
    </div>
  )
}
