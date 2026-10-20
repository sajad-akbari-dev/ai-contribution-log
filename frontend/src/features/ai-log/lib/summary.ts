import type { AiLog, AiPhase } from '@/types/firestore'
import { AI_PHASES } from '../constants'

export interface PhaseSummary {
  phase: AiPhase
  logs: number
  /** accepted / all logs in the phase, 0–1. null when the phase has no logs. */
  acceptanceRate: number | null
  minutesSaved: number
}

type SummarisableLog = Pick<AiLog, 'phase' | 'outcome' | 'minutesSaved'>

/**
 * Per-phase task count, acceptance rate and total minutes saved.
 * Always returns one row per phase, in SDLC order, so the table never shifts.
 */
export function summarizeByPhase(logs: readonly SummarisableLog[]): PhaseSummary[] {
  return AI_PHASES.map((phase) => {
    const inPhase = logs.filter((log) => log.phase === phase)
    const accepted = inPhase.filter((log) => log.outcome === 'accepted').length
    return {
      phase,
      logs: inPhase.length,
      acceptanceRate: inPhase.length === 0 ? null : accepted / inPhase.length,
      minutesSaved: inPhase.reduce((total, log) => total + log.minutesSaved, 0),
    }
  })
}
