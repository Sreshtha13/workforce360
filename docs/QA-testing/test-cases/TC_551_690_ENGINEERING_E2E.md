# Test Cases TC-551 to TC-690 — Detailed Executable Cases

**Scope:** Project Management (sprints, time, team, budget), Engineering, Documents, Helpdesk, Notifications, Reports, Storage, Cross-cutting UI/security, End-to-end journeys  
**Base URLs:** Web `http://localhost:3000` · API `http://localhost:4000`  
**Auth:** Login via UI or `POST /api/auth/login` (httpOnly cookies)  
**Response envelope:** `{ data, error, meta }`  
**Seed users:** `admin@workforce360.com` / `Admin@123` · `hr@workforce360.com` / `Hr@123456` · `finance@workforce360.com` / `Finance@123` · `payroll@workforce360.com` / `Payroll@123`  

> There is **no dedicated PM / Developer / QA seed user**. For PM and Engineering cases, use Super Admin **or** create a user and assign `pm.*` / `engineering.*` permissions first.

---

## Shared setup (reuse across this file)

**PM fixture (create once, reuse):**
1. Login as admin.
2. `POST /api/pm/projects` — `{ "name": "QA Phoenix", "code": "QA-PHX", "status": "ACTIVE" }` → save `projectId`.
3. `POST /api/pm/sprints` — `{ "projectId": "<projectId>", "name": "Sprint 1", "status": "PLANNING", "startDate": "<ISO>", "endDate": "<ISO + 14d>" }` → save `sprintId`.
4. `POST /api/pm/tasks` — `{ "projectId": "<projectId>", "sprintId": "<sprintId>", "title": "Implement login", "status": "TODO", "priority": "HIGH" }` → save `taskId`.

**Engineering fixture:**
1. Same `projectId`.
2. `POST /api/engineering/releases` — `{ "projectId": "<projectId>", "version": "1.0.0", "name": "Phoenix GA", "type": "MINOR" }` → save `releaseId`.

**Confirmed enums (from code):**
- Task status: `TODO` | `IN_PROGRESS` | `IN_REVIEW` | `DONE` | `CANCELLED`
- Sprint status: `PLANNING` | `ACTIVE` | `COMPLETED` | `CANCELLED`
- Release status (API schema): `PLANNING` | `IN_PROGRESS` | `TESTING` | `STAGING` | `RELEASED` | `ROLLED_BACK`
- Test case status: `DRAFT` | `READY` | `PASSED` | `FAILED` | `BLOCKED` | `SKIPPED`
- Storage purpose (Zod): `RESUME` | `POLICY` | `OFFER_LETTER` | `DOCUMENT` | `OTHER`

---

## TC-551 — Task status workflow TODO → DONE

**Module:** Project Management  
**Feature:** Tasks, Sprints, Kanban  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Admin (or user with `pm.task.update`) is logged in.
- PM fixture exists: project, sprint, task in `TODO`.

**Test Data:**
- Task title: `Implement login`
- Status path: `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`

**Steps to Execute:**
1. Open `http://localhost:3000/pm/projects/<projectId>/board`.
2. Confirm the task card is in the **To Do** column.
3. Drag the card to **In Progress** (or open the task and PATCH status).
4. Drag to **In Review**.
5. Drag to **Done**.
6. `GET /api/pm/tasks/<taskId>` and inspect `status`.
7. Attempt `PATCH /api/pm/tasks/<taskId>` with `{ "status": "NOT_A_STATUS" }`.

**Expected Result:**
1. Kanban loads with columns To Do, In Progress, In Review, Done.
2. Card starts in To Do.
3. Card moves; API `PATCH /api/pm/tasks/:id` returns 200; `status` is `IN_PROGRESS`.
4. Status is `IN_REVIEW`.
5. Status is `DONE`.
6. GET returns `status: "DONE"`.
7. HTTP 400 `VALIDATION_ERROR` (enum only allows the five statuses).

**Postconditions:** Task remains `DONE`.

**Notes / Dependencies:** Confirmed from `updateTaskSchema` and `apps/web/app/(dashboard)/pm/projects/[id]/board/page.tsx`. There is **no BACKLOG** status in this codebase.

---

## TC-552 — Sprint start changes status to ACTIVE

**Module:** Project Management  
**Feature:** Tasks, Sprints, Kanban  
**Scenario Type:** Positive / API / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Sprint exists with `status: PLANNING`.
- User has `pm.sprint.update`.

**Test Data:**
- `PATCH /api/pm/sprints/<sprintId>` body: `{ "status": "ACTIVE" }`

**Steps to Execute:**
1. Open `/pm/projects/<projectId>/sprints` (or sprint detail `/pm/sprints/<sprintId>`).
2. Start the sprint (UI control) **or** send the PATCH above.
3. Reload sprint via `GET /api/pm/sprints/<sprintId>`.
4. PATCH with `{ "status": "ACTIVE", "startDate": "not-a-date" }`.

**Expected Result:**
1. Sprint listed as Planning.
2. HTTP 200; sprint `status` is `ACTIVE`.
3. GET matches ACTIVE.
4. HTTP 400 if startDate is not ISO datetime (`z.string().datetime()`).

**Postconditions:** Sprint is ACTIVE.

**Notes / Dependencies:** Confirmed `updateSprintSchema`. Service does not extra-validate date order; if UI allows endDate before startDate, record as a product gap.

---

## TC-553 — Sprint complete

**Module:** Project Management  
**Feature:** Tasks, Sprints, Kanban  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Sprint is `ACTIVE`.
- User has `pm.sprint.update`.

**Test Data:**
- `{ "status": "COMPLETED", "completedAt": "<now ISO>" }`

**Steps to Execute:**
1. `PATCH /api/pm/sprints/<sprintId>` with COMPLETED (and optional `completedAt`).
2. Open sprint detail UI.
3. Confirm board/sprint badge shows Completed.

**Expected Result:**
1. HTTP 200; `status` is `COMPLETED`.
2. UI shows completed state; start/complete actions disabled as implemented.
3. Sprint no longer appears as the active sprint on the project board (verify actual UI filter).

**Postconditions:** Sprint COMPLETED.

**Notes / Dependencies:** Completing a sprint is a status PATCH only — **no automatic move of open tasks** is implemented in `pm.service.ts`. See TC-554.

---

## TC-554 — Incomplete tasks remain after sprint complete

**Module:** Project Management  
**Feature:** Tasks, Sprints, Kanban  
**Scenario Type:** Edge  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Sprint ACTIVE with at least one task still `TODO` or `IN_PROGRESS`.
- User has `pm.sprint.update` and `pm.task.read`.

**Test Data:**
- Open task id: `<openTaskId>` still linked to `sprintId`

**Steps to Execute:**
1. Note `sprintId` on the open task (`GET /api/pm/tasks/<openTaskId>`).
2. Complete the sprint (`PATCH` status `COMPLETED`).
3. GET the same task again.
4. Open project backlog `/pm/projects/<projectId>/backlog` and the completed sprint board `/pm/sprints/<sprintId>`.

**Expected Result:**
1. Task still has `sprintId` before complete.
2. Sprint completes successfully.
3. **Confirmed from code:** task `sprintId` is **not** cleared automatically. Task still belongs to the completed sprint unless a tester/product rule says otherwise.
4. Document actual UI: task may still show on the completed sprint board and **not** auto-return to backlog.

**Postconditions:** Open task still has original `sprintId` unless UI/service was changed.

**Notes / Dependencies:** If product expects auto-move to backlog, this is a **gap**. Do not fail the test as a bug unless a written requirement exists.

---

## TC-555 — Kanban board empty state

**Module:** Project Management  
**Feature:** Tasks, Sprints, Kanban  
**Scenario Type:** UI / Edge  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Project exists with **zero** tasks (create a new empty project).
- User has `pm.task.read`.

**Test Data:**
- New project name: `Empty Board Project`

**Steps to Execute:**
1. Create project via `/pm/projects`.
2. Open `/pm/projects/<newProjectId>/board`.
3. Observe each column.

**Expected Result:**
1. Project created.
2. Board page loads without error (not a crash / ErrorState).
3. Empty columns render (empty drop zones). No uncaught exception. If an EmptyState component is shown, it is readable.

**Postconditions:** Empty project can be deleted or left in DB.

**Notes / Dependencies:** Confirmed `KanbanBoard` is used on the board page.

---

## TC-556 — Task link to release

**Module:** Project Management  
**Feature:** Tasks, Sprints, Kanban  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Task and engineering release exist on the **same** project.
- User has `pm.task.update` and `engineering.release.read`.

**Test Data:**
- `PATCH /api/pm/tasks/<taskId>` `{ "releaseId": "<releaseId>" }`  
  **If `releaseId` is not on `updateTaskSchema`, use the field the UI actually sends** (inspect network tab on task detail).

**Steps to Execute:**
1. Open `/pm/tasks/<taskId>` or `/engineering/releases/<releaseId>`.
2. Link the task to the release (UI) or PATCH as above.
3. `GET /api/engineering/releases/<releaseId>` and look for `tasks` include.
4. `GET /api/pm/tasks/<taskId>` and confirm the link field.

**Expected Result:**
1. Task detail loads.
2. HTTP 200 on update.
3. Release payload includes the linked task (schema `Release.tasks` on frontend types).
4. Task shows `releaseId`.

**Postconditions:** Task remains linked.

**Notes / Dependencies:** Prisma `Task.releaseId` exists. `updateTaskSchema` in `pm.schema.ts` as read during analysis lists milestone/sprint but **verify whether `releaseId` is accepted** — if PATCH ignores `releaseId`, file a gap and use DB/UI path that works.

---

## TC-557 — Log time entry on task

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / API / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Task exists.
- User has `pm.time.create`.
- Logged-in user id is known (`GET /api/auth/me`).

**Test Data:**
```json
{
  "taskId": "<taskId>",
  "userId": "<currentUserId>",
  "hours": 2.5,
  "date": "<today ISO datetime>",
  "description": "Implemented login form"
}
```

**Steps to Execute:**
1. Open `/pm/tasks/<taskId>` Time tracking section.
2. Enter 2.5 hours for today with description; save.
3. Confirm network call `POST /api/pm/time-entries`.
4. `GET /api/pm/time-entries?taskId=<taskId>`.

**Expected Result:**
1. Time tracking UI visible.
2. HTTP 201; `data.hours` is 2.5; `data.taskId` matches.
3. POST used, not a missing route.
4. New entry appears in the list.

**Postconditions:** Time entry id saved as `timeEntryId`.

**Notes / Dependencies:** Confirmed `createTimeEntrySchema`: `hours` must be `z.number().positive()`; `date` must be ISO datetime. `userId` is **required** by schema.

---

## TC-558 — Update time entry

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- `timeEntryId` from TC-557 exists.
- User has `pm.time.update`.

**Test Data:**
- `{ "hours": 3, "description": "Adjusted after review" }`

**Steps to Execute:**
1. `PATCH /api/pm/time-entries/<timeEntryId>` with the body above.
2. GET list filtered by `taskId`.
3. Refresh task detail UI.

**Expected Result:**
1. HTTP 200; hours is 3; description updated.
2. List shows updated values.
3. UI matches API.

**Postconditions:** Entry hours = 3.

**Notes / Dependencies:** There is **no DELETE** time-entry route in `pm.routes.ts`.

---

## TC-559 — Time entry hours validation (negative)

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Validation / Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Valid `taskId` and `userId`.
- User has `pm.time.create`.

**Test Data:**
- Same as TC-557 but `"hours": -1`

**Steps to Execute:**
1. `POST /api/pm/time-entries` with `hours: -1`.
2. Repeat with `hours: 0`.
3. Repeat with `hours` omitted.

**Expected Result:**
1. HTTP 400 `VALIDATION_ERROR` (`z.number().positive()` rejects negatives).
2. HTTP 400 (0 is not positive).
3. HTTP 400 (required field).

**Postconditions:** No new time entry created.

**Notes / Dependencies:** Confirmed `createTimeEntrySchema`.

---

## TC-560 — Time entry hours boundary 24

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Boundary  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- User has `pm.time.create`.
- Valid task.

**Test Data:**
- `hours: 24`
- `hours: 24.01` (optional extra)
- `hours: 0.01` (minimum positive)

**Steps to Execute:**
1. POST time entry with `hours: 24`.
2. POST with `hours: 0.01`.
3. If UI has a max, try 25 from the UI.

**Expected Result:**
1. HTTP 201 — **schema has no max**; 24 is accepted.
2. HTTP 201 — smallest positive value accepted.
3. Document UI vs API: API will accept 25 unless a service rule exists (none found). If product wants max 24, this is a **gap**.

**Postconditions:** Boundary entries exist; delete/ignore in cleanup.

**Notes / Dependencies:** Inferred max-24 is a business expectation, **not** enforced in Zod.

---

## TC-561 — List time entries by project / task

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- At least two time entries on different tasks.
- User has `pm.time.read`.

**Test Data:**
- `GET /api/pm/time-entries?taskId=<taskId>`
- `GET /api/pm/time-entries?userId=<userId>`
- `GET /api/pm/time-entries?startDate=<ISO>&endDate=<ISO>`

**Steps to Execute:**
1. Call list with `taskId`.
2. Call list with `userId`.
3. Call list with a date range that includes today.
4. Call list with a date range in the past that excludes today.

**Expected Result:**
1. Only entries for that task.
2. Only entries for that user.
3. Today's entries included.
4. Today's entries excluded.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `listTimeEntriesQuerySchema` — filter is `taskId` / `userId` / dates, **not** `projectId`. If the compact case expected `?projectId=`, use task filter or join via UI instead.

---

## TC-562 — Portal timesheet entry

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Employee (or admin) logged in.
- Portal nav item Timesheets is visible (`/portal/timesheets`).
- A PM project exists to optionally select.

**Test Data:**
- Date: today (`YYYY-MM-DD`)
- Hours: `8`
- Description: `Sprint work`
- Billable: checked

**Steps to Execute:**
1. Open `/portal/timesheets`.
2. Click **Log Time**.
3. Fill date, hours, description, project, billable; submit.
4. Observe the week list and total hours.
5. In DevTools, note the API path.

**Expected Result:**
1. Page title “Timesheets” loads.
2. Sheet/modal opens.
3. **Confirmed frontend** calls `POST /api/timesheets` via `apiClient.timesheets.create`.
4. If the API route exists: entry appears and week total increases.  
   **Confirmed gap:** no `/api/timesheets` router was found in `apps/api`. Expect **404** or empty list until that API is implemented. Log as blocked/defect, not as a silent pass.
5. Path is `/api/timesheets`, **not** `/api/pm/time-entries`.

