# AI Contribution Log — Feature Specification

Status of this document: **as built** on branch `feature/ai-contribution-log` (not yet merged).
It is written from the code and the live rules test, not from the original plan. Section 9 lists where
the build differs from the draft plan, so you can confirm each point.

---

## 1. What the feature is for

**Problem.** NBN teams have been taught to use AI across the software development lifecycle (SDLC), but
there is no lightweight way to record *how* AI is used. Nobody can say which phases AI helps, where its
output is usually rejected, or how much time it really saves.

**Persona.**
- *Developer* — logs an AI-assisted task in about thirty seconds.
- *Delivery lead / team owner* — creates the team, adds members, and reads the per-phase summary.

**What it does.** A developer records each AI-assisted task: SDLC phase, what it was used for, whether the
output was **accepted / edited / rejected**, and roughly how many **minutes it saved**. A team dashboard
shows, per phase: how many tasks were logged, the acceptance rate, and total minutes saved.

**Client link.** Supports the team project "SDLC with AI" for NBN Co by producing the evidence an
AI-assisted lifecycle needs to justify itself. *(A real client data point still has to be added to the
Rationale in the submission document — see Section 10.)*

---

## 2. Screens and what the user sees

| Screen | URL | Contents |
|---|---|---|
| Teams list | `/teams` (sidebar: **AI Log**) | "Create team" form; list of the user's teams (name, member count); each opens its dashboard |
| Team dashboard | `/teams/{teamId}` | Team name and member count; **Add log** button; owner-only **Add member** form; per-phase summary table; newest-first log list |
| Add-log form | inline on the dashboard | Phase (dropdown), Minutes saved (number), "What did you use AI for?" (text), outcome (3 radio buttons: Accepted / Edited / Rejected) |
| Profile | `/profile` | Shows the user's **User ID** with a Copy button, so a team owner can add them |

Every screen that loads data has four states:

| State | Teams list | Team dashboard | Add-log form |
|---|---|---|---|
| Empty | "No teams yet" + prompt to create one | "No logs yet" + prompt to log the first task (summary table still shown, all phases at 0) | Blank form, phase and outcome unselected |
| Loading | Skeleton rows | Skeleton blocks | Save button shows "Saving…" and is disabled |
| Error | Red banner with **Retry** | Red banner with **Retry**; non-members see "You do not have access to this team." with a link back | Field errors under each input; a red banner for a failed save, with the typed values kept |
| Success | List of teams | Summary table + log list | Form closes, toast "Log saved", list and summary update live |

---

## 3. Use cases

### UC1 — Log an AI-assisted task (main use case)

| | |
|---|---|
| **Actor** | Team member (developer) |
| **Trigger** | The member finishes a task where they used AI and wants to record how it went |
| **Preconditions** | Signed in with a verified email; belongs to the team; the team exists |

**Main flow**
1. The member opens the team dashboard.
2. The member selects **Add log**.
3. The system shows the log form.
4. The member chooses a phase, writes a short summary, chooses an outcome and enters minutes saved.
5. The member submits.
6. The system validates the entry.
7. The system saves it with the member's ID and a server timestamp.
8. The system updates the log list and the per-phase summary.
9. The system shows a "Log saved" confirmation and closes the form.

**Alternate / error flows**
- **A1 — invalid input (step 6).** A field is invalid (no phase or outcome, empty or over-long summary,
  minutes not a whole number from 0 to 480). The system shows an inline error on that field and saves nothing.
- **A2 — no access (step 7).** The member is not in the team. The save is rejected and the system shows
  "You do not have access to this team."
- **A3 — save fails (step 7).** A service error occurs. The system shows an error banner and keeps the
  entered values so the member can retry.
- **A4 — no logs yet (step 1).** The dashboard shows an empty state prompting the first entry.

**Postcondition.** A new log exists under the team, authored by the member, visible to every team member.

### UC2 — Create a team and add a member

| | |
|---|---|
| **Actor** | Any signed-in user (becomes the team **owner**); a teammate who gives the owner their User ID |
| **Trigger** | A delivery lead wants their team to start logging |
| **Preconditions** | Signed in; the teammate has copied their User ID from `/profile` and sent it to the owner |

**Main flow:** the owner opens `/teams` → enters a team name → creates the team (owner is its only member)
→ opens the team dashboard → pastes the teammate's User ID into **Add member** → the teammate now sees the
team in their list.

**Alternate flows:** empty or over-long name → inline error, nothing saved. A non-owner never sees the
Add-member form, and the rules reject the write even if they call it directly.

### UC3 — Review AI contribution (delivery lead)

