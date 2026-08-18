# Test Cases TC-251 to TC-382 — HR Assets/Tickets, Portal, Attendance, Leave, Approvals

---

## TC-251 — HR list assets
**Module:** HR Operations | **Feature:** Assets (HR view) | **Type:** Positive | **Steps:** `/hr/assets` | **Expected:** Asset table with tag, status, assignee

## TC-252 — HR create asset
**Module:** HR Operations | **Type:** Positive | **Steps:** Create asset with tag, name, category | **Expected:** Asset in AVAILABLE status

## TC-253 — HR assign asset to employee
**Module:** HR Operations | **Type:** Positive | **Steps:** `POST /api/hr/assets/:id/assign` | **Expected:** Asset status ASSIGNED; employeeId set

## TC-254 — Assign already-assigned asset fails
**Module:** HR Operations | **Type:** Negative | **Steps:** Assign asset already assigned | **Expected:** HTTP 400

## TC-255 — HR asset list filter by status
**Module:** HR Operations | **Type:** UI | **Steps:** Filter AVAILABLE/ASSIGNED | **Expected:** Correct filter

## TC-256 — Asset without asset.read permission
**Module:** HR Operations | **Type:** Security | **Steps:** Employee `GET /api/hr/assets` | **Expected:** HTTP 403

## TC-257 — Asset tag uniqueness
**Module:** HR Operations | **Type:** Negative/DB | **Steps:** Create duplicate tag | **Expected:** HTTP 409

## TC-258 — Asset detail view
**Module:** HR Operations | **Type:** Positive | **Steps:** View asset in list | **Expected:** Details shown

## TC-259 — HR list support tickets
**Module:** HR Operations | **Feature:** Tickets (HR view) | **Type:** Positive | **Steps:** `/hr/tickets` | **Expected:** Ticket list with status, priority

## TC-260 — HR view ticket detail
**Module:** HR Operations | **Type:** Positive | **Steps:** Click ticket | **Expected:** Messages thread, SLA info

## TC-261 — HR assign ticket to agent
**Module:** HR Operations | **Type:** Positive | **Steps:** `POST /api/hr/tickets/:id/assign` | **Expected:** Assignee set

## TC-262 — HR update ticket status
**Module:** HR Operations | **Type:** Positive | **Steps:** `PATCH /api/hr/tickets/:id/status` to RESOLVED | **Expected:** Status updated

## TC-263 — HR reply to ticket
**Module:** HR Operations | **Type:** Positive | **Steps:** `POST /api/hr/tickets/:id/replies` | **Expected:** Staff reply added

## TC-264 — Ticket without ticket.manage cannot assign
**Module:** HR Operations | **Type:** Security | **Steps:** Employee assign ticket | **Expected:** HTTP 403

## TC-265 — Ticket SLA due date calculated
**Module:** HR Operations | **Type:** Positive | **Steps:** Create HIGH priority ticket | **Expected:** SLA due based on SlaPolicy | **Notes:** ticket-sla.ts

## TC-266 — Ticket number auto-generated
**Module:** HR Operations | **Type:** Positive | **Steps:** Create ticket | **Expected:** Unique ticketNumber format

## TC-267 — Portal dashboard loads for employee
**Module:** Employee Portal | **Feature:** Dashboard & Profile | **Type:** Positive/UI | **Steps:** `/portal/dashboard` | **Expected:** Personal widgets, quick links

## TC-268 — Portal profile view
**Module:** Employee Portal | **Type:** Positive | **Steps:** `/portal/profile` | **Expected:** Name, email, department, manager shown

## TC-269 — Portal profile update allowed fields
**Module:** Employee Portal | **Type:** Positive | **Steps:** Update phone/address fields | **Expected:** `PATCH /api/portal/profile` 200

## TC-270 — Portal profile cannot change email (if restricted)
**Module:** Employee Portal | **Type:** Security | **Steps:** Attempt change email via profile | **Expected:** Field read-only or rejected

