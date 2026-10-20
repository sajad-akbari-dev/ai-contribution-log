import type { Timestamp } from 'firebase/firestore'

/**
 * Firestore collection type definitions.
 *
 * Keep in sync with:
 *   - src/lib/firebase/firestore.ts  (typed collection exports)
 *   - firebase/firestore.rules       (security rules)
 *   - docs/FIRESTORE-SCHEMA.md       (schema documentation)
 *
 * When adding a new collection, use the /firebase-collection skill.
 */

export interface UserProfile {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  role: 'user'
  createdAt: Timestamp
  updatedAt: Timestamp
  _schemaVersion: 1
}

export type CreateUserProfileInput = Omit<UserProfile, 'createdAt' | 'updatedAt'>

export interface Team {
  id: string
  name: string
  ownerId: string
  memberIds: string[] // always includes ownerId; used by security rules for membership checks
  createdAt: Timestamp
  updatedAt: Timestamp
  _schemaVersion: 1
}

export type AiPhase = 'requirements' | 'design' | 'build' | 'test' | 'deploy'
export type AiOutcome = 'accepted' | 'edited' | 'rejected'

export interface AiLog {
  id: string
  teamId: string
  userId: string // author — must equal the signed-in user (enforced by rules)
  phase: AiPhase
  taskSummary: string
  outcome: AiOutcome
  minutesSaved: number
  createdAt: Timestamp
  updatedAt: Timestamp
  deletedAt: Timestamp | null // soft delete — null means live
  _schemaVersion: 1
}