**Trigger:** the lead wants to know how AI is performing. They open the dashboard and read the per-phase
table (tasks logged, acceptance rate, minutes saved) before scrolling to individual entries.

### UC4 — Delete my own log

A member deletes one of their own logs (two-step: **Delete** → **Confirm delete**). The log disappears from
the list and the summary. It is a *soft delete*: the document stays in Firestore with `deletedAt` set.

---

## 4. Functional specification

**Inputs**
- Team: name (1–60 characters).
- Member: a user ID (text).
- Log: phase (`requirements | design | build | test | deploy`), task summary (1–280 characters),
  outcome (`accepted | edited | rejected`), minutes saved (whole number 0–480).

**Outputs**
- Saved team and log documents.
- Per-phase summary: **tasks logged**, **acceptance rate** = accepted ÷ all logs in that phase (an *edited*
  log does **not** count as accepted), shown as a rounded percentage, or "—" when the phase has no logs;
  **total minutes saved**. One row per phase, always in SDLC order.
- Log list, newest first, each showing phase, outcome, minutes, summary, author ("You" or "Member xxxxxx",
  the first 6 characters of their ID — names are not available) and date.

**Data touched** (full schema in `docs/FIRESTORE-SCHEMA.md`)

| Collection | Path | Access |
|---|---|---|
| `teams` | `/teams/{teamId}` | Members read. Any signed-in user creates a team they own with `memberIds = [themselves]`. Only the owner updates it, and only to **add** members (max 50). Name and owner never change. Never deleted. |
| `aiLogs` | `/teams/{teamId}/aiLogs/{logId}` | Team members read and create. Only the author edits or soft-deletes their own log. Hard delete is denied. |
| `users` | `/users/{uid}` | Existing boilerplate collection; the app only reads the user's own UID from Firebase Auth. |

Every document carries `_schemaVersion: 1`, `createdAt` and `updatedAt` (both set by the **server**).
Logs also carry `deletedAt` (`null` while live).

**Where the logic lives**
- *Server-side logic:* Firestore security rules (`firebase/firestore.rules`) validate every write — allowed
  values, ranges, author = signed-in user, server timestamps, membership via `get()` on the team, owner-only
  member adds. Writes are made with the **client SDK** on purpose, because the Admin SDK would bypass the rules.
- *Client side:* Zod forms give friendly errors (same limits as the rules); the per-phase summary is
  computed in the browser from the team's logs.