## TC-271 — Portal dashboard API
**Module:** Employee Portal | **Type:** API | **Steps:** `GET /api/portal/dashboard` | **Expected:** HTTP 200 personal data

## TC-272 — Portal without portal.read returns 403
**Module:** Employee Portal | **Type:** Security | **Steps:** Unprivileged user | **Expected:** HTTP 403

## TC-273 — Profile update validation empty phone
**Module:** Employee Portal | **Type:** Validation | **Steps:** Submit invalid data | **Expected:** 400 or field error

## TC-274 — Portal nav shows all enabled modules
**Module:** Employee Portal | **Type:** UI | **Steps:** Check sidebar portal section | **Expected:** Attendance, Leave, Payslips, etc.

## TC-275 — Portal profile shows employment status
**Module:** Employee Portal | **Type:** Positive | **Steps:** View profile | **Expected:** Employment status displayed

## TC-276 — Portal dashboard loading state
**Module:** Employee Portal | **Type:** UI | **Steps:** Load with slow network | **Expected:** Skeleton shown

## TC-277 — Clock in for today
**Module:** Employee Portal | **Feature:** Attendance Clock In/Out | **Type:** Positive/E2E | **Steps:** `/portal/attendance` → Clock In | **Expected:** `POST /api/attendance/clock-in` 200; status PRESENT

## TC-278 — Clock out after clock in
**Module:** Employee Portal | **Type:** Positive | **Steps:** Clock Out | **Expected:** checkOutTime recorded; workHours calculated

## TC-279 — Double clock-in same day rejected
**Module:** Employee Portal | **Type:** Negative | **Steps:** Clock in twice | **Expected:** HTTP 400 already clocked in

## TC-280 — Clock out without clock in fails
**Module:** Employee Portal | **Type:** Negative | **Steps:** Clock out without prior clock in | **Expected:** HTTP 400

## TC-281 — Clock in API requires auth only (no special permission)
**Module:** Employee Portal | **Type:** API/Positive | **Steps:** Employee POST clock-in | **Expected:** HTTP 200

## TC-282 — Attendance history displayed on portal
**Module:** Employee Portal | **Type:** UI | **Steps:** View attendance calendar/list | **Expected:** Past records shown

## TC-283 — Request attendance correction
**Module:** Employee Portal | **Type:** Positive | **Steps:** Submit correction with reason | **Expected:** `POST /api/attendance/corrections` 201 PENDING

## TC-284 — Correction reason required (min 1 char)
**Module:** Employee Portal | **Type:** Validation | **Steps:** Submit empty reason | **Expected:** HTTP 400

## TC-285 — Correction reason max 1000 chars boundary
**Module:** Employee Portal | **Type:** Boundary | **Steps:** Submit 1001-char reason | **Expected:** HTTP 400

## TC-286 — Clock in on weekend (edge)
**Module:** Employee Portal | **Type:** Edge | **Steps:** Clock in Saturday | **Expected:** Record created or warning — document

## TC-287 — Clock in with optional shiftId
**Module:** Employee Portal | **Type:** Positive | **Steps:** Clock in selecting shift | **Expected:** shiftId linked

## TC-288 — Attendance page shows today's status
**Module:** Employee Portal | **Type:** UI | **Expected:** Current day status badge

## TC-289 — Rapid clock in/out clicks
**Module:** Employee Portal | **Type:** Edge | **Steps:** Double-click clock buttons | **Expected:** No duplicate records

## TC-290 — Attendance stats on portal
**Module:** Employee Portal | **Type:** Positive | **Steps:** View monthly summary | **Expected:** Present/absent counts

## TC-291 — Apply for leave
**Module:** Employee Portal | **Feature:** Leave Applications | **Type:** Positive/E2E | **Steps:** `/portal/leave` → select type, dates, reason → Submit | **Expected:** Application PENDING

## TC-292 — Leave application reduces available balance on approval
**Module:** Employee Portal | **Type:** E2E | **Steps:** Apply → Manager approves | **Expected:** Balance decreased by dayCount

