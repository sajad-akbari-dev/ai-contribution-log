'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { formatDatetime } from '@/lib/utils'
import type { AiLog } from '@/types/firestore'
import { OUTCOME_LABELS, PHASE_LABELS } from '../constants'
import { softDeleteAiLog } from '../lib/mutations'
import { cardClass, secondaryButtonClass } from './styles'

interface LogListProps {
  logs: readonly AiLog[]
  currentUid: string
}

export function LogList({ logs, currentUid }: LogListProps) {
  return (
    <ul className="space-y-2">
      {logs.map((log) => (
        <LogRow key={log.id} log={log} isOwn={log.userId === currentUid} />
      ))}
    </ul>
  )
}

function LogRow({ log, isOwn }: { log: AiLog; isOwn: boolean }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const result = await softDeleteAiLog(log.id)
    if (result.success) {
      toast.success('Log deleted')
    } else {
      toast.error(result.error ?? 'Failed to delete the log')
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <li className={`${cardClass} space-y-2`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium dark:bg-zinc-800">
          {PHASE_LABELS[log.phase]}
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium dark:bg-zinc-800">
          {OUTCOME_LABELS[log.outcome]}
        </span>
        <span className="text-zinc-500">{log.minutesSaved} min saved</span>
      </div>
      <p className="text-sm">{log.taskSummary}</p>
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
        <span>
          {isOwn ? 'You' : `Member ${log.userId.slice(0, 6)}`} ·{' '}
          {formatDatetime(log.createdAt.toDate())}
        </span>
        {isOwn &&
          (confirming ? (
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className={secondaryButtonClass}
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className={secondaryButtonClass}
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={secondaryButtonClass}
            >
              Delete
            </button>
          ))}
      </div>
    </li>
  )
}
