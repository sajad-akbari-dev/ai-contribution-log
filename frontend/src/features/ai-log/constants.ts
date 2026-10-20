import type { AiOutcome, AiPhase } from '@/types/firestore'

// Keep these lists identical to the allow-lists in firebase/firestore.rules (validAiLog).
export const AI_PHASES = [
  'requirements',
  'design',
  'build',
  'test',
  'deploy',
] as const satisfies readonly AiPhase[]

export const AI_OUTCOMES = [
  'accepted',
  'edited',
  'rejected',
] as const satisfies readonly AiOutcome[]

export const PHASE_LABELS: Record<AiPhase, string> = {
  requirements: 'Requirements',
  design: 'Design',
  build: 'Build',
  test: 'Test',
  deploy: 'Deploy',
}

export const OUTCOME_LABELS: Record<AiOutcome, string> = {
  accepted: 'Accepted',
  edited: 'Edited',
  rejected: 'Rejected',
}

export const MAX_TEAM_NAME_LENGTH = 60
export const MAX_SUMMARY_LENGTH = 280
export const MAX_MINUTES_SAVED = 480