## TC-293 — Apply leave exceeding balance rejected
**Module:** Employee Portal | **Type:** Negative | **Steps:** Request more days than balance | **Expected:** HTTP 400 insufficient balance

## TC-294 — Overlapping leave dates rejected
**Module:** Employee Portal | **Type:** Negative | **Steps:** Apply overlapping existing approved leave | **Expected:** HTTP 400 overlap

## TC-295 — Cancel own pending leave
**Module:** Employee Portal | **Type:** Positive | **Steps:** `POST /api/leave/applications/:id/cancel` | **Expected:** Status CANCELLED

## TC-296 — Cannot cancel approved leave
**Module:** Employee Portal | **Type:** Negative | **Steps:** Cancel approved application | **Expected:** HTTP 400

## TC-297 — Leave start date after end date rejected
**Module:** Employee Portal | **Type:** Validation | **Steps:** endDate < startDate | **Expected:** HTTP 400

## TC-298 — Single day leave (start=end)
**Module:** Employee Portal | **Type:** Boundary/Positive | **Steps:** 1-day leave | **Expected:** dayCount=1

## TC-299 — Leave type requiring approval goes to workflow
**Module:** Employee Portal | **Type:** Positive | **Steps:** Apply leave type with requiresApproval | **Expected:** ApprovalRequest created

## TC-300 — Leave list shows status filters
**Module:** Employee Portal | **Type:** UI | **Steps:** Filter PENDING/APPROVED | **Expected:** Correct list

## TC-301 — Leave balance display on portal
**Module:** Employee Portal | **Type:** UI | **Steps:** View balances per type | **Expected:** allocated/used/remaining shown

## TC-302 — Apply leave on holiday (edge)
**Module:** Employee Portal | **Type:** Edge | **Steps:** Select holiday date | **Expected:** Accepted or warning

## TC-303 — Leave application without leave type fails
**Module:** Employee Portal | **Type:** Validation | **Steps:** Submit without leaveTypeId | **Expected:** HTTP 400

## TC-304 — Manager reviews leave application
**Module:** Employee Portal | **Type:** E2E | **Pre:** Manager with leave.approve | **Steps:** Approve via approvals page | **Expected:** Status APPROVED

## TC-305 — Leave half-day application (if supported)
**Module:** Employee Portal | **Type:** Edge | **Steps:** Apply half-day | **Expected:** dayCount=0.5 or rejected — verify

## TC-306 — Leave stats API
**Module:** Employee Portal | **Type:** API | **Steps:** `GET /api/leave/stats` | **Expected:** Aggregate leave data

## TC-307 — List own payslips
**Module:** Employee Portal | **Feature:** Payslips & Downloads | **Type:** Positive | **Steps:** `/portal/payslips` | **Expected:** Payslips for logged-in employee only

## TC-308 — Download payslip PDF
**Module:** Employee Portal | **Type:** Positive | **Steps:** Click download on payslip | **Expected:** PDF file downloaded

## TC-309 — Cannot download another employee's payslip
**Module:** Employee Portal | **Type:** Security | **Steps:** `GET /api/portal/payslips/:otherId/download` | **Expected:** HTTP 403

## TC-310 — Payslip list empty state
**Module:** Employee Portal | **Type:** UI/Edge | **Pre:** No payslips | **Expected:** EmptyState message

## TC-311 — Payslip download API returns correct content-type
**Module:** Employee Portal | **Type:** API | **Steps:** Download endpoint | **Expected:** application/pdf

## TC-312 — Payslip shows month/year and net pay
**Module:** Employee Portal | **Type:** UI | **Steps:** View payslip row | **Expected:** Period and amount displayed

## TC-313 — Payslip for unpaid payroll run not shown
**Module:** Employee Portal | **Type:** Negative | **Pre:** Payroll run not processed | **Expected:** No payslip in list

## TC-314 — Payslip access requires portal.read
**Module:** Employee Portal | **Type:** Security | **Steps:** User without portal.read | **Expected:** HTTP 403