**Out of scope**
- Editing a log in the UI (the rules allow it; there is no screen).
- Removing members, renaming or deleting a team.
- Invitations by email or link (members are added by pasting a User ID).
- Charts, export, notifications, pagination.
- Analysing the content of task summaries.
- Cloud Functions (the free plan can't run them; the rules do the server-side work).

---

## 5. Acceptance criteria

Each is testable and traces to the use cases. **Verified** shows how far I have actually checked it.

| ID | The system shall… | Use case | Verified |
|---|---|---|---|
| AC1 | allow a signed-in team member to create a log with a phase, task summary, outcome and minutes saved. | UC1 | Rules test L1 ✔ live |
| AC2 | reject any log whose phase is not one of requirements, design, build, test or deploy, or whose outcome is not accepted, edited or rejected. | UC1-A1 | Rules L2, L3 ✔ · form: unit tests ✔ |
| AC3 | reject any log where minutes saved is not a whole number from 0 to 480. | UC1-A1 | Rules L4, L5, L6 (500, −5, 12.5) ✔, L13 (480 accepted) ✔ · form: unit tests ✔ |
| AC4 | reject a task summary that is empty or longer than 280 characters. | UC1-A1 | Rules L7, L8 ✔ · form: unit tests ✔ |
| AC5 | store the signed-in user's ID as the author and a server-generated timestamp on every new log, and reject logs that claim a different author or a client-chosen timestamp. | UC1 | Rules L9, L12 ✔ |
| AC6 | show a team's logs only to members of that team. | UC1-A2 | Rules L14, R2, R4, T6 ✔ (outsider denied; UI no-access message not clicked through) |
| AC7 | prevent a user from editing or deleting a log they did not author, and deny hard deletes. | UC4 | Rules E1, E2, E6 ✔ |
| AC8 | display, for each phase, the number of logs, the acceptance rate and the total minutes saved, calculated from the team's live logs. | UC3 | Calculation: unit tests ✔ · live list queries R1/E8 return correct rows ✔ · table in a browser: **not yet seen** |
| AC9 | show an empty state when a team has no logs, a loading state while data is fetched, and an error state with a retry option when a request fails. | all | Implemented · **not yet exercised in a browser** |
| AC10 | allow only a team's owner to add members to that team, and never remove one. | UC2 | Rules T9, T11, T12 ✔ |
| AC11 | redirect unauthenticated users to sign in before showing any team data. | all | Boilerplate `requireAuth()` on both pages · rules deny unauthenticated reads (T7, E10 ✔) · redirect itself **not tested** |
| AC12 | let an author soft-delete their own log so that it disappears from the list and the summary. | UC4 | Rules E7, E8 ✔ (log gone from live list) · button **not yet clicked** |
| AC13 | create each team with its creator as owner and sole member, with a name of 1–60 characters. | UC2 | Rules T1–T5 ✔ |

---

## 6. Test plan (Section 7 of the submission)

| Test | Steps | Expected | Traces to |
|---|---|---|---|
| TC1 Happy path | Sign in as a member, open the dashboard, add a valid log | Log saves, appears with the correct author, summary updates | AC1, AC5, AC8 |
| TC2 Invalid minutes | Submit 500, then −5, then 12.5 | Each rejected with an inline error, nothing saved | AC3 |
| TC3 Invalid phase | Write a log with a phase outside the list (rules / tampered request) | Write denied by the rules | AC2 |
| TC4 Non-member | Sign in as a user not in the team; open its URL | Access denied; UI shows the no-access message | AC6 |
| TC5 Edit another's log | As a member, try to edit or delete a log someone else wrote | Write denied by the rules | AC7 |
| TC6 Empty and error states | Open a new team with no logs; force a failed request | Empty state, then an error banner with Retry | AC9 |

The rules half of TC2–TC5 has been run live (49 automated checks, all as expected). **The on-screen half and
screenshots for the submission still need to be captured by you in the running app.**

---

## 7. Architecture in one picture

```
Browser (Next.js on Vercel)
   │  sign in / out
   ▼
Firebase Authentication ── ID token ──► Browser
   │  reads & writes via the client SDK (token attached)
   ▼
Firestore security rules ◄─ checks auth, field validation, team membership
   │  allow / deny every request
   ▼
Firestore: teams/{teamId}   and   teams/{teamId}/aiLogs/{logId}

GitHub: feature branch → PR → merge to main
   ├─ GitHub Actions CI: lint, typecheck, tests, audit
   ├─ GitHub Actions deploy.yml: deploys Firestore rules on merge
   └─ Vercel: deploys the frontend on merge
```

---

## 8. Known limitations (for Section 8 of the submission)

- The per-phase summary is computed in the browser, so it would not scale to thousands of logs (no backend
  aggregation on the free plan, no pagination).
- Members are added by pasting a User ID; the rules don't check the ID belongs to a real user, and an owner
  cannot remove members.
- Soft-deleted logs are hidden by the app's query filter, **not** by the rules — team members can still read
  them by direct read or an unfiltered query. (Putting that condition in the read rule made Firestore reject
  every list query.)
- "Minutes saved" is self-reported and therefore subjective.
- If the browser is offline, Firestore queues a save instead of failing, so the save-error banner appears for
  rejected or denied writes, not for a lost connection.
- Users must have a verified email (boilerplate behaviour).

---

## 9. Where the build differs from the draft plan (please confirm)

| Draft plan | As built | Why |
|---|---|---|
| `aiLogs` as a top-level collection with a `teamId` field | Subcollection `teams/{teamId}/aiLogs` | Membership is checked from the path; the team of a log can't change |
| Hard delete of logs (`allow delete` by author) | **Soft delete** (`deletedAt`); `delete` always denied | Follows boilerplate convention |
| Rule hid deleted logs from reads | Hidden by the **query filter** only | Rule version broke every list query |
| Summary shows zeros when empty | Counts show 0; acceptance rate shows "—" | A 0% rate on no data would be misleading |
| Edit a log | **Rules allow it; no UI** | Cut for scope; delete exists |
| Fields: no `_schemaVersion` / `updatedAt` | Added to both collections | Boilerplate convention |
| Member removal implied in use-case A2 | Membership is **add-only** | A2 reworded to "user is not a member" |
| Aggregation in browser | Unchanged | No backend on the free plan |

---

## 10. Still to do before submission

- Add one real client data point to the Rationale (the draft's own "honest gap").
- Capture screenshots / a short recording for every test case, marked pass/fail.
- Click through the running app once: create team, add log, delete log, copy User ID, empty/error states.
- Connect GitHub secrets and Vercel so the pipeline runs; capture the green run and the live URL.
- Confirm with your tutor that a non-fork public repo satisfies "create a new fork".
- Draw the wireframes and diagrams for the document from the final build.