**Postconditions:** If create succeeded, timesheet row exists; if 404, none.

**Notes / Dependencies:** UI confirmed `apps/web/app/(dashboard)/portal/timesheets/page.tsx`. Treat backend 404 as a **known integration gap**.

---

## TC-563 — Team allocation create

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Project exists.
- Target user exists (use HR user id).
- Actor has `pm.team.create`.

**Test Data:**
```json
{
  "projectId": "<projectId>",
  "userId": "<hrUserId>",
  "role": "Developer",
  "allocatedHours": 40
}
```

**Steps to Execute:**
1. Open `/pm/projects/<projectId>/team`.
2. Add member: select user, role, hours; save.
3. Confirm `POST /api/pm/team-allocations`.
4. `GET /api/pm/team-allocations?projectId=<projectId>`.

**Expected Result:**
1. Team page loads.
2. HTTP 201; allocation has `role` and `allocatedHours`.
3. POST used.
4. Member appears once in the list.

**Postconditions:** Save `allocationId`.

**Notes / Dependencies:** Confirmed `allocateTeamMemberSchema`. Unique `(projectId, userId)` on `ProjectTeamAllocation`.

---

## TC-564 — Duplicate team allocation rejected

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- TC-563 allocation exists for `(projectId, hrUserId)`.
- User has `pm.team.create`.

**Test Data:**
- Same body as TC-563.

**Steps to Execute:**
1. `POST /api/pm/team-allocations` with the same projectId + userId.
2. Inspect status and error code.
3. Refresh team UI — still a single row.

**Expected Result:**
1. Request fails (HTTP 409 preferred, or 400 `OPERATION_FAILED` if mapped from Prisma P2002).
2. Error envelope `{ data: null, error: { code, message } }` — no stack trace.
3. Only one allocation row.

**Postconditions:** Still one allocation.

**Notes / Dependencies:** Confirmed `@@unique([projectId, userId])`.

---

## TC-565 — Update team allocation hours

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- `allocationId` exists.
- User has `pm.team.update`.

**Test Data:**
- `{ "allocatedHours": 20, "role": "Tech Lead" }`

**Steps to Execute:**
1. `PATCH /api/pm/team-allocations/<allocationId>` with the body.
2. GET list for the project.
3. Confirm UI on `/pm/projects/<id>/team`.

**Expected Result:**
1. HTTP 200; hours 20; role Tech Lead.
2. List matches.
3. UI matches.

**Postconditions:** Allocation updated.

**Notes / Dependencies:** `allocatedHours` must remain positive if sent (`z.number().positive().nullable()`).

---

## TC-566 — Budget entry create

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Project exists.
- User has `pm.budget.create`.

**Test Data:**
```json
{
  "projectId": "<projectId>",
  "category": "Labor",
  "amount": 15000,
  "description": "Sprint 1 contractor cost",
  "date": "<ISO datetime>"
}
```

**Steps to Execute:**
1. Open `/pm/projects/<projectId>/budget`.
2. Add entry with category Labor, amount 15000, today's date.
3. Confirm `POST /api/pm/budget`.
4. `GET /api/pm/projects/<projectId>/budget`.

**Expected Result:**
1. Budget page loads.
2. HTTP 201; amount 15000; category Labor.
3. POST used.
4. Entry listed.

**Postconditions:** Save `budgetEntryId`.

**Notes / Dependencies:** Confirmed `createBudgetEntrySchema`. Category is free text `min(1)`. Amount is `z.number()` (**negative not rejected by Zod** — see TC-568).

---

## TC-567 — Budget tracking vs project budget

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / UI  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Project has `budget` set (e.g. PATCH project `{ "budget": 50000 }`).
- At least one budget entry exists (TC-566).

**Test Data:**
- Project budget: `50000`
- Logged spend: `15000`
- Expected remaining / variance: `35000`

**Steps to Execute:**
1. PATCH project budget to 50000 if not set (`pm.project.update`).
2. Open `/pm/projects/<projectId>/budget`.
3. Sum entries from `GET /api/pm/projects/<projectId>/budget`.
4. Compare UI variance (budget − sum of entries).

**Expected Result:**
1. Project.budget is 50000.
2. Page shows planned budget and logged amount.
3. API sum equals 15000 (plus any extra entries).
4. Variance displayed as 35000 (or equivalent). If UI does not show variance, record as UX gap — API still has both numbers.

**Postconditions:** None.

**Notes / Dependencies:** Confirm UI copy on the budget page; do not invent a chart if none exists.

---

## TC-568 — Budget amount negative rejected

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Validation / Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- User has `pm.budget.create`.

**Test Data:**
- Same as TC-566 with `"amount": -500`

**Steps to Execute:**
1. `POST /api/pm/budget` with amount `-500`.
2. Try amount `0`.

**Expected Result:**
1. **Zod currently allows any number** (`z.number()`). If HTTP 201, **log as requirement gap** (negative spend should likely be 400). If service rejects, HTTP 400 is the desired business result.
2. Document 0: allowed by schema; confirm product rule.

**Postconditions:** If created, note the row for cleanup.

**Notes / Dependencies:** Do not mark 201 as a test pass for “rejected” — mark **Fail vs intended rule** or **Blocked/Unclear**.

---

## TC-569 — PM reports page

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- User has `pm.project.read` or `report.read`.
- At least one project exists.

**Test Data:** None beyond fixture project.

**Steps to Execute:**
1. Open `/pm/reports`.
2. Wait for loading to finish.
3. Optionally call `GET /api/pm/projects/<projectId>/report`.

**Expected Result:**
1. Page loads (not 404). Nav item “PM Reports” visible for permitted roles.
2. Either project report widgets render **or** EmptyState/ErrorState with retry — no white screen.
3. HTTP 200 with progress metrics if the report endpoint is used.

**Postconditions:** None.

**Notes / Dependencies:** Nav href confirmed `/pm/reports`.

---

## TC-570 — Entity attachments on PM item

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Task exists.
- User can upload purpose `DOCUMENT` (needs `document.create` per storage RBAC — confirm `STORAGE_PURPOSE_PERMISSIONS`).
- User can `document.create` / `document.read`.

**Test Data:**
- File: `spec.pdf` (small PDF, &lt; 5 MB)
- Title: `Login spec`

**Steps to Execute:**
1. Open `/pm/tasks/<taskId>`.
2. In **Task attachments**, enter title, choose file, upload.
3. Confirm flow: `POST /api/storage/presign` → `PUT` uploadUrl → `POST /api/storage/confirm` → `POST /api/documents`.
4. Refresh; file appears in the list.

**Expected Result:**
1. `EntityAttachments` section visible.
2. Upload succeeds without console errors.
3. Network order matches `uploadFileViaPresign` + `documents.create`.
4. Document listed for this `entityId`.

**Postconditions:** Document linked to the task.

**Notes / Dependencies:** Confirmed `apps/web/components/pm/entity-attachments.tsx`.

---

## TC-571 — PM documents page

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- User has `document.read` or `pm.project.read`.

**Test Data:** None.

**Steps to Execute:**
1. From sidebar open **PM → Documents** (`/pm/documents`).
2. Confirm the shared documents UI (categories/list/upload if permitted).

**Expected Result:**
1. Page loads using `DocumentsPage` with PM context.
2. No crash. EmptyState if no docs; list if TC-570 created one.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `apps/web/app/(dashboard)/pm/documents/page.tsx`.

---

## TC-572 — Billable timesheet flag

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Portal timesheets page usable (see TC-562).
- If `/api/timesheets` is missing, **skip** and mark blocked.

**Test Data:**
- Entry A: billable `true`, 4 hours
- Entry B: billable `false`, 2 hours

**Steps to Execute:**
1. On `/portal/timesheets`, log 4h with Billable checked.
2. Log 2h with Billable unchecked.
3. Inspect list/API payload `billable`.

**Expected Result:**
1. Create succeeds; `billable: true`.
2. Create succeeds; `billable: false`.
3. UI reflects both (checkbox/badge). PM `time-entries` schema has **no** billable field — billable applies to **portal timesheets**, not `POST /api/pm/time-entries`.

**Postconditions:** Two portal entries if API exists.

**Notes / Dependencies:** Confirmed checkbox in portal timesheets page.

---

## TC-573 — Time entry date in the future

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Negative / Edge  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- User has `pm.time.create`.

**Test Data:**
- `date`: tomorrow 12:00Z ISO string
- `hours`: 1

**Steps to Execute:**
1. `POST /api/pm/time-entries` with tomorrow’s datetime.
2. Try the same from task time-tracking UI if date picker allows future dates.

**Expected Result:**
1. **Schema does not forbid future dates.** HTTP 201 means a product gap if future logging should be blocked. HTTP 400 means service-level validation exists (none found in schema).
2. Record actual UI (min date = today or not).

**Postconditions:** If created, keep id for cleanup.

**Notes / Dependencies:** Mark Pass only if behavior matches an agreed rule; otherwise **Unclear**.

---

## TC-574 — Remove team member allocation

**Module:** Project Management  
**Feature:** Time Entries & Budget  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- `allocationId` exists.
- User has `pm.team.update`.

**Test Data:**
- `{ "leftAt": "<now ISO>" }`

**Steps to Execute:**
1. Attempt `DELETE /api/pm/team-allocations/<allocationId>`.
2. `PATCH /api/pm/team-allocations/<allocationId>` with `leftAt` set.
3. GET allocations for the project.
4. Confirm team UI (member shown as left / hidden).

**Expected Result:**
1. **No DELETE route** in `pm.routes.ts` — expect 404. Do not treat as a product delete button unless UI uses PATCH.
2. HTTP 200; `leftAt` populated.
3. Record whether list still returns the row (likely yes; filter may be UI-only).
4. UI matches.

**Postconditions:** Allocation has `leftAt`.

**Notes / Dependencies:** Removal is **soft via `leftAt`**, not HTTP DELETE.

---

## TC-575 — Create engineering release

**Module:** Engineering  
**Feature:** Releases & Test Cases  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- PM project exists.
- User has `engineering.release.create`.

**Test Data:**
```json
{
  "projectId": "<projectId>",
  "version": "1.0.0",
  "name": "Phoenix GA",
  "type": "MINOR",
  "description": "First production release"
}
```

**Steps to Execute:**
1. Open `/engineering/releases`.
2. Create release with version 1.0.0, name Phoenix GA, type Minor, linked project.
3. Confirm `POST /api/engineering/releases`.
4. `GET /api/engineering/releases?projectId=<projectId>`.

**Expected Result:**
1. Releases list page loads.
2. HTTP 201; `status` defaults to planning-style status (`PLANNING`).
3. POST used.
4. New release listed.

**Postconditions:** Save `releaseId`.

**Notes / Dependencies:** Confirmed `createReleaseSchema`. Types: `MAJOR` | `MINOR` | `PATCH` | `HOTFIX`.

---

## TC-576 — Deploy release

**Module:** Engineering  
**Feature:** Releases & Test Cases  
**Scenario Type:** Positive / API / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Release exists.
- User has `engineering.release.deploy`.
- UI Deploy button is shown when `status === STAGING` (frontend `ReleaseStatus.STAGING`).

**Test Data:**
- `POST /api/engineering/releases/<releaseId>/deploy` (empty body)

**Steps to Execute:**
1. If needed, `PATCH /api/engineering/releases/<releaseId>` `{ "status": "STAGING" }` (`engineering.release.update`).
2. Open `/engineering/releases/<releaseId>` and click **Deploy** (or call POST deploy).
3. `GET /api/engineering/releases/<releaseId>`.

**Expected Result:**
1. Status STAGING so UI shows Deploy.
2. HTTP 200. Service sets `status: "RELEASED"`, `deployedAt` now, `deployedBy` = actor.
3. Detail shows Deployed timestamp and deployer name.

**Postconditions:** Release RELEASED.

**Notes / Dependencies:** Confirmed `engineering.service.ts` `deployRelease`. Frontend enum uses `RELEASED` / `STAGING`; if PATCH rejects `STAGING` because API enum differs (`IN_PROGRESS`/`TESTING`), document the **frontend/backend enum mismatch**.

---

## TC-577 — Rollback release

**Module:** Engineering  
**Feature:** Releases & Test Cases  
**Scenario Type:** Positive / API / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Release is `RELEASED` (TC-576).
- User has `engineering.release.deploy` (rollback uses the same permission).

**Test Data:**
- `POST /api/engineering/releases/<releaseId>/rollback`

**Steps to Execute:**
1. On release detail, click **Rollback** (visible when status is RELEASED).
2. Confirm POST rollback.
3. GET release.

**Expected Result:**
1. Rollback control enabled.
2. HTTP 200.
3. `status` is `ROLLED_BACK` (service) / UI may label `ROLLED_BACK`.

**Postconditions:** Release rolled back.

**Notes / Dependencies:** Confirmed `rollbackRelease` sets `ROLLED_BACK`. Frontend type also has `ROLLED_BACK`.

---

## TC-578 — Release version unique per project

**Module:** Engineering  
**Feature:** Releases & Test Cases  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Release version `1.0.0` exists for `projectId`.
- User has `engineering.release.create`.

**Test Data:**
- Same `projectId` + `version: "1.0.0"` + different name

**Steps to Execute:**
1. `POST /api/engineering/releases` with duplicate version.
2. Create version `1.0.1` on the same project (control).
3. Create `1.0.0` on a **different** project (if a second project exists).

**Expected Result:**
1. HTTP 409 (unique `projectId+version`) or mapped 400/409.
2. HTTP 201.
3. HTTP 201 — uniqueness is **per project**, not global.

**Postconditions:** Duplicate not inserted.

**Notes / Dependencies:** Confirmed Prisma `@@unique([projectId, version])`.

---

## TC-579 — Create test case linked to release

**Module:** Engineering  
**Feature:** Releases & Test Cases  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Project and release exist.
- User has `engineering.testcase.create`.

**Test Data:**
```json
{
  "projectId": "<projectId>",
  "releaseId": "<releaseId>",
  "title": "Login with valid credentials",
  "steps": "Open /login; enter admin; submit",
  "expectedResult": "Redirect to dashboard",
  "priority": "HIGH"
}
```

**Steps to Execute:**
1. Open `/engineering/test-cases`.
2. Create test case with the data above.
3. Confirm `POST /api/engineering/test-cases`.
4. GET `/api/engineering/test-cases?releaseId=<releaseId>`.

**Expected Result:**
1. List page loads.
2. HTTP 201; status defaults to `DRAFT`; `releaseId` set.
3. POST used.
4. Case appears in the filtered list.

**Postconditions:** Save `testCaseId`.