## TC-315 — Create support ticket from portal
**Module:** Employee Portal | **Feature:** Support Tickets | **Type:** Positive | **Steps:** `/portal/support` → Create with subject, description | **Expected:** Ticket OPEN

## TC-316 — View own tickets list
**Module:** Employee Portal | **Type:** Positive | **Steps:** List tickets | **Expected:** Only own tickets

## TC-317 — Reply to own ticket
**Module:** Employee Portal | **Type:** Positive | **Steps:** Add reply message | **Expected:** Message in thread

## TC-318 — Cannot view other employee's ticket
**Module:** Employee Portal | **Type:** Security | **Steps:** `GET /api/portal/tickets/:otherId` | **Expected:** HTTP 403

## TC-319 — Ticket with attachment upload
**Module:** Employee Portal | **Type:** Positive | **Steps:** Attach file on create | **Expected:** File linked

## TC-320 — Ticket subject required validation
**Module:** Employee Portal | **Type:** Validation | **Steps:** Submit without subject | **Expected:** Error

## TC-321 — View assigned policies portal
**Module:** Employee Portal | **Feature:** Policies & Documents | **Type:** Positive | **Steps:** `/portal/policies` | **Expected:** Assigned policies listed

## TC-322 — View portal documents
**Module:** Employee Portal | **Type:** Positive | **Steps:** `/portal/documents` | **Expected:** Documents page loads with ACL-filtered docs

## TC-323 — Upload document from portal (if permitted)
**Module:** Employee Portal | **Type:** Positive | **Steps:** Upload via documents page | **Expected:** Presign flow succeeds

## TC-324 — Portal documents empty state
**Module:** Employee Portal | **Type:** UI | **Pre:** No documents | **Expected:** Empty state

## TC-325 — Policy acknowledgement button state
**Module:** Employee Portal | **Type:** UI | **Steps:** View acknowledged vs pending policy | **Expected:** Button disabled after ack

## TC-326 — Cannot access HR documents without permission
**Module:** Employee Portal | **Type:** Security | **Steps:** Direct API doc access | **Expected:** 403

## TC-327 — List notifications
**Module:** Employee Portal | **Feature:** Notifications & Preferences | **Type:** Positive | **Steps:** `/portal/notifications` | **Expected:** Notification list

## TC-328 — Mark notification as read
**Module:** Employee Portal | **Type:** Positive | **Steps:** Click notification / mark read | **Expected:** isRead=true

## TC-329 — Notification preferences update
**Module:** Employee Portal | **Type:** Positive | **Steps:** `/portal/notification-preferences` disable email for category | **Expected:** Preference saved

## TC-330 — Unread count badge in header
**Module:** Employee Portal | **Type:** UI | **Steps:** Check notification bell | **Expected:** Badge shows count from `/api/notifications/unread-count`

## TC-331 — Mark all notifications read
**Module:** Employee Portal | **Type:** Positive | **Steps:** `POST /api/notifications/read-all` | **Expected:** All marked read

## TC-332 — Notification preference per category unique
**Module:** Employee Portal | **Type:** DB | **Steps:** Update same category twice | **Expected:** Single row updated

## TC-333 — MFA setup on portal security page
**Module:** Employee Portal | **Feature:** Security (MFA, Devices) | **Type:** Positive | **Steps:** `/portal/security` enable MFA | **Expected:** QR shown, enable succeeds

## TC-334 — View trusted devices on security page
**Module:** Employee Portal | **Type:** UI | **Steps:** Security page devices section | **Expected:** Device list

## TC-335 — Revoke device from portal UI
**Module:** Employee Portal | **Type:** Positive | **Steps:** Click revoke on device | **Expected:** Device removed

## TC-336 — Disable MFA from portal
**Module:** Employee Portal | **Type:** Positive | **Steps:** Disable with valid TOTP | **Expected:** MFA disabled

## TC-337 — Security page without auth redirects
**Module:** Employee Portal | **Type:** Security | **Steps:** Unauthenticated access | **Expected:** Redirect login

