# Test Cases TC-251 to TC-382 — Detailed Executable Cases

**Scope:** HR assets & tickets, employee portal, attendance, leave, approval workflows  
**Base URLs:** Web `http://localhost:3000` · API `http://localhost:4000`  
**Auth:** Login via UI or `POST /api/auth/login` (httpOnly cookies)  
**Response envelope:** `{ data, error, meta }`  

**Seed users:**
| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@workforce360.com` | `Admin@123` |
| HR | `hr@workforce360.com` | `Hr@123456` |
| Finance | `finance@workforce360.com` | `Finance@123` |
| Payroll | `payroll@workforce360.com` | `Payroll@123` |

Create an **employee** user (role `employee`, with `portal.read` / `portal.update` / `ticket.create`) for portal cases. HR and admin are not a substitute for “employee cannot …”.

**Confirmed enums / paths:**
- Asset status: `AVAILABLE` \| `ASSIGNED` \| `MAINTENANCE` \| `RETIRED`
- Ticket status: `OPEN` \| `IN_PROGRESS` \| `WAITING_ON_EMPLOYEE` \| `RESOLVED` \| `CLOSED`
- Ticket priority: `LOW` \| `MEDIUM` \| `HIGH` \| `URGENT`
- Attendance status: `PRESENT` \| `ABSENT` \| `HALF_DAY` \| `ON_LEAVE` \| `HOLIDAY` \| `WEEKEND`
- Correction: `PENDING` \| `APPROVED` \| `REJECTED`
- Leave application: `PENDING` \| `APPROVED` \| `REJECTED` \| `CANCELLED`
- Clock API: `POST /api/attendance/clock-in` · `POST /api/attendance/clock-out` · `GET /api/attendance/records`
- Leave types API: `/api/leave/types` (not `/api/leave/policies`)
- Portal payslips: `GET /api/portal/payslips` · `GET /api/portal/payslips/:id/download`

**UI vs API mismatches (log as defects if UI is used):**
- Portal attendance calls `/api/attendance/check-in`, `/check-out`, `/today` — those routes are **not** on `attendance.routes.ts`. Prefer API `clock-in` / `clock-out` / `records` unless aliases are added.
- Portal leave calls `/api/leave/policies` and body `policyId` — API uses `/api/leave/types` and `leaveTypeId`.

---

## Shared setup

1. Login as HR; note `employeeId` of a test employee (seed HR is `EMP002` or hire from TC-225).
2. Login as that employee in a second browser/profile for portal + clock + leave apply.
3. Keep admin for approval workflows and MFA-admin cases.

---

## TC-251 — HR list assets

**Module:** HR Operations  
**Feature:** Assets (HR view)  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** HR with `asset.read`. At least one asset (create in TC-252 if empty).

**Test Data:** `/hr/assets` · `GET /api/hr/assets` and/or `GET /api/assets`

**Steps to Execute:**
1. Login as HR; open `/hr/assets`.
2. Confirm table columns: name, tag, status, assignee.
3. `GET /api/hr/assets` with HR cookies.

**Expected Result:**
1. Page loads (not 403).
2. Rows show tag, status badge (`AVAILABLE`/`ASSIGNED`/…), assignee when assigned.
3. HTTP 200; `data` is an array.

**Postconditions:** None.

**Notes / Dependencies:** Dedicated module is `/api/assets` (`asset.read`). HR also exposes `/api/hr/assets`.

---

## TC-252 — HR create asset

**Module:** HR Operations  
**Feature:** Assets (HR view)  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** HR with `asset.create`.

**Test Data:**
```json
{
  "name": "QA Laptop 14",
  "tag": "QA-LAP-251",
  "category": "Laptop",
  "serialNumber": "SN-QA-0001"
}
```

**Steps to Execute:**
1. On `/hr/assets`, open create sheet; submit the data above.
2. Confirm `POST /api/hr/assets` or `POST /api/assets`.
3. GET the new asset.

**Expected Result:**
1. HTTP 201/200.
2. `status` is `AVAILABLE`; `employeeId` null.
3. Row appears in the list.

**Postconditions:** Save `assetId`.

**Notes / Dependencies:** `createAssetSchema`: `name` + `tag` required. Dedicated service sets `AVAILABLE` and writes history.

---

## TC-253 — HR assign asset to employee

**Module:** HR Operations  
**Feature:** Assets (HR view)  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** `AVAILABLE` asset (`assetId`). Employee id. Permission: HR assign uses `asset.update` on `/api/hr/assets/:id/assign`; dedicated assign uses `asset.manage` on `POST /api/assets/:id/assign`.

**Test Data:** `{ "employeeId": "<employeeId>" }`

**Steps to Execute:**
1. On `/hr/assets`, assign the asset to the employee.
2. Confirm POST assign.
3. GET asset; open `/portal/assets` as that employee.

**Expected Result:**
1. HTTP 200.
2. `status` `ASSIGNED`; `employeeId` set; `assignedAt` set (dedicated module).
3. Employee sees the asset on portal.

**Postconditions:** Asset ASSIGNED.

**Notes / Dependencies:** Dedicated `assignAsset` requires current status `AVAILABLE` (`ASSET_NOT_AVAILABLE`).

---

## TC-254 — Assign already-assigned asset fails

**Module:** HR Operations  
**Feature:** Assets (HR view)  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Asset already ASSIGNED (TC-253). Second employee id.

**Test Data:** `{ "employeeId": "<otherEmployeeId>" }`

**Steps to Execute:**
1. `POST /api/assets/<assetId>/assign` with another employee (dedicated module).
2. Repeat via `POST /api/hr/assets/<assetId>/assign` if that is what the UI uses.

**Expected Result:**
1. Dedicated API: HTTP 400 `ASSET_NOT_AVAILABLE` (“Asset is not available for assignment”).
2. **HR helper `hr.service.assignAsset` does not check status** — it may overwrite assignee (HTTP 200). If UI uses HR route, log **gap vs dedicated module**. Compact expected 400 — pass dedicated, flag HR path.

**Postconditions:** Prefer asset still assigned to original employee.

**Notes / Dependencies:** Confirmed `asset.service.ts` vs `hr.service.ts`.

---

## TC-255 — HR asset list filter by status

**Module:** HR Operations  
**Feature:** Assets (HR view)  
**Scenario Type:** UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Mix of AVAILABLE and ASSIGNED assets. `asset.read`.

**Test Data:** `GET /api/hr/assets?status=AVAILABLE` · `?status=ASSIGNED`  
(`listAssetsQuerySchema` supports `status`, `employeeId`)

**Steps to Execute:**
1. Filter AVAILABLE in UI or query string.
2. Filter ASSIGNED.
3. Filter `employeeId`.

**Expected Result:**
1. Only AVAILABLE rows.
2. Only ASSIGNED rows.
3. Only that employee’s assets.

**Postconditions:** Clear filters.

**Notes / Dependencies:** Confirmed query schema.

---

## TC-256 — Asset list without asset.read returns 403

**Module:** HR Operations  
**Feature:** Assets (HR view)  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee **without** `asset.read` (portal user).

**Test Data:** `GET /api/hr/assets` · `GET /api/assets`

**Steps to Execute:**
1. Login as employee.
2. GET both asset list endpoints.
3. Open `/hr/assets`.

**Expected Result:**
1. Employee session.
2. HTTP 403.
3. Nav hidden / permission error. Portal `/portal/assets` may still work (`portal.read` + own assets).

**Postconditions:** None.

**Notes / Dependencies:** HR and `/api/assets` both require `asset.read`.

---

## TC-257 — Asset tag uniqueness

**Module:** HR Operations  
**Feature:** Assets (HR view)  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Tag `QA-LAP-251` exists. `asset.create`.

**Test Data:** Same tag, different name.

**Steps to Execute:**
1. `POST /api/assets` with duplicate `tag`.
2. Inspect status/code.

**Expected Result:**
1. Dedicated service: HTTP **400** `DUPLICATE_ASSET_TAG` (not necessarily 409).
2. Prisma unique on tag may surface as 409 if HR create skips the service check — record actual. Compact expected 409 — **accept 400 with duplicate code**.

**Postconditions:** No second row with that tag.

**Notes / Dependencies:** `asset.service.createAsset` explicit duplicate check.

---

## TC-258 — Asset detail view

**Module:** HR Operations  
**Feature:** Assets (HR view)  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `asset.read`. Known `assetId`.

**Test Data:** `GET /api/assets/<assetId>` · UI row/detail.

**Steps to Execute:**
1. Open asset in `/hr/assets` (row expand or detail).
2. GET by id.
3. GET unknown id.

**Expected Result:**
1. Name, tag, category, status, assignee visible.
2. HTTP 200.
3. HTTP 404.

**Postconditions:** None.

**Notes / Dependencies:** Dedicated GET `/:id` with `asset.read`.

---

## TC-259 — HR list support tickets

**Module:** HR Operations  
**Feature:** Tickets (HR view)  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** HR with `ticket.read`. Create a portal ticket first if list is empty (TC-315).

**Test Data:** `/hr/tickets` · `GET /api/hr/tickets`

**Steps to Execute:**
1. Open `/hr/tickets`.
2. Confirm columns: number, subject, status, priority, assignee.
3. GET API.

**Expected Result:**
1. Page loads.
2. Status/priority badges match enums.
3. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** Nav `/hr/tickets`.

---

## TC-260 — HR view ticket detail

**Module:** HR Operations  
**Feature:** Tickets (HR view)  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `ticket.read`. Known `ticketId`.

**Test Data:** `GET /api/hr/tickets/<ticketId>`

**Steps to Execute:**
1. Click a ticket on `/hr/tickets`.
2. Confirm message thread, SLA due timestamps if present.
3. GET unknown id.

**Expected Result:**
1. Detail loads.
2. Description + replies; `ticketNumber`; optional `firstResponseDueAt` / `resolutionDueAt`.
3. HTTP 404.

**Postconditions:** None.

**Notes / Dependencies:** SLA from `ticket-sla.ts`.

---

## TC-261 — HR assign ticket to agent

**Module:** HR Operations  
**Feature:** Tickets (HR view)  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** OPEN ticket. HR with `ticket.manage`. Assignee user id (HR).

**Test Data:** `POST /api/hr/tickets/<ticketId>/assign` `{ "assigneeId": "<hrUserId>" }`

**Steps to Execute:**
1. Assign in UI or POST.
2. GET ticket.
3. POST `{ "assigneeId": null }` to unassign if supported.

**Expected Result:**
1. HTTP 200.
2. `assigneeId` set.
3. Null unassign 200 if schema allows (`assigneeId` nullable).

**Postconditions:** Ticket assigned.

**Notes / Dependencies:** `assignTicketSchema.assigneeId` nullable. Permission `ticket.manage`.

---

## TC-262 — HR update ticket status

**Module:** HR Operations  
**Feature:** Tickets (HR view)  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `ticket.manage`. Assigned ticket.

**Test Data:** `PATCH /api/hr/tickets/<id>/status` `{ "status": "RESOLVED" }`  
Also `IN_PROGRESS`, `CLOSED`.

**Steps to Execute:**
1. PATCH IN_PROGRESS.
2. PATCH RESOLVED.
3. PATCH `{ "status": "DONE" }`.

**Expected Result:**
1. HTTP 200.
2. HTTP 200; status RESOLVED (enum value is `RESOLVED`, not `RESOLVED` vs compact `RESOLVED` — matches).
3. HTTP 400 invalid enum.

**Postconditions:** Ticket RESOLVED or CLOSED.

**Notes / Dependencies:** `updateTicketStatusSchema`. Compact said RESOLVED — valid.

---

## TC-263 — HR reply to ticket

**Module:** HR Operations  
**Feature:** Tickets (HR view)  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `ticket.manage`. Open/in-progress ticket.

**Test Data:** `POST /api/hr/tickets/<id>/replies` `{ "body": "Please try restarting VPN.", "setWaiting": true }`

**Steps to Execute:**
1. Post staff reply in UI.
2. GET ticket; confirm thread.
3. POST `{ "body": "" }`.

**Expected Result:**
1. HTTP 200/201; staff message stored.
2. Body visible; if `setWaiting` true, status may become `WAITING_ON_EMPLOYEE`.
3. HTTP 400 (`body` min 1, max 5000).

**Postconditions:** Reply exists.

**Notes / Dependencies:** `ticketReplySchema`.

---

## TC-264 — Ticket assign without ticket.manage returns 403

**Module:** HR Operations  
**Feature:** Tickets (HR view)  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee with `ticket.create` / `portal.read` only. Known ticket id.

**Test Data:** `POST /api/hr/tickets/<id>/assign` `{ "assigneeId": "<self>" }`

**Steps to Execute:**
1. As employee, POST assign.
2. PATCH status RESOLVED as employee.

**Expected Result:**
1. HTTP 403.
2. HTTP 403.

**Postconditions:** Ticket unchanged.

**Notes / Dependencies:** Assign/status/replies require `ticket.manage`. Employee uses `/api/portal/tickets`.

---

## TC-265 — Ticket SLA due date calculated

**Module:** HR Operations  
**Feature:** Tickets (HR view)  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- SLA policy for HIGH exists (`/hr/sla-policies`, TC-609) with known `firstResponseMinutes` / `resolutionMinutes`.
- Employee can create tickets.

**Test Data:** Portal create `{ "subject": "VPN down", "description": "Cannot connect", "priority": "HIGH" }`

**Steps to Execute:**
1. Create HIGH priority ticket from `/portal/support`.
2. GET `/api/hr/tickets/<id>` as HR.
3. Compare `firstResponseDueAt` ≈ createdAt + firstResponseMinutes.

**Expected Result:**
1. HTTP 201; ticket OPEN.
2. SLA fields populated when a matching SlaPolicy exists; else both due dates null.
3. Arithmetic matches `calculateSlaDueDates` in `ticket-sla.ts`.

**Postconditions:** Ticket exists.

**Notes / Dependencies:** Priority aliases map `high` → `HIGH`. Ticket number `TKT-YYYYMMDD-xxxx`.

---

## TC-266 — Ticket number auto-generated

**Module:** HR Operations  
**Feature:** Tickets (HR view)  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Employee creates a ticket (TC-315).

**Test Data:** New ticket.

**Steps to Execute:**
1. Create ticket.
2. Read `ticketNumber`.
3. Create a second ticket; compare numbers.

**Expected Result:**
1. HTTP 201.
2. Format `TKT-YYYYMMDD-<4 hex>` (UTC date).
3. Unique numbers.

**Postconditions:** Two tickets.

**Notes / Dependencies:** `generateTicketNumber`.

---

## TC-267 — Portal dashboard loads for employee

**Module:** Employee Portal  
**Feature:** Dashboard & Profile  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee with `portal.read`.

**Test Data:** `/portal/dashboard`

**Steps to Execute:**
1. Login as employee; open `/portal/dashboard`.
2. Confirm widgets / quick links (attendance, leave, payslips, support).
3. Confirm `GET /api/portal/dashboard`.

**Expected Result:**
1. Dashboard (not admin metrics).
2. Portal shortcuts visible.
3. HTTP 200 personal payload.

**Postconditions:** None.

**Notes / Dependencies:** Permission `portal.read`. Nav `/portal/dashboard`.

---

## TC-268 — Portal profile view

**Module:** Employee Portal  
**Feature:** Dashboard & Profile  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `portal.read`.

**Test Data:** `/portal/profile` · `GET /api/portal/profile`

**Steps to Execute:**
1. Open `/portal/profile`.
2. Confirm name, email, department, manager (if linked).
3. GET profile API.

**Expected Result:**
1. Page loads.
2. Identity + org fields shown; email visible.
3. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** GET requires `portal.read`.

---

## TC-269 — Portal profile update allowed fields

**Module:** Employee Portal  
**Feature:** Dashboard & Profile  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `portal.update`.

**Test Data:**
```json
{
  "firstName": "Testy",
  "lastName": "Employee",
  "phone": "9876543210",
  "emergencyContactName": "Pat Parent",
  "emergencyContactPhone": "9123456780"
}
```

**Steps to Execute:**
1. PATCH `/api/portal/profile` (or UI save).
2. GET profile.
3. Reload UI.

**Expected Result:**
1. HTTP 200.
2. Phone and emergency contacts updated; names updated.
3. UI matches.

**Postconditions:** Profile updated (restore names if needed).

**Notes / Dependencies:** `updatePortalProfileSchema` — **no email, no address**. Compact “address” is **not** in the schema.

---

## TC-270 — Portal profile cannot change email

**Module:** Employee Portal  
**Feature:** Dashboard & Profile  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `portal.update`.

**Test Data:** `{ "email": "hacked@example.com" }`

**Steps to Execute:**
1. Inspect profile form — email control.
2. `PATCH /api/portal/profile` with `email`.
3. GET profile.

**Expected Result:**
1. Email is read-only in UI.
2. Extra `email` is ignored (Zod strips unknown) or 400 — email must **not** change.
3. Original email remains.

**Postconditions:** Email unchanged.

**Notes / Dependencies:** Email is not in `updatePortalProfileSchema`.

---

## TC-271 — Portal dashboard API

**Module:** Employee Portal  
**Feature:** Dashboard & Profile  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Employee with `portal.read`.

**Test Data:** `GET /api/portal/dashboard`

**Steps to Execute:**
1. GET as employee.
2. Confirm payload is scoped to self (no other employees’ PII).

**Expected Result:**
1. HTTP 200.
2. Personal widgets/counts only.

**Postconditions:** None.

**Notes / Dependencies:** `requirePermission("portal.read")`.

---

## TC-272 — Portal without portal.read returns 403

**Module:** Employee Portal  
**Feature:** Dashboard & Profile  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** User **without** `portal.read` (e.g. candidate-only, or stripped role). If every seed user has portal.read, create a custom role with no portal perms.

**Test Data:** `GET /api/portal/dashboard`

**Steps to Execute:**
1. Login as that user.
2. GET portal dashboard and profile.
3. Open `/portal/dashboard`.

**Expected Result:**
1. Session exists.
2. HTTP 403.
3. Nav/page gated.

**Postconditions:** None.

**Notes / Dependencies:** Unauthenticated is 401 + login redirect (TC-337).

---

## TC-273 — Profile update validation

**Module:** Employee Portal  
**Feature:** Dashboard & Profile  
**Scenario Type:** Validation  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `portal.update`.

**Test Data:** `{ "firstName": "" }` · `{ "phone": "" }` (empty string allowed — optional)

**Steps to Execute:**
1. PATCH `firstName: ""`.
2. PATCH `{}`.
3. Submit UI with firstName cleared if the field is shown.

**Expected Result:**
1. HTTP 400 (`firstName` min 1 if sent).
2. HTTP 200 no-op (all fields optional).
3. Inline error if UI requires name.

**Postconditions:** Profile valid.

**Notes / Dependencies:** Phone has **no** min length in Zod — empty phone is allowed. Compact “empty phone 400” may **not** fail API.

---

## TC-274 — Portal nav shows enabled modules

**Module:** Employee Portal  
**Feature:** Dashboard & Profile  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Employee with portal permissions.

**Test Data:** Sidebar portal group.

**Steps to Execute:**
1. Login as employee; inspect sidebar.
2. Confirm links: dashboard, profile, security, attendance, leave, timesheets, payslips, assets, documents, policies, notifications, preferences, support.
3. Confirm HR/admin groups hidden.

**Expected Result:**
1. Portal section visible.
2. Items match `navigation.ts` (module-availability may hide timesheets/requests).
3. `/hr/*` and `/admin/*` not shown.

**Postconditions:** None.

**Notes / Dependencies:** `/portal/requests` may be a coming-soon flag.

---

## TC-275 — Portal profile shows employment status

**Module:** Employee Portal  
**Feature:** Dashboard & Profile  
**Scenario Type:** Positive / UI  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Employee has lifecycle/employment status on master record.

**Test Data:** `/portal/profile` or dashboard.

**Steps to Execute:**
1. Open profile/dashboard.
2. Look for lifecycle / employment status (ACTIVE, etc.).
3. If missing, GET `/api/portal/profile` and `/api/portal/dashboard`.

**Expected Result:**
1. Page loads.
2. Status displayed **or** only in API — record actual (do not fail UI if API has it and UI omits).
3. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** Confirm payload keys.

---

## TC-276 — Portal dashboard loading state

**Module:** Employee Portal  
**Feature:** Dashboard & Profile  
**Scenario Type:** UI  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Employee logged in. Slow 3G throttle.

**Test Data:** `/portal/dashboard`

**Steps to Execute:**
1. Throttle network; hard refresh.
2. Observe skeleton/spinner.
3. Restore network.

**Expected Result:**
1. Request in flight.
2. Loading UI, then widgets.
3. No crash.

**Postconditions:** Network restored.

**Notes / Dependencies:** None.

---

## TC-277 — Clock in for today

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** Positive / E2E / API  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee authenticated. No clock-in yet today. Use a weekday if possible.

**Test Data:** `POST /api/attendance/clock-in` `{ "date": "<today YYYY-MM-DD>" }` optional.

**Steps to Execute:**
1. As employee, POST clock-in (API).
2. GET ` /api/attendance/records?employeeId=<id>&from=<today>&to=<today>` as HR **or** employee if allowed.
3. Open `/portal/attendance` and click Clock In (UI calls `/api/attendance/check-in` — record 404 vs success).

**Expected Result:**
1. HTTP 200; `status` `PRESENT`; `checkInTime` set. Code `ALREADY_CLOCKED_IN` on retry.
2. Record exists for today.
3. If UI 404, log **frontend path mismatch**; API case still passes.

**Postconditions:** Clocked in today.

**Notes / Dependencies:** Clock-in is `requireAuth` only (no `attendance.manage`). Confirmed `attendance.service.ts`.

---

## TC-278 — Clock out after clock in

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** TC-277 clock-in done.

**Test Data:** `POST /api/attendance/clock-out` `{}`

**Steps to Execute:**
1. Wait at least a few seconds (or pass `checkOutTime` ISO after check-in).
2. POST clock-out.
3. GET record; note `workHours`.

**Expected Result:**
1. HTTP 200.
2. `checkOutTime` set.
3. `workHours` = (checkOut − checkIn) in hours (float). Second clock-out → 400 `ALREADY_CLOCKED_OUT`.

**Postconditions:** Clocked out.

**Notes / Dependencies:** Confirmed workHours calculation.

---

## TC-279 — Double clock-in same day rejected

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Already clocked in today (re-clock-in before clock-out, or after TC-277).

**Test Data:** Second `POST /api/attendance/clock-in`

**Steps to Execute:**
1. POST clock-in again for today.
2. Inspect `error.code`.

**Expected Result:**
1. HTTP 400 `ALREADY_CLOCKED_IN` (“Already clocked in for this date”).
2. Single checkInTime.

**Postconditions:** Unchanged.

**Notes / Dependencies:** Unique `(employeeId, date)` also exists; service checks first.

---

## TC-280 — Clock out without clock in fails

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee with **no** check-in for a chosen date (use tomorrow’s `date` in body, or a fresh user).

**Test Data:** `POST /api/attendance/clock-out` `{ "date": "<date-with-no-check-in>" }`

**Steps to Execute:**
1. POST clock-out without prior clock-in.
2. Inspect code.

**Expected Result:**
1. HTTP 400 `NOT_CLOCKED_IN` (“Must clock in before clocking out”).
2. No checkOutTime invented.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed service.

---

## TC-281 — Clock in requires auth only (no attendance.manage)

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** API / Security / Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee **without** `attendance.manage` / `attendance.read`.

**Test Data:** `POST /api/attendance/clock-in`

**Steps to Execute:**
1. As employee, POST clock-in (pick a date not already used, or clock-out first).
2. As employee, `GET /api/attendance/records`.
3. Unauthenticated POST clock-in.

**Expected Result:**
1. HTTP 200 (auth only).
2. HTTP **403** — list requires `attendance.read` (employee may be unable to list via this API; portal UI may break — log gap).
3. HTTP 401.

**Postconditions:** Attendance row may exist.

**Notes / Dependencies:** Compact expected employee can use clock-in — **confirmed**. List is stricter.

---

## TC-282 — Attendance history on portal

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Some month records exist. Employee on `/portal/attendance`.

**Test Data:** Calendar month.

**Steps to Execute:**
1. Open `/portal/attendance`.
2. Change month; observe calendar/list.
3. Note whether list uses `GET /api/attendance/records?from&to` or `GET /api/attendance?startDate&endDate`.

**Expected Result:**
1. Page loads.
2. Past PRESENT days shown if the list API succeeds.
3. If UI uses `/api/attendance?startDate=` and gets 404, log mismatch; verify history via HR `GET /api/attendance/records`.

**Postconditions:** None.

**Notes / Dependencies:** API list is `GET /api/attendance/records` with `from`/`to`.

---

## TC-283 — Request attendance correction

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee auth. A past date to correct (e.g. yesterday ABSENT or missed clock).

**Test Data:**
```json
{
  "date": "<yesterday YYYY-MM-DD>",
  "requestedStatus": "PRESENT",
  "reason": "Forgot to clock in; was in office 09:05–18:00"
}
```

**Steps to Execute:**
1. `POST /api/attendance/corrections` as employee.
2. As HR, `GET /api/attendance/corrections?status=PENDING`.

**Expected Result:**
1. HTTP 201/200; correction `PENDING`.
2. HR sees the request (`attendance.read` or `attendance.approve`).

**Postconditions:** Save `correctionId`.

**Notes / Dependencies:** `reason` min 1 max 1000. `requestedStatus` same attendance enum. Auth only to create.

---

## TC-284 — Correction reason required

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee auth.

**Test Data:** `{ "date": "2026-08-17", "requestedStatus": "PRESENT", "reason": "" }`

**Steps to Execute:**
1. POST corrections with empty reason.
2. POST missing reason.
3. POST missing date.

**Expected Result:**
1. HTTP 400 (min 1).
2. HTTP 400.
3. HTTP 400 (YYYY-MM-DD required).

**Postconditions:** No correction.

**Notes / Dependencies:** Confirmed schema.

---

## TC-285 — Correction reason max 1000 boundary

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** Boundary  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Employee auth.

**Test Data:** reason length 1000 vs 1001.

**Steps to Execute:**
1. POST reason of 1000 characters.
2. POST 1001 characters.

**Expected Result:**
1. HTTP 201/200.
2. HTTP 400 max 1000.

**Postconditions:** Optional PENDING correction.

**Notes / Dependencies:** `z.string().min(1).max(1000)`.

---

## TC-286 — Clock in on weekend (edge)

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** Edge  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Employee auth. Choose a Saturday `date` in the body (do not wait for a real Saturday).

**Test Data:** `{ "date": "<Saturday YYYY-MM-DD>" }`

**Steps to Execute:**
1. POST clock-in with Saturday date.
2. GET record.

**Expected Result:**
1. HTTP 200 — **service does not block weekends**. Status is still `PRESENT`.
2. Record exists. If product should warn, log gap. Compact “document behaviour”.

**Postconditions:** Weekend PRESENT record.

**Notes / Dependencies:** No weekend guard in `clockIn`.

---

## TC-287 — Clock in with optional shiftId

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Shift exists (TC-341). Employee clock-in for a date not used.

**Test Data:** `{ "date": "<free date>", "shiftId": "<shiftId>" }`

**Steps to Execute:**
1. POST clock-in with shiftId.
2. GET record.

**Expected Result:**
1. HTTP 200.
2. `shiftId` stored.

**Postconditions:** Record linked to shift.

**Notes / Dependencies:** `clockInSchema.shiftId` optional.

---

## TC-288 — Attendance page shows today's status

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Employee; today’s record from TC-277.

**Test Data:** `/portal/attendance`

**Steps to Execute:**
1. Open the page.
2. Look for today’s badge (PRESENT / not clocked in).
3. If UI calls `/api/attendance/today` and 404s, badge may never load — log defect; confirm via clock-in API.

**Expected Result:**
1. Page renders.
2. Today’s status visible **if** today API exists. Otherwise API records still have PRESENT.
3. Document UI vs `GET /api/attendance/records`.

**Postconditions:** None.

**Notes / Dependencies:** `getToday` is **not** in attendance.routes.ts.

---

## TC-289 — Rapid clock in/out clicks

**Module:** Employee Portal  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** Edge  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Employee; date with no record (or new date in body).

**Test Data:** Parallel double POST clock-in.

**Steps to Execute:**
1. Fire two clock-in requests at once for the same date.
2. Count rows for employee+date.
3. Double-click Clock In in UI if the button is not disabled.

**Expected Result:**
1. One 200 and one 400 `ALREADY_CLOCKED_IN`, **or** one 200 and one 409 unique constraint.
2. Exactly one record.
3. UI should disable while pending (if not, log UX gap).

**Postconditions:** Single record.

**Notes / Dependencies:** Unique `@@unique([employeeId, date])`.

---

## TC-290 — Attendance stats

**Module:** Employee Portal / Attendance  
**Feature:** Attendance Clock In/Out  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** User with `attendance.read` (HR). Employee clock-ins exist.

**Test Data:** `GET /api/attendance/stats`

**Steps to Execute:**
1. As HR, GET stats.
2. As employee without `attendance.read`, GET stats.
3. Compare present/absent counts to records (spot-check).

**Expected Result:**
1. HTTP 200; aggregate counts.
2. HTTP 403.
3. Plausible numbers.

**Postconditions:** None.

**Notes / Dependencies:** Stats require `attendance.read` — **not** on portal permission. Portal “monthly summary” may be client-side from list.

---

## TC-291 — Apply for leave

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Positive / E2E / API  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- Leave type exists (TC-365) with balance (TC-367) ≥ requested days.
- Employee authenticated.
- Prefer type with `requiresApproval: true`.

**Test Data:**
```json
{
  "leaveTypeId": "<id>",
  "startDate": "<next Monday YYYY-MM-DD>",
  "endDate": "<that Monday>",
  "reason": "Personal appointment"
}
```

**Steps to Execute:**
1. `POST /api/leave/applications` as employee.
2. GET application as HR (`leave.read`).
3. Try UI `/portal/leave` (sends `policyId` to `/api/leave/policies` — record mismatch).

**Expected Result:**
1. HTTP 201/200; `status` `PENDING` if `requiresApproval`, else `APPROVED` (auto) and balance deducted immediately.
2. HR sees the application.
3. UI may 404 — log gap; API case still passes.

**Postconditions:** Save `leaveApplicationId`.

**Notes / Dependencies:** Apply is `requireAuth` only. `reason` required. Date format YYYY-MM-DD.

---

## TC-292 — Leave approval reduces balance

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** PENDING application (TC-291) with `requiresApproval`. HR/manager with `leave.approve`. Balance known (`remaining` before).

**Test Data:** `POST /api/leave/applications/<id>/review` `{ "decision": "APPROVED" }`

**Steps to Execute:**
1. GET `/api/leave/balances?employeeId=&leaveTypeId=&year=`.
2. POST review APPROVED.
3. GET balances again.
4. GET application.

**Expected Result:**
1. Note `used` / remaining.
2. HTTP 200.
3. `used` increased by `dayCount`; remaining decreased.
4. Status `APPROVED`.

**Postconditions:** Leave APPROVED.

**Notes / Dependencies:** If type auto-approves on apply, deduction already happened at TC-291.

---

## TC-293 — Apply leave exceeding balance rejected

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** Balance remaining 1 (or 0). Employee auth.

**Test Data:** Range whose inclusive calendar `dayCount` > remaining (e.g. 10 days).

**Steps to Execute:**
1. POST application with too many days.
2. Inspect `error.code`.

**Expected Result:**
1. HTTP 400 `INSUFFICIENT_LEAVE_BALANCE` if a balance row exists.
2. **If no balance row**, service **does not** throw (condition is `if (balance && balance.remaining < dayCount)`). Initialize balance first (TC-367) or this check is skipped — log gap.

**Postconditions:** No overdrawn application.

**Notes / Dependencies:** Confirmed leave.service.

---

## TC-294 — Overlapping leave dates rejected

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** Existing PENDING or APPROVED leave covering date D. Employee auth.

**Test Data:** New apply with start/end overlapping D.

**Steps to Execute:**
1. POST overlapping application.
2. Inspect code.

**Expected Result:**
1. HTTP 400 `LEAVE_OVERLAP`.
2. Second application not created.

**Postconditions:** Original leave unchanged.

**Notes / Dependencies:** `findOverlappingLeaves`.

---

## TC-295 — Cancel own pending leave

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Own PENDING application. Employee is applicant.

**Test Data:** `POST /api/leave/applications/<id>/cancel` optional `{ "reason": "Plans changed" }`

**Steps to Execute:**
1. POST cancel as the employee.
2. GET application as HR.
3. Cancel again.

**Expected Result:**
1. HTTP 200; `CANCELLED`.
2. HR list shows CANCELLED.
3. HTTP 400 `LEAVE_ALREADY_CANCELLED`.

**Postconditions:** CANCELLED.

**Notes / Dependencies:** Cancel is `requireAuth` (no leave.manage). Reason max 500.

---

## TC-296 — Cancel approved leave

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Negative / **Behaviour check**  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** APPROVED leave (TC-292). Same employee.

**Test Data:** POST cancel.

**Steps to Execute:**
1. Note balance `used`.
2. POST cancel as employee.
3. GET balance and application.

**Expected Result:**
1. Baseline used days.
2. **Service allows cancel of APPROVED** and **restores** used/remaining. HTTP 200 `CANCELLED` — compact expected 400, **implementation differs**.
3. Balance restored. Only already-CANCELLED is blocked.

**Postconditions:** Leave CANCELLED; balance restored.

**Notes / Dependencies:** `cancelLeaveApplication` restores if status was APPROVED.

---

## TC-297 — Leave start after end rejected

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee auth. Valid leaveTypeId.

**Test Data:** `startDate: 2026-08-20`, `endDate: 2026-08-18`, reason `x`

**Steps to Execute:**
1. POST apply.
2. Confirm Zod refine and/or service `INVALID_DATE_RANGE`.

**Expected Result:**
1. HTTP 400 (“Start date must be before or equal to end date”).
2. No row.

**Postconditions:** None.

**Notes / Dependencies:** Schema `.refine` plus service check.

---

## TC-298 — Single-day leave (start = end)

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Boundary / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Balance ≥ 1. Non-overlapping date.

**Test Data:** startDate = endDate = a free weekday.

**Steps to Execute:**
1. POST apply.
2. Read `dayCount`.

**Expected Result:**
1. HTTP 201/200.
2. `dayCount === 1` (inclusive calendar diff).

**Postconditions:** Application exists.

**Notes / Dependencies:** `calculateDayCount` = inclusive calendar days (**not** business days).

---

## TC-299 — Leave type requiring approval creates workflow request

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Leave type `requiresApproval: true`. Optional `approverIds: ["<managerUserId>"]` on apply body.

**Test Data:** Apply with `approverIds` array (min 1 if sent).

**Steps to Execute:**
1. POST apply with approverIds.
2. GET `/api/approvals/pending/me` as that manager.
3. Apply **without** approverIds.

**Expected Result:**
1. Leave PENDING; if approverIds sent, `ApprovalRequest` created and `approvalRequestId` linked.
2. Manager sees pending item (`entityType` `leave_application`).
3. Still PENDING; **no** approval request unless IDs provided. Compact assumed always — **only when approverIds present**.

**Postconditions:** Pending leave ± approval.

**Notes / Dependencies:** Confirmed leave.service block.

---

## TC-300 — Leave list status filters

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Mix of PENDING/APPROVED. User with `leave.read` or `leave.approve` for GET list. Employee apply does **not** grant list permission.

**Test Data:** `GET /api/leave/applications?status=PENDING`

**Steps to Execute:**
1. As HR, GET PENDING.
2. As HR, GET APPROVED.
3. As employee without leave.read, GET list.
4. Portal UI filter if present.

**Expected Result:**
1. Only PENDING.
2. Only APPROVED.
3. HTTP 403 — employee may only see UI if a self-scope exists; **route requires leave.read OR leave.approve**. Log if portal list 403s.
4. UI matches when API works.

**Postconditions:** None.

**Notes / Dependencies:** Query `status`, `employeeId`, `from`, `to`.

---

## TC-301 — Leave balance display on portal

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Initialized balances. HR `leave.read` for GET `/api/leave/balances`. Portal page calls `apiClient.leave.balance()` — confirm path.

**Test Data:** `GET /api/leave/balances?employeeId=<id>&year=2026`

**Steps to Execute:**
1. As HR, GET balances.
2. Open `/portal/leave` as employee; read allocated/used/remaining.
3. As employee GET `/api/leave/balances` without leave.read.

**Expected Result:**
1. HTTP 200; `allocated`, `used`, `remaining` (and `carriedOver`).
2. UI shows figures **if** its API succeeds.
3. HTTP 403 unless a self-service balances route exists — log gap.

**Postconditions:** None.

**Notes / Dependencies:** List balances requires `leave.read`.

---

## TC-302 — Apply leave on a holiday (edge)

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Edge  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Holiday exists (TC-346). Employee apply that date.

**Test Data:** start = end = holiday date.

**Steps to Execute:**
1. POST leave on the holiday.
2. Read `dayCount`.

**Expected Result:**
1. HTTP 201/200 — **holidays are not subtracted** (`calculateDayCount` is calendar inclusive).
2. `dayCount` is 1. Log product gap if holidays should be excluded.

**Postconditions:** Application exists.

**Notes / Dependencies:** Compact said “accepted or warning” — accepted, no warning in API.

---

## TC-303 — Leave application without leave type fails

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee auth.

**Test Data:** Body missing `leaveTypeId`; invalid id.

**Steps to Execute:**
1. POST without leaveTypeId.
2. POST `leaveTypeId: "does-not-exist"` with valid dates/reason.

**Expected Result:**
1. HTTP 400.
2. HTTP 404 `LEAVE_TYPE_NOT_FOUND`.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-304 — Manager/HR reviews leave application

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** PENDING leave. Reviewer with `leave.approve`.

**Test Data:** `{ "decision": "APPROVED", "reviewNotes": "OK" }`  
Reject path: `{ "decision": "REJECTED", "reviewNotes": "Peak season" }` on a **second** application.

**Steps to Execute:**
1. POST review APPROVED (or approve via `/approvals` if an ApprovalRequest exists).
2. Confirm leave APPROVED.
3. REJECT a different PENDING leave.

**Expected Result:**
1. HTTP 200.
2. Status APPROVED; balance deducted.
3. REJECTED; balance unchanged (TC-373).

**Postconditions:** One approved, one rejected.

**Notes / Dependencies:** `reviewLeaveApplicationSchema.decision` APPROVED \| REJECTED. Notes max 1000 optional.

---

## TC-305 — Leave half-day application

**Module:** Employee Portal  
**Feature:** Leave Applications  
**Scenario Type:** Edge  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Employee auth.

**Test Data:** Look for `dayCount`/`isHalfDay`/`session` on apply schema.

**Steps to Execute:**
1. Inspect `applyLeaveSchema` / portal form for half-day.
2. If no field, POST only start=end (full day).

**Expected Result:**
1. **No half-day field** on `applyLeaveSchema`.
2. Full day `dayCount=1`. Mark **N/A / not implemented** — do not invent 0.5.

**Postconditions:** None.

**Notes / Dependencies:** Compact “verify” — not supported.

---

## TC-306 — Leave stats API

**Module:** Employee Portal / Leave  
**Feature:** Leave Applications  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `leave.read` (HR).

**Test Data:** `GET /api/leave/stats`

**Steps to Execute:**
1. As HR, GET stats.
2. As employee without leave.read, GET stats.

**Expected Result:**
1. HTTP 200 aggregates.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed route.

---

## TC-307 — List own payslips

**Module:** Employee Portal  
**Feature:** Payslips & Downloads  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee with `portal.read`. At least one **PUBLISHED** payslip for that employee (process a payroll run, or skip if none — then EmptyState TC-310).

**Test Data:** `/portal/payslips` · `GET /api/portal/payslips`

**Steps to Execute:**
1. Open `/portal/payslips`.
2. GET API as employee.
3. Confirm only own rows.

**Expected Result:**
1. Page loads.
2. HTTP 200; only this employee’s payslips.
3. No other employee ids.

**Postconditions:** None.

**Notes / Dependencies:** Compact path `/payslips` — actual `/api/portal/payslips`.

---

## TC-308 — Download payslip PDF

**Module:** Employee Portal  
**Feature:** Payslips & Downloads  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Own PUBLISHED payslip id with file.

**Test Data:** `GET /api/portal/payslips/<id>/download`

**Steps to Execute:**
1. Click download on `/portal/payslips`.
2. Confirm network download URL.
3. Open the file.

**Expected Result:**
1. Download starts.
2. HTTP 200 file or redirect to signed URL.
3. Valid PDF.

**Postconditions:** File on disk.

**Notes / Dependencies:** `payroll.service.getMyPayslipDownload` requires own id + PUBLISHED + file.

---

## TC-309 — Cannot download another employee’s payslip

**Module:** Employee Portal  
**Feature:** Payslips & Downloads  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee A session. Payslip id belonging to employee B (admin/HR lookup).

**Test Data:** `GET /api/portal/payslips/<B-id>/download`

**Steps to Execute:**
1. As A, GET B’s download.
2. As A, GET `/api/portal/payslips` and confirm B’s id absent.

**Expected Result:**
1. HTTP 403/404 (service: not owner or not PUBLISHED).
2. B’s payslip not in A’s list.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed ownership check.

---

## TC-310 — Payslip list empty state

**Module:** Employee Portal  
**Feature:** Payslips & Downloads  
**Scenario Type:** UI / Edge  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Employee with zero payslips (new hire).

**Test Data:** `/portal/payslips`

**Steps to Execute:**
1. Open the page.
2. GET API.

**Expected Result:**
1. EmptyState, not a crash.
2. HTTP 200 `[]`.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-311 — Payslip download Content-Type

**Module:** Employee Portal  
**Feature:** Payslips & Downloads  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Own PUBLISHED payslip with file.

**Test Data:** Download GET.

**Steps to Execute:**
1. GET download; inspect `Content-Type` and `Content-Disposition`.
2. If JSON redirect `{ url }`, follow URL.

**Expected Result:**
1. `application/pdf` (or octet-stream + filename.pdf).
2. File name like `payslip-YYYY-MM.pdf`.

**Postconditions:** None.

**Notes / Dependencies:** Local file vs S3 redirect.

---

## TC-312 — Payslip row shows period and net pay

**Module:** Employee Portal  
**Feature:** Payslips & Downloads  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** At least one payslip in the list.

**Test Data:** `/portal/payslips`

**Steps to Execute:**
1. Read month/year and net amount on the row.
2. Compare to API fields.

**Expected Result:**
1. Period and net pay visible.
2. Matches API.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-313 — Payslip for unprocessed run not listed

**Module:** Employee Portal  
**Feature:** Payslips & Downloads  
**Scenario Type:** Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Payroll run in DRAFT/CALCULATED (not processed/published). Employee of that run.

**Test Data:** GET `/api/portal/payslips`

**Steps to Execute:**
1. As employee, list payslips.
2. Confirm no row for that draft run.
3. Try download if an unpublished id is guessed.

**Expected Result:**
1. HTTP 200.
2. Unpublished payslips omitted (`status === "PUBLISHED"`).
3. Download 403/404.

**Postconditions:** None.

**Notes / Dependencies:** `listMyPayslips` published only.

---

## TC-314 — Payslip access requires portal.read

**Module:** Employee Portal  
**Feature:** Payslips & Downloads  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** User without `portal.read`.

**Test Data:** `GET /api/portal/payslips`

**Steps to Execute:**
1. GET payslips.
2. Open `/portal/payslips`.

**Expected Result:**
1. HTTP 403.
2. Page gated.

**Postconditions:** None.

**Notes / Dependencies:** Both list and download use `portal.read`.

---

## TC-315 — Create support ticket from portal

**Module:** Employee Portal  
**Feature:** Support Tickets  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee with `ticket.create` or `portal.read` (route is OR).

**Test Data:** `/portal/support`
```json
{
  "subject": "VPN not connecting",
  "description": "Timeout since 09:00",
  "priority": "HIGH",
  "category": "IT"
}
```

**Steps to Execute:**
1. Open `/portal/support`; create ticket.
2. Confirm `POST /api/portal/tickets`.
3. GET `/api/portal/tickets`.

**Expected Result:**
1. Form submits.
2. HTTP 201; status `OPEN`; `ticketNumber` set; priority normalized to `HIGH`.
3. Ticket in own list.

**Postconditions:** Save `ticketId`.

**Notes / Dependencies:** Schema field is `subject` (not title). Priority optional (default MEDIUM).

---

## TC-316 — View own tickets list

**Module:** Employee Portal  
**Feature:** Support Tickets  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee has tickets; another user’s ticket exists.

**Test Data:** `GET /api/portal/tickets`

**Steps to Execute:**
1. GET portal tickets as employee.
2. Confirm only own tickets.
3. Open `/portal/support` list UI.

**Expected Result:**
1. HTTP 200.
2. No other employees’ tickets.
3. UI matches.

**Postconditions:** None.

**Notes / Dependencies:** Portal list is self-scoped.

---

## TC-317 — Reply to own ticket

**Module:** Employee Portal  
**Feature:** Support Tickets  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Own OPEN ticket.

**Test Data:** `POST /api/portal/tickets/<id>/replies` `{ "body": "Still failing after reboot." }`

**Steps to Execute:**
1. Reply in UI.
2. GET ticket; confirm employee message in thread.
3. Empty body.

**Expected Result:**
1. HTTP 200.
2. Message stored (employee author).
3. HTTP 400.

**Postconditions:** Reply exists.

**Notes / Dependencies:** Same `ticketReplySchema`. Permission `ticket.create` OR `portal.read`.

---

## TC-318 — Cannot view another employee’s ticket

**Module:** Employee Portal  
**Feature:** Support Tickets  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee A. Ticket id owned by B (from HR list).

**Test Data:** `GET /api/portal/tickets/<B-id>`

**Steps to Execute:**
1. As A, GET B’s ticket.
2. POST reply on B’s ticket.

**Expected Result:**
1. HTTP 403 (or 404).
2. HTTP 403.

**Postconditions:** B’s ticket unchanged.

**Notes / Dependencies:** Portal getTicket must enforce ownership.

---

## TC-319 — Ticket with attachment upload

**Module:** Employee Portal  
**Feature:** Support Tickets  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Employee can presign purpose `OTHER` or `DOCUMENT`. Portal support page uses `uploadFileViaPresign`.

**Test Data:** Small PNG/PDF. Then create/reply with `attachmentFileId`.

**Steps to Execute:**
1. On `/portal/support`, attach a file and submit.
2. Confirm presign → PUT → confirm → POST ticket/reply with file id.
3. HR opens ticket and sees attachment.

**Expected Result:**
1. Upload succeeds.
2. `attachmentFileId` persisted.
3. HR can see metadata/link.

**Postconditions:** File linked.

**Notes / Dependencies:** `createTicketSchema.attachmentFileId` optional.

---

## TC-320 — Ticket subject required

**Module:** Employee Portal  
**Feature:** Support Tickets  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee auth.

**Test Data:** `{ "description": "no subject" }` · subject length 201.

**Steps to Execute:**
1. POST without subject.
2. POST subject 201 chars.
3. POST description empty.

**Expected Result:**
1. HTTP 400.
2. HTTP 400 (max 200).
3. HTTP 400 (description min 1).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed schema.

---

## TC-321 — View assigned policies on portal

**Module:** Employee Portal  
**Feature:** Policies & Documents  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Published policy assigned to employee (TC-242/250). `portal.read`.

**Test Data:** `/portal/policies` · `GET /api/portal/policies`

**Steps to Execute:**
1. Open `/portal/policies`.
2. GET API.
3. Confirm acknowledge CTA for pending.

**Expected Result:**
1. Assigned published policies listed.
2. HTTP 200.
3. Pending vs acknowledged distinguished.

**Postconditions:** None.

**Notes / Dependencies:** Same as TC-243/250.

---

## TC-322 — View portal documents

**Module:** Employee Portal  
**Feature:** Policies & Documents  
**Scenario Type:** Positive / UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `document.read` or portal documents page uses shared DocumentsPage with ACL.

**Test Data:** `/portal/documents`

**Steps to Execute:**
1. Open `/portal/documents`.
2. Confirm list is ACL-filtered (GENERAL / employee context).
3. Direct `GET /api/documents` as employee.

**Expected Result:**
1. Page loads.
2. Only permitted docs.
3. 200 filtered or 403 if `document.read` missing — record actual.

**Postconditions:** None.

**Notes / Dependencies:** Nav `/portal/documents`.

---

## TC-323 — Upload document from portal (if permitted)

**Module:** Employee Portal  
**Feature:** Policies & Documents  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Employee with `document.create` **or** page hides upload. Storage purpose `DOCUMENT`.

**Test Data:** Small PDF.

**Steps to Execute:**
1. If upload control exists, upload via presign.
2. If no control, POST `/api/documents` as employee.
3. Record 201 vs 403.

**Expected Result:**
1. Success only with `document.create` + storage mapping.
2. 403 without permission — **do not treat missing button as a fail**.
3. Document listed for the employee if created.

**Postconditions:** Optional document.

**Notes / Dependencies:** Compact “if permitted”.

---

## TC-324 — Portal documents empty state

**Module:** Employee Portal  
**Feature:** Policies & Documents  
**Scenario Type:** UI  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Employee with no visible documents.

**Test Data:** `/portal/documents`

**Steps to Execute:**
1. Open the page.
2. Confirm EmptyState.

**Expected Result:**
1. Loads.
2. Helpful empty message, not a spinner-forever.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-325 — Policy acknowledgement button state

**Module:** Employee Portal  
**Feature:** Policies & Documents  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** One pending and one already acknowledged policy.

**Test Data:** `/portal/policies`

**Steps to Execute:**
1. Confirm Acknowledge enabled on pending.
2. Acknowledge (TC-243).
3. Refresh; button disabled / “Acknowledged on …”.

**Expected Result:**
1. Pending CTA enabled.
2. POST 200.
3. CTA disabled; date shown.

**Postconditions:** Policy acknowledged.

**Notes / Dependencies:** Duplicate POST returns existing ack (TC-246).

---

## TC-326 — Cannot access HR documents without permission

**Module:** Employee Portal  
**Feature:** Policies & Documents  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee. An HR-only document id (from `/hr/documents`).

**Test Data:** `GET /api/documents/<hrDocId>`

**Steps to Execute:**
1. As employee, GET the HR document.
2. Open `/hr/documents`.

**Expected Result:**
1. HTTP 403 (ACL / `document.read`).
2. HR nav hidden.

**Postconditions:** None.

**Notes / Dependencies:** Pair with TC-600/601.

---

## TC-327 — List notifications

**Module:** Employee Portal  
**Feature:** Notifications & Preferences  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee auth. Some notifications (ticket reply, leave, etc.).

**Test Data:** `/portal/notifications` · `GET /api/notifications` and/or `GET /api/portal/notifications`

**Steps to Execute:**
1. Open `/portal/notifications`.
2. GET `/api/notifications`.
3. GET `/api/portal/notifications`.

**Expected Result:**
1. Own notifications listed.
2. HTTP 200 (auth only on `/api/notifications`).
3. HTTP 200 if portal alias exists; 404 if not — portal page may use one of the two.

**Postconditions:** None.

**Notes / Dependencies:** Dual surfaces.

---

## TC-328 — Mark notification as read

**Module:** Employee Portal  
**Feature:** Notifications & Preferences  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Unread notification id.

**Test Data:** `POST /api/notifications/<id>/read` and/or `POST /api/portal/notifications/<id>/read`

**Steps to Execute:**
1. Click notification / mark read in UI.
2. Confirm POST.
3. GET list; `isRead` true.

**Expected Result:**
1. UI updates.
2. HTTP 200.
3. Unread count decreases (TC-330).

**Postconditions:** Notification read.

**Notes / Dependencies:** Portal route uses `portal.read`; global notifications route is auth-only.

---

## TC-329 — Notification preferences update

**Module:** Employee Portal  
**Feature:** Notifications & Preferences  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Authenticated employee.

**Test Data:** `/portal/notification-preferences`  
`PUT /api/notifications/preferences` `{ "category": "LEAVE", "inAppEnabled": true, "emailEnabled": false }`

**Steps to Execute:**
1. Open preferences; disable email for Leave.
2. Confirm PUT.
3. GET preferences.

**Expected Result:**
1. Control saves.
2. HTTP 200.
3. LEAVE `emailEnabled` false; in-app still true.

**Postconditions:** Preference persisted.

**Notes / Dependencies:** Categories include LEAVE, TICKET, APPROVAL, PAYROLL, etc. Unique per user+category.

---

## TC-330 — Unread count badge in header

**Module:** Employee Portal  
**Feature:** Notifications & Preferences  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Known unread count N > 0.

**Test Data:** `GET /api/notifications/unread-count`

**Steps to Execute:**
1. GET unread-count.
2. Inspect bell badge in dashboard shell.
3. Mark all read (TC-331); badge 0.

**Expected Result:**
1. HTTP 200 `{ count: N }` (field name: record actual).
2. Badge shows N (or “N+”).
3. Badge clears.

**Postconditions:** Possibly all read.

**Notes / Dependencies:** Compact path `/unread-count` confirmed.

---

## TC-331 — Mark all notifications read

**Module:** Employee Portal  
**Feature:** Notifications & Preferences  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Several unread notifications.

**Test Data:** `POST /api/notifications/read-all`

**Steps to Execute:**
1. POST read-all.
2. GET unread-count.
3. GET list unreadOnly=true.

**Expected Result:**
1. HTTP 200.
2. Count 0.
3. Empty unread list.

**Postconditions:** All read.

**Notes / Dependencies:** Confirmed route.

---

## TC-332 — Notification preference per category unique

**Module:** Employee Portal  
**Feature:** Notifications & Preferences  
**Scenario Type:** DB  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Employee auth.

**Test Data:** PUT LEAVE emailEnabled false, then true.

**Steps to Execute:**
1. PUT LEAVE twice with different flags.
2. GET preferences; count LEAVE rows.

**Expected Result:**
1. Both HTTP 200.
2. **One** LEAVE row; last write wins.

**Postconditions:** Final preference = last PUT.

**Notes / Dependencies:** Unique (userId, category).

---

## TC-333 — MFA setup on portal security page

**Module:** Employee Portal  
**Feature:** Security (MFA, Devices)  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Logged-in user with MFA currently off. Authenticator app.

**Test Data:** `/portal/security` · `POST /api/auth/mfa/setup` then `POST /api/auth/mfa/enable` `{ "code": "<TOTP>" }`

**Steps to Execute:**
1. Open `/portal/security`; start setup.
2. Scan QR (`qrDataUrl`); enter TOTP; enable.
3. GET `/api/auth/mfa/status`.
4. Store backup codes shown.

**Expected Result:**
1. QR + manual secret.
2. HTTP 200; MFA enabled; backup codes returned once.
3. `enabled: true`.
4. Codes displayed in UI.

**Postconditions:** MFA on. Save backup codes for TC-336.

**Notes / Dependencies:** Confirmed portal security page + auth routes.

---

## TC-334 — View trusted devices on security page

**Module:** Employee Portal  
**Feature:** Security (MFA, Devices)  
**Scenario Type:** UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Logged in (current session = a device).

**Test Data:** `GET /api/auth/devices` · `/portal/security`

**Steps to Execute:**
1. GET devices.
2. Confirm list on security page (user-agent, last seen).

**Expected Result:**
1. HTTP 200; includes current device.
2. UI lists devices.

**Postconditions:** None.

**Notes / Dependencies:** `GET /api/auth/devices` requireAuth.

---

## TC-335 — Revoke device from portal UI

**Module:** Employee Portal  
**Feature:** Security (MFA, Devices)  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** At least two devices, **or** revoke a non-current id. `deviceId` from list.

**Test Data:** `DELETE /api/auth/devices/<id>`

**Steps to Execute:**
1. Click revoke on a device (prefer not current).
2. Confirm DELETE.
3. If current device is revoked, next API call 401 → login.

**Expected Result:**
1. HTTP 200.
2. Device gone from list (`revokedAt`).
3. Current-device revoke ends session (record actual).

**Postconditions:** Device revoked.

**Notes / Dependencies:** Confirmed DELETE route.

---

## TC-336 — Disable MFA from portal

**Module:** Employee Portal  
**Feature:** Security (MFA, Devices)  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** MFA enabled (TC-333). Valid TOTP or backup code.

**Test Data:** `POST /api/auth/mfa/disable` `{ "code": "<TOTP>" }`

**Steps to Execute:**
1. On `/portal/security`, disable with code.
2. GET mfa/status.
3. Disable with wrong code first (control).

**Expected Result:**
1. HTTP 200; `enabled: false`.
2. Status disabled.
3. Wrong code 400/401; MFA remains on until valid disable.

**Postconditions:** MFA off (re-enable if account requires it).

**Notes / Dependencies:** `mfaCodeSchema`.

---

## TC-337 — Security page without auth redirects

**Module:** Employee Portal  
**Feature:** Security (MFA, Devices)  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Logged out (private window).

**Test Data:** `/portal/security`

**Steps to Execute:**
1. Open `/portal/security` logged out.
2. `GET /api/auth/mfa/status` without cookies.

**Expected Result:**
1. Redirect `/login`.
2. HTTP 401.

**Postconditions:** None.

**Notes / Dependencies:** Dashboard layout session gate.

---

## TC-338 — MFA-enforced role cannot disable without admin

**Module:** Employee Portal  
**Feature:** Security (MFA, Devices)  
**Scenario Type:** Security / **Gap check**  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Role with `requiresMfa` (if seed/admin supports it). User MFA enabled.

**Test Data:** POST mfa/disable with valid TOTP as that user.

**Steps to Execute:**
1. Confirm role requires MFA (admin roles UI / DB).
2. User disables MFA.
3. Next login — is MFA still challenged?

**Expected Result:**
1. Flag exists or N/A.
2. If disable **succeeds**, log **gap** vs compact “blocked”. If 403, pass.
3. Record login behaviour.

**Postconditions:** Restore MFA if still required.

**Notes / Dependencies:** Compact assumed block — **verify**, do not invent.

---

## TC-339 — Change password from portal

**Module:** Employee Portal  
**Feature:** Security (MFA, Devices)  
**Scenario Type:** Positive / Edge  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** `/portal/security` open.

**Test Data:** Look for change-password form.

**Steps to Execute:**
1. Search security page for password fields.
2. If absent, `POST /api/auth/password/change` if such a route exists.
3. Mark N/A if neither UI nor route.

**Expected Result:**
1. **Portal security page (as read) has MFA + devices only.**
2. Change password is **forgot/reset flow**, not in-portal.
3. Mark **N/A** unless a route is found.

**Postconditions:** None.

**Notes / Dependencies:** Compact “if available”.

---

## TC-340 — Security page MFA status badge

**Module:** Employee Portal  
**Feature:** Security (MFA, Devices)  
**Scenario Type:** UI  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Known MFA on/off.

**Test Data:** `/portal/security`

**Steps to Execute:**
1. With MFA off, confirm Disabled indicator.
2. Enable (TC-333); confirm Enabled badge.
3. Disable; badge updates.

**Expected Result:**
1. Disabled shown.
2. Enabled shown.
3. Updates after query invalidate (`["mfa","status"]`).

**Postconditions:** Desired MFA state.

**Notes / Dependencies:** Confirmed statusQuery on page.

---

## TC-341 — Create shift

**Module:** Attendance  
**Feature:** Shifts & Holidays  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** HR/admin with `attendance.manage`.

**Test Data:**
```json
{
  "name": "General Shift",
  "code": "GS",
  "startTime": "09:00",
  "endTime": "18:00"
}
```

**Steps to Execute:**
1. `POST /api/attendance/shifts`.
2. `GET /api/attendance/shifts`.
3. `GET /api/attendance/shifts/<id>`.

**Expected Result:**
1. HTTP 201/200.
2. Shift listed.
3. HTTP 200 detail.

**Postconditions:** Save `shiftId`.

**Notes / Dependencies:** Times `HH:mm` 00–23. Name max 100.

---

## TC-342 — Shift time format validation

**Module:** Attendance  
**Feature:** Shifts & Holidays  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `attendance.manage`.

**Test Data:** `startTime: "25:00"` · `"9:00"` · `"09:60"`

**Steps to Execute:**
1. POST each invalid time.
2. POST `startTime: "00:00"`, `endTime: "23:59"` (valid bounds).

**Expected Result:**
1. HTTP 400 all invalid.
2. HTTP 201/200.

**Postconditions:** Optional shift.

**Notes / Dependencies:** Regex `^([01]\d|2[0-3]):([0-5]\d)$`.

---

## TC-343 — Shift name max 100 boundary

**Module:** Attendance  
**Feature:** Shifts & Holidays  
**Scenario Type:** Boundary  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `attendance.manage`.

**Test Data:** name 100 chars vs 101. Valid times.

**Steps to Execute:**
1. POST name length 100.
2. POST 101.

**Expected Result:**
1. HTTP 201/200.
2. HTTP 400.

**Postconditions:** Optional shift.

**Notes / Dependencies:** `z.string().min(1).max(100)`.

---

## TC-344 — Update shift times

**Module:** Attendance  
**Feature:** Shifts & Holidays  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `shiftId`. `attendance.manage`.

**Test Data:** `PUT /api/attendance/shifts/<id>` `{ "startTime": "10:00", "endTime": "19:00" }`

**Steps to Execute:**
1. PUT new times.
2. GET shift.

**Expected Result:**
1. HTTP 200.
2. Times updated.

**Postconditions:** Shift updated.

**Notes / Dependencies:** `updateShiftSchema` partial.

---

## TC-345 — Delete unused shift

**Module:** Attendance  
**Feature:** Shifts & Holidays  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Shift not required by records (or unused). `attendance.manage`.

**Test Data:** `DELETE /api/attendance/shifts/<id>`

**Steps to Execute:**
1. DELETE unused shift.
2. GET by id.
3. GET list.

**Expected Result:**
1. HTTP 200; soft delete if implemented.
2. HTTP 404.
3. Absent from list.

**Postconditions:** Shift deleted.

**Notes / Dependencies:** If FK blocks delete, HTTP 400 — record actual.

---

## TC-346 — Create holiday

**Module:** Attendance  
**Feature:** Shifts & Holidays  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `attendance.manage`.

**Test Data:**
```json
{
  "name": "QA Foundation Day",
  "date": "2026-10-02",
  "isOptional": false
}
```

**Steps to Execute:**
1. `POST /api/attendance/holidays`.
2. `GET /api/attendance/holidays`.

**Expected Result:**
1. HTTP 201/200.
2. Holiday listed.

**Postconditions:** Save `holidayId`.

**Notes / Dependencies:** Date `YYYY-MM-DD`. Field is `isOptional` (not `isOptional` vs compact `isOptional` — matches).

---

## TC-347 — Holiday date format validation

**Module:** Attendance  
**Feature:** Shifts & Holidays  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `attendance.manage`.

**Test Data:** `date: "18-08-2026"` · `"2026/08/18"` · `"2026-13-01"`

**Steps to Execute:**
1. POST each invalid date with a name.
2. POST `2026-08-18`.

**Expected Result:**
1. HTTP 400 (`YYYY-MM-DD` regex — 13 may pass regex but be an invalid calendar date; record).
2. HTTP 201/200.

**Postconditions:** Optional holiday.

**Notes / Dependencies:** Regex `^\d{4}-\d{2}-\d{2}$` does **not** validate month 01–12.

---

## TC-348 — List holidays

**Module:** Attendance  
**Feature:** Shifts & Holidays  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `attendance.read`.

**Test Data:** `GET /api/attendance/holidays`

**Steps to Execute:**
1. GET as HR.
2. GET as employee without attendance.read.

**Expected Result:**
1. HTTP 200; includes TC-346.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** List has no year query in schema — all holidays returned unless service filters.

---

## TC-349 — Optional holiday flag

**Module:** Attendance  
**Feature:** Shifts & Holidays  
**Scenario Type:** Positive  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** `attendance.manage`.

**Test Data:** `{ "name": "Optional Festival", "date": "2026-11-01", "isOptional": true }`

**Steps to Execute:**
1. POST holiday.
2. GET; confirm `isOptional === true`.

**Expected Result:**
1. HTTP 201/200.
2. Flag stored.

**Postconditions:** Holiday exists.

**Notes / Dependencies:** Optional boolean.

---

## TC-350 — Shift/holiday CRUD requires attendance.manage

**Module:** Attendance  
**Feature:** Shifts & Holidays  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee without `attendance.manage`.

**Test Data:** Valid shift body.

**Steps to Execute:**
1. As employee, POST `/api/attendance/shifts`.
2. POST `/api/attendance/holidays`.
3. GET `/api/attendance/shifts` (needs `attendance.read`).

**Expected Result:**
1. HTTP 403.
2. HTTP 403.
3. HTTP 403 if no attendance.read.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed middleware.

---

## TC-351 — HR mark attendance for employee

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** HR `attendance.manage`. Employee id. Date without conflict (or accept upsert).

**Test Data:**
```json
{
  "employeeId": "<id>",
  "date": "2026-08-10",
  "status": "ABSENT"
}
```

**Steps to Execute:**
1. `POST /api/attendance/records`.
2. GET records for that employee/date.

**Expected Result:**
1. HTTP 200/201; status ABSENT.
2. Row visible.

**Postconditions:** Record exists.

**Notes / Dependencies:** Status enum includes ABSENT.

---

## TC-352 — Unique attendance per employee per day

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Record exists for employee+date (TC-351). `attendance.manage`.

**Test Data:** Same employee+date, status `PRESENT`.

**Steps to Execute:**
1. POST records again (same date).
2. GET that date.

**Expected Result:**
1. **Service upserts** — HTTP 200 updating to PRESENT, **not** 409. Compact expected 409.
2. Still **one** row (`@@unique([employeeId, date])`). Concurrent inserts could 409.

**Postconditions:** One row; latest status.

**Notes / Dependencies:** `upsertAttendanceRecord` in markAttendance.

---

## TC-353 — List attendance with date filter

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `attendance.read`. Records in August 2026.

**Test Data:** `GET /api/attendance/records?from=2026-08-01&to=2026-08-31`

**Steps to Execute:**
1. GET with from/to.
2. GET `?status=ABSENT`.
3. GET `?employeeId=<id>`.

**Expected Result:**
1. HTTP 200; dates in range.
2. Only ABSENT.
3. Only that employee.

**Postconditions:** None.

**Notes / Dependencies:** Query params `from`, `to`, `status`, `employeeId` — **not** `startDate`/`endDate`.

---

## TC-354 — Attendance stats API

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `attendance.read`.

**Test Data:** `GET /api/attendance/stats`

**Steps to Execute:**
1. GET stats as HR.
2. Compare to a known ABSENT/PRESENT count.

**Expected Result:**
1. HTTP 200 aggregates.
2. Plausible vs records.

**Postconditions:** None.

**Notes / Dependencies:** Same as TC-290 (HR).

---

## TC-355 — Review attendance correction — approve

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** PENDING correction (TC-283). HR with `attendance.approve`.

**Test Data:** `POST /api/attendance/corrections/<id>/review` `{ "decision": "APPROVED", "reviewNotes": "Verified" }`

**Steps to Execute:**
1. POST review APPROVED.
2. GET correction.
3. GET attendance record for that date.

**Expected Result:**
1. HTTP 200.
2. Correction `APPROVED`.
3. Record status = `requestedStatus` (e.g. PRESENT).

**Postconditions:** Correction approved; record updated.

**Notes / Dependencies:** Schema field `decision` APPROVED \| REJECTED; `reviewNotes` max 1000 optional.

---

## TC-356 — Review attendance correction — reject

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Another PENDING correction. `attendance.approve`.

**Test Data:** `{ "decision": "REJECTED", "reviewNotes": "Insufficient evidence" }`

**Steps to Execute:**
1. Note attendance status before.
2. POST REJECTED.
3. GET record.

**Expected Result:**
1. Baseline status.
2. Correction REJECTED.
3. Attendance record **unchanged**.

**Postconditions:** Correction rejected.

**Notes / Dependencies:** Confirm service does not mutate record on reject.

---

## TC-357 — List pending corrections

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `attendance.read` or `attendance.approve`. Some PENDING.

**Test Data:** `GET /api/attendance/corrections?status=PENDING`

**Steps to Execute:**
1. GET PENDING.
2. GET `?employeeId=<id>`.

**Expected Result:**
1. HTTP 200; only PENDING.
2. Filtered by employee.

**Postconditions:** None.

**Notes / Dependencies:** Query schema `status`, `employeeId`.

---

## TC-358 — Employee cannot approve own correction

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee’s PENDING correction. Employee **without** `attendance.approve`.

**Test Data:** POST review APPROVED as employee.

**Steps to Execute:**
1. As employee, POST `/api/attendance/corrections/<id>/review`.
2. Confirm still PENDING as HR.

**Expected Result:**
1. HTTP 403.
2. Still PENDING.

**Postconditions:** Unchanged.

**Notes / Dependencies:** Review requires `attendance.approve`.

---

## TC-359 — Mark attendance invalid status enum

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `attendance.manage`.

**Test Data:** `{ "employeeId": "<id>", "date": "2026-08-11", "status": "INVALID" }`  
Also `"LEAVE"` (compact) vs `"ON_LEAVE"`.

**Steps to Execute:**
1. POST status INVALID.
2. POST status `LEAVE`.
3. POST `ON_LEAVE`.

**Expected Result:**
1. HTTP 400.
2. HTTP 400 — **enum is `ON_LEAVE`, not `LEAVE`**.
3. HTTP 200.

**Postconditions:** Optional ON_LEAVE row.

**Notes / Dependencies:** Confirmed markAttendanceSchema.

---

## TC-360 — Attendance check-out before check-in

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `attendance.manage`.

**Test Data:** Same date; `checkInTime` 18:00Z; `checkOutTime` 09:00Z; status PRESENT.

**Steps to Execute:**
1. POST records with out < in.
2. Read `workHours`.

**Expected Result:**
1. HTTP 200 **likely** — service computes hours even if negative (`checkOut - checkIn`). Compact expected 400 or auto-correct — **document actual** (probably negative hours, no validation).
2. Log gap if negative workHours stored.

**Postconditions:** Record may have negative hours.

**Notes / Dependencies:** No ordering check in `markAttendance`.

---

## TC-361 — Full correction E2E

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee + HR. Date with ABSENT (TC-351).

**Test Data:** Correction to PRESENT + approve.

**Steps to Execute:**
1. Employee POST correction PRESENT + reason.
2. HR lists PENDING.
3. HR approves.
4. Record is PRESENT.

**Expected Result:**
1. PENDING.
2. Visible to HR.
3. APPROVED.
4. Attendance PRESENT.

**Postconditions:** Date PRESENT.

**Notes / Dependencies:** Combines TC-283 + TC-355.

---

## TC-362 — Attendance list large date range (NFR)

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** API / Performance  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** `attendance.read`. Year of data if available.

**Test Data:** `from=2026-01-01&to=2026-12-31`

**Steps to Execute:**
1. GET records for the full year.
2. Time the response.

**Expected Result:**
1. HTTP 200 (no pagination in schema — entire set).
2. Target &lt; 2s locally; if slower, log NFR. No 500.

**Postconditions:** None.

**Notes / Dependencies:** **No page/pageSize** on listAttendanceQuerySchema.

---

## TC-363 — Weekend marked as WEEKEND status

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `attendance.manage`. A Saturday date.

**Test Data:** `{ "employeeId", "date": "<Saturday>", "status": "WEEKEND" }`

**Steps to Execute:**
1. POST records WEEKEND.
2. GET that date.

**Expected Result:**
1. HTTP 200.
2. Status WEEKEND.

**Postconditions:** Record exists.

**Notes / Dependencies:** Enum includes WEEKEND.

---

## TC-364 — HALF_DAY attendance status

**Module:** Attendance  
**Feature:** Records & Corrections  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `attendance.manage`.

**Test Data:** Status `HALF_DAY` with check-in/out spanning ~4 hours.

**Steps to Execute:**
1. POST HALF_DAY with times.
2. Read `workHours`.

**Expected Result:**
1. HTTP 200; status HALF_DAY (**not** `HALF_DAY` vs compact `HALF_DAY` — matches).
2. workHours from timestamps; **not** auto-forced to 4h unless coded that way.

**Postconditions:** Record exists.

**Notes / Dependencies:** Confirmed enum `HALF_DAY`.

---

## TC-365 — Create leave type

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `leave.manage`.

**Test Data:**
```json
{
  "name": "QA Casual Leave",
  "code": "QA-CL",
  "defaultAllocation": 12,
  "requiresApproval": true,
  "carryForward": false
}
```

**Steps to Execute:**
1. `POST /api/leave/types`.
2. `GET /api/leave/types`.
3. Duplicate name.

**Expected Result:**
1. HTTP 201/200.
2. Type listed.
3. HTTP 400 `DUPLICATE_LEAVE_TYPE_NAME` (or code duplicate).

**Postconditions:** Save `leaveTypeId`.

**Notes / Dependencies:** Field is `defaultAllocation` (not `defaultBalance`). `carryForward` not `carryForward` vs compact `carryForward` — schema `carryForward`.

---

## TC-366 — Leave type default allocation zero

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Boundary  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `leave.manage`.

**Test Data:** `{ "name": "Unpaid QA", "code": "QA-UP", "defaultAllocation": 0 }`

**Steps to Execute:**
1. POST type.
2. POST `defaultAllocation: -1`.

**Expected Result:**
1. HTTP 201/200 (`min(0)`).
2. HTTP 400.

**Postconditions:** Type exists.

**Notes / Dependencies:** `z.number().int().min(0)`.

---

## TC-367 — Initialize leave balance for employee

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** `leave.manage`. Employee + leaveTypeId.

**Test Data:**
```json
{
  "employeeId": "<id>",
  "leaveTypeId": "<leaveTypeId>",
  "year": 2026,
  "allocated": 12,
  "carriedOver": 0
}
```

**Steps to Execute:**
1. `POST /api/leave/balances`.
2. `GET /api/leave/balances?employeeId=&year=2026`.

**Expected Result:**
1. HTTP 201/200; remaining ≈ allocated + carriedOver − used.
2. Row listed.

**Postconditions:** Save `balanceId`.

**Notes / Dependencies:** Year 2000–2100. `allocated` min 0.

---

## TC-368 — Duplicate balance year rejected

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Balance for employee+type+2026 exists.

**Test Data:** Same POST as TC-367.

**Steps to Execute:**
1. POST balances again.
2. Inspect status.

**Expected Result:**
1. HTTP 409 unique **or** 400 mapped duplicate — record code.
2. One row only.

**Postconditions:** Single balance.

**Notes / Dependencies:** Unique employee+type+year expected.

---

## TC-369 — Adjust leave balance

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `balanceId`. `leave.manage`.

**Test Data:** `PUT /api/leave/balances/<id>` `{ "allocated": 15 }`

**Steps to Execute:**
1. PUT allocated 15.
2. GET balance.
3. PUT `{ "used": -1 }`.

**Expected Result:**
1. HTTP 200.
2. allocated 15; remaining recomputed if service does so.
3. HTTP 400 (`used` min 0).

**Postconditions:** Balance updated.

**Notes / Dependencies:** `adjustLeaveBalanceSchema`.

---

## TC-370 — Leave application dayCount calculation

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Balance ≥ 7. No overlap. Employee apply.

**Test Data:** Monday 2026-08-17 through Friday 2026-08-21.

**Steps to Execute:**
1. POST apply that range.
2. Read `dayCount`.
3. POST a range including Saturday–Sunday (e.g. Fri–Mon).

**Expected Result:**
1. HTTP 201/200.
2. `dayCount === 5` (inclusive calendar Mon–Fri).
3. Fri–Mon = **4 calendar days including weekend** — **weekends are NOT excluded**. Compact “excluding weekends/holidays” is **false** in code.

**Postconditions:** Applications exist.

**Notes / Dependencies:** `calculateDayCount` calendar inclusive.

---

## TC-371 — Carry-forward leave type flag

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Positive / Gap  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `leave.manage`.

**Test Data:** Type `{ "name": "QA AL", "carryForward": true, "maxCarryForwardDays": 5 }`

**Steps to Execute:**
1. POST type with carryForward true.
2. Search for a year-end job / API that copies remaining → next year `carriedOver`.
3. Manually POST 2027 balance with `carriedOver: 5` if no job.

**Expected Result:**
1. Flags stored.
2. **No automatic year-roll API found** in leave.routes — carry-forward is data + `carriedOver` on initialize.
3. Manual 2027 row works. Compact “unused carries” is **not an automated job** unless documented elsewhere.

**Postconditions:** Type exists.

**Notes / Dependencies:** Schema has carryForward + maxCarryForwardDays.

---

## TC-372 — Leave approve via manager deducts balance

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** PENDING leave; `leave.approve`. Balance remaining known.

**Test Data:** `{ "decision": "APPROVED" }`

**Steps to Execute:**
1. POST review.
2. GET balance.

**Expected Result:**
1. HTTP 200 APPROVED.
2. used += dayCount.

**Postconditions:** Approved.

**Notes / Dependencies:** Same as TC-292/304.

---

## TC-373 — Leave reject does not change balance

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** PENDING leave (not yet deducted). `leave.approve`.

**Test Data:** `{ "decision": "REJECTED", "reviewNotes": "Blackout" }`

**Steps to Execute:**
1. Snapshot remaining.
2. POST REJECTED.
3. GET balance.

**Expected Result:**
1. Baseline.
2. Status REJECTED.
3. remaining **unchanged** (pending did not deduct).

**Postconditions:** REJECTED.

**Notes / Dependencies:** Deduct happens on approve (or auto-approve apply).

---

## TC-374 — Leave type CRUD requires leave.manage

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee without `leave.manage`.

**Test Data:** Valid createLeaveType body.

**Steps to Execute:**
1. As employee, POST `/api/leave/types`.
2. POST `/api/leave/balances`.
3. POST `/api/leave/applications` (should work — auth only).

**Expected Result:**
1. HTTP 403.
2. HTTP 403.
3. HTTP 201/200 (apply allowed).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-375 — Leave application list filter by status

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `leave.read`. Mixed statuses.

**Test Data:** `GET /api/leave/applications?status=PENDING`

**Steps to Execute:**
1. GET PENDING.
2. GET `?from=&to=` range.
3. GET `?leaveTypeId=`.

**Expected Result:**
1. Only PENDING.
2. Date-bounded.
3. Type-bounded.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed query schema.

---

## TC-376 — Leave stats for HR

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `leave.read`.

**Test Data:** `GET /api/leave/stats`

**Steps to Execute:**
1. GET as HR.
2. GET as employee without leave.read.

**Expected Result:**
1. HTTP 200.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Same as TC-306.

---

## TC-377 — Leave spanning year boundary

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Edge  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Balances for **2026 and 2027** if check uses start year only. Employee apply.

**Test Data:** startDate `2026-12-30`, endDate `2027-01-02` (4 calendar days). Reason required.

**Steps to Execute:**
1. Ensure 2026 remaining ≥ 4 (service uses **startDate year** only).
2. POST apply.
3. Inspect `dayCount` and which year’s balance is deducted on approve.

**Expected Result:**
1. If 2026 remaining ≥ 4, apply succeeds even if 2027 balance is 0.
2. `dayCount === 4`.
3. Deduction against **2026** only — **no split**. Log product gap vs “split across years”.

**Postconditions:** Application exists.

**Notes / Dependencies:** `const year = startDate.getFullYear()`.

---

## TC-378 — Delete unused leave type

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Type with **no** (or any) applications. `leave.manage`.

**Test Data:** `DELETE /api/leave/types/<unusedId>`

**Steps to Execute:**
1. Create a throwaway type; DELETE it.
2. GET by id.

**Expected Result:**
1. HTTP 200; soft delete (`deleteLeaveType` does not check applications).
2. HTTP 404.

**Postconditions:** Type gone from default list.

**Notes / Dependencies:** Soft delete; **no** “in use” guard (see TC-379).

---

## TC-379 — Cannot delete leave type with active applications

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Negative / **Gap check**  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Type used by a PENDING/APPROVED application. `leave.manage`.

**Test Data:** DELETE that type id.

**Steps to Execute:**
1. DELETE the in-use type.
2. GET applications for that type.

**Expected Result:**
1. **Service always soft-deletes** — HTTP 200 even with applications. Compact expected 400 — **implementation gap**.
2. Applications still reference the id; list types may hide deleted.

**Postconditions:** Type soft-deleted; apps orphaned from UI types list.

**Notes / Dependencies:** `deleteLeaveType` no usage check.

---

## TC-380 — Leave balance cannot go negative on approval

**Module:** Leave  
**Feature:** Types, Balances, Applications  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- PENDING leave with dayCount 5.
- Before approve, PUT balance remaining to 1 (`allocated`/`used` adjust).
- `leave.approve`.

**Test Data:** POST review APPROVED.

**Steps to Execute:**
1. Shrink remaining below dayCount **after** apply (apply already passed the check).
2. POST APPROVED.
3. GET balance.

**Expected Result:**
1. Remaining 1.
2. If approve path calls `deductLeaveBalance` without re-check, remaining could go **negative** — record actual. Compact expected 400 on approve.
3. Prefer HTTP 400; if 200 and remaining &lt; 0, log **gap**.

**Postconditions:** Document remaining.

**Notes / Dependencies:** Insufficient check is on **apply**, not clearly repeated on approve.

---

## TC-381 — Create approval workflow

**Module:** Approvals  
**Feature:** Workflows, Requests, Delegations  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Admin with `approval.manage`.

**Test Data:** `/admin/approval-workflows`
```json
{
  "name": "QA Leave workflow",
  "code": "qa-leave-wf",
  "entityType": "leave_application",
  "isActive": true,
  "steps": [
    { "stepOrder": 1, "approverRole": "hr", "slaHours": 24 }
  ]
}
```

**Steps to Execute:**
1. Open `/admin/approval-workflows`; create workflow.
2. Confirm `POST /api/approvals/workflows`.
3. `GET /api/approvals/workflows`.
4. Duplicate `code`.

**Expected Result:**
1. UI saves.
2. HTTP 201/200.
3. Workflow listed; `isActive` true.
4. HTTP 400/409 unique code.

**Postconditions:** Save `workflowId`.

**Notes / Dependencies:** `createWorkflowSchema`: name, code, entityType required; steps optional array. Permission `approval.manage`. Read list needs `approval.read`.

---

## TC-382 — Create approval request manually

**Module:** Approvals  
**Feature:** Workflows, Requests, Delegations  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** `approval.create`. Existing entity (e.g. PENDING leave id). Requester user id (employee). Approver user id (HR).

**Test Data:**
```json
{
  "entityType": "leave_application",
  "entityId": "<leaveApplicationId>",
  "requesterId": "<employeeUserId>",
  "approverIds": ["<hrUserId>"]
}
```
Alternative: `POST /api/approvals/from-workflow` `{ "workflowId", "entityType", "entityId", "requesterId" }`.

**Steps to Execute:**
1. `POST /api/approvals` with approverIds.
2. `GET /api/approvals/pending/me` as HR.
3. GET `/api/approvals/<id>`.
4. POST missing approverIds `[]`.

**Expected Result:**
1. HTTP 201/200; status PENDING; current step 1.
2. HR sees the request.
3. HTTP 200 detail.
4. HTTP 400 (`approverIds` min 1).

**Postconditions:** Save `approvalRequestId`. Continue chain in TC-383+ (`POST /api/approvals/:id/approve`).

**Notes / Dependencies:** `createApprovalRequestSchema`. From-workflow uses `createFromWorkflowSchema`. Pending/me is **auth only** (no approval.read).

---

## Coverage recap (this file)

| Range | Count | Focus |
|-------|-------|--------|
| TC-251 – TC-258 | 8 | HR assets |
| TC-259 – TC-266 | 8 | HR tickets + SLA |
| TC-267 – TC-276 | 10 | Portal dashboard & profile |
| TC-277 – TC-290 | 14 | Clock in/out, portal attendance |
| TC-291 – TC-306 | 16 | Portal leave |
| TC-307 – TC-314 | 8 | Payslips |
| TC-315 – TC-320 | 6 | Portal tickets |
| TC-321 – TC-326 | 6 | Portal policies & documents |
| TC-327 – TC-332 | 6 | Notifications |
| TC-333 – TC-340 | 8 | Portal MFA & devices |
| TC-341 – TC-350 | 10 | Shifts & holidays |
| TC-351 – TC-364 | 14 | Attendance records & corrections |
| TC-365 – TC-380 | 16 | Leave types, balances, rules |
| TC-381 – TC-382 | 2 | Approval workflow + request |
| **Total** | **132** | TC-251 through TC-382, no skipped IDs |

**Implementation notes (do not treat compact expectations as silent passes):**
- Portal UI attendance/leave paths (`check-in`, `/today`, `/leave/policies`, `policyId`) **do not match** API (`clock-in`, `/records`, `/leave/types`, `leaveTypeId`).
- Clock-in is auth-only; listing records needs `attendance.read`.
- Duplicate asset tag: **400** `DUPLICATE_ASSET_TAG` on dedicated API, not necessarily 409.
- HR `assignAsset` may **overwrite** assignee; dedicated `/api/assets/:id/assign` returns 400 if not AVAILABLE.
- Mark attendance **upserts** (not 409).
- Attendance status is `ON_LEAVE` / `HALF_DAY`, not `LEAVE` / `HALF_DAY` typo variants.
- Leave `dayCount` is **inclusive calendar days** (weekends/holidays counted).
- Approved leave **can** be cancelled; balance is restored.
- Auto-approve types skip PENDING and deduct on apply.
- Insufficient balance is skipped if **no** balance row exists.
- Year-spanning leave uses **start year** only.
- Delete leave type does **not** block in-use types.
- Payslips path is `/api/portal/payslips` (published + owner only).
- Ticket numbers `TKT-YYYYMMDD-xxxx`; statuses include `RESOLVED`.
- Profile PATCH cannot change email; **no address field**.
- MFA lives at `/api/auth/mfa/*` and `/portal/security`; change-password is likely N/A on that page.
