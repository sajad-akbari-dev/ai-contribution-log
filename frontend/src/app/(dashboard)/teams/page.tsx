import type { Metadata } from 'next'
import { requireAuth } from '@/actions/auth.actions'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreateTeamForm } from '@/features/ai-log/components/CreateTeamForm'
import { TeamsList } from '@/features/ai-log/components/TeamsList'

export const metadata: Metadata = { title: 'Teams' }

export default async function TeamsPage() {
  await requireAuth()
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="AI Contribution Log"
        description="Pick a team to log AI-assisted tasks and see which SDLC phases AI helps most."
      />
      <CreateTeamForm />
      <TeamsList />
    </div>
  )
}