## TC-338 — MFA enforced role cannot disable without admin
**Module:** Employee Portal | **Type:** Security | **Pre:** requiresMfa role | **Expected:** Disable blocked or re-prompt

## TC-339 — Change password from portal (if available)
**Module:** Employee Portal | **Type:** Positive/Edge | **Steps:** Change password form | **Expected:** Works or N/A if not in UI

## TC-340 — Security page shows MFA status badge
**Module:** Employee Portal | **Type:** UI | **Steps:** View MFA section | **Expected:** Enabled/Disabled indicator

## TC-341 — Create shift
**Module:** Attendance | **Feature:** Shifts & Holidays | **Type:** Positive | **Steps:** `POST /api/attendance/shifts` name, startTime 09:00, endTime 18:00 | **Expected:** Shift created

## TC-342 — Shift time format validation HH:mm
**Module:** Attendance | **Type:** Validation | **Steps:** startTime: `25:00` | **Expected:** HTTP 400

## TC-343 — Shift name max 100 chars boundary
**Module:** Attendance | **Type:** Boundary | **Steps:** 101-char name | **Expected:** HTTP 400

## TC-344 — Update shift times
**Module:** Attendance | **Type:** Positive | **Steps:** PUT shift | **Expected:** Updated

## TC-345 — Delete unused shift
**Module:** Attendance | **Type:** Positive | **Steps:** DELETE shift | **Expected:** Soft deleted

## TC-346 — Create holiday
**Module:** Attendance | **Type:** Positive | **Steps:** `POST /api/attendance/holidays` date YYYY-MM-DD | **Expected:** Holiday created

## TC-347 — Holiday date format validation
**Module:** Attendance | **Type:** Validation | **Steps:** date: `18-08-2026` | **Expected:** HTTP 400

## TC-348 — List holidays for year
**Module:** Attendance | **Type:** Positive | **Steps:** GET holidays | **Expected:** List returned

## TC-349 — Optional holiday flag
**Module:** Attendance | **Type:** Positive | **Steps:** Create isOptional: true | **Expected:** Flag stored

## TC-350 — Shift/holiday CRUD requires attendance.manage
**Module:** Attendance | **Type:** Security | **Steps:** Employee POST shift | **Expected:** HTTP 403

## TC-351 — HR mark attendance for employee
**Module:** Attendance | **Feature:** Records & Corrections | **Type:** Positive | **Steps:** `POST /api/attendance/records` status ABSENT | **Expected:** Record created

## TC-352 — Unique attendance per employee per day
**Module:** Attendance | **Type:** Negative/DB | **Steps:** Duplicate record same employee+date | **Expected:** HTTP 409

## TC-353 — List attendance with date filter
**Module:** Attendance | **Type:** Positive | **Steps:** GET records?from=&to= | **Expected:** Filtered list

## TC-354 — Attendance stats API
**Module:** Attendance | **Type:** Positive | **Steps:** `GET /api/attendance/stats` | **Expected:** Aggregate counts

## TC-355 — Review attendance correction approve
**Module:** Attendance | **Type:** Positive/E2E | **Pre:** HR with attendance.approve | **Steps:** Approve correction | **Expected:** Record updated; correction APPROVED

## TC-356 — Review attendance correction reject
**Module:** Attendance | **Type:** Positive | **Steps:** Reject with notes | **Expected:** Correction REJECTED; record unchanged

## TC-357 — List corrections pending
**Module:** Attendance | **Type:** Positive | **Steps:** GET corrections?status=PENDING | **Expected:** Pending list

## TC-358 — Employee cannot approve own correction
**Module:** Attendance | **Type:** Security | **Steps:** Employee POST review | **Expected:** HTTP 403

## TC-359 — Mark attendance invalid status enum
**Module:** Attendance | **Type:** Validation | **Steps:** status: INVALID | **Expected:** HTTP 400

## TC-360 — Attendance record with check-in after check-out
**Module:** Attendance | **Type:** Negative | **Steps:** checkOut before checkIn | **Expected:** HTTP 400 or auto-correct