**Notes / Dependencies:** Confirmed `createTestCaseSchema`. Priority enum: LOW/MEDIUM/HIGH/CRITICAL (API `CRITICAL`, not `URGENT`).

---

## TC-580 — Execute test case

**Module:** Engineering  
**Feature:** Releases & Test Cases  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Test case exists (preferably `READY`).
- User has `engineering.testcase.execute`.

**Test Data:**
```json
{
  "status": "PASSED",
  "actualResult": "Dashboard loaded",
  "notes": "Chrome 128"
}
```

**Steps to Execute:**
1. If needed, PATCH test case `{ "status": "READY" }` (`engineering.testcase.create` is used for PATCH in routes).
2. `POST /api/engineering/test-cases/<testCaseId>/execute` with PASSED payload.
3. GET test case.
4. Repeat execute with `"status": "FAILED"` on a second case (optional).

**Expected Result:**
1. Case is READY or execute still accepted from DRAFT (record actual).
2. HTTP 200.
3. Status PASSED; executor/actual result stored if the service persists them.
4. FAILED path works with same permission.

**Postconditions:** Test case PASSED.

**Notes / Dependencies:** Confirmed execute route + `executeTestCaseSchema`.

---

## TC-581 — Test case detail page

**Module:** Engineering  
**Feature:** Releases & Test Cases  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- `testCaseId` exists.
- User has `engineering.testcase.read`.

**Test Data:** None.

**Steps to Execute:**
1. Open `/engineering/test-cases/<testCaseId>`.
2. Verify title, steps, expected result, status, assignee, release.
3. Open an invalid id `/engineering/test-cases/does-not-exist`.

**Expected Result:**
1. Detail page loads.
2. Fields match API GET.
3. ErrorState / not found — not a blank crash.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed route `apps/web/app/(dashboard)/engineering/test-cases/[id]/page.tsx`.

---

## TC-582 — Engineering dashboard my-sprint

**Module:** Engineering  
**Feature:** Releases & Test Cases  
**Scenario Type:** API / Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- User has `engineering.release.read`.
- Optional: user is assignee on sprint tasks.

**Test Data:**
- `GET /api/engineering/dashboard/my-sprint`
- Optional `?sprintId=<sprintId>`

**Steps to Execute:**
1. Open `/engineering/dashboard`.
2. Call GET my-sprint (with and without sprintId).
3. Compare widgets to API data.

**Expected Result:**
1. Dashboard loads.
2. HTTP 200; payload contains current/selected sprint tasks for the user (empty array is valid).
3. UI does not show another user’s tasks as “mine”.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed route `GET /dashboard/my-sprint`. Query schema `sprintDashboardQuerySchema`.

---

## TC-583 — Engineering without permission blocked

**Module:** Engineering  
**Feature:** Releases & Test Cases  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- Logged in as **HR** (`hr@workforce360.com`) who lacks `engineering.release.create`.
- A valid create-release body is ready.

**Test Data:**
- Same body as TC-575

**Steps to Execute:**
1. `POST /api/engineering/releases` as HR.
2. Navigate UI to `/engineering/releases`.
3. `GET /api/engineering/releases` as HR.

**Expected Result:**
1. HTTP 403 `FORBIDDEN`.
2. Nav item hidden **or** page gated by `RequirePermission`; no create form.
3. GET also 403 unless HR was granted `engineering.release.read` (seed HR should not have it).

**Postconditions:** No release created.

**Notes / Dependencies:** Confirmed `requirePermission("engineering.release.create")`.

---

## TC-584 — Release detail page

**Module:** Engineering  
**Feature:** Releases & Test Cases  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Release exists; optionally has linked test cases (TC-579).
- User has `engineering.release.read`.

**Test Data:** None.

**Steps to Execute:**
1. Open `/engineering/releases/<releaseId>`.
2. Verify name, version, status badge, type, deploy/rollback buttons per status.
3. Verify linked test cases / tasks if shown.

**Expected Result:**
1. Detail loads.
2. Deploy only when STAGING; Rollback when RELEASED (frontend).
3. Linked cases visible if API includes them.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed release detail page.

---

## TC-585 — Create documentation article

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** Positive / UI / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- User has `engineering.doc.create`.

**Test Data:**
```json
{
  "projectId": "<projectId>",
  "title": "API authentication notes",
  "category": "backend",
  "content": "JWT cookies, refresh rotation."
}
```

**Steps to Execute:**
1. Open `/engineering/docs`.
2. Create article with title and content.
3. Confirm `POST /api/engineering/docs`.
4. GET `/api/engineering/docs?search=authentication`.

**Expected Result:**
1. Docs list loads.
2. HTTP 201; unpublished by default (`isPublished` false unless set).
3. POST used.
4. Article found by search.

**Postconditions:** Save `engDocId`.

**Notes / Dependencies:** Confirmed `createDocSchema`. This is **engineering docs**, not the DMS module (`/api/documents`).

---

## TC-586 — Publish documentation

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- `engDocId` exists, unpublished.
- User has `engineering.doc.publish`.

**Test Data:**
- `POST /api/engineering/docs/<engDocId>/publish`

**Steps to Execute:**
1. Click Publish in UI or call POST publish.
2. GET the doc.
3. As a user with only `engineering.doc.read`, confirm it appears in the list.

**Expected Result:**
1. HTTP 200.
2. `isPublished` is true.
3. Published doc is visible to readers.

**Postconditions:** Doc published.

**Notes / Dependencies:** Confirmed publish route. PATCH can also set `isPublished` via `updateDocSchema` with `engineering.doc.create` — publish endpoint is the intended action.

---

## TC-587 — Create training course

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** Positive / UI / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- User has `engineering.training.create`.

**Test Data:**
```json
{
  "title": "Secure coding 101",
  "category": "security",
  "duration": 60,
  "isRequired": true,
  "content": "OWASP top 10 overview"
}
```

**Steps to Execute:**
1. Open `/engineering/training`.
2. Create course with duration 60, required = true.
3. Confirm `POST /api/engineering/training`.

**Expected Result:**
1. Training list loads.
2. HTTP 201; `isRequired` true; `duration` 60.
3. Course listed.

**Postconditions:** Save `trainingId`.

**Notes / Dependencies:** `duration` is `z.number().int().positive()` — 60 minutes.

---

## TC-588 — Enroll in training

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- `trainingId` exists.
- User has `engineering.training.enroll`.

**Test Data:**
- `{ "trainingId": "<trainingId>" }`

**Steps to Execute:**
1. `POST /api/engineering/training/enroll` with trainingId.
2. `GET /api/engineering/training/my-enrollments`.
3. Enroll again with the same trainingId.

**Expected Result:**
1. HTTP 201/200; enrollment status `NOT_STARTED` or `IN_PROGRESS` (schema uses `NOT_STARTED` | `IN_PROGRESS` | `COMPLETED` | `EXPIRED`).
2. Enrollment listed for current user.
3. Unique `(trainingId, userId)` — second enroll is 409, or returns existing enrollment. Record actual.

**Postconditions:** Save `enrollmentId`.

**Notes / Dependencies:** Confirmed enroll route. Prisma unique on training enrollment.

---

## TC-589 — Complete training with score

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** Positive / API / Boundary  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- `enrollmentId` exists.
- User has `engineering.training.enroll`.

**Test Data:**
- `{ "status": "COMPLETED", "score": 85, "completedAt": "<ISO>" }`
- Invalid score: `101` and `-1`

**Steps to Execute:**
1. `PATCH /api/engineering/training/enrollments/<enrollmentId>` with score 85 and COMPLETED.
2. GET my-enrollments.
3. PATCH score `101`.
4. PATCH score `-1`.

**Expected Result:**
1. HTTP 200; status COMPLETED; score 85.
2. List shows completed with score.
3. HTTP 400 (`score` max 100).
4. HTTP 400 (`score` min 0).

**Postconditions:** Enrollment completed at 85.

**Notes / Dependencies:** Confirmed `updateEnrollmentSchema` score 0–100. Status enum on API is `NOT_STARTED` (not `NOT_STARTED` vs compact `PENDING`).

---

## TC-590 — Create code review

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Project exists; optional task exists.
- User has `engineering.codereview.create`.

**Test Data:**
```json
{
  "projectId": "<projectId>",
  "taskId": "<taskId>",
  "title": "Review login API",
  "pullRequestUrl": "https://github.com/org/repo/pull/12",
  "reviewerId": "<adminUserId>"
}
```

**Steps to Execute:**
1. Open `/engineering/code-reviews`.
2. Create review with title and PR URL.
3. Confirm `POST /api/engineering/code-reviews`.

**Expected Result:**
1. List page loads.
2. HTTP 201; status pending-like string (service default — record exact, e.g. `PENDING` or `OPEN`).
3. Review listed.

**Postconditions:** Save `codeReviewId`.

**Notes / Dependencies:** `status` on create schema is not required; stored as string.

---

## TC-591 — Approve code review

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Code review exists, not yet approved.
- User has `engineering.codereview.approve`.

**Test Data:**
- `POST /api/engineering/code-reviews/<codeReviewId>/approve`

**Steps to Execute:**
1. Open `/engineering/code-reviews/<codeReviewId>`.
2. Click Approve or POST approve.
3. GET the review.

**Expected Result:**
1. Detail loads with Approve action.
2. HTTP 200.
3. Status is approved (`APPROVED` or service string). Record exact value.

**Postconditions:** Review approved.

**Notes / Dependencies:** Confirmed approve route.

---

## TC-592 — Request changes on code review

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- A **second** code review in pending state (do not reuse already APPROVED if service blocks it).
- User has `engineering.codereview.approve`.

**Test Data:**
```json
{ "reviewNotes": "Please add unit tests for MFA bypass." }
```

**Steps to Execute:**
1. `POST /api/engineering/code-reviews/<pendingReviewId>/request-changes` with notes.
2. GET the review.
3. POST request-changes with empty body `{}` (notes optional).

**Expected Result:**
1. HTTP 200.
2. Status reflects changes requested (e.g. `CHANGES_REQUESTED`); notes stored.
3. HTTP 200 (notes optional per `requestChangesSchema`).

**Postconditions:** Review in changes-requested state.

**Notes / Dependencies:** Confirmed `request-changes` route.

---

## TC-593 — Code review detail page

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- `codeReviewId` exists.
- User has `engineering.codereview.read`.

**Test Data:** None.

**Steps to Execute:**
1. Open `/engineering/code-reviews/<codeReviewId>`.
2. Verify PR link is clickable, status badge, reviewer, title.

**Expected Result:**
1. Detail loads.
2. PR URL renders as a link; status and reviewer visible.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `[id]` page.

---

## TC-594 — Training required flag on dashboard

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** Edge / UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Required training exists (`isRequired: true`) from TC-587.
- Current user may or may not be enrolled.

**Test Data:** None.

**Steps to Execute:**
1. Open `/engineering/dashboard` and `/engineering/training`.
2. Filter training with `GET /api/engineering/training?isRequired=true`.
3. Confirm required courses are visually marked.

**Expected Result:**
1. Pages load.
2. HTTP 200; required course included.
3. Required badge/filter visible. If dashboard does **not** highlight required training, record as UX gap — API filter still works.

**Postconditions:** None.

**Notes / Dependencies:** Query `isRequired` confirmed on `listTrainingQuerySchema`.

---

## TC-595 — Engineering team metrics API

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** API / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- User has `engineering.release.read`.

**Test Data:**
- `GET /api/engineering/dashboard/team-metrics`
- `GET /api/engineering/dashboard/team-metrics?projectId=<projectId>`
- `GET /api/engineering/dashboard/my-metrics`

**Steps to Execute:**
1. Call team-metrics without filter.
2. Call with projectId.
3. Call my-metrics.
4. Open dashboard and compare numbers (no crash if zeros).

**Expected Result:**
1. HTTP 200; JSON stats (counts/rates — record shape).
2. HTTP 200; scoped to project.
3. HTTP 200; current user metrics.
4. UI widgets match or show zeros.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed dashboard routes. Compact case name `team-metrics` matches API (not `team-metrics` vs `my-metrics` mix-up).

---

## TC-596 — Doc linked to project

**Module:** Engineering  
**Feature:** Docs, Training, Code Reviews  
**Scenario Type:** Positive / API  
**Priority:** Low  
**Severity:** Low  

**Preconditions:**
- User has `engineering.doc.create` and `engineering.doc.read`.

**Test Data:**
- Create doc with `projectId` set (TC-585).
- `GET /api/engineering/docs?projectId=<projectId>`

**Steps to Execute:**
1. Create a doc with projectId.
2. List docs filtered by projectId.
3. GET doc by id; confirm `projectId`.

**Expected Result:**
1. HTTP 201.
2. Only docs for that project (or including it).
3. Association persisted.

**Postconditions:** Doc linked.

**Notes / Dependencies:** `projectId` optional on `createDocSchema`.

---

## TC-597 — Create document category

**Module:** Documents  
**Feature:** Categories, Versions, Permissions  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- User has `document.manage`.

**Test Data:**
```json
{
  "name": "HR Policies",
  "code": "HR-POL",
  "description": "Company policy PDFs",
  "context": "EMPLOYEE"
}
```

**Steps to Execute:**
1. `POST /api/documents/categories` with the body.
2. `GET /api/documents/categories`.
3. POST again with the same `code`.

**Expected Result:**
1. HTTP 201; category created.
2. Category listed.
3. Duplicate code fails (409/400) if unique; otherwise record gap.

**Postconditions:** Save `categoryId`.

**Notes / Dependencies:** Context enum: `EMPLOYEE` | `CANDIDATE` | `PROJECT` | `GENERAL`. Confirmed `createDocumentCategorySchema`.

---

## TC-598 — Upload document with version

**Module:** Documents  
**Feature:** Categories, Versions, Permissions  
**Scenario Type:** Positive / E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- User has `document.create` and storage permission for `DOCUMENT`.
- Optional `categoryId` from TC-597.

**Test Data:**
- File: `handbook-v1.pdf`
- Title: `Employee Handbook`

**Steps to Execute:**
1. Open `/hr/documents` (or `/pm/documents`).
2. Upload file (presign → PUT → confirm).
3. Create document with returned `fileId` / `storage` id, title, category, context `GENERAL`.
4. `GET /api/documents/<documentId>`.

**Expected Result:**
1. Documents page loads.
2. Stored file created.
3. HTTP 201; document has version 1 (`versionNumber` 1).
4. GET shows current version and file metadata.

**Postconditions:** Save `documentId`.

**Notes / Dependencies:** Confirmed create requires `fileId`. Frontend `DocumentsPage` + `uploadFileViaPresign`.

---

## TC-599 — Add new document version

