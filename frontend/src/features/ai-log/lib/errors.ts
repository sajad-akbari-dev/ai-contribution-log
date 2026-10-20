/** Turn a Firestore/SDK error into a message safe to show the user. */
export function describeFirestoreError(err: unknown): string {
  const code = getErrorCode(err)
  if (code === 'permission-denied') return 'You do not have access to this team.'
  if (code === 'unavailable') return 'Cannot reach the server. Check your connection and retry.'
  return 'Something went wrong. Please try again.'
}

export function isPermissionDenied(err: unknown): boolean {
  return getErrorCode(err) === 'permission-denied'
}

function getErrorCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const { code } = err as { code: unknown }
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}