## TC-361 — Full correction E2E workflow
**Module:** Attendance | **Type:** E2E | **Steps:** Employee request → HR approve | **Expected:** Complete flow

## TC-362 — Attendance list pagination (if API supports)
**Module:** Attendance | **Type:** API | **Steps:** Large date range query | **Expected:** Results returned within 2s NFR

## TC-363 — Weekend marked as WEEKEND status
**Module:** Attendance | **Type:** Positive | **Steps:** HR mark Saturday as WEEKEND | **Expected:** Accepted

## TC-364 — HALF_DAY attendance status
**Module:** Attendance | **Type:** Positive | **Steps:** Mark HALF_DAY | **Expected:** workHours = half day

## TC-365 — Create leave type
**Module:** Leave | **Feature:** Types, Balances, Applications | **Type:** Positive | **Steps:** `POST /api/leave/types` name, defaultBalance | **Expected:** Type created

## TC-366 — Leave type default balance boundary zero
**Module:** Leave | **Type:** Boundary | **Steps:** defaultBalance: 0 | **Expected:** Accepted

## TC-367 — Initialize leave balance for employee
**Module:** Leave | **Type:** Positive | **Steps:** `POST /api/leave/balances` employeeId, typeId, year | **Expected:** Balance row created

## TC-368 — Duplicate balance year rejected
**Module:** Leave | **Type:** Negative/DB | **Steps:** Same employee+type+year | **Expected:** HTTP 409

## TC-369 — Adjust leave balance
**Module:** Leave | **Type:** Positive | **Steps:** PUT balance allocated amount | **Expected:** Updated

## TC-370 — Leave application dayCount calculation
**Module:** Leave | **Type:** Positive | **Steps:** Apply Mon-Fri (5 working days) | **Expected:** dayCount=5 excluding weekends/holidays

## TC-371 — Carry forward leave type flag
**Module:** Leave | **Type:** Positive | **Steps:** Type with carryForward true | **Expected:** Unused balance carries to next year

## TC-372 — Leave approve via manager
**Module:** Leave | **Type:** Positive/E2E | **Steps:** `POST /api/leave/applications/:id/review` APPROVED | **Expected:** Balance deducted

## TC-373 — Leave reject restores no balance change
**Module:** Leave | **Type:** Positive | **Steps:** Reject pending application | **Expected:** Balance unchanged

## TC-374 — Leave manage requires leave.manage permission
**Module:** Leave | **Type:** Security | **Steps:** Employee create leave type | **Expected:** HTTP 403

## TC-375 — Leave application list filter by status
**Module:** Leave | **Type:** Positive | **Steps:** GET applications?status=PENDING | **Expected:** Filtered

## TC-376 — Leave stats for HR dashboard
**Module:** Leave | **Type:** API | **Steps:** `GET /api/leave/stats` | **Expected:** Aggregates

## TC-377 — Apply leave spanning year boundary (edge)
**Module:** Leave | **Type:** Edge | **Steps:** Dec 30 - Jan 2 leave | **Expected:** Correct dayCount split or handled

## TC-378 — Leave type delete not in use
**Module:** Leave | **Type:** Positive | **Steps:** DELETE unused type | **Expected:** Soft deleted

## TC-379 — Cannot delete leave type with active applications
**Module:** Leave | **Type:** Negative | **Steps:** Delete type with pending apps | **Expected:** HTTP 400

## TC-380 — Leave balance cannot go negative on approval
**Module:** Leave | **Type:** Negative | **Steps:** Approve when insufficient balance | **Expected:** HTTP 400

## TC-381 — Create approval workflow
**Module:** Approvals | **Feature:** Workflows, Requests, Delegations | **Type:** Positive | **Steps:** `/admin/approval-workflows` create with levels | **Expected:** Workflow saved

## TC-382 — Create approval request manually
**Module:** Approvals | **Type:** Positive | **Steps:** `POST /api/approvals` entityType, entityId | **Expected:** Request PENDING level 1