**Module:** Documents  
**Feature:** Categories, Versions, Permissions  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- `documentId` exists.
- User has `document.update`.
- A second file was uploaded via storage confirm → `fileId2`.

**Test Data:**
```json
{
  "fileId": "<fileId2>",
  "changeNotes": "Updated leave policy section"
}
```

**Steps to Execute:**
1. `POST /api/documents/<documentId>/versions` with fileId2.
2. GET document.
3. Confirm version list shows v1 and v2; current version is v2.

**Expected Result:**
1. HTTP 201/200.
2. `versionNumber` incremented (unique per document).
3. History contains both versions.

**Postconditions:** Current version is 2.

**Notes / Dependencies:** Confirmed `@@unique([documentId, versionNumber])`.

---

## TC-600 — Set document permissions ACL

**Module:** Documents  
**Feature:** Categories, Versions, Permissions  
**Scenario Type:** Positive / Security  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- `documentId` exists.
- User has `document.manage`.
- HR user id known.

**Test Data:**
```json
{
  "permissions": [
    { "userId": "<hrUserId>", "accessLevel": "VIEW" }
  ]
}
```

**Steps to Execute:**
1. `PUT /api/documents/<documentId>/permissions` with VIEW for HR only.
2. Login as HR; `GET /api/documents/<documentId>`.
3. Login as finance; `GET /api/documents/<documentId>`.

**Expected Result:**
1. HTTP 200; ACL saved.
2. HR HTTP 200 (VIEW).
3. Finance HTTP 403 if ACL is enforced on GET (document-access helper). If finance still reads it via `document.read` only, record whether ACL is additive or restrictive.

**Postconditions:** ACL in place.

**Notes / Dependencies:** Access levels: `VIEW` | `EDIT` | `DELETE` | `MANAGE`.

---

## TC-601 — Document access denied for unauthorized user

**Module:** Documents  
**Feature:** Categories, Versions, Permissions  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- ACL from TC-600 grants only HR VIEW.
- Finance user has no extra document permissions beyond none/minimal.

**Test Data:**
- Finance session cookies
- `GET /api/documents/<documentId>`

**Steps to Execute:**
1. Login as finance.
2. GET the restricted document.
3. Attempt `POST /api/documents/<id>/versions` as finance.

**Expected Result:**
1. Session is finance.
2. HTTP 403 (or 404 to avoid enumeration — record actual).
3. HTTP 403.

**Postconditions:** Document unchanged.

**Notes / Dependencies:** Pair with TC-600. If GET is allowed for anyone with `document.read`, fail this case against the ACL requirement.

---

## TC-602 — HR documents page

**Module:** Documents  
**Feature:** Categories, Versions, Permissions  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- HR user has `document.read`.

**Test Data:** None.

**Steps to Execute:**
1. Login as HR.
2. Open `/hr/documents`.
3. Confirm shared `DocumentsPage` (HR context).

**Expected Result:**
1. Login succeeds.
2. Page loads; HR nav Documents visible.
3. List/filter/upload match HR context (not PM-only docs unless shared).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `apps/web/app/(dashboard)/hr/documents/page.tsx`.

---

## TC-603 — Delete document (soft delete)

**Module:** Documents  
**Feature:** Categories, Versions, Permissions  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- A disposable document exists (create a extra doc, do not delete the ACL test doc if still needed).
- User has `document.delete`.

**Test Data:**
- `DELETE /api/documents/<disposableDocId>`

**Steps to Execute:**
1. DELETE the document.
2. `GET /api/documents/<disposableDocId>`.
3. `GET /api/documents` list.

**Expected Result:**
1. HTTP 200.
2. HTTP 404 (or 200 with deleted flag — record). Soft delete means `deletedAt` set.
3. Document **not** in default list.

**Postconditions:** Document soft-deleted.

**Notes / Dependencies:** Confirmed DELETE route.

---

## TC-604 — Document category context enum validation

**Module:** Documents  
**Feature:** Categories, Versions, Permissions  
**Scenario Type:** Validation / Negative  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- User has `document.manage`.

**Test Data:**
- `{ "name": "Bad", "code": "BAD1", "context": "INVALID" }`

**Steps to Execute:**
1. POST category with invalid context.
2. POST with valid `GENERAL`.

**Expected Result:**
1. HTTP 400 `VALIDATION_ERROR`.
2. HTTP 201.

**Postconditions:** Valid category may remain.

**Notes / Dependencies:** Confirmed `documentContextSchema`.

---

## TC-605 — Document version history display

**Module:** Documents  
**Feature:** Categories, Versions, Permissions  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Document with at least two versions (TC-599).
- User has `document.read`.

**Test Data:** None.

**Steps to Execute:**
1. Open the document in `/hr/documents` (or detail UI).
2. Open version history.
3. Confirm dates, version numbers, change notes.

**Expected Result:**
1. Document opens.
2. History lists v1 and v2.
3. Timestamps and notes match API.

**Postconditions:** None.

**Notes / Dependencies:** If UI has no history panel, verify via GET payload only and log UX gap.

---

## TC-606 — Document manage permission required for ACL

**Module:** Documents  
**Feature:** Categories, Versions, Permissions  
**Scenario Type:** Security / Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- User with `document.read` / `document.create` but **without** `document.manage` (create a custom role if HR has manage).
- `documentId` exists.

**Test Data:**
- PUT permissions body from TC-600

**Steps to Execute:**
1. `PUT /api/documents/<documentId>/permissions` as the limited user.
2. Confirm 403.
3. Same user GET document (should still work if they have read + ACL).

**Expected Result:**
1. Request sent authenticated.
2. HTTP 403 (`requirePermission("document.manage")`).
3. GET 200 or 403 per ACL — permissions unchanged.

**Postconditions:** ACL unchanged.

**Notes / Dependencies:** Confirmed route permission `document.manage`.

---

## TC-607 — Helpdesk ticket list (agent view)

**Module:** Helpdesk  
**Feature:** Tickets, SLA, Knowledge Base  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- At least one portal ticket exists (create via `/portal/support` as a user with ticket create).
- Agent has `ticket.manage` (HR).

**Test Data:**
- `GET /api/helpdesk/tickets`

**Steps to Execute:**
1. Login as HR.
2. Open HR tickets / helpdesk list (e.g. `/hr/tickets` if that is the agent UI).
3. Call GET helpdesk tickets.

**Expected Result:**
1. HR session active.
2. Agent sees **all org tickets**, not only their own.
3. HTTP 200; array includes the portal-created ticket.

**Postconditions:** None.

**Notes / Dependencies:** Helpdesk list requires `ticket.manage`. Portal list is a different API (`/api/portal/tickets`).

---

## TC-608 — Helpdesk escalate ticket

**Module:** Helpdesk  
**Feature:** Tickets, SLA, Knowledge Base  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Ticket id exists, status OPEN or IN_PROGRESS.
- User has `ticket.manage`.
- Approver user id exists.

**Test Data:**
```json
{
  "approverIds": ["<adminUserId>"],
  "notes": "Customer SLA at risk"
}
```

**Steps to Execute:**
1. `POST /api/helpdesk/tickets/<ticketId>/escalate` with body.
2. GET ticket.
3. POST escalate with empty `approverIds: []`.

**Expected Result:**
1. HTTP 200; escalation recorded (`escalationLevel` increased and/or approval created — record actual).
2. Ticket shows escalated state / notes.
3. HTTP 400 (min 1 approver).

**Postconditions:** Ticket escalated.

**Notes / Dependencies:** Confirmed `helpdeskEscalateSchema`.

---

## TC-609 — Helpdesk SLA policy upsert

**Module:** Helpdesk  
**Feature:** Tickets, SLA, Knowledge Base  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- User has `ticket.manage`.

**Test Data:**
```json
{
  "name": "Urgent SLA",
  "priority": "URGENT",
  "firstResponseMinutes": 30,
  "resolutionMinutes": 240
}
```

**Steps to Execute:**
1. Open `/hr/sla-policies`.
2. `PUT /api/helpdesk/sla` with the body.
3. `GET /api/helpdesk/sla`.
4. PUT again with `firstResponseMinutes: 0`.

**Expected Result:**
1. SLA page loads.
2. HTTP 200; policy saved.
3. Policy listed for URGENT.
4. HTTP 400 (must be positive int).

**Postconditions:** SLA policy exists.

**Notes / Dependencies:** Unique per priority expected (TC-615). Nav href `/hr/sla-policies`.

---

## TC-610 — KB article create

**Module:** Helpdesk  
**Feature:** Tickets, SLA, Knowledge Base  
**Scenario Type:** Positive / UI / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- User has `ticket.manage`.

**Test Data:**
```json
{
  "title": "How to reset your password",
  "content": "Use Forgot password on /login.",
  "category": "Account",
  "slug": "reset-password",
  "isPublished": false
}
```

**Steps to Execute:**
1. Open `/hr/knowledge-base`.
2. Create article as draft.
3. Confirm `POST /api/helpdesk/kb`.

**Expected Result:**
1. KB page loads.
2. HTTP 201; `isPublished` false.
3. Article listed in agent KB admin.

**Postconditions:** Save `kbId`.

**Notes / Dependencies:** Confirmed createKb schema. GET `/api/helpdesk/kb` is **auth only** (no ticket.manage) for read.

---

## TC-611 — KB article publish

**Module:** Helpdesk  
**Feature:** Tickets, SLA, Knowledge Base  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Draft KB article exists.
- User has `ticket.manage` to patch.

**Test Data:**
- `PATCH /api/helpdesk/kb/<kbId>` `{ "isPublished": true }`

**Steps to Execute:**
1. Publish via UI or PATCH.
2. Login as employee; `GET /api/helpdesk/kb` and `GET /api/helpdesk/kb/<kbId>`.
3. Confirm unpublished articles are hidden from employees (if service filters).

**Expected Result:**
1. HTTP 200; `isPublished` true.
2. Employee can read published article (KB GET is auth-only).
3. Drafts not listed for employees — **verify**; if drafts leak, log security gap.

**Postconditions:** Article published.

**Notes / Dependencies:** No dedicated publish route; publish is PATCH.

---

## TC-612 — KB article view increments count

**Module:** Helpdesk  
**Feature:** Tickets, SLA, Knowledge Base  
**Scenario Type:** Positive / API  
**Priority:** Low  
**Severity:** Low  

**Preconditions:**
- Published KB article exists.
- Authenticated user.

**Test Data:**
- `GET /api/helpdesk/kb/<kbId>` twice

**Steps to Execute:**
1. GET article; note `viewCount` (or equivalent).
2. GET again.
3. If field missing, inspect payload and mark N/A.

**Expected Result:**
1. HTTP 200.
2. Count increments by 1 **if implemented**. If unchanged, record as **not implemented** (do not invent).
3. No error.

**Postconditions:** Count may have increased.

**Notes / Dependencies:** Compact case assumed viewCount; confirm field on model before failing.

---

## TC-613 — Helpdesk reply as staff

**Module:** Helpdesk  
**Feature:** Tickets, SLA, Knowledge Base  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Open ticket exists.
- User has `ticket.manage`.

**Test Data:**
```json
{
  "body": "We are looking into this.",
  "setWaiting": true
}
```

**Steps to Execute:**
1. `POST /api/helpdesk/tickets/<ticketId>/reply` with body.
2. GET ticket; inspect messages.
3. POST reply with `"body": ""`.

**Expected Result:**
1. HTTP 200/201; staff message added (`authorType` staff/agent).
2. Thread shows the reply; status may become `WAITING_FOR_EMPLOYEE` if `setWaiting` is honored.
3. HTTP 400 (body min 1).

**Postconditions:** Reply stored.

**Notes / Dependencies:** Confirmed `helpdeskReplySchema` max 10000.

---

## TC-614 — KB slug uniqueness

**Module:** Helpdesk  
**Feature:** Tickets, SLA, Knowledge Base  
**Scenario Type:** Negative / DB  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Article with slug `reset-password` exists.
- User has `ticket.manage`.

**Test Data:**
- Second article with same slug, different title

**Steps to Execute:**
1. POST KB with duplicate slug.
2. POST with a new slug `reset-password-2`.

**Expected Result:**
1. HTTP 409 if slug unique; otherwise document missing constraint.
2. HTTP 201.

**Postconditions:** Only one row with slug `reset-password`.

**Notes / Dependencies:** Confirm unique on `KnowledgeBaseArticle.slug` in Prisma before treating 201 as a bug.

---

## TC-615 — SLA unique per priority

**Module:** Helpdesk  
**Feature:** Tickets, SLA, Knowledge Base  
**Scenario Type:** Negative / DB  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- URGENT SLA exists (TC-609).
- User has `ticket.manage`.

**Test Data:**
- Second PUT/POST with same priority `URGENT` but different name

**Steps to Execute:**
1. Upsert a second policy with priority URGENT.
2. GET SLA list.

**Expected Result:**
1. Either updates the existing URGENT policy (upsert) **or** 409 on create. Must **not** create two active URGENT policies if unique(priority) exists.
2. One URGENT policy.

**Postconditions:** Single URGENT SLA.

**Notes / Dependencies:** Compact case expected 409; upsert semantics may update in place — both are acceptable if uniqueness holds.

---

## TC-616 — Helpdesk without ticket.manage blocked

**Module:** Helpdesk  
**Feature:** Tickets, SLA, Knowledge Base  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- Employee logged in (portal user without `ticket.manage`).
- A ticket id exists.

**Test Data:**
- `POST /api/helpdesk/tickets/<ticketId>/escalate` with valid approverIds

**Steps to Execute:**
1. As employee, POST escalate.
2. As employee, GET `/api/helpdesk/tickets`.
3. As employee, GET `/api/helpdesk/kb` (should be allowed — auth only).

**Expected Result:**
1. HTTP 403.
2. HTTP 403.
3. HTTP 200 (KB read is auth-only).

**Postconditions:** Ticket not escalated.

**Notes / Dependencies:** Confirmed escalate requires `ticket.manage`.

---

## TC-617 — List in-app notifications

**Module:** Notifications  
**Feature:** In-app, Announcements, Prefs  
**Scenario Type:** Positive / API / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Authenticated user (any role).
- Optionally trigger a notification (e.g. ticket reply).

**Test Data:**
- `GET /api/notifications`
- `GET /api/notifications?unreadOnly=true`
- `GET /api/notifications?category=TICKET`

**Steps to Execute:**
1. Open `/portal/notifications`.
2. Call list endpoints.
3. Confirm envelope `{ data, error, meta }`.

**Expected Result:**
1. Page lists the current user’s notifications only.
2. HTTP 200; unreadOnly filters; category filter works (`TICKET`, `APPROVAL`, `LEAVE`, etc.).
3. Another user’s notifications never appear.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed list + query schema. No extra permission beyond auth.

