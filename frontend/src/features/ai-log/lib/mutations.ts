import { addDoc, arrayUnion, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { getClientDb } from '@/lib/firebase/client'
import type { ActionResult } from '@/types'
import type { AiLogFormInput } from '../schemas'
import { describeFirestoreError } from './errors'

// These run in the browser with the client SDK on purpose: Firestore security rules
// (firebase/firestore.rules) are the server-side enforcement. The Admin SDK would bypass them.
// Plain collection refs are used because the typed ones include `id`, which is not a stored field.

export async function createTeam(uid: string, name: string): Promise<ActionResult<string>> {
  try {
    const ref = await addDoc(collection(getClientDb(), 'teams'), {
      name,
      ownerId: uid,
      memberIds: [uid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      _schemaVersion: 1,
    })
    return { success: true, data: ref.id }
  } catch (err) {
    return { success: false, error: describeFirestoreError(err) }
  }
}

export async function addTeamMember(teamId: string, memberUid: string): Promise<ActionResult> {
  try {
    await updateDoc(doc(getClientDb(), 'teams', teamId), {
      memberIds: arrayUnion(memberUid),
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: describeFirestoreError(err) }
  }
}

export async function createAiLog(
  uid: string,
  teamId: string,
  input: AiLogFormInput
): Promise<ActionResult<string>> {
  try {
    const ref = await addDoc(collection(getClientDb(), 'teams', teamId, 'aiLogs'), {
      userId: uid,
      phase: input.phase,
      taskSummary: input.taskSummary,
      outcome: input.outcome,
      minutesSaved: input.minutesSaved,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
      _schemaVersion: 1,
    })
    return { success: true, data: ref.id }
  } catch (err) {
    return { success: false, error: describeFirestoreError(err) }
  }
}

/** Soft delete: the log stays in Firestore with deletedAt set; queries filter it out. */
export async function softDeleteAiLog(teamId: string, logId: string): Promise<ActionResult> {
  try {
    await updateDoc(doc(getClientDb(), 'teams', teamId, 'aiLogs', logId), {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: describeFirestoreError(err) }
  }
}
