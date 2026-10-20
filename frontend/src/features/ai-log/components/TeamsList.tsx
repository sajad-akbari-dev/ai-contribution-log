'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '@/components/shared/EmptyState'
import { useUserTeams } from '../hooks/useLiveData'
import { describeFirestoreError } from '../lib/errors'
import { ErrorBanner, SkeletonRows } from './StateViews'
import { cardClass } from './styles'

export function TeamsList() {
  const { user } = useAuth()
  const { data: teams, loading, error, retry } = useUserTeams(user?.uid)

  if (error) return <ErrorBanner message={describeFirestoreError(error)} onRetry={retry} />
  if (loading) return <SkeletonRows rows={3} />
  if (teams.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No teams yet"
        description="Create a team above to start logging AI-assisted tasks."
      />
    )
  }

  return (
    <ul className="space-y-2">
      {teams.map((team) => (
        <li key={team.id}>
          <Link
            href={`/teams/${team.id}`}
            className={`${cardClass} flex items-center justify-between transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800`}
          >
            <span className="font-medium">{team.name}</span>
            <span className="text-sm text-zinc-500">
              {team.memberIds.length} {team.memberIds.length === 1 ? 'member' : 'members'}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