---

## TC-618 — Admin create announcement

**Module:** Notifications  
**Feature:** In-app, Announcements, Prefs  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- User has `announcement.manage` (admin).

**Test Data:**
```json
{
  "title": "Office closed Friday",
  "body": "The office will be closed on 2026-08-21.",
  "audience": "ALL"
}
```

**Steps to Execute:**
1. Open `/admin/announcements`.
2. Create announcement (unpublished).
3. Confirm `POST /api/notifications/announcements`.

**Expected Result:**
1. Admin page loads.
2. HTTP 201; not necessarily visible to employees until publish.
3. Appears in admin list.

**Postconditions:** Save `announcementId`.

**Notes / Dependencies:** Title max 200; body max 10000. Audience is a string (e.g. `ALL`, `ROLE:hr`).

---

## TC-619 — Publish announcement

**Module:** Notifications  
**Feature:** In-app, Announcements, Prefs  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Draft announcement exists.
- User has `announcement.manage`.

**Test Data:**
- `POST /api/notifications/announcements/<announcementId>/publish`

**Steps to Execute:**
1. Publish via UI or POST publish.
2. As employee, `GET /api/notifications/announcements`.
3. Confirm employee UI (banner or notifications page) shows it.

**Expected Result:**
1. HTTP 200; published flag/timestamp set.
2. Employee list includes the announcement (audience ALL).
3. Visible in UI.

**Postconditions:** Announcement published.

**Notes / Dependencies:** Confirmed publish route.

---

## TC-620 — Announcement audience ROLE filter

**Module:** Notifications  
**Feature:** In-app, Announcements, Prefs  
**Scenario Type:** Positive / Security  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Admin can manage announcements.
- HR and Finance users exist.

**Test Data:**
```json
{
  "title": "HR only policy update",
  "body": "Visible to HR role only.",
  "audience": "ROLE:hr"
}
```

**Steps to Execute:**
1. Create + publish announcement with audience `ROLE:hr` (use the exact audience format the API stores — inspect create response).
2. Login as HR; GET announcements.
3. Login as finance; GET announcements.

**Expected Result:**
1. Published successfully.
2. HR sees the announcement.
3. Finance does **not** see it.

**Postconditions:** Role-targeted announcement published.

**Notes / Dependencies:** Audience format is a free string (`max 100`). If `ROLE:hr` is not parsed, record actual working format from code/UI (e.g. role code `hr`).

---

## TC-621 — Announcement expiry

**Module:** Notifications  
**Feature:** In-app, Announcements, Prefs  
**Scenario Type:** Edge  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Admin has `announcement.manage`.

**Test Data:**
- Create with `expiresAt` in the past (ISO datetime)
- Or create with expiry 1 minute from now and wait

**Steps to Execute:**
1. `POST /api/notifications/announcements` with past `expiresAt`, then publish.
2. As employee, GET announcements.
3. Create one with future expiry; confirm it **is** listed.

**Expected Result:**
1. Create may succeed.
2. Expired announcement **not** shown to employees (if service filters `expiresAt`). If still shown, log functional gap.
3. Future-dated expiry still visible.

**Postconditions:** Expired announcement exists but hidden.

**Notes / Dependencies:** `expiresAt` optional ISO datetime on create schema.

---

## TC-622 — Notification preferences per category

**Module:** Notifications  
**Feature:** In-app, Announcements, Prefs  
**Scenario Type:** Positive / API / UI  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Authenticated employee.
- Preference page `/portal/notification-preferences` (or equivalent).

**Test Data:**
```json
{
  "category": "LEAVE",
  "inAppEnabled": true,
  "emailEnabled": false
}
```

**Steps to Execute:**
1. `GET /api/notifications/preferences`.
2. `PUT /api/notifications/preferences` with LEAVE email disabled.
3. GET preferences again.
4. PUT with invalid category `FOO`.

**Expected Result:**
1. HTTP 200; list/map of categories.
2. HTTP 200.
3. LEAVE `emailEnabled` is false; `inAppEnabled` true.
4. HTTP 400.

**Postconditions:** Preference persisted (unique per user+category).

**Notes / Dependencies:** Confirmed `updatePreferenceSchema`. Unique `(userId, category)` in schema analysis.

---

## TC-623 — Unread notification count API

**Module:** Notifications  
**Feature:** In-app, Announcements, Prefs  
**Scenario Type:** API / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- User has at least one unread notification (or zero).

**Test Data:**
- `GET /api/notifications/unread-count`

**Steps to Execute:**
1. GET unread-count; note `n`.
2. `POST /api/notifications/<id>/read` for one unread id.
3. GET unread-count again.
4. `POST /api/notifications/read-all`; GET count.

**Expected Result:**
1. HTTP 200; numeric count (0 allowed).
2. HTTP 200.
3. Count is `n-1` (not below 0).
4. Count is 0.

**Postconditions:** All notifications read.

**Notes / Dependencies:** Confirmed unread-count, read, read-all routes.

---

## TC-624 — Delete announcement

**Module:** Notifications  
**Feature:** In-app, Announcements, Prefs  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Disposable announcement exists.
- User has `announcement.manage`.

**Test Data:**
- `DELETE /api/notifications/announcements/<id>`

**Steps to Execute:**
1. DELETE announcement.
2. GET announcements as admin and as employee.

**Expected Result:**
1. HTTP 200; soft delete.
2. Announcement not in employee list; admin list excludes it (or shows deleted only if a flag exists).

**Postconditions:** Announcement deleted.

**Notes / Dependencies:** Confirmed DELETE route.

---

## TC-625 — Report KPI attendance scope

**Module:** Reports  
**Feature:** KPIs, Export, Schedules  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- User has `report.read` or `dashboard.read` or `dashboard.executive.read`.
- Some attendance data exists (optional).

**Test Data:**
- `GET /api/reports/kpis/attendance`
- Also try scopes used by `kpiScopeEnum`: `executive`, `hr`, `finance`, `payroll`, `project`

**Steps to Execute:**
1. Call `/api/reports/kpis/attendance` (compact case).
2. If 400, retry with a confirmed scope from `kpiScopeEnum` (e.g. `hr`).
3. Open `/reports` UI and select attendance/HR KPIs.

**Expected Result:**
1. HTTP 200 **or** 400 if `attendance` is not a valid `:scope` — then use documented enum.
2. HTTP 200 with KPI payload.
3. UI charts/cards render.

**Postconditions:** None.

**Notes / Dependencies:** `report.routes.ts` uses `/kpis/:scope`. Compact name `attendance` may not match enum (`hr`). Record actual accepted scopes.

---

## TC-626 — Export attendance report CSV

**Module:** Reports  
**Feature:** KPIs, Export, Schedules  
**Scenario Type:** Positive / API / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- User has `report.export` or `report.read`.

**Test Data:**
- `GET /api/reports/ATTENDANCE/export?format=csv`  
  (report types: `ATTENDANCE` | `LEAVE` | `RECRUITMENT` | `INVOICE` | `PAYROLL` | `PROJECT` | `EXECUTIVE`)

**Steps to Execute:**
1. From `/reports`, export attendance as CSV.
2. Confirm GET export URL and query `format=csv` (schema uppercases format).
3. Open the downloaded file.

**Expected Result:**
1. Download starts.
2. HTTP 200; `Content-Type` csv or octet-stream; `Content-Disposition` filename.
3. File opens; header row present. Empty data still yields a valid CSV.

**Postconditions:** File on disk.

**Notes / Dependencies:** Confirmed `GET /:type/export` and `reportFormatEnum` CSV/PDF.

---

## TC-627 — Export report PDF

**Module:** Reports  
**Feature:** KPIs, Export, Schedules  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Same as TC-626.

**Test Data:**
- `GET /api/reports/PAYROLL/export?format=pdf`

**Steps to Execute:**
1. Export payroll (or attendance) as PDF from UI or API.
2. Open the file in a PDF reader.

**Expected Result:**
1. HTTP 200; PDF bytes.
2. File is a valid PDF (`%PDF` header). If PDF is unimplemented, record 400/501 as gap.

**Postconditions:** PDF downloaded.

**Notes / Dependencies:** Format enum includes PDF.

---

## TC-628 — Create report schedule

**Module:** Reports  
**Feature:** KPIs, Export, Schedules  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- User has `report.schedule.manage`.

**Test Data:**
```json
{
  "name": "Monthly payroll dump",
  "reportType": "PAYROLL",
  "format": "CSV",
  "frequency": "MONTHLY",
  "dayOfPeriod": 1,
  "hourUtc": 6,
  "recipients": ["payroll@workforce360.com"]
}
```

**Steps to Execute:**
1. Open `/reports/schedules`.
2. Create schedule with the data above.
3. Confirm `POST /api/reports/schedules`.
4. POST with `recipients: ["not-an-email"]`.

**Expected Result:**
1. Schedules page loads.
2. HTTP 201; schedule stored.
3. POST used.
4. HTTP 400 (email validation).

**Postconditions:** Save `scheduleId`.

**Notes / Dependencies:** Frequency `DAILY` | `WEEKLY` | `MONTHLY`. `dayOfPeriod` 0–28. Recipients min 1 email.

---

## TC-629 — Run due schedules manually

**Module:** Reports  
**Feature:** KPIs, Export, Schedules  
**Scenario Type:** API / Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- At least one schedule exists, preferably due (`nextRunAt` in the past if the field exists).
- User has `report.schedule.manage`.

**Test Data:**
- `POST /api/reports/schedules/run-due`

**Steps to Execute:**
1. POST run-due.
2. Check schedule `lastRunAt` / run history if returned.
3. Confirm recipients would be targeted (do not require a real inbox in local env — check logs).

**Expected Result:**
1. HTTP 200; due schedules processed (empty run is OK if none due).
2. Due schedule timestamps update.
3. No 500.

**Postconditions:** Schedules updated.

**Notes / Dependencies:** Confirmed `POST /schedules/run-due`. Also invoked by cron in `scheduler.ts`.

---

## TC-630 — Report filter by date range

**Module:** Reports  
**Feature:** KPIs, Export, Schedules  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- User has `report.read`.

**Test Data:**
- `GET /api/reports/ATTENDANCE?dateFrom=2026-08-01&dateTo=2026-08-31`
- Invalid: `dateFrom=2026-08-31&dateTo=2026-08-01` (if validated)

**Steps to Execute:**
1. Call report with August 2026 range.
2. Call KPI with same filters (`reportFiltersSchema`).
3. Use inverted from/to if the UI allows.

**Expected Result:**
1. HTTP 200; data limited to range (or empty).
2. HTTP 200.
3. Either 400 or empty set — record actual.

**Postconditions:** None.

**Notes / Dependencies:** Filters: `dateFrom`, `dateTo`, `departmentId`, `format`.

---

## TC-631 — Reports page UI

**Module:** Reports  
**Feature:** KPIs, Export, Schedules  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- User with `report.read` (admin).

**Test Data:** None.

**Steps to Execute:**
1. Open `/reports`.
2. Confirm report type selector and export buttons.
3. Switch types (attendance, payroll, etc.) and wait for load.

**Expected Result:**
1. Page loads.
2. Selector + export CSV/PDF controls present.
3. No uncaught error when switching types.

**Postconditions:** None.

**Notes / Dependencies:** Nav `/reports` and `/reports/schedules`.

---

## TC-632 — Report without report.read blocked

**Module:** Reports  
**Feature:** KPIs, Export, Schedules  
**Scenario Type:** Security / Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Employee without `report.read` / `report.export`.

**Test Data:**
- `GET /api/reports/PAYROLL/export?format=csv`

**Steps to Execute:**
1. As employee, call payroll export.
2. As employee, `GET /api/reports/PAYROLL`.
3. Open `/reports` in the browser.

**Expected Result:**
1. HTTP 403.
2. HTTP 403.
3. Nav hidden and/or page gated.

**Postconditions:** No file downloaded.

**Notes / Dependencies:** Export requires `report.export` **or** `report.read`.

---

## TC-633 — KPI scopes for authorized user

**Module:** Reports  
**Feature:** KPIs, Export, Schedules  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Admin with report/dashboard read.

**Test Data:**
- Scopes: `executive`, `hr`, `finance`, `payroll`, `project`

**Steps to Execute:**
1. `GET /api/reports/kpis/<scope>` for each enum value.
2. Call an invalid scope `kpis/foo`.

**Expected Result:**
1. Each valid scope HTTP 200.
2. HTTP 400/404 for invalid scope.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `kpiScopeEnum`.

---

## TC-634 — Update report schedule

**Module:** Reports  
**Feature:** KPIs, Export, Schedules  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- `scheduleId` exists.
- User has `report.schedule.manage`.

**Test Data:**
- `{ "frequency": "WEEKLY", "hourUtc": 8 }`
- Invalid `{ "hourUtc": 24 }`

**Steps to Execute:**
1. `PATCH /api/reports/schedules/<scheduleId>` with WEEKLY / hour 8.
2. GET schedules list.
3. PATCH `hourUtc: 24`.

**Expected Result:**
1. HTTP 200; frequency WEEKLY; hourUtc 8.
2. List matches.
3. HTTP 400 (hour 0–23).

**Postconditions:** Schedule updated.

**Notes / Dependencies:** Confirmed `updateReportScheduleSchema` partial of create.

---

## TC-635 — Presign upload valid file

**Module:** Storage  
**Feature:** Presign Upload & Confirm  
**Scenario Type:** Positive / E2E / API  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- Authenticated user with permission for purpose `DOCUMENT` (or `OTHER`).
- API running; local storage provider default.

**Test Data:**
- fileName: `note.txt`
- mimeType: `text/plain`
- purpose: `DOCUMENT`
- file body: `hello`

**Steps to Execute:**
1. `POST /api/storage/presign` with fileName, mimeType, purpose.
2. `PUT` to returned `uploadUrl` with the file bytes and Content-Type.
3. `POST /api/storage/confirm` with storageKey, originalName, mimeType, sizeBytes, purpose.
4. Confirm `data.id` of stored file.

**Expected Result:**
1. HTTP 200; `uploadUrl`, `storageKey`, `expiresInSeconds` (900).
2. PUT 200 (local: `/api/storage/upload/:token`).
3. HTTP 200; StoredFile row created.
4. File id returned for later document/ticket use.

**Postconditions:** Save `storedFileId`.

**Notes / Dependencies:** Confirmed `storage.routes.ts` + `lib/storage.ts` local token map.

---

## TC-636 — Presign wrong purpose for role rejected

