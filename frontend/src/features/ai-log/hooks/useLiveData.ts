'use client'

import { useCallback, useEffect, useState } from 'react'
import { onSnapshot, query, where, type FirestoreError, type Unsubscribe } from 'firebase/firestore'
import { getAiLogsCollection, getTeamsCollection, teamDoc } from '@/lib/firebase/firestore'
import type { AiLog, Team } from '@/types/firestore'

interface LiveResult<T> {
  data: T
  loading: boolean
  error: FirestoreError | null
  /** Re-subscribe after an error. */
  retry: () => void
}

/**
 * Shared subscribe/unsubscribe/error/retry plumbing for the hooks below.
 * `key` identifies the query (null = not ready yet); the subscription restarts
 * only when `key` changes or `retry()` is called — not on every render.
 */
function useLiveSubscription<T>(
  initial: T,
  key: string | null,
  subscribe: (next: (value: T) => void, fail: (err: FirestoreError) => void) => Unsubscribe
): LiveResult<T> {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FirestoreError | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (key === null) return
    return subscribe(
      (value) => {
        setData(value)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const retry = useCallback(() => {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }, [])

  return { data, loading, error, retry }
}

/** Teams the user belongs to. Matches the `teams` read rule (uid in memberIds). */
export function useUserTeams(uid: string | undefined) {
  return useLiveSubscription<Team[]>([], uid ?? null, (next, fail) =>
    onSnapshot(
      query(getTeamsCollection(), where('memberIds', 'array-contains', uid ?? '')),
      (snap) => next(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      fail
    )
  )
}

/** A single team. A non-member gets a permission-denied error from the `teams` read rule. */
export function useTeam(teamId: string) {
  return useLiveSubscription<Team | null>(null, teamId, (next, fail) =>
    onSnapshot(
      teamDoc(teamId),
      (snap) => next(snap.exists() ? { ...snap.data(), id: snap.id } : null),
      fail
    )
  )
}

/**
 * Live (not soft-deleted) logs for a team, newest first.
 * Reads the teams/{teamId}/aiLogs subcollection.
 * The deletedAt == null filter is required: the `aiLogs` read rule only allows
 * documents with deletedAt == null, so a query without it is rejected.
 * Sorted in the browser to avoid needing a composite index.
 */
export function useTeamLogs(teamId: string) {
  return useLiveSubscription<AiLog[]>([], teamId, (next, fail) =>
    onSnapshot(
      query(getAiLogsCollection(teamId), where('deletedAt', '==', null)),
      (snap) => {
        const logs = snap.docs.map((d) => ({
          // 'estimate' avoids a null createdAt on a just-written log whose server time is pending
          ...d.data({ serverTimestamps: 'estimate' }),
          id: d.id,
        }))
        next(logs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()))
      },
      fail
    )
  )
}
