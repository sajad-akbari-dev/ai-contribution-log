# Firestore Schema

## Overview

All collections use the typed collection pattern — see `frontend/src/lib/firebase/firestore.ts`.
Security rules are in `firebase/firestore.rules`.

When adding a new collection, use the `/firebase-collection` Claude Code skill.

## Schema versioning

Every document in every collection **must** include a `_schemaVersion` field:

```typescript
_schemaVersion: 1  // increment when doing a breaking schema change
```

This enables **lazy migration** — when a document is read, check `_schemaVersion` and migrate on the fly if it's behind current. See the `/evolve-schema` skill for the full migration workflow.

**Rules:**
- `_schemaVersion` is always `1` on creation
- Non-breaking changes (adding optional fields with defaults) keep the same version
- Breaking changes (rename, remove, type change) increment the version and require a migration function
- Never remove `_schemaVersion` from a schema

---

## `users` collection

**Path:** `/users/{userId}`
**Access:** Owner-only (user can read/write their own document; admins can read all)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | `string` | Yes | Firebase Auth UID (same as document ID) |
| `email` | `string` | Yes | User's email address |
| `displayName` | `string \| null` | Yes | Display name from Auth or profile |
| `photoURL` | `string \| null` | Yes | Profile photo URL |
| `role` | `'user' \| 'admin'` | Yes | User role — immutable by user after creation |
| `createdAt` | `Timestamp` | Yes | When the document was created |
| `updatedAt` | `Timestamp` | Yes | When the document was last updated |
| `_schemaVersion` | `1` | Yes | Schema version for lazy migration |

**Creation:** Auto-created by `AuthProvider` on first sign-in via `syncUserProfile()`.
**Deletion:** Hard-delete is disabled in security rules. Use `deletedAt` field for soft-delete.

---

## `teams` collection

**Path:** `/teams/{teamId}`
**Access:** Members read; any signed-in user creates a team they own; only the owner updates, and only to add members. Never deleted.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Team name, 1–60 characters. Immutable after creation. |
| `ownerId` | `string` | Yes | UID of the creator. Immutable. |
| `memberIds` | `string[]` | Yes | UIDs allowed to read/write the team's logs. Starts as `[ownerId]`; add-only; max 50. |
| `createdAt` | `Timestamp` | Yes | Must equal the server time on create. |
| `updatedAt` | `Timestamp` | Yes | Must equal the server time on every write. |
| `_schemaVersion` | `1` | Yes | Schema version for lazy migration |

**Why an array:** the rules need one cheap lookup (`uid in memberIds`) and the app needs one query (`where('memberIds', 'array-contains', uid)`).

---

## `aiLogs` collection

**Path:** `/teams/{teamId}/aiLogs/{logId}` (a subcollection of the team)
**Access:** Team members read logs; members create logs as themselves; only the author edits or soft-deletes. Hard-delete is disabled.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | Author — must equal the signed-in UID. Immutable. |
| `phase` | `'requirements' \| 'design' \| 'build' \| 'test' \| 'deploy'` | Yes | SDLC phase |
| `taskSummary` | `string` | Yes | 1–280 characters |
| `outcome` | `'accepted' \| 'edited' \| 'rejected'` | Yes | What happened to the AI output |
| `minutesSaved` | `number` | Yes | Whole number, 0–480 |
| `createdAt` | `Timestamp` | Yes | Must equal the server time on create. Immutable. |
| `updatedAt` | `Timestamp` | Yes | Must equal the server time on every write. |
| `deletedAt` | `Timestamp \| null` | Yes | `null` while live; set to the server time to soft-delete. |
| `_schemaVersion` | `1` | Yes | Schema version for lazy migration |

**Why a subcollection:** the team ID comes from the path, so the rules can check membership with `isTeamMember(teamId)` for list queries as well as single reads. The team a log belongs to cannot be changed.
**Soft-deleted logs:** hidden by the app, not by the rules. `useTeamLogs` queries with `where('deletedAt', '==', null)`. A `deletedAt == null` condition in the read rule made Firestore reject every list query, so team members can still read soft-deleted logs directly.
**Queries:** lists are sorted in the browser, so no composite index is needed.
**Writes:** made with the client SDK from the browser so the rules validate them — see `frontend/src/features/ai-log/lib/mutations.ts`.

---

<!-- Add new collection schemas below using the /firebase-collection skill -->