**Module:** Storage  
**Feature:** Presign Upload & Confirm  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- Employee **without** `offer.create` / `offer.update`.
- Employee **is** allowed some purpose (e.g. RESUME via portal permissions if granted).

**Test Data:**
```json
{
  "fileName": "offer.pdf",
  "mimeType": "application/pdf",
  "purpose": "OFFER_LETTER"
}
```

**Steps to Execute:**
1. Login as employee.
2. `POST /api/storage/presign` with OFFER_LETTER.
3. Repeat as admin/HR who has offer permissions (control).

**Expected Result:**
1. Employee session.
2. HTTP 403 (insufficient permissions for purpose) from `requireStoragePurposePermission`.
3. Control user HTTP 200.

**Postconditions:** No file created.

**Notes / Dependencies:** Compact case said `OFFER_LETTER`. Zod purpose is `OFFER_LETTER`. Mapping in `storage-rbac.ts`: OFFER_LETTER → `offer.create` / `offer.update`.

---

## TC-637 — Presign invalid mime type / purpose

**Module:** Storage  
**Feature:** Presign Upload & Confirm  
**Scenario Type:** Validation / Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Authenticated user.

**Test Data:**
- purpose: `MALWARE`
- mimeType omitted
- fileName: `""`

**Steps to Execute:**
1. POST presign purpose `MALWARE`.
2. POST presign with empty fileName.
3. POST presign missing mimeType.

**Expected Result:**
1. HTTP 400 (Zod enum) **or** 400 unsupported purpose from middleware if it bypasses Zod.
2. HTTP 400 (fileName min 1).
3. HTTP 400.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed purpose enum and storage-rbac unsupported purpose test.

---

## TC-638 — Confirm upload without presign fails

**Module:** Storage  
**Feature:** Presign Upload & Confirm  
**Scenario Type:** Negative / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Authenticated user with DOCUMENT permission.

**Test Data:**
```json
{
  "storageKey": "document/does-not-exist.txt",
  "originalName": "x.txt",
  "mimeType": "text/plain",
  "sizeBytes": 5,
  "purpose": "DOCUMENT"
}
```

**Steps to Execute:**
1. `POST /api/storage/confirm` with a fabricated storageKey (no prior PUT).
2. Inspect status.

**Expected Result:**
1. HTTP 400 (or 404) — confirm must not create a trusted file for an object that was never uploaded.
2. Error envelope; no StoredFile with that key (or row without backing object — treat as fail if it “succeeds”).

**Postconditions:** No orphan trusted file.

**Notes / Dependencies:** Confirm service behavior if it only inserts metadata.

---

## TC-639 — Upload file too large

**Module:** Storage  
**Feature:** Presign Upload & Confirm  
**Scenario Type:** Boundary / Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Authenticated user.
- Know configured max (if any). If none in code, use a very large `sizeBytes` on confirm and a large PUT body.

**Test Data:**
- Confirm `sizeBytes: 999999999`
- PUT body significantly larger than a reasonable limit (e.g. &gt; 50 MB) if practical

**Steps to Execute:**
1. Presign a large file name.
2. PUT a large payload (or skip PUT if limit is on confirm).
3. Confirm with huge sizeBytes.

**Expected Result:**
1. Presign may still 200 (it may not check size).
2. PUT 413/400 **or** success if unlimited locally.
3. If no max is implemented, **record gap** — do not fail solely because 201 occurred unless a limit is documented.

**Postconditions:** Clean up large files.

**Notes / Dependencies:** No max size found on `presignUploadSchema`. Mark **Unclear** if unlimited.

---

## TC-640 — Local upload via upload token

**Module:** Storage  
**Feature:** Presign Upload & Confirm  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- `STORAGE_PROVIDER` is local (default).
- Presign succeeded; `uploadUrl` contains `/api/storage/upload/<token>`.

**Test Data:**
- Token from presign
- Body: small text file

**Steps to Execute:**
1. Presign purpose OTHER or DOCUMENT.
2. `PUT /api/storage/upload/<token>` with raw body and Content-Type.
3. PUT the same token a second time.

**Expected Result:**
1. uploadUrl is local, not S3.
2. HTTP 200; file stored under generated key.
3. Second PUT: record actual (token may be single-use if Map entry is deleted).

**Postconditions:** Object stored locally.

**Notes / Dependencies:** Confirmed `pendingLocalUploads` Map and `PUT` handler in storage lib. Compact path `/api/storage/upload/:token` matches implementation (`/api/storage/upload/` + token).

---

## TC-641 — Expired upload token rejected

**Module:** Storage  
**Feature:** Presign Upload & Confirm  
**Scenario Type:** Negative / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Presign token TTL is 900 seconds (`expiresInSeconds`).

**Test Data:**
- Expired token (wait 15+ minutes) **or** a random 48-hex token

**Steps to Execute:**
1. `PUT /api/storage/upload/deadbeef` (invalid token).
2. Optional: presign, wait until after `expiresAt`, then PUT.

**Expected Result:**
1. HTTP 400/401/404 — not 200.
2. Expired token rejected; confirm afterward also fails.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `expiresAt: Date.now() + 900000`.

---

## TC-642 — S3 presign URL works (if S3 configured)

**Module:** Storage  
**Feature:** Presign Upload & Confirm  
**Scenario Type:** Positive / Integration  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Env: `STORAGE_PROVIDER=s3` and S3 credentials/bucket set.  
- **Skip (N/A)** if local storage.

**Test Data:**
- Small PNG/PDF
- purpose DOCUMENT

**Steps to Execute:**
1. POST presign.
2. Confirm `uploadUrl` is an S3/signed URL (not `/api/storage/upload/`).
3. PUT the file to that URL.
4. Confirm via API.

**Expected Result:**
1. HTTP 200.
2. Host is S3/endpoint.
3. PUT 200 from S3.
4. StoredFile created.

**Postconditions:** Object in bucket.

**Notes / Dependencies:** Confirmed S3 branch in `createPresignedUpload`. Mark N/A in local default.

---

## TC-643 — Resume upload purpose for careers

**Module:** Storage  
**Feature:** Presign Upload & Confirm  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Candidate or applicant flow: public apply page `/careers/<slug>/apply` **or** authenticated user with RESUME purpose permission (`portal.read` / `candidate.update` / `application.update` per storage-rbac).

**Test Data:**
- PDF resume
- purpose: `RESUME`

**Steps to Execute:**
1. On apply form, attach resume.
2. Capture presign purpose = RESUME.
3. Complete apply (`POST /api/careers/apply`).
4. As employee **without** resume permissions, POST presign RESUME (negative control).

**Expected Result:**
1. File input accepts PDF.
2. Presign 200 for applicant/candidate path.
3. Application created with resume file linked.
4. Control user 403 unless they have mapped perms.

**Postconditions:** Application + resume stored.

**Notes / Dependencies:** Careers apply may use `optionalAuth`. Confirm who is allowed to presign RESUME when logged out — if apply uploads only after register, follow that path.

---

## TC-644 — Document upload purpose

**Module:** Storage  
**Feature:** Presign Upload & Confirm  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- User with `document.create` (and whatever DOCUMENT purpose maps to in `STORAGE_PURPOSE_PERMISSIONS`).

**Test Data:**
- purpose: `DOCUMENT`
- fileName: `policy.pdf`

**Steps to Execute:**
1. Presign DOCUMENT.
2. PUT + confirm.
3. Create DMS document with the file id (TC-598).

**Expected Result:**
1. HTTP 200.
2. File stored.
3. Document create 201.

**Postconditions:** File + document exist.

**Notes / Dependencies:** Pair with documents module.

---

## TC-645 — Sidebar navigation matches user permissions

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- Seed users: admin, HR, finance, payroll.
- `filterNavByPermissions` is used in the dashboard shell.

**Test Data:**
- Admin: all modules
- HR: HR + portal, not payroll runs
- Finance: finance nav, not payroll
- Payroll: payroll nav, not invoices
- Employee-only (if created): portal only

**Steps to Execute:**
1. Login as each role; screenshot/list sidebar groups.
2. Compare to `apps/web/lib/navigation.ts` permission arrays.
3. As finance, confirm `/engineering/releases` is not in the nav.

**Expected Result:**
1. Each role sees only permitted groups.
2. Matches filter rules (`permissions` any-of, `roles`, `excludeRoles`).
3. Engineering hidden for finance/HR.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed navigation.ts.

---

## TC-646 — Breadcrumbs show correct path

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Admin logged in.
- A project exists.

**Test Data:**
- URL: `/pm/projects/<projectId>/board`

**Steps to Execute:**
1. Open the board URL.
2. Read breadcrumb trail.
3. Click parent crumb (Projects / project name).

**Expected Result:**
1. Board loads.
2. Trail similar to Dashboard → PM → Project → Board (exact labels per `breadcrumbs` component).
3. Parent navigates correctly.

**Postconditions:** None.

**Notes / Dependencies:** Confirm `components/layout` breadcrumbs. If crumbs are only the page title, record actual.

---

## TC-647 — LoadingState on data fetch

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Admin logged in.
- Browser DevTools network throttling: Slow 3G.

**Test Data:**
- Page: `/hr/employees` or `/admin/users` (list with LoadingState)

**Steps to Execute:**
1. Enable throttling.
2. Hard-refresh the list page.
3. Observe skeleton/LoadingState before data.

**Expected Result:**
1. Throttle on.
2. Page does not flash an empty error.
3. LoadingState/skeleton visible, then table.

**Postconditions:** Restore network.

**Notes / Dependencies:** Confirmed `LoadingState` in admin-states / admin-states usage.

---

## TC-648 — ErrorState with retry button

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Admin logged in.
- Ability to stop the API (`apps/api`) temporarily.

**Test Data:**
- Page: `/admin/users`

**Steps to Execute:**
1. Stop the API process.
2. Reload `/admin/users`.
3. Click **Retry** (or equivalent).
4. Start API; click Retry again.

**Expected Result:**
1. API down.
2. ErrorState shown (not infinite spinner, not raw stack).
3. Retry re-fires the query.
4. After API is up, list loads.

**Postconditions:** API running.

**Notes / Dependencies:** Confirmed ErrorState pattern.

---

## TC-649 — EmptyState on empty list

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Edge  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Use a module list that can be empty (e.g. new project’s tasks, or filter that matches nothing).

**Test Data:**
- Search string `zzz-no-match-xyz`

**Steps to Execute:**
1. Open a list page (users/jobs/leads).
2. Search for a string that matches nothing.
3. Observe EmptyState copy.

**Expected Result:**
1. List page loads.
2. Zero rows.
3. Helpful empty message (not a blank table crash).

**Postconditions:** Clear search.

**Notes / Dependencies:** Confirmed EmptyState components.

---

## TC-650 — FormSheet open/close/create flow

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Admin on a FormSheet page (e.g. `/admin/departments` or `/hr/jobs`).

**Test Data:**
- Partial input: name `Temp`

**Steps to Execute:**
1. Open Create sheet; type `Temp`.
2. Click cancel/overlay close.
3. Reopen Create.
4. Confirm fields are empty (reset).
5. Fill valid data and submit successfully.

**Expected Result:**
1. Sheet opens.
2. Sheet closes.
3. Sheet opens again.
4. Form reset (no leftover `Temp`).
5. Record created; success toast (TC-652).

**Postconditions:** Created record exists.

**Notes / Dependencies:** Confirmed FormSheet pattern.

---

## TC-651 — Backend validation errors shown inline

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Admin on user create (`/admin/users`) where `parseApiFieldErrors` is used.

**Test Data:**
- Email: `not-an-email`
- Or empty required name

**Steps to Execute:**
1. Submit invalid user form (bypass HTML5 if needed via API-backed submit).
2. Observe field-level errors.
3. Confirm scroll to first error if implemented.

**Expected Result:**
1. HTTP 400 from API.
2. Inline errors under fields (Zod flatten mapped).
3. First invalid field in view.

**Postconditions:** No user created.

**Notes / Dependencies:** Confirmed `lib/form-validation.ts`.

---

## TC-652 — Toast success on create

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Positive  
**Priority:** Low  
**Severity:** Low  

**Preconditions:**
- Toast provider mounted (root layout).

**Test Data:**
- Any successful create (department/job).

**Steps to Execute:**
1. Successfully create a record.
2. Watch for success toast.
3. Trigger an API error; watch error toast if any.

**Expected Result:**
1. Create 201.
2. Success toast appears.
3. Error toast or inline error — no silent failure.

**Postconditions:** Record created.

**Notes / Dependencies:** Confirmed toast-provider.

---

## TC-653 — Theme toggle dark/light mode

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Positive  
**Priority:** Low  
**Severity:** Low  

**Preconditions:**
- Logged in; theme toggle visible in shell header.

**Test Data:** None.

**Steps to Execute:**
1. Toggle to dark.
2. Refresh the page.
3. Toggle back to light.

**Expected Result:**
1. Dark styles apply (dashboard background/text).
2. Preference persists (localStorage/theme provider).
3. Light mode restored.

**Postconditions:** Theme restored to tester preference.

**Notes / Dependencies:** Confirmed theme-toggle / theme-provider.

---

## TC-654 — Mobile responsive sidebar collapse

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Responsive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Logged in.
- Browser width 375px (iPhone) or device mode.

**Test Data:**
- Viewport: 375 × 812

**Steps to Execute:**
1. Open `/dashboard` at 375px.
2. Confirm sidebar is collapsed/hamburger.
3. Open menu; navigate to a portal page.
4. Confirm no horizontal scrollbar on main content.

**Expected Result:**
1. Layout usable.
2. Nav not permanently covering content.
3. Navigation works.
4. No clipped primary actions.

**Postconditions:** Restore viewport.

**Notes / Dependencies:** Desktop-first requirement still must work on mobile browser.

---

## TC-655 — Tablet layout usable

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Responsive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- Logged in as admin.

**Test Data:**
- Viewport: 768 × 1024

**Steps to Execute:**
1. Open `/dashboard`, `/hr/employees`, `/pm/projects/<id>/board` at 768px.
2. Check tables, kanban, forms.

**Expected Result:**
1. Pages load.
2. No overlapping controls; tables may scroll horizontally but remain usable.

**Postconditions:** Restore viewport.

**Notes / Dependencies:** None.

---

## TC-656 — SearchBar debounce behavior

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Edge  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:**
- List page with SearchBar (e.g. `/admin/users`, `/hr/employees`).
- Network tab open.

**Test Data:**
- Type `admin` rapidly (5 keystrokes in &lt; 300ms)

**Steps to Execute:**
1. Focus search.
2. Type quickly.
3. Count `/api/users` (or equivalent) requests.

**Expected Result:**
1. Search focused.
2. Not one request per keystroke.
3. One (or few) requests after debounce delay.

