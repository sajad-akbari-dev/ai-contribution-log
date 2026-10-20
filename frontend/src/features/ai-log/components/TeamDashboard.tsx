'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useTeam, useTeamLogs } from '../hooks/useLiveData'
import { describeFirestoreError, isPermissionDenied } from '../lib/errors'
import { summarizeByPhase } from '../lib/summary'
import { AddLogForm } from './AddLogForm'
import { AddMemberForm } from './AddMemberForm'
import { LogList } from './LogList'
import { PhaseSummaryTable } from './PhaseSummaryTable'
import { ErrorBanner, SkeletonRows } from './StateViews'
import { primaryButtonClass } from './styles'

interface TeamDashboardProps {
  teamId: string
}

export function TeamDashboard({ teamId }: TeamDashboardProps) {
  const { user } = useAuth()
  const team = useTeam(teamId)
  const logs = useTeamLogs(teamId)
  const [showForm, setShowForm] = useState(false)

  // Hook is called before any early return so hook order stays stable.
  const summary = useMemo(() => summarizeByPhase(logs.data), [logs.data])

  if (team.error) {
    if (isPermissionDenied(team.error)) {
      return (
        <div className="space-y-3">
          <ErrorBanner message={describeFirestoreError(team.error)} />
          <Link href="/teams" className="text-sm underline">
            Back to your teams
          </Link>
        </div>
      )
    }
    return <ErrorBanner message={describeFirestoreError(team.error)} onRetry={team.retry} />
  }
  if (team.loading || !user) {
    return (
      <div className="space-y-6">
        <SkeletonRows rows={1} />
        <SkeletonRows rows={5} />
        <SkeletonRows rows={3} />
      </div>
    )
  }
  if (!team.data) {
    return <ErrorBanner message="This team could not be found." />
  }

  const isOwner = team.data.ownerId === user.uid

  return (
    <div className="space-y-6">
      <Link href="/teams" className="text-sm text-zinc-500 underline">
        ← All teams
      </Link>
      <PageHeader
        title={team.data.name}
        description={`${team.data.memberIds.length} ${team.data.memberIds.length === 1 ? 'member' : 'members'}`}
        actions={
          !showForm && (
            <button type="button" onClick={() => setShowForm(true)} className={primaryButtonClass}>
              Add log
            </button>
          )
        }
      />

      {isOwner && <AddMemberForm teamId={teamId} />}

      {logs.error ? (
        <ErrorBanner message={describeFirestoreError(logs.error)} onRetry={logs.retry} />
      ) : logs.loading ? (
        <div className="space-y-6">
          <SkeletonRows rows={5} />
          <SkeletonRows rows={3} />
        </div>
      ) : (
        <>
          <PhaseSummaryTable summary={summary} />

          {showForm && (
            <AddLogForm
              uid={user.uid}
              teamId={teamId}
              onSaved={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          )}

          {logs.data.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No logs yet"
              description="Log the first AI-assisted task for this team."
            />
          ) : (
            <LogList logs={logs.data} currentUid={user.uid} />
          )}
        </>
      )}
    </div>
  )
}