**Postconditions:** Clear search.

**Notes / Dependencies:** If debounce is missing, log as performance UX issue.

---

## TC-657 — Workspace selector (if multiple workspaces)

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Edge  
**Priority:** Low  
**Severity:** Low  

**Preconditions:**
- Logged in.
- Inspect header for `WorkspaceSelector`.

**Test Data:** None.

**Steps to Execute:**
1. Look for workspace/company switcher in the shell.
2. If only one company, open it and confirm a single option.
3. If control is absent, mark **N/A** (single-tenant).

**Expected Result:**
1. Control present or absent — record.
2. Single-tenant: one company, no error.
3. N/A is acceptable; product is not multi-company (out of scope).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed component exists; multi-company is out of scope per project rules.

---

## TC-658 — Page title and header consistent

**Module:** Cross-cutting  
**Feature:** UI States, Navigation, Responsive  
**Scenario Type:** UI / Positive  
**Priority:** Low  
**Severity:** Low  

**Preconditions:**
- Admin logged in.

**Test Data:**
- Sample routes: `/admin/users`, `/admin/roles`, `/hr/jobs`, `/finance/invoices`

**Steps to Execute:**
1. Visit each route.
2. Compare `AdminPageHeader` / page H1 to sidebar label.

**Expected Result:**
1. Pages load.
2. Title matches the nav label (Users, Roles, Jobs, Invoices). No leftover “Untitled”.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-659 — API 500 returns generic error to client

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** Negative / Security  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Ability to force a server error (optional test-only route, or stop DB).  
- Do **not** use production data.

**Test Data:**
- Authenticated GET that will 500 (e.g. DB stopped)  
- Or rely on existing error-handler tests

**Steps to Execute:**
1. Stop PostgreSQL **or** otherwise force an unhandled error.
2. Call `GET /api/users` as admin.
3. Inspect JSON: no stack, no SQL, no env secrets.

**Expected Result:**
1. Failure induced.
2. HTTP 500; `{ data: null, error: { code: "INTERNAL_ERROR", message: "<generic>" } }`.
3. No Prisma/SQL/stack in `error`.

**Postconditions:** Restart DB/API.

**Notes / Dependencies:** Confirmed error-handler maps unknown errors to INTERNAL_ERROR.

---

## TC-660 — Network offline shows error

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** Negative / UI  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Logged in on a list page.

**Test Data:** None.

**Steps to Execute:**
1. DevTools → Offline.
2. Trigger a refetch (Retry, filter, navigate).
3. Go online; retry.

**Expected Result:**
1. Browser offline.
2. User-friendly error (ErrorState/toast), not a blank page.
3. Data loads after retry.

**Postconditions:** Network online.

**Notes / Dependencies:** None.

---

## TC-661 — Duplicate form submit prevention

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** Edge / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Create form (e.g. department or job).
- Network throttling Slow 3G so the request is in-flight.

**Test Data:**
- Unique name `DoubleSubmit Dept`

**Steps to Execute:**
1. Fill valid unique data.
2. Double-click Save quickly.
3. Count POST requests and DB rows.

**Expected Result:**
1. Form valid.
2. Submit button disabled while pending (FormSheet/mutation `isPending`).
3. **One** POST and **one** row. If two rows, fail.

**Postconditions:** Single department.

**Notes / Dependencies:** Confirm button disabled on mutation pending.

---

## TC-662 — Concurrent edit last-write-wins or conflict

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** Concurrency  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Two browsers/sessions as admin (or admin + HR if both can update the entity).
- Target: same job posting or user record.

**Test Data:**
- Session A title: `Title A`
- Session B title: `Title B`

**Steps to Execute:**
1. Open the same edit form in two sessions.
2. Session A saves Title A.
3. Session B saves Title B without refreshing.
4. GET the entity.

**Expected Result:**
1. Both forms show original.
2. A succeeds.
3. B succeeds (last write wins) **or** 409 conflict if versioning exists (none found).
4. Stored title is B if last-write-wins. **Document actual** — do not fail if LWW unless a requirement says otherwise.

**Postconditions:** Entity has one title.

**Notes / Dependencies:** No optimistic-lock field found on typical update schemas.

---

## TC-663 — Browser back after create does not resubmit

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** Edge / UI  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Create flow that navigates or closes sheet after success.

**Test Data:**
- Unique job title `BackNav Job`

**Steps to Execute:**
1. Create the job successfully.
2. Browser Back.
3. Browser Forward (or re-open create).
4. Confirm job count.

**Expected Result:**
1. One job created.
2. Back does not POST again.
3. No duplicate job.
4. Count +1 only.

**Postconditions:** Single job.

**Notes / Dependencies:** SPA mutations should not replay on back.

---

## TC-664 — Session expiry mid-form shows login redirect

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** Session / Security  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Admin logged in with a form open (`/admin/users` create sheet filled).
- Ability to expire session: logout in another tab, or `POST /api/users/:id/revoke-sessions` on self, or wait for access+refresh expiry.

**Test Data:**
- Filled but unsubmitted form

**Steps to Execute:**
1. Fill the form; do not submit.
2. Invalidate session (other tab logout / revoke).
3. Submit the form.
4. Observe redirect and whether refresh is attempted (`POST /api/auth/refresh`).

**Expected Result:**
1. Form has data.
2. Session dead.
3. Submit gets 401; refresh fails; redirect to `/login`.
4. User is not left on a broken dashboard. Data loss is expected unless a warning is shown — record whether a warning exists.

**Postconditions:** Logged out.

**Notes / Dependencies:** Confirmed api-client refresh-on-401. After revoke, refresh should fail (`SESSION_EXPIRED`).

---

## TC-665 — API response envelope consistency

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** API / Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Admin authenticated.
- Sample endpoints across modules.

**Test Data:**
- `GET /api/health`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/pm/projects`
- `GET /api/engineering/releases`
- `GET /api/notifications`
- `GET /api/reports/kpis/hr`
- `GET /api/does-not-exist`
- `POST /api/auth/login` with bad password

**Steps to Execute:**
1. Call each endpoint.
2. Assert top-level keys include `data` and `error` (and `meta` when listed).

**Expected Result:**
1. All calls return JSON envelope.
2. Success: `error` null; `data` set. Failure: `data` null; `error.code` set. 404 uses `NOT_FOUND`. Login failure `UNAUTHORIZED`.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed API envelope standard.

---

## TC-666 — Prisma unique constraint maps to friendly error

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** API / Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Admin can create users/org entities.
- Known unique field (user email, department code, project code).

**Test Data:**
- Create user with email `admin@workforce360.com` (exists)

**Steps to Execute:**
1. `POST /api/users` duplicate email.
2. Inspect HTTP status and `error.code`.
3. Confirm no raw `P2002` leaked to client.

**Expected Result:**
1. Request rejected.
2. HTTP 409 with a friendly code (e.g. duplicate email) **or** 400 OPERATION_FAILED — must be documented. Prefer 409.
3. Message human-readable; no Prisma meta dump.

**Postconditions:** No duplicate user.

**Notes / Dependencies:** Confirmed `mapPrismaError` / AppError mapping in tests.

---

## TC-667 — XSS in text field sanitized on display

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** Security / UI  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:**
- User can create a ticket or task (portal support or PM task).

**Test Data:**
- Title/body: `<script>alert(1)</script>`
- Also try `<img src=x onerror=alert(1)>`

**Steps to Execute:**
1. Create ticket/task with the payload.
2. Open the detail page.
3. Confirm no alert dialog and no script execution.
4. View page source/DOM: payload is text, not a live script node.

**Expected Result:**
1. HTTP 201 (string stored).
2. Detail renders as text.
3. No XSS execution (React default escaping).
4. If `dangerouslySetInnerHTML` is used on engineering docs content, **retest that page** — docs `content` may be a richer sink.

**Postconditions:** Record remains; safe to leave.

**Notes / Dependencies:** Engineering docs `content` is a likely HTML sink — include `/engineering/docs/<id>` in this test.

---

## TC-668 — CSRF protection via sameSite cookies

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Logged in; DevTools → Application → Cookies for API host.

**Test Data:** None.

**Steps to Execute:**
1. Inspect access/refresh cookie attributes: HttpOnly, Secure, SameSite.
2. Compare to env: `sameSite: lax` (dev) / `strict` (prod) per cookie helper.
3. Confirm JS `document.cookie` cannot read the auth cookie (HttpOnly).

**Expected Result:**
1. HttpOnly present.
2. SameSite lax in local; strict documented for production.
3. Cookie not readable from `document.cookie`.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `apps/api` cookie helper.

---

## TC-669 — No secrets in frontend bundle

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:**
- Production or `next build` output available, **or** search `apps/web` source for forbidden keys.

**Test Data:**
- Search strings: `DATABASE_URL`, `SUPABASE_SERVICE`, `STRIPE_SECRET`, `RAZORPAY_KEY_SECRET`, `JWT_SECRET`

**Steps to Execute:**
1. Search `apps/web` for those strings.
2. If a `.next` bundle exists, search compiled JS.
3. View `/login` page source for leaked env.

**Expected Result:**
1. No service-role/DB/JWT secrets in frontend source.
2. Bundle contains only `NEXT_PUBLIC_*` (e.g. API base URL, Razorpay **publishable** key).
3. Page source clean.

**Postconditions:** None.

**Notes / Dependencies:** Architecture rule: frontend never ships DB credentials.

---

## TC-670 — Rate limiting on login (if implemented)

**Module:** Cross-cutting  
**Feature:** Error Handling & Concurrency  
**Scenario Type:** Security / Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Login endpoint publicly reachable.
- Use a non-lockout test account.

**Test Data:**
- 30–100 rapid `POST /api/auth/login` with wrong password for `admin@workforce360.com`

**Steps to Execute:**
1. Script or repeat login failures quickly.
2. Observe status codes (401 vs 429).
3. Check security events / login history as admin afterward.

**Expected Result:**
1. Requests accepted or throttled.
2. **If no rate limiter in code:** all 401, no 429 — mark **N/A / gap**, not a product pass for “rate limited”.
3. Failed attempts logged (`LoginHistory` / `SecurityEvent`) if that monitor is enabled.

**Postconditions:** Admin account still usable with correct password.

**Notes / Dependencies:** Prior analysis found **no** rate-limit middleware. Do not invent 429.

---

## TC-671 — E2E: Hire to payroll full workflow

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:**
- Admin, HR, Payroll users available.
- Public job published (`/careers`).
- Leave/attendance data optional for LOP.

**Test Data:**
- Candidate: `e2e.hire@example.com` / policy-compliant password
- Job: published seed or newly published job
- Salary: basic + HRA sufficient for a run
- Payroll period: current month/year

**Steps to Execute:**
1. As guest: register/apply on `/careers/<slug>/apply` with resume (TC-643).
2. As HR: open pipeline `/hr/pipeline`; move application through stages; schedule interview; create and send offer.
3. As HR: hire / convert to employee (`/hr/onboarding` or lifecycle). Confirm user + employee master + employee code.
4. As payroll: create salary structure for the new employee (`/payroll/salary-structures`).
5. As payroll: create payroll run for month/year → calculate → submit → approve → process.
6. As the new employee (or portal login): open `/portal/payslips` and download PDF.

**Expected Result:**
1. Application created.
2. Offer SENT; candidate/employee record ready to hire.
3. Employee ACTIVE (or onboarding state per product); appears in `/hr/employees`.
4. ACTIVE salary structure exists.
5. Run PROCESSED; payslip generated (`Payslip` + PDF file).
6. Employee can download **only** their payslip; PDF opens.

**Postconditions:** New employee and payroll artifacts exist (cleanup optional).

**Notes / Dependencies:** Cross-module path confirmed in architecture. Any missing hire UI action should be called out as a blocker, not skipped silently.

---

## TC-672 — E2E: Leave request to approval to balance update

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- Employee user with leave balance &gt; requested days.
- Approver with `leave.approve` (HR or manager).
- Leave type exists.

**Test Data:**
- Type: Annual/Casual (as seeded)
- Dates: two working days next week
- Balance before: note `remaining`

**Steps to Execute:**
1. Employee: `/portal/leave` apply.
2. Confirm `POST /api/leave/applications` → PENDING; approval request created if required.
3. Approver: `/approvals` approve **or** `POST /api/leave/applications/<id>/review` APPROVED.
4. Employee: refresh balances.
5. Attempt overlapping leave on the same dates.

**Expected Result:**
1. Application submitted.
2. Status PENDING; balance not yet reduced (record if the product reserves days immediately).
3. Status APPROVED.
4. Remaining balance decreased by `dayCount`.
5. HTTP 400 overlap.

**Postconditions:** Approved leave exists; balance reduced.

**Notes / Dependencies:** Confirmed leave.service overlap + approve.

---

## TC-673 — E2E: Invoice create to payment to paid

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:**
- Finance user.
- Client exists (`/finance/clients`).
- Invoice approver if workflow requires `invoice.approve`.

**Test Data:**
- Client: existing
- Line: qty 2, unit price 1000
- Manual payment: full total

**Steps to Execute:**
1. Create invoice with line items (`/finance/invoices`).
2. Submit for approval if DRAFT requires it; approve.
3. Send invoice.
4. Record manual payment for the full amount (`/finance/payments` or invoice detail).
5. Open invoice detail.

**Expected Result:**
1. Totals = qty × price (+ tax if any).
2. Status moves DRAFT → PENDING_APPROVAL → APPROVED (as implemented).
3. Status SENT.
4. Payment SUCCESS; `amountPaid` = total.
5. Invoice PAID.

**Postconditions:** Paid invoice in DB.

**Notes / Dependencies:** Skip Razorpay if keys missing; manual payment is the deterministic path.

---

## TC-674 — E2E: BD lead won to PM project creation

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- User with `bd.lead.update` and `pm.project.create` (admin).
- Contact + lead exist.

**Test Data:**
- Lead value &gt; 0
- Project code unique `QA-WON-1`

**Steps to Execute:**
1. Create contact and lead (`/bd/leads`).
2. Move lead to WON.
3. `POST /api/pm/projects` with `leadId` of the won lead.
4. Open `/pm/projects/<id>` and add a task + sprint.
5. Attempt a second project with the same `leadId`.

**Expected Result:**
1. Lead created.
2. Lead WON (`wonAt` set if implemented).
3. Project created and linked.
4. Task/sprint work.
5. HTTP 409 unique `Project.leadId`.

**Postconditions:** One project per won lead.

**Notes / Dependencies:** Confirmed unique leadId on Project.

---

## TC-675 — E2E: Asset assign and return lifecycle

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- HR with `asset.create` / `asset.manage`.
- Employee exists.
- Unique asset tag.

**Test Data:**
- Tag: `QA-LAP-001`
- Name: `QA Laptop`

**Steps to Execute:**
1. HR creates asset (`/hr/assets` or `/api/assets`) — status AVAILABLE.
2. Assign to employee.
3. Employee opens `/portal/assets` and sees it.
4. HR returns the asset.
5. Assign again to another employee (or same).

**Expected Result:**
1. AVAILABLE.
2. ASSIGNED; history row created.
3. Portal lists the asset.
4. AVAILABLE; employeeId cleared; portal list empty for that employee.
5. Second assign succeeds.

**Postconditions:** Asset AVAILABLE or reassigned.

**Notes / Dependencies:** Confirmed assign/return routes.

---

## TC-676 — E2E: Support ticket employee to resolution

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Employee with ticket create / portal.read.
- HR with `ticket.manage`.
- Optional SLA for the ticket priority.

**Test Data:**
- Subject: `VPN not connecting`
- Body: `Cannot reach VPN since morning`
- Priority: HIGH if the form allows

**Steps to Execute:**
1. Employee creates ticket `/portal/support`.
2. HR lists it via helpdesk/HR tickets; assigns to self.
3. HR replies (TC-613).
4. Employee replies on portal.
5. HR sets status RESOLVED then CLOSED.
6. Note SLA timestamps if present.

**Expected Result:**
1. Ticket OPEN; ticketNumber generated.
2. Assignee set.
3. Staff message visible to employee.
4. Employee message visible to HR.
5. Status CLOSED; employee cannot reopen unless product allows.
6. SLA due dates populated if policy exists.

**Postconditions:** Ticket CLOSED.

**Notes / Dependencies:** Portal vs helpdesk APIs both involved.

---

## TC-677 — E2E: Policy publish assign acknowledge

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- HR with policy permissions.
- Employee in a department used for assignment.

**Test Data:**
- Policy title: `E2E Code of Conduct`
- Assignment target: department or ALL

**Steps to Execute:**
1. HR creates policy `/hr/policies` (DRAFT).
2. Publish policy.
3. Assign to employee’s department (or ALL).
4. Employee opens `/portal/policies` and acknowledges.
5. HR views acknowledgements.
6. Employee acknowledges again.

**Expected Result:**
1. DRAFT created.
2. PUBLISHED.
3. Assignment exists.
4. POST acknowledge 200; recorded.
5. HR sees the employee.
6. HTTP 409 duplicate acknowledgement.

**Postconditions:** One acknowledgement row.

**Notes / Dependencies:** Unique (policyId, userId).

---

## TC-678 — E2E: Attendance correction approval

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Employee can clock / request correction.
- HR has `attendance.approve`.
- An attendance day exists (clock-in or HR-marked).

**Test Data:**
- Date: today or yesterday
- Requested status: PRESENT
- Reason: `Forgot to clock in`

**Steps to Execute:**
1. Employee submits correction `/portal/attendance`.
2. HR lists `GET /api/attendance/corrections?status=PENDING`.
3. HR approves.
4. GET attendance record for that date.
5. Employee submits another correction for an already-approved day (record actual).

**Expected Result:**
1. Correction PENDING.
2. Visible to HR.
3. Correction APPROVED.
4. Attendance status matches requested status.
5. Document whether a second pending correction is blocked.

**Postconditions:** Record corrected.

**Notes / Dependencies:** Confirmed correction review route.

---

## TC-679 — E2E: Reimbursement submit review pay

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Employee authenticated.
- Finance with `reimbursement.review`.
- Optional receipt upload (REIMBURSEMENT_RECEIPT purpose if in enum; Zod may use OTHER/DOCUMENT).

**Test Data:**
- Amount: 1500
- Description: `Client travel taxi`

**Steps to Execute:**
1. Employee submits reimbursement (`POST /api/finance/reimbursements` — auth only).
2. Finance lists `/finance/reimbursements`.
3. Finance approves review.
4. Finance mark-paid.
5. Employee confirms status in UI if shown.

**Expected Result:**
1. PENDING.
2. Visible to finance.
3. APPROVED.
4. PAID.
5. Employee sees PAID.

**Postconditions:** Reimbursement PAID.

**Notes / Dependencies:** Confirmed finance reimbursement routes.

---

## TC-680 — E2E: Recruitment interview to offer send

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- HR user.
- Application exists (from careers apply or HR-created candidate).

**Test Data:**
- Interview: tomorrow ISO, interviewer = HR user
- Offer: salary 1000000, start date next month

**Steps to Execute:**
1. `POST /api/recruitment/interviews` (or UI `/hr/interviews`).
2. Mark interview completed in UI/API if available.
3. Create offer `POST /api/recruitment/offers`.
4. Send `POST /api/recruitment/offers/<id>/send`.
5. Confirm `/hr/offers` shows SENT.

**Expected Result:**
1. Interview scheduled.
2. Interview COMPLETED (if status update exists).
3. Offer DRAFT.
4. Offer SENT; notification/email if configured (do not fail local if email disabled).
5. List shows SENT.

**Postconditions:** Offer SENT.

**Notes / Dependencies:** Confirmed recruitment offer send route.

---

## TC-681 — E2E: PM sprint planning to completion

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- User with full `pm.*` (admin).
- Project exists.

**Test Data:**
- Sprint name: `E2E Sprint`
- Two tasks: A (DONE), B (TODO)

**Steps to Execute:**
1. Create sprint PLANNING; add both tasks (`sprintId`).
2. PATCH sprint ACTIVE.
3. On `/pm/projects/<id>/board` or `/pm/sprints/<id>`, move task A to DONE.
4. Complete sprint (COMPLETED).
5. Verify task B still exists (TC-554 behavior).

**Expected Result:**
1. Sprint + tasks linked.
2. ACTIVE.
3. Task A DONE on kanban.
4. Sprint COMPLETED.
5. Task B not deleted; sprintId behavior documented.

**Postconditions:** Sprint COMPLETED.

**Notes / Dependencies:** Combines TC-551–554.

---

## TC-682 — E2E: Engineering release deploy rollback

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- User with engineering release create/update/deploy.
- Project exists.

**Test Data:**
- version: `2.1.0` (unique)
- name: `E2E deploy`

**Steps to Execute:**
1. Create release.
2. PATCH to STAGING (or whatever status shows Deploy).
3. Deploy.
4. Rollback.
5. Confirm statuses: PLANNING → STAGING → RELEASED → ROLLED_BACK.

**Expected Result:**
1. 201.
2. Deploy button visible.
3. RELEASED + deployedAt.
4. ROLLED_BACK.
5. Audit log entries DEPLOY and ROLLBACK if audit.read is checked.

**Postconditions:** Release ROLLED_BACK.

**Notes / Dependencies:** Combines TC-575–577. Watch frontend/API status enum mismatch.

---

## TC-683 — E2E: Document upload version permission

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Admin with document.manage.
- HR user for VIEW ACL.
- Finance user as unauthorized.

**Test Data:**
- File v1 and v2 PDFs
- ACL: HR VIEW only

**Steps to Execute:**
1. Upload v1; create document (TC-598).
2. Add v2 (TC-599).
3. Set ACL HR VIEW (TC-600).
4. HR GET document 200; finance GET 403 (TC-601).
5. HR cannot PUT permissions (TC-606) unless they have manage.

**Expected Result:**
1. Doc v1.
2. Current v2.
3. ACL saved.
4. HR allowed; finance denied.
5. HR cannot change ACL.

**Postconditions:** Restricted document in DMS.

**Notes / Dependencies:** Combines TC-598–606.

---

## TC-684 — E2E: Admin RBAC change affects user immediately

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- Super admin.
- A custom role assigned to a test user that includes `pm.project.read`.
- Test user logged in (second browser).

**Test Data:**
- Permission to remove: `pm.project.read`

**Steps to Execute:**
1. Test user `GET /api/pm/projects` → 200.
2. Admin removes `pm.project.read` from that role (`PUT /api/roles/:id/permissions/bulk` or remove).
3. **Without logout**, test user GET projects again (and refresh UI).
4. Restore permission (cleanup).

**Expected Result:**
1. 200.
2. Role updated.
3. Next API call 403 (permissions loaded per request from DB). UI nav should hide PM after refresh/`/api/auth/me` refetch.
4. Permission restored.

**Postconditions:** Role restored.

**Notes / Dependencies:** Confirmed requireAuth loads permissions from DB each request.

---

## TC-685 — E2E: Multi-tab session logout

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Admin logged in in two tabs of the same browser.

**Test Data:** None.

**Steps to Execute:**
1. Tab A and Tab B both show `/dashboard`.
2. Tab A: Logout.
3. Tab B: click a nav item or trigger GET `/api/auth/me`.

**Expected Result:**
1. Both authed.
2. Tab A at `/login`; cookies cleared.
3. Tab B gets 401 on API (refresh fails) and redirects to login. Brief stale UI before the next request is acceptable.

**Postconditions:** Logged out.

**Notes / Dependencies:** Refresh token revoked on logout.

---

## TC-686 — E2E: Report export download

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Admin with `report.export` or `report.read`.
- Some employees exist (seed).

**Test Data:**
- Type: ATTENDANCE or EXECUTIVE/headcount equivalent
- format: csv

**Steps to Execute:**
1. Login admin; open `/reports`.
2. Export CSV (TC-626).
3. Open file; confirm rows or headers related to employees/attendance.

**Expected Result:**
1. Reports UI.
2. File downloads.
3. Not an empty error HTML page.

**Postconditions:** File on disk.

**Notes / Dependencies:** Combines TC-625–627.

---

## TC-687 — E2E: Announcement publish employee sees

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Admin `announcement.manage`.
- Employee/HR user without manage (reader).

**Test Data:**
- Title: `E2E all-hands`
- audience: `ALL`

**Steps to Execute:**
1. Admin creates + publishes announcement.
2. Employee logs in (or already logged in; refresh `/portal/notifications` or GET announcements).
3. Confirm visibility.
4. Admin deletes/expires it; employee refresh.

**Expected Result:**
1. Published.
2. Employee sees title/body.
3. Matches GET `/api/notifications/announcements`.
4. No longer visible.

**Postconditions:** Announcement removed or expired.

**Notes / Dependencies:** Combines TC-618–621.

---

## TC-688 — E2E: Salary revision approve new structure

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Payroll user with structure + revision permissions.
- Employee with an ACTIVE salary structure.
- Approver with `salary_revision.approve` if different from requester.

**Test Data:**
- Increase basic by a known amount (e.g. +5000)

**Steps to Execute:**
1. `POST /api/payroll/salary-revisions` for the employee.
2. Approve revision.
3. `GET /api/payroll/salary-structures/active/<employeeId>`.
4. Confirm previous structure SUPERSEDED.
5. Optional: next payroll run uses new components.

**Expected Result:**
1. Revision PENDING.
2. APPROVED.
3. Active structure reflects new components.
4. Only one ACTIVE structure.
5. New amounts appear in run calculate breakdown.

**Postconditions:** New ACTIVE structure.

**Notes / Dependencies:** Confirmed payroll salary revision flow.

---

## TC-689 — E2E: Approval workflow multi-level invoice

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Admin can configure `/admin/approval-workflows` for invoices (entity type invoice) with **two** levels (e.g. finance then admin).
- Finance user = L1; admin = L2.
- Client + DRAFT invoice exist.

**Test Data:**
- Two workflow levels with distinct approver roles/users

**Steps to Execute:**
1. Ensure a 2-level invoice workflow is active.
2. Finance creates invoice and submits (`POST /api/finance/invoices/:id/submit`).
3. L1 approves (`POST /api/approvals/:id/approve` or invoice approve).
4. Confirm invoice not fully approved yet (`currentLevel` advanced).
5. L2 approves.
6. Invoice status APPROVED (or equivalent).

**Expected Result:**
1. Workflow exists.
2. Approval request created at level 1.
3. L1 success; still pending L2.
4. L1 cannot skip L2.
5. L2 success; request APPROVED.
6. Invoice approved and can be sent.

**Postconditions:** Invoice approved via 2 levels.

**Notes / Dependencies:** If only a single-level invoice approve route exists (`invoice.approve`), still verify workflow engine path `POST /api/approvals/:id/approve`.

---

## TC-690 — E2E: Public careers to candidate portal

**Module:** E2E Journeys  
**Feature:** End-to-end business workflows  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- At least one PUBLISHED job on `/careers`.
- Guest browser (logged out).

**Test Data:**
- Email: `e2e.candidate@example.com`
- Password meeting policy (min 8 + complexity flags)
- Job slug: published job

**Steps to Execute:**
1. Open `/careers`; open job detail; go to apply/register.
2. `POST /api/careers/register` (or UI `/careers/register`) then login if required.
3. Apply to the job (`/careers/<slug>/apply`) with resume.
4. Login as the candidate; open `/candidate/dashboard` (or “My Applications” nav).
5. Confirm the application is listed.
6. As candidate, open `/hr/pipeline` (must be denied).

**Expected Result:**
1. Public pages work without auth.
2. Candidate user created with candidate role.
3. Application created; duplicate apply 409.
4. Candidate dashboard shows the application.
5. Status matches HR pipeline (APPLIED/screening).
6. HTTP 403 / UI hidden — candidate cannot access HR modules.

**Postconditions:** Candidate account + application exist.

**Notes / Dependencies:** Candidate nav `roles: ["candidate"]`. Careers routes are public.

---

## Coverage recap (this file)

| Range | Count | Focus |
|-------|-------|--------|
| TC-551 – TC-574 | 24 | PM sprints, time, team, budget, attachments |
| TC-575 – TC-596 | 22 | Engineering releases, tests, docs, training, reviews, metrics |
| TC-597 – TC-606 | 10 | DMS categories, versions, ACL |
| TC-607 – TC-616 | 10 | Helpdesk, SLA, KB |
| TC-617 – TC-624 | 8 | Notifications & announcements |
| TC-625 – TC-634 | 10 | Reports KPIs, export, schedules |
| TC-635 – TC-644 | 10 | Storage presign/confirm/RBAC |
| TC-645 – TC-670 | 26 | Cross-cutting UI, errors, security |
| TC-671 – TC-690 | 20 | End-to-end journeys |
| **Total** | **140** | TC-551 through TC-690, no skipped IDs |

**Known gaps to log, not invent:**
- Portal `/api/timesheets` client vs missing API router (TC-562, TC-572)
- No DELETE for PM time entries / team allocations (use PATCH `leftAt`)
- Time hours and budget amount have weak/no max or negativity rules in Zod
- Release status enum may differ between web `ReleaseStatus` and API Zod
- No login rate limiter found (TC-670)
