# Test Cases TC-383 to TC-550 — Detailed Executable Cases

**Scope:** Approvals (remainder), dedicated assets module, finance (clients/invoices/payments/reimbursements/webhooks), payroll, business development, project management  
**Base URLs:** Web `http://localhost:3000` · API `http://localhost:4000`  
**Auth:** Login via UI or `POST /api/auth/login` (httpOnly cookies)  
**Envelope:** `{ data, error, meta }`  

**Seed users:** `admin@workforce360.com` / `Admin@123` · `hr@workforce360.com` / `Hr@123456` · `finance@workforce360.com` / `Finance@123` · `payroll@workforce360.com` / `Payroll@123`  

Create a **BD/PM-capable user** (or use admin) for `/bd/*` and `/pm/*`. Employees without those permissions are the 403 subjects.

**Confirmed enums / paths (do not use compact aliases blindly):**
- Approvals pending: `GET /api/approvals/pending/me` (**not** `/pending/my`)
- Approvals stats: `GET /api/approvals/stats/me` (**not** `/stats/my`)
- Escalations: `POST /api/approvals/process-escalations`
- From workflow: `POST /api/approvals/from-workflow`
- Assets history: `GET /api/assets/:id/history` · all: `GET /api/assets/history/all` · stats: `GET /api/assets/stats/summary`
- Invoice status: `DRAFT` \| `PENDING_APPROVAL` \| `APPROVED` \| `SENT` \| `PARTIALLY_PAID` \| `PAID` \| `OVERDUE` \| `CANCELLED` \| `REJECTED`
- Client status: `ACTIVE` \| `INACTIVE`
- Payment config: `GET /api/finance/payment-config`
- Manual pay: `POST /api/finance/payments/manual`
- Checkout: `POST /api/finance/payments/checkout-session` `{ invoiceId, provider: "STRIPE"|"RAZORPAY" }`
- Webhooks: `POST /api/payment-webhooks/stripe` · `POST /api/payment-webhooks/razorpay`
- Salary structure: `ACTIVE` \| `SUPERSEDED`
- Payroll run: `DRAFT` \| `PENDING_APPROVAL` \| `APPROVED` \| `PROCESSED` \| `PAID` \| `CANCELLED` (reject returns to **DRAFT**, no REJECTED)
- Payslip: `GENERATED` \| `PUBLISHED`
- Lead: `NEW` \| `CONTACTED` \| `QUALIFIED` \| `PROPOSAL_SENT` \| `NEGOTIATION` \| `WON` \| `LOST`
- Bid: `DRAFT` \| `SUBMITTED` \| `UNDER_REVIEW` \| `ACCEPTED` \| `REJECTED` \| `WITHDRAWN`
- Task status: `TODO` \| `IN_PROGRESS` \| `IN_REVIEW` \| `DONE` \| `CANCELLED` (**no BACKLOG**)
- Task priority (API Zod): `LOW` \| `MEDIUM` \| `HIGH` \| `URGENT` (Prisma also has `URGENT`)
- Project status: `PLANNING` \| `ACTIVE` \| `ON_HOLD` \| `COMPLETED` \| `CANCELLED`
- Communication `direction`: `inbound` \| `outbound` (lowercase)
- Portfolio flag: `isPublished`

Continue from **TC-382** (`approvalRequestId` on a PENDING request).

---

## TC-383 — Approve request at current level

**Module:** Approvals  
**Feature:** Workflows, Requests, Delegations  
**Scenario Type:** Positive / E2E / API  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** PENDING `approvalRequestId` (TC-382). Logged in as the **current-level approver**.

**Test Data:** `POST /api/approvals/<id>/approve` `{ "notes": "L1 OK" }` (notes optional, max 1000)

**Steps to Execute:**
1. As approver, POST approve.
2. GET `/api/approvals/<id>`.
3. If workflow has another level, confirm status still PENDING and level incremented; if last level, APPROVED.

**Expected Result:**
1. HTTP 200.
2. History includes APPROVE action.
3. Terminal APPROVED **or** next level pending — not skipped.

**Postconditions:** Save updated request.

**Notes / Dependencies:** Approve is `requireAuth` only; **service** checks current approver (not `approval.approve` permission).

---

## TC-384 — Reject approval request

**Module:** Approvals  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Separate PENDING request. Current approver session.

**Test Data:** `POST /api/approvals/<id>/reject` `{ "notes": "Policy exception denied" }`  
(`notes` **required** min 1 max 1000)

**Steps to Execute:**
1. POST reject **without** notes.
2. POST reject with notes.
3. GET request.

**Expected Result:**
1. HTTP 400.
2. HTTP 200; status `REJECTED`.
3. Linked entity (leave/invoice) not approved.

**Postconditions:** REJECTED.

**Notes / Dependencies:** `rejectRequestSchema.notes` required.

---

## TC-385 — Cancel own approval request

**Module:** Approvals  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** PENDING request created by employee (`requesterId`). Employee session.

**Test Data:** `POST /api/approvals/<id>/cancel` `{ "reason": "Applied in error" }` (reason optional max 500)

**Steps to Execute:**
1. As requester, POST cancel.
2. As a **different** user, cancel another pending request they did not create.

**Expected Result:**
1. HTTP 200; `CANCELLED`.
2. HTTP 403 unless service allows admin override — record actual.

**Postconditions:** CANCELLED.

**Notes / Dependencies:** Cancel is auth-only; ownership enforced in service.

---

## TC-386 — Non-approver cannot approve

**Module:** Approvals  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** PENDING request whose approver is HR. Finance (or employee) session.

**Test Data:** `POST /api/approvals/<id>/approve` `{}`

**Steps to Execute:**
1. As non-approver, POST approve.
2. Confirm request still PENDING as the real approver.

**Expected Result:**
1. HTTP 403 (or 400 not-your-step).
2. Unchanged.

**Postconditions:** Still PENDING.

**Notes / Dependencies:** No route-level `approval.approve`; service must deny.

---

## TC-387 — List my pending approvals

**Module:** Approvals  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** At least one PENDING item for HR. HR session.

**Test Data:** `GET /api/approvals/pending/me`

**Steps to Execute:**
1. As HR, GET pending/me.
2. As employee with no pending items, GET pending/me.
3. Confirm compact `/pending/my` 404s.

**Expected Result:**
1. HTTP 200; only items where the user is current approver (or delegate).
2. HTTP 200 empty array.
3. `/pending/my` is **not** a route — use `/pending/me`.

**Postconditions:** None.

**Notes / Dependencies:** Auth only.

---

## TC-388 — Approval history view

**Module:** Approvals  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Request that was approved or rejected. Authenticated user allowed to view it.

**Test Data:** `GET /api/approvals/<id>/history`

**Steps to Execute:**
1. GET history.
2. GET `/api/approvals/<id>`.

**Expected Result:**
1. HTTP 200; ordered actions (submit/approve/reject/cancel) with actor, notes, timestamps.
2. Detail consistent with history.

**Postconditions:** None.

**Notes / Dependencies:** Auth only.

---

## TC-389 — Create approval from workflow template

**Module:** Approvals  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Active workflow (TC-381) for `leave_application`. `approval.create`. Entity id (leave or invoice).

**Test Data:**
```json
{
  "workflowId": "<workflowId>",
  "entityType": "leave_application",
  "entityId": "<leaveApplicationId>",
  "requesterId": "<employeeUserId>"
}
```

**Steps to Execute:**
1. `POST /api/approvals/from-workflow`.
2. GET the new request; confirm levels copied from workflow.
3. POST with unknown workflowId.

**Expected Result:**
1. HTTP 201/200; PENDING level 1.
2. Approvers/roles match workflow steps.
3. HTTP 404.

**Postconditions:** Save request id.

**Notes / Dependencies:** `requesterId` optional (defaults to actor). Compact path `/from-workflow` matches.

---

## TC-390 — Approval workflow condition routing

**Module:** Approvals  
**Scenario Type:** Positive / Gap check  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Ability to set workflow `conditions` (`field`, `operator` eq/ne/gt/gte/lt/lte/in, `value`). Invoice with `totalAmount` above/below a threshold.

**Test Data:** Workflow condition e.g. `totalAmount` `gt` `10000` → finance approver.

**Steps to Execute:**
1. PATCH/create workflow with a condition + two step variants if supported.
2. Submit a high-value invoice for approval.
3. Submit a low-value invoice.
4. Inspect `apps/api/src/lib/approval-conditions.ts` / assigned approvers.

**Expected Result:**
1. Workflow saves conditions.
2. High-value routes to the intended approver **if** the engine evaluates metadata.
3. Low-value uses the other path.
4. If conditions are stored but **not evaluated**, log **gap** — still record assigned approverIds from submit body (`submitInvoiceApprovalSchema.approverIds` is **client-supplied**).

**Postconditions:** Two invoices in approval.

**Notes / Dependencies:** Invoice submit always sends `approverIds` from the client — condition routing may be unused for invoices.

---

## TC-391 — Create delegation

**Module:** Approvals  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** User with `approval.delegate` (admin/HR as seeded). Delegate user id ≠ delegator.

**Test Data:** `/approvals/delegations`
```json
{
  "delegatorId": "<hrUserId>",
  "delegateId": "<financeUserId>",
  "startsAt": "<now ISO>",
  "endsAt": "<now+7d ISO>",
  "reason": "On leave"
}
```

**Steps to Execute:**
1. Open `/approvals/delegations`; create.
2. Confirm `POST /api/approvals/delegations`.
3. POST `endsAt` before `startsAt` if the service validates.

**Expected Result:**
1. HTTP 201/200; `isActive` true (default).
2. Listed on GET `/api/approvals/delegations`.
3. 400 if inverted dates are rejected — else log gap.

**Postconditions:** Save `delegationId`.

**Notes / Dependencies:** Datetime ISO required.

---

## TC-392 — Delegated approver can approve

**Module:** Approvals  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Active delegation HR → Finance (TC-391). PENDING request whose approver is HR.

**Test Data:** Finance session `POST /api/approvals/<id>/approve`

**Steps to Execute:**
1. As finance (delegate), GET `/api/approvals/pending/me` — request should appear.
2. POST approve.
3. GET history; look for `delegatedFromId` / delegator id.

**Expected Result:**
1. Item listed for delegate.
2. HTTP 200.
3. Audit/history shows approval **on behalf of** HR. If field missing, log payload.

**Postconditions:** Request approved or advanced.

**Notes / Dependencies:** Compact `delegatedFromId` — confirm actual field name.

---

## TC-393 — Expired delegation not active

**Module:** Approvals  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Create delegation with `endsAt` in the **past** (or wait). PENDING HR request.

**Test Data:** Past `endsAt` ISO.

**Steps to Execute:**
1. Create/update delegation so it is expired.
2. As delegate, GET pending/me and POST approve.

**Expected Result:**
1. Delegation stored.
2. Request **not** in delegate pending; approve **403**. Original approver can still approve.

**Postconditions:** Delegation expired.

**Notes / Dependencies:** Also test `isActive: false` via PATCH.

---

## TC-394 — Process escalations job

**Module:** Approvals  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `approval.manage`. A PENDING request whose step `slaHours` / escalateAfterHours has elapsed (create with 1-hour SLA in the past if possible).

**Test Data:** `POST /api/approvals/process-escalations`

**Steps to Execute:**
1. As admin, POST process-escalations.
2. As employee, POST the same.
3. GET the overdue request; note level/assignee change.

**Expected Result:**
1. HTTP 200; overdue items escalated (or empty if none due).
2. HTTP 403.
3. History shows escalation if any were due.

**Postconditions:** Possibly escalated request.

**Notes / Dependencies:** Compact name `process-escalations` matches route.

---

## TC-395 — Approval stats (my dashboard)

**Module:** Approvals  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Authenticated user who has approved/pending items.

**Test Data:** `GET /api/approvals/stats/me`

**Steps to Execute:**
1. GET stats/me.
2. Confirm `/stats/my` is not a route.

**Expected Result:**
1. HTTP 200; pending/approved (and maybe rejected) counts for the current user.
2. Use `/stats/me` only.

**Postconditions:** None.

**Notes / Dependencies:** Auth only.

---

## TC-396 — Multi-level approval full flow

**Module:** Approvals  
**Scenario Type:** E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Workflow with **two** steps (HR then admin). Entity + from-workflow request.

**Test Data:** L1 HR approve; L2 admin approve.

**Steps to Execute:**
1. Create request from 2-level workflow.
2. As L1, approve — still PENDING, level 2.
3. As L1, approve again — should 403.
4. As L2, approve — APPROVED.
5. Confirm linked entity (invoice/leave) reflects approval.

**Expected Result:**
1. Two levels.
2. HTTP 200; not final.
3. L1 cannot finish L2.
4. Final APPROVED.
5. Entity APPROVED/leave approved as designed.

**Postconditions:** Fully approved.

**Notes / Dependencies:** Pair with TC-689 invoice flow.

---

## TC-397 — Update approval workflow

**Module:** Approvals  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `approval.manage`. Existing workflow.

**Test Data:** `PATCH /api/approvals/workflows/<id>` add a step `{ "steps": [..., { "stepOrder": 2, "approverRole": "admin" }] }` or name change.

**Steps to Execute:**
1. PATCH name/description/isActive.
2. PATCH steps array.
3. As HR without approval.manage, PATCH.

**Expected Result:**
1. HTTP 200.
2. GET workflow shows new level.
3. HTTP 403.

**Postconditions:** Workflow updated.

**Notes / Dependencies:** `updateWorkflowSchema`; `code` is not in PATCH (immutable).

---

## TC-398 — Delete delegation

**Module:** Approvals  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `delegationId`. `approval.delegate`.

**Test Data:** `DELETE /api/approvals/delegations/<id>`

**Steps to Execute:**
1. DELETE.
2. GET list.
3. DELETE again.

**Expected Result:**
1. HTTP 200 (soft delete or hard).
2. Absent from list.
3. HTTP 404.

**Postconditions:** Removed.

**Notes / Dependencies:** Confirmed DELETE route.

---

## TC-399 — Approvals page UI pending list

**Module:** Approvals  
**Scenario Type:** UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** User with pending items. Logged in.

**Test Data:** `/approvals`

**Steps to Execute:**
1. Open `/approvals`.
2. Confirm pending widget + list; approve/reject controls.
3. Confirm dashboard PendingApprovals widget (if `dashboard.read`) also lists items.

**Expected Result:**
1. Page loads.
2. Matches `GET /api/approvals/pending/me`.
3. Widget visible for admin/HR.

**Postconditions:** None.

**Notes / Dependencies:** Nav `/approvals`.

---

## TC-400 — Manual create requires approval.create

**Module:** Approvals  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee **without** `approval.create`. Valid body from TC-382.

**Test Data:** `POST /api/approvals`

**Steps to Execute:**
1. As employee, POST /api/approvals.
2. POST /api/approvals/from-workflow.

**Expected Result:**
1. HTTP 403.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Both creates use `approval.create`. Apply-leave without approverIds does not need this permission.

---

## TC-401 — Create asset via assets module

**Module:** Assets  
**Feature:** Asset CRUD, Assign, Return  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** User with `asset.create` (HR/admin).

**Test Data:** `POST /api/assets`
```json
{ "name": "QA Monitor 27", "tag": "QA-MON-401", "category": "Monitor" }
```

**Steps to Execute:**
1. POST /api/assets.
2. GET /api/assets and /api/assets/:id.

**Expected Result:**
1. HTTP 201/200; `status` `AVAILABLE`.
2. Listed; history seed event STATUS_CHANGED → AVAILABLE.

**Postconditions:** Save `assetId`.

**Notes / Dependencies:** Dedicated module (not only `/api/hr/assets`).

---

## TC-402 — Update asset details

**Module:** Assets  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `asset.update`. `assetId`.

**Test Data:** `PUT /api/assets/<id>` `{ "name": "QA Monitor 27-inch", "notes": "Docking station" }`  
(`tag` is **not** in updateAssetSchema)

**Steps to Execute:**
1. PUT name/notes/category.
2. PUT `{ "tag": "HACK" }` — should ignore or 400.

**Expected Result:**
1. HTTP 200; fields updated.
2. Tag unchanged.

**Postconditions:** Updated.

**Notes / Dependencies:** Update schema: name, category, serialNumber, notes only.

---

## TC-403 — Soft delete asset

**Module:** Assets  
**Scenario Type:** Positive / Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** AVAILABLE unused asset. `asset.delete`. Also an ASSIGNED asset.

**Test Data:** `DELETE /api/assets/<id>`

**Steps to Execute:**
1. DELETE AVAILABLE asset.
2. GET by id / list.
3. DELETE an ASSIGNED asset.

**Expected Result:**
1. HTTP 200.
2. 404 / omitted from list (soft delete).
3. HTTP 400 `ASSET_ASSIGNED` (“Return it first”).

**Postconditions:** AVAILABLE one deleted.

**Notes / Dependencies:** Confirmed `deleteAsset` guard.

---

## TC-404 — Assign asset to employee

**Module:** Assets  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** AVAILABLE `assetId`. `asset.manage`. Employee id.

**Test Data:** `POST /api/assets/<id>/assign` `{ "employeeId": "<id>", "notes": "Onboarding kit" }`

**Steps to Execute:**
1. POST assign.
2. GET asset; GET `/api/assets/<id>/history`.
3. Portal `/portal/assets` as that employee.

**Expected Result:**
1. HTTP 200; `ASSIGNED`; `employeeId` set.
2. History action `ASSIGNED`.
3. Employee sees it.

**Postconditions:** ASSIGNED.

**Notes / Dependencies:** Permission `asset.manage` (not `asset.update`).

---

## TC-405 — Return asset from employee

**Module:** Assets  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** ASSIGNED asset. `asset.manage`.

**Test Data:** `POST /api/assets/<id>/return` `{ "notes": "Exiting" }`

**Steps to Execute:**
1. POST return.
2. GET asset.
3. POST return again.

**Expected Result:**
1. HTTP 200.
2. `AVAILABLE`; `employeeId` null.
3. HTTP 400 `ASSET_NOT_ASSIGNED`.

**Postconditions:** AVAILABLE.

**Notes / Dependencies:** Confirmed returnAsset.

---

## TC-406 — Update asset status

**Module:** Assets  
**Scenario Type:** Positive / Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** AVAILABLE asset, not assigned. `asset.manage`.

**Test Data:** `PATCH /api/assets/<id>/status` `{ "status": "MAINTENANCE" }`  
Then `{ "status": "ASSIGNED" }` without employee.

**Steps to Execute:**
1. PATCH MAINTENANCE.
2. PATCH ASSIGNED with no employeeId on the asset.
3. PATCH `BROKEN`.

**Expected Result:**
1. HTTP 200; MAINTENANCE.
2. HTTP 400 `ASSET_MISSING_EMPLOYEE`.
3. HTTP 400 invalid enum (`AVAILABLE` \| `ASSIGNED` \| `MAINTENANCE` \| `RETIRED`).

**Postconditions:** MAINTENANCE or restored AVAILABLE.

**Notes / Dependencies:** Compact MAINTENANCE matches.

---

## TC-407 — Asset history view

**Module:** Assets  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Asset that was assigned and returned. `asset.read`.

**Test Data:** `GET /api/assets/<id>/history`

**Steps to Execute:**
1. GET history.
2. Confirm compact `/history` vs actual `/:id/history`.

**Expected Result:**
1. HTTP 200; create, assign, return (and status) events with actor/timestamps.
2. Path is `GET /api/assets/:id/history`.

**Postconditions:** None.

**Notes / Dependencies:** Compact `/history` is wrong if used as `/api/assets/:id/history` — that's correct as `/:id/history`.

---

## TC-408 — List assets by employee

**Module:** Assets  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Employee has ≥1 ASSIGNED asset. `asset.read`.

**Test Data:** `GET /api/assets/employee/<employeeId>`

**Steps to Execute:**
1. GET employee assets.
2. GET unknown employee id (empty vs 404).

**Expected Result:**
1. HTTP 200; that employee’s assets.
2. 200 `[]` or 404 — record.

**Postconditions:** None.

**Notes / Dependencies:** Compact path matches `/employee/:employeeId`.

---

## TC-409 — Asset stats summary

**Module:** Assets  
**Scenario Type:** API  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** `asset.read`. Mix of statuses.

**Test Data:** `GET /api/assets/stats/summary`

**Steps to Execute:**
1. GET summary.
2. As employee without asset.read.

**Expected Result:**
1. HTTP 200; counts by AVAILABLE/ASSIGNED/MAINTENANCE/RETIRED.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Compact `/stats/summary` matches.

---

## TC-410 — Assign already-assigned asset fails

**Module:** Assets  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** ASSIGNED asset. `asset.manage`.

**Test Data:** POST assign to another employee.

**Steps to Execute:**
1. POST `/api/assets/<id>/assign`.

**Expected Result:**
1. HTTP 400 `ASSET_NOT_AVAILABLE`.

**Postconditions:** Original assignee unchanged.

**Notes / Dependencies:** Dedicated module (HR path may differ — TC-254).

---

## TC-411 — Asset tag duplicate rejected

**Module:** Assets  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Tag `QA-MON-401` exists. `asset.create`.

**Test Data:** POST same tag.

**Steps to Execute:**
1. POST /api/assets duplicate tag.

**Expected Result:**
1. HTTP **400** `DUPLICATE_ASSET_TAG` (compact 409 — accept 400). Unique constraint may 409 if thrown as Prisma P2002.

**Postconditions:** One row per tag.

**Notes / Dependencies:** `createAsset` explicit check.

---

## TC-412 — Asset history all list

**Module:** Assets  
**Scenario Type:** Positive  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** `asset.read`. History rows exist.

**Test Data:** `GET /api/assets/history/all` (optional query per `listAssetHistoryQuerySchema`)

**Steps to Execute:**
1. GET history/all.
2. Confirm compact `/history/all` vs actual `/history/all`.

**Expected Result:**
1. HTTP 200; list (pagination if implemented).
2. Path `GET /api/assets/history/all`.

**Postconditions:** None.

**Notes / Dependencies:** Compact said `/history/all` — actual `/history/all`.

---

## TC-413 — Create finance client

**Module:** Finance  
**Feature:** Clients & Invoices  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Finance user with `client.manage`.

**Test Data:** `/finance/clients`
```json
{
  "name": "Acme QA Ltd",
  "companyName": "Acme",
  "email": "ap@acme.test",
  "billingAddress": "1 Test Street",
  "city": "Bengaluru",
  "country": "IN"
}
```

**Steps to Execute:**
1. Create via UI.
2. Confirm `POST /api/finance/clients`.
3. GET list.

**Expected Result:**
1. HTTP 201/200; status **ACTIVE** (default).
2. Listed on `/finance/clients`.
3. Name required min 1 max 200.

**Postconditions:** Save `clientId`.

**Notes / Dependencies:** No explicit status on create schema — defaults ACTIVE.

---

## TC-414 — Update client details

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `client.manage`. `clientId`.

**Test Data:** `PUT /api/finance/clients/<id>` `{ "phone": "0800000000", "taxId": "GSTIN-QA" }`

**Steps to Execute:**
1. PUT update.
2. GET client.

**Expected Result:**
1. HTTP 200.
2. Fields persisted.

**Postconditions:** Updated.

**Notes / Dependencies:** `updateClientSchema` partial + optional status.

---

## TC-415 — Deactivate client

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** ACTIVE client. `client.manage`.

**Test Data:** `PUT /api/finance/clients/<id>` `{ "status": "INACTIVE" }`

**Steps to Execute:**
1. PUT INACTIVE.
2. Open new invoice UI; confirm client not selectable **or** API still allows invoice (record).
3. PUT `{ "status": "CLOSED" }`.

**Expected Result:**
1. HTTP 200; INACTIVE.
2. Product should hide INACTIVE clients — if invoices still create, log gap.
3. HTTP 400 (enum ACTIVE \| INACTIVE only). Compact said INACTIVE — actual **INACTIVE**.

**Postconditions:** INACTIVE.

**Notes / Dependencies:** Compact INACTIVE ≠ Prisma INACTIVE.

---

## TC-416 — Create invoice with line items

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** ACTIVE `clientId`. `invoice.manage`.

**Test Data:** `POST /api/finance/invoices`
```json
{
  "clientId": "<id>",
  "issueDate": "2026-08-18",
  "dueDate": "2026-09-17",
  "currency": "USD",
  "taxAmount": 180,
  "discountAmount": 0,
  "lineItems": [
    { "description": "QA retainers", "quantity": 10, "unitPrice": 100 }
  ]
}
```

**Steps to Execute:**
1. POST invoice.
2. GET invoice; read subtotal/total.
3. Open `/finance/invoices`.

**Expected Result:**
1. HTTP 201/200; status **DRAFT**.
2. subtotal = 10×100 = 1000; total = 1000+180−0 = 1180 (`computeInvoiceTotals`).
3. Listed.

**Postconditions:** Save `invoiceId`.

**Notes / Dependencies:** `lineItems` min 1. Dates YYYY-MM-DD. `quantity` positive; `unitPrice` min 0.

---

## TC-417 — Invoice total calculation accuracy

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** `invoice.manage`. Client.

**Test Data:** Three lines qty/price (2×50, 1×25, 3×10), taxAmount 20, discountAmount 5.

**Steps to Execute:**
1. POST invoice with those lines.
2. Compute expected subtotal 100+25+30=155; total 155+20−5=170.
3. Compare API `subtotal` / `totalAmount`.

**Expected Result:**
1. HTTP 201.
2. Matches rounded 2 decimals.
3. No silent tax-on-line unless implemented (schema tax is invoice-level `taxAmount`).

**Postconditions:** Invoice exists.

**Notes / Dependencies:** `finance.service.ts` `round2`.

---

## TC-418 — Submit invoice for approval

**Module:** Finance  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** DRAFT invoice. `invoice.manage`. Approver user id with `invoice.approve`.

**Test Data:** `POST /api/finance/invoices/<id>/submit` `{ "approverIds": ["<financeOrAdminUserId>"] }`

**Steps to Execute:**
1. POST submit.
2. GET invoice.
3. POST submit again.
4. Submit `{ "approverIds": [] }`.

**Expected Result:**
1. HTTP 200.
2. Status **PENDING_APPROVAL**; approvalRequestId set.
3. HTTP 400 unless already pending is idempotent — record.
4. HTTP 400 min 1 approver.

**Postconditions:** PENDING_APPROVAL. Compact PENDING_APPROVAL ≠ **PENDING_APPROVAL**.

**Notes / Dependencies:** `submitInvoiceApprovalSchema`.

---

## TC-419 — Approve invoice

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** PENDING_APPROVAL invoice. User with `invoice.approve` who is in approverIds.

**Test Data:** `POST /api/finance/invoices/<id>/approve` `{ "notes": "OK" }`

**Steps to Execute:**
1. POST approve.
2. GET invoice.
3. As employee without invoice.approve, POST approve on another invoice.

**Expected Result:**
1. HTTP 200.
2. Status **APPROVED**.
3. HTTP 403.

**Postconditions:** APPROVED.

**Notes / Dependencies:** Uses `approveRequestSchema` (notes optional). Must be PENDING_APPROVAL (`INVOICE_NOT_PENDING_APPROVAL`).

---

## TC-420 — Reject invoice

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Another PENDING_APPROVAL invoice. `invoice.approve`.

**Test Data:** `POST /api/finance/invoices/<id>/reject` `{ "notes": "Wrong PO" }`

**Steps to Execute:**
1. Reject without notes.
2. Reject with notes.
3. GET invoice.

**Expected Result:**
1. HTTP 400 (notes required).
2. HTTP 200; status **REJECTED**.
3. Cannot send until re-drafted if service requires it.

**Postconditions:** REJECTED.

**Notes / Dependencies:** `rejectRequestSchema`.

---

## TC-421 — Send invoice to client

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** APPROVED invoice (or whatever send allows — verify). `invoice.manage`. Client email set.

**Test Data:** `POST /api/finance/invoices/<id>/send`

**Steps to Execute:**
1. POST send on APPROVED invoice.
2. POST send on DRAFT.
3. Check status SENT; email only if SMTP configured (do not fail local on missing mail).

**Expected Result:**
1. HTTP 200; status **SENT**.
2. HTTP 400 if send requires APPROVED.
3. Email best-effort.

**Postconditions:** SENT.

**Notes / Dependencies:** Confirm allowed source statuses in finance.service.sendInvoice.

---

## TC-422 — Cancel invoice

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** DRAFT invoice. `invoice.manage`.

**Test Data:** `POST /api/finance/invoices/<id>/cancel`

**Steps to Execute:**
1. Cancel DRAFT.
2. GET invoice.

**Expected Result:**
1. HTTP 200; **CANCELLED**.
2. Not in default “open” filters.

**Postconditions:** CANCELLED.

**Notes / Dependencies:** Prisma `CANCELLED`.

---

## TC-423 — Cannot cancel paid invoice

**Module:** Finance  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** PAID invoice (TC-435). `invoice.manage`.

**Test Data:** POST cancel.

**Steps to Execute:**
1. POST `/api/finance/invoices/<paidId>/cancel`.

**Expected Result:**
1. HTTP 400. Status remains PAID.

**Postconditions:** PAID.

**Notes / Dependencies:** Confirm service guard; if missing, log gap.

---

## TC-424 — Mark overdue invoices job

**Module:** Finance  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** SENT invoice with `dueDate` in the past, unpaid. `invoice.manage`.

**Test Data:** `POST /api/finance/invoices/mark-overdue`

**Steps to Execute:**
1. POST mark-overdue.
2. GET that invoice.
3. As employee, POST mark-overdue.

**Expected Result:**
1. HTTP 200.
2. Status **OVERDUE**.
3. HTTP 403.

**Postconditions:** OVERDUE.

**Notes / Dependencies:** Compact `/mark-overdue` matches.

---

## TC-425 — Invoice list filter by status

**Module:** Finance  
**Scenario Type:** UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Mix of statuses. `invoice.read`.

**Test Data:** `/finance/invoices` · `GET /api/finance/invoices?status=DRAFT` (also SENT, PAID, page/pageSize)

**Steps to Execute:**
1. Filter DRAFT / SENT / PAID in UI.
2. GET with status + pagination if `optionalPaginationQuerySchema` applies.

**Expected Result:**
1. List matches filter.
2. HTTP 200; `status` is a free string on list query.

**Postconditions:** None.

**Notes / Dependencies:** Compact DRAFT/SENT/PAID are valid Prisma values.

---

## TC-426 — Invoice detail page

**Module:** Finance  
**Scenario Type:** UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `invoice.read`. Known invoice.

**Test Data:** `/finance/invoices/<id>` · `GET /api/finance/invoices/<id>`

**Steps to Execute:**
1. Open detail.
2. Confirm line items, subtotal, tax, discount, total, status, action buttons (submit/approve/send/pay).

**Expected Result:**
1. Page loads.
2. Matches API; actions respect permissions and status.

**Postconditions:** None.

**Notes / Dependencies:** Nav invoices + `[id]` page.

---

## TC-427 — Invoice number uniqueness

**Module:** Finance  
**Scenario Type:** Negative / DB  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `invoice.manage`. Existing invoiceNumber if user-supplied; otherwise numbers are generated.

**Test Data:** Two creates; compare `invoiceNumber`. Attempt to force duplicate if API accepts a number field (create schema has **no** invoiceNumber — generated).

**Steps to Execute:**
1. Create two invoices.
2. Inspect uniqueness of generated numbers.
3. If no client-supplied number, mark **N/A for duplicate POST** — uniqueness is DB on generated value.

**Expected Result:**
1. Both 201.
2. Distinct numbers.
3. Compact 409 only if a duplicate insert is attempted at DB.

**Postconditions:** Two invoices.

**Notes / Dependencies:** createInvoiceSchema has no invoiceNumber field.

---

## TC-428 — Create invoice without client fails

**Module:** Finance  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `invoice.manage`.

**Test Data:** Body missing `clientId`; empty lineItems `[]`.

**Steps to Execute:**
1. POST without clientId.
2. POST with clientId but `lineItems: []`.
3. POST missing issueDate.

**Expected Result:**
1. HTTP 400.
2. HTTP 400 (min 1 line).
3. HTTP 400 date YYYY-MM-DD.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed schema.

---

## TC-429 — Line item zero quantity boundary

**Module:** Finance  
**Scenario Type:** Boundary  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `invoice.manage`. Valid client.

**Test Data:** `quantity: 0` · `quantity: 0.5` · `quantity: 1`

**Steps to Execute:**
1. POST qty 0.
2. POST qty 0.5.
3. POST qty 1.

**Expected Result:**
1. HTTP 400 (`z.number().positive()` — 0 fails).
2. HTTP 201 (positive float allowed unless int elsewhere).
3. HTTP 201.

**Postconditions:** Optional invoices.

**Notes / Dependencies:** Compact expected validation error for 0 — **confirmed**.

---

## TC-430 — Line item negative price rejected

**Module:** Finance  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `invoice.manage`.

**Test Data:** `unitPrice: -100` · `unitPrice: 0`

**Steps to Execute:**
1. POST unitPrice -100.
2. POST unitPrice 0.

**Expected Result:**
1. HTTP 400 (`money()` = `z.number().min(0)`).
2. HTTP 201 — **0 is allowed**. Compact only mentioned negative.

**Postconditions:** Optional zero-price invoice.

**Notes / Dependencies:** Confirmed.

---

## TC-431 — Finance dashboard loads

**Module:** Finance  
**Scenario Type:** UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `finance.dashboard.read`.

**Test Data:** `/finance/dashboard` · `GET /api/finance/dashboard`

**Steps to Execute:**
1. Open dashboard as finance.
2. Confirm revenue/outstanding widgets.
3. As employee, GET dashboard.

**Expected Result:**
1. Page loads.
2. HTTP 200 metrics.
3. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Permission `finance.dashboard.read`.

---

## TC-432 — Employee without finance permission blocked

**Module:** Finance  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee session.

**Test Data:** `GET /api/finance/invoices` · `GET /api/finance/clients`

**Steps to Execute:**
1. GET invoices.
2. GET clients.
3. Open `/finance/invoices`.

**Expected Result:**
1. HTTP 403.
2. HTTP 403.
3. Nav hidden / gated.

**Postconditions:** None.

**Notes / Dependencies:** invoice.read / client.read.

---

## TC-433 — Record manual payment

**Module:** Finance  
**Feature:** Payments  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** SENT/APPROVED unpaid invoice. `payment.manage`.

**Test Data:** `POST /api/finance/payments/manual`
```json
{ "invoiceId": "<id>", "amount": 100, "currency": "USD", "method": "bank_transfer" }
```

**Steps to Execute:**
1. POST manual payment (partial).
2. GET invoice `amountPaid` / status.
3. Confirm compact `/payments/manual` vs actual `/payments/manual`.

**Expected Result:**
1. HTTP 201/200; payment SUCCEEDED/recorded.
2. amountPaid increased; status PARTIALLY_PAID if not full.
3. Path is `/api/finance/payments/manual`.

**Postconditions:** Partial payment recorded.

**Notes / Dependencies:** `amount` positive. Compact `/payments/manual` ≠ **`/payments/manual`**.

---

## TC-434 — Partial payment updates balance

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Invoice total 1180; paid 100 (TC-433).

**Test Data:** None extra.

**Steps to Execute:**
1. GET invoice.
2. GET `/api/finance/payments?invoiceId=`.

**Expected Result:**
1. Status **PARTIALLY_PAID** (not compact PARTIALLY_PAID vs PARTIALLY_PAID — Prisma `PARTIALLY_PAID`). Compact said PARTIALLY_PAID — actual **PARTIALLY_PAID**.
2. Payments list shows the 100.

**Postconditions:** PARTIALLY_PAID.

**Notes / Dependencies:** Compact PARTIALLY_PAID ≠ PARTIALLY_PAID.

---

## TC-435 — Full payment marks invoice PAID

**Module:** Finance  
**Scenario Type:** Positive / E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Remaining balance known.

**Test Data:** POST manual payment for **remaining** amount.

**Steps to Execute:**
1. Pay remaining.
2. GET invoice.

**Expected Result:**
1. HTTP 200.
2. Status **PAID**; amountPaid = totalAmount.

**Postconditions:** PAID.

**Notes / Dependencies:** None.

---

## TC-436 — Create Razorpay/Stripe checkout session

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `payment.manage`. Unpaid SENT invoice. Provider keys in env **or** expect 500/400 if missing.

**Test Data:** `POST /api/finance/payments/checkout-session` `{ "invoiceId": "<id>", "provider": "RAZORPAY" }`

**Steps to Execute:**
1. POST RAZORPAY.
2. POST STRIPE.
3. POST `{ "provider": "PAYPAL" }`.
4. Confirm compact `/checkout-session` vs `/checkout-session`.

**Expected Result:**
1. HTTP 200 with session/order id **if configured**; else 400/503 documented.
2. Same for Stripe.
3. HTTP 400 enum STRIPE \| RAZORPAY.
4. Actual path `/checkout-session`.

**Postconditions:** Session may exist.

**Notes / Dependencies:** Compact `/checkout-session` ≠ **`/checkout-session`**.

---

## TC-437 — Razorpay checkout UI on invoice page

**Module:** Finance  
**Scenario Type:** UI / E2E  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Invoice detail; Razorpay publishable key via payment-config. Browser.

**Test Data:** `/finance/invoices/<id>` Pay button.

**Steps to Execute:**
1. GET `/api/finance/payment-config`.
2. Click Pay.
3. If keys missing, record disabled Pay / error toast.

**Expected Result:**
1. Publishable keys only.
2. Razorpay/Stripe modal opens when configured.
3. N/A local without keys — not a product fail.

**Postconditions:** None.

**Notes / Dependencies:** `openRazorpayCheckout` on web.

---

## TC-438 — List payments with filters

**Module:** Finance  
**Scenario Type:** Positive / UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `payment.read`. Payments exist.

**Test Data:** `/finance/payments` · `GET /api/finance/payments?invoiceId=&status=&provider=`

**Steps to Execute:**
1. Open payments page.
2. Filter by invoice/status/provider.

**Expected Result:**
1. Table loads.
2. HTTP 200 filtered.

**Postconditions:** None.

**Notes / Dependencies:** listPaymentsQuerySchema — **no page param** in schema (compact pagination is TC-442).

---

## TC-439 — Payment config returns publishable keys only

**Module:** Finance  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Any authenticated user (route is **auth only**, no payment.manage).

**Test Data:** `GET /api/finance/payment-config`

**Steps to Execute:**
1. As finance, GET config.
2. As employee, GET config.
3. Inspect JSON for `secret`, `key_secret`, `webhook`.

**Expected Result:**
1. HTTP 200; publishable/publishableKey/razorpayKeyId only.
2. HTTP 200 (auth only) **or** 403 if later locked — record. Compact implied finance-only.
3. **No** secret keys.

**Postconditions:** None.

**Notes / Dependencies:** Compact `/payment-config` ≠ **`/payment-config`**.

---

## TC-440 — Overpayment rejected

**Module:** Finance  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** Invoice remaining 50. `payment.manage`.

**Test Data:** POST manual `{ "invoiceId", "amount": 99999 }`

**Steps to Execute:**
1. POST amount > remaining.

**Expected Result:**
1. HTTP 400 if service guards overpay; **if 200 and amountPaid > total**, log **gap**. Compact expected 400.

**Postconditions:** Invoice not over-paid (preferred).

**Notes / Dependencies:** Verify finance.service.recordManualPayment.

---

## TC-441 — Payment without payment.manage

**Module:** Finance  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee session. Valid invoiceId.

**Test Data:** POST `/api/finance/payments/manual`

**Steps to Execute:**
1. As employee, POST manual payment.
2. POST checkout-session.

**Expected Result:**
1. HTTP 403.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Compact said `invoice.manage` — actual permission is **`payment.manage`**.

---

## TC-442 — List payments pagination

**Module:** Finance  
**Scenario Type:** API  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** `payment.read`. Many payments if possible.

**Test Data:** `GET /api/finance/payments?page=1`

**Steps to Execute:**
1. GET with page=1.
2. Inspect whether `page` is honored (`listPaymentsQuerySchema` has invoiceId/status/provider **only**).

**Expected Result:**
1. HTTP 200.
2. **Pagination may be ignored** — extra query keys stripped. Log gap vs compact.

**Postconditions:** None.

**Notes / Dependencies:** No pagination in listPaymentsQuerySchema.

---

## TC-443 — Employee submit reimbursement

**Module:** Finance  
**Feature:** Reimbursements  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Authenticated employee (**no** extra permission on POST). Optional receipt fileId.

**Test Data:** `POST /api/finance/reimbursements`
```json
{
  "category": "Travel",
  "description": "Client taxi",
  "amount": 1500,
  "currency": "INR",
  "expenseDate": "2026-08-15"
}
```
UI: `/finance/reimbursements` (finance team) or portal if a submit form exists.

**Steps to Execute:**
1. As employee, POST reimbursement.
2. GET `/api/finance/reimbursements` as employee (needs reimbursement.read **or** review — may 403).
3. GET as finance.

**Expected Result:**
1. HTTP 201; status **PENDING**.
2. Employee list may 403 — then finance GET should include the row (or employee-scoped if implemented). Log.
3. Finance sees PENDING.

**Postconditions:** Save `reimbursementId`.

**Notes / Dependencies:** POST is auth-only. Amount positive. Compact portal submit — confirm UI exists.

---

## TC-444 — Finance approve reimbursement

**Module:** Finance  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** PENDING reimbursement. `reimbursement.review`.

**Test Data:** `POST /api/finance/reimbursements/<id>/review` `{ "status": "APPROVED", "reviewNotes": "Receipt OK" }`

**Steps to Execute:**
1. POST APPROVED.
2. GET reimbursement.

**Expected Result:**
1. HTTP 200.
2. Status **APPROVED**.

**Postconditions:** APPROVED.

**Notes / Dependencies:** `reviewReimbursementSchema`.

---

## TC-445 — Finance reject reimbursement

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Another PENDING reimbursement. `reimbursement.review`.

**Test Data:** `{ "status": "REJECTED", "reviewNotes": "Out of policy" }`

**Steps to Execute:**
1. POST REJECTED.
2. GET item.

**Expected Result:**
1. HTTP 200.
2. **REJECTED**.

**Postconditions:** REJECTED.

**Notes / Dependencies:** None.

---

## TC-446 — Mark reimbursement paid

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** APPROVED reimbursement. `reimbursement.review`.

**Test Data:** `POST /api/finance/reimbursements/<id>/mark-paid` `{ "paymentReference": "NEFT123" }`

**Steps to Execute:**
1. Mark-paid on APPROVED.
2. Mark-paid on PENDING (should fail).

**Expected Result:**
1. HTTP 200; status **PAID**.
2. HTTP 400.

**Postconditions:** PAID.

**Notes / Dependencies:** Compact path matches.

---

## TC-447 — Reimbursement receipt upload

**Module:** Finance  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Employee can presign. Purpose enum: `RESUME` \| `POLICY` \| `OFFER_LETTER` \| `DOCUMENT` \| `OTHER` — **no `REIMBURSEMENT_RECEIPT`**.

**Test Data:** Presign purpose **`OTHER` or `DOCUMENT`**; confirm; POST reimbursement `{ "receiptFileId": "<fileId>" }`.

**Steps to Execute:**
1. Presign purpose REIMBURSEMENT_RECEIPT (expect 400 enum).
2. Presign OTHER/DOCUMENT; upload; confirm.
3. Create reimbursement with receiptFileId.

**Expected Result:**
1. HTTP 400 invalid purpose (compact name does not exist).
2. File stored.
3. HTTP 201; receipt linked.

**Postconditions:** Receipt on reimbursement.

**Notes / Dependencies:** Use OTHER/DOCUMENT.

---

## TC-448 — Reimbursement amount must be positive

**Module:** Finance  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Authenticated employee.

**Test Data:** `amount: -50` · `amount: 0` · `amount: 0.01`

**Steps to Execute:**
1. POST each amount with valid category/description/expenseDate.

**Expected Result:**
1. HTTP 400.
2. HTTP 400 (`positive()`).
3. HTTP 201.

**Postconditions:** Optional 0.01 row.

**Notes / Dependencies:** Confirmed.

---

## TC-449 — Employee views own reimbursements only

**Module:** Finance  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Two employees’ reimbursements. Finance has `reimbursement.read`. Employee may lack list permission.

**Test Data:** `GET /api/finance/reimbursements` · `GET /api/finance/reimbursements?employeeId=<other>`

**Steps to Execute:**
1. As finance, list all / filter employeeId.
2. As employee, GET list and GET another’s id.

**Expected Result:**
1. Finance sees all (or filter).
2. Employee: 403 on list **or** self-only; GET other id 403/404. Compact expected own-only — **enforce if list is allowed**.

**Postconditions:** None.

**Notes / Dependencies:** GET list requires reimbursement.read OR review — employees often 403.

---

## TC-450 — Reimbursement submit → approve → pay E2E

**Module:** Finance  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee + finance.review.

**Test Data:** New reimbursement 500 INR.

**Steps to Execute:**
1. Employee POST create.
2. Finance review APPROVED.
3. Finance mark-paid.
4. GET final status PAID.

**Expected Result:**
1. PENDING.
2. APPROVED.
3. PAID.
4. Consistent throughout.

**Postconditions:** PAID reimbursement.

**Notes / Dependencies:** Combines 443–446.

---

## TC-451 — Stripe webhook valid signature

**Module:** Finance  
**Feature:** Payment Webhooks  
**Scenario Type:** Security / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Stripe webhook secret in env. Pending Stripe payment / invoice. Raw JSON body.

**Test Data:** `POST /api/payment-webhooks/stripe` with valid `Stripe-Signature` (Stripe CLI `stripe trigger` / `stripe listen`).

**Steps to Execute:**
1. Send valid signed event (e.g. `checkout.session.completed` / `payment_intent.succeeded`).
2. GET invoice/payment.

**Expected Result:**
1. HTTP 200.
2. Payment SUCCEEDED; invoice updated toward PAID.

**Postconditions:** Payment updated.

**Notes / Dependencies:** Raw body parser on this path. Skip/N/A without Stripe test keys.

---

## TC-452 — Stripe webhook invalid signature rejected

**Module:** Finance  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Endpoint up.

**Test Data:** POST JSON without signature or with `Stripe-Signature: bogus`.

**Steps to Execute:**
1. POST unsigned.
2. POST wrong signature.
3. Confirm invoice unchanged.

**Expected Result:**
1. HTTP 400.
2. HTTP 400.
3. No payment row / no status change.

**Postconditions:** Unchanged.

**Notes / Dependencies:** Confirmed constructEvent.

---

## TC-453 — Razorpay webhook valid signature

**Module:** Finance  
**Scenario Type:** Security / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Razorpay webhook secret. Test payload + `X-Razorpay-Signature`.

**Test Data:** `POST /api/payment-webhooks/razorpay`

**Steps to Execute:**
1. POST valid signed event (`payment.captured`).
2. GET payment/invoice.

**Expected Result:**
1. HTTP 200.
2. Payment processed.

**Postconditions:** Updated.

**Notes / Dependencies:** N/A without keys.

---

## TC-454 — Razorpay webhook invalid signature

**Module:** Finance  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** Endpoint up.

**Test Data:** POST with bad/missing signature header.

**Steps to Execute:**
1. POST invalid signature.
2. Confirm no invoice change.

**Expected Result:**
1. HTTP 400.
2. Unchanged.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-455 — Duplicate webhook idempotency

**Module:** Finance  
**Scenario Type:** Edge  
**Priority:** High  
**Severity:** High  

**Preconditions:** Valid Stripe or Razorpay event that creates/succeeds a payment. Replay same event id.

**Test Data:** Same payload twice.

**Steps to Execute:**
1. POST valid webhook.
2. POST identical event again.
3. Count payment rows / amountPaid.

**Expected Result:**
1. First 200.
2. Second 200 **without** double amount (idempotent by provider event id). If amount doubles, **fail**.

**Postconditions:** Single payment effect.

**Notes / Dependencies:** Confirm event-id uniqueness in payment-gateway.service.

---

## TC-456 — Webhook for unknown payment/invoice

**Module:** Finance  
**Scenario Type:** Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Valid signature if possible; metadata invoiceId that does not exist.

**Test Data:** Signed event with unknown id.

**Steps to Execute:**
1. POST event referencing missing invoice/payment.
2. Confirm HTTP 400/404 **or** 200 ignore — must **not** 500.

**Expected Result:**
1. Graceful 4xx or no-op 200.
2. No crash / no stack in body.

**Postconditions:** None.

**Notes / Dependencies:** Compact 404/400.

---

## TC-457 — Webhook malformed JSON

**Module:** Finance  
**Scenario Type:** Negative  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Endpoint up.

**Test Data:** Body `{not-json` Content-Type application/json.

**Steps to Execute:**
1. POST malformed body to Stripe and Razorpay paths.

**Expected Result:**
1. HTTP 400; no 500.

**Postconditions:** None.

**Notes / Dependencies:** Raw parser still needs valid JSON for Stripe.

---

## TC-458 — Webhook updates invoice to PAID

**Module:** Finance  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Checkout session for full invoice amount (TC-436) completed in test mode.

**Test Data:** Complete payment in Stripe/Razorpay test checkout → webhook.

**Steps to Execute:**
1. Create checkout for remaining balance.
2. Complete test payment.
3. GET invoice.

**Expected Result:**
1. Session created.
2. Webhook 200.
3. Invoice **PAID**.

**Postconditions:** PAID.

**Notes / Dependencies:** N/A without provider. Manual pay TC-435 is the local equivalent.

---

## TC-459 — Create salary structure

**Module:** Payroll  
**Feature:** Salary Structures & Revisions  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** `salary_structure.manage`. Employee id. `/payroll/salary-structures`

**Test Data:**
```json
{
  "employeeId": "<id>",
  "effectiveFrom": "2026-08-01",
  "currency": "INR",
  "basic": 50000,
  "hra": 20000,
  "providentFund": 6000,
  "incomeTax": 4000
}
```

**Steps to Execute:**
1. POST `/api/payroll/salary-structures`.
2. GET list / active.

**Expected Result:**
1. HTTP 201/200; status **ACTIVE**.
2. Components stored; net implied = allowances − deductions.

**Postconditions:** Save structure id.

**Notes / Dependencies:** money() min 0. compact SUPERSEDED vs **SUPERSEDED**.

---

## TC-460 — Supersede existing salary structure

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** ACTIVE structure. `salary_structure.manage`.

**Test Data:** POST new structure for **same** employee with later `effectiveFrom`.

**Steps to Execute:**
1. POST second structure.
2. GET `/api/payroll/salary-structures/active/<employeeId>`.
3. GET list for employee.

**Expected Result:**
1. HTTP 201.
2. Active = **new** one.
3. Old status **SUPERSEDED** (not SUPERSEDED). Compact SUPERSEDED ≠ **SUPERSEDED**.

**Postconditions:** One ACTIVE.

**Notes / Dependencies:** Confirm service supersedes previous.

---

## TC-461 — Get active structure for employee

**Module:** Payroll  
**Scenario Type:** API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `salary_structure.read`. Employee with ACTIVE structure.

**Test Data:** `GET /api/payroll/salary-structures/active/<employeeId>`

**Steps to Execute:**
1. GET active.
2. GET employee with none.
3. As employee without permission.

**Expected Result:**
1. HTTP 200; ACTIVE only.
2. HTTP 404.
3. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Compact path matches.

---

## TC-462 — Request salary revision

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Permission `salary_revision.request` **or** `salary_structure.manage`. Approver ids with `salary_revision.approve`.

**Test Data:** `POST /api/payroll/salary-revisions`
```json
{
  "employeeId": "<id>",
  "proposedBasic": 55000,
  "proposedHra": 22000,
  "effectiveFrom": "2026-09-01",
  "reason": "Annual increment",
  "approverIds": ["<payrollOrAdminUserId>"]
}
```

**Steps to Execute:**
1. POST revision.
2. GET `/api/payroll/salary-revisions/<id>`.
3. POST without reason / empty approverIds.

**Expected Result:**
1. HTTP 201; status **PENDING**.
2. Proposed components stored.
3. HTTP 400.

**Postconditions:** Save `revisionId`.

**Notes / Dependencies:** reason min 1; approverIds min 1. UI `/payroll/salary-revisions`.

---

## TC-463 — Approve salary revision

**Module:** Payroll  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** PENDING revision. `salary_revision.approve`.

**Test Data:** `POST /api/payroll/salary-revisions/<id>/approve` `{ "status": "APPROVED", "reviewNotes": "OK" }`

**Steps to Execute:**
1. POST approve.
2. GET active salary structure — new ACTIVE; old SUPERSEDED.
3. GET revision APPROVED.

**Expected Result:**
1. HTTP 200.
2. New structure from proposed components.
3. Revision APPROVED.

**Postconditions:** New ACTIVE structure.

**Notes / Dependencies:** `reviewSalaryRevisionSchema`.

---

## TC-464 — Reject salary revision

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Another PENDING revision. `salary_revision.approve`.

**Test Data:** `{ "status": "REJECTED", "reviewNotes": "Budget freeze" }`

**Steps to Execute:**
1. Snapshot active structure id.
2. POST reject.
3. GET active — unchanged.

**Expected Result:**
1. Baseline.
2. Revision REJECTED.
3. No new structure.

**Postconditions:** REJECTED.

**Notes / Dependencies:** None.

---

## TC-465 — Salary revision approve permission

**Module:** Payroll  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** PENDING revision. HR **without** `salary_revision.approve` (typical HR seed).

**Test Data:** POST approve as HR.

**Steps to Execute:**
1. As HR, POST approve.
2. As payroll/admin, approve succeeds (control).

**Expected Result:**
1. HTTP 403.
2. Control 200.

**Postconditions:** Still PENDING until control.

**Notes / Dependencies:** Compact expected HR 403 — **likely true**.

---

## TC-466 — Salary structure component validation

**Module:** Payroll  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `salary_structure.manage`.

**Test Data:** `basic: -1` · `basic: 0` · missing employeeId.

**Steps to Execute:**
1. POST negative basic.
2. POST basic 0.
3. POST missing employeeId.

**Expected Result:**
1. HTTP 400.
2. HTTP 201 (`min(0)`).
3. HTTP 400.

**Postconditions:** Optional zero-basic structure.

**Notes / Dependencies:** Compact negative — confirmed fail. Zero allowed.

---

## TC-467 — List salary structures filter

**Module:** Payroll  
**Scenario Type:** UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `salary_structure.read`. `/payroll/salary-structures`

**Test Data:** `GET /api/payroll/salary-structures?employeeId=`

**Steps to Execute:**
1. Open UI; filter employee if present.
2. GET with employeeId.
3. Note schema has **employeeId only** (no status query).

**Expected Result:**
1. List loads.
2. HTTP 200 filtered.
3. Status filter may be **UI-only**.

**Postconditions:** None.

**Notes / Dependencies:** listSalaryStructuresQuerySchema.

---

## TC-468 — Only one ACTIVE structure per employee

**Module:** Payroll  
**Scenario Type:** DB / Business rule  
**Priority:** High  
**Severity:** High  

**Preconditions:** After TC-460.

**Test Data:** GET list for employee.

**Steps to Execute:**
1. Count ACTIVE rows for one employee (API + DB if available).
2. Create another structure; recount.

**Expected Result:**
1. Exactly one ACTIVE.
2. Previous SUPERSEDED.

**Postconditions:** Invariant holds.

**Notes / Dependencies:** Service-enforced; confirm unique index if any.

---

## TC-469 — Salary revision approval writes audit log

**Module:** Payroll  
**Scenario Type:** DB / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `audit.read`. Perform TC-463.

**Test Data:** `GET /api/audit-logs?entity=salary_revision` (or similar entity string)

**Steps to Execute:**
1. Approve a revision.
2. Search audit logs for actor + entity id.

**Expected Result:**
1. Approval 200.
2. Audit row exists (action approve/update). If payroll uses writeAuditLog under a different entity name, record it.

**Postconditions:** None.

**Notes / Dependencies:** Entity naming may vary.

---

## TC-470 — Revision request by employee

**Module:** Payroll  
**Scenario Type:** Edge / Security  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Employee without `salary_revision.request` / `salary_structure.manage`. Valid body.

**Test Data:** POST `/api/payroll/salary-revisions` as employee.

**Steps to Execute:**
1. POST as employee.
2. Record 403 vs 201.

**Expected Result:**
1. HTTP **403** unless employee was granted `salary_revision.request`. Compact “verify” — default deny.

**Postconditions:** None.

**Notes / Dependencies:** Route anyOf request OR structure.manage.

---

## TC-471 — Payroll dashboard loads

**Module:** Payroll  
**Feature:** Payroll Runs & Payslips  
**Scenario Type:** UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Payroll user. `/payroll/dashboard`

**Test Data:** None (may compose run list + KPIs).

**Steps to Execute:**
1. Open dashboard.
2. Confirm metrics/run shortcuts.
3. Employee opens `/payroll/dashboard`.

**Expected Result:**
1. Loads for payroll.
2. Useful metrics.
3. Hidden/403.

**Postconditions:** None.

**Notes / Dependencies:** There may be no dedicated `/api/payroll/dashboard` — UI may use runs list.

---

## TC-472 — Create payroll run for month/year

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** `payroll_run.manage`. `/payroll/runs`

**Test Data:** `POST /api/payroll/runs`
```json
{
  "month": 8,
  "year": 2026,
  "payPeriodStart": "2026-08-01",
  "payPeriodEnd": "2026-08-31"
}
```

**Steps to Execute:**
1. POST run.
2. GET `/api/payroll/runs/<id>`.

**Expected Result:**
1. HTTP 201; status **DRAFT**.
2. Period stored.

**Postconditions:** Save `runId`. Use a unique month if 2026-08 exists.

**Notes / Dependencies:** month 1–12; year 2000–2100.

---

## TC-473 — Duplicate payroll run month/year rejected

**Module:** Payroll  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** High  

**Preconditions:** Run for 8/2026 exists.

**Test Data:** Same month/year POST.

**Steps to Execute:**
1. POST duplicate period.

**Expected Result:**
1. HTTP 400/409 from `findPayrollRunByPeriod` — not a second DRAFT. Compact 409.

**Postconditions:** One run per period.

**Notes / Dependencies:** Unique month+year.

---

## TC-474 — Calculate payroll run

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** DRAFT `runId`. Employees with ACTIVE salary structures. `payroll_run.manage`.

**Test Data:** `POST /api/payroll/runs/<id>/calculate`

**Steps to Execute:**
1. POST calculate.
2. GET run; inspect items (gross, deductions, LOP, net).
3. Calculate a PROCESSED run.

**Expected Result:**
1. HTTP 200.
2. One item per eligible employee; LOP fields present.
3. HTTP 400 `PAYROLL_RUN_NOT_DRAFT`.

**Postconditions:** Items generated.

**Notes / Dependencies:** Recalculate allowed only in DRAFT.

---

## TC-475 — LOP from attendance absences

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee with 2 ABSENT weekdays in the pay period (TC-351). ACTIVE structure. DRAFT run calculated.

**Test Data:** Inspect that employee’s run item `lopDays` / `paidDays`.

**Steps to Execute:**
1. Ensure two ABSENT records in period.
2. Calculate run.
3. Read item vs `payroll-lop.ts` working days.

**Expected Result:**
1. Absences exist.
2. HTTP 200.
3. `lopDays` ≈ 2; paidDays = workingDays − LOP (leave/holiday rules per helper).

**Postconditions:** None.

**Notes / Dependencies:** `payroll-lop.ts`.

---

## TC-476 — Working days exclude weekends and holidays

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Holiday in period (TC-346). August 2026 calendar.

**Test Data:** Run item `workingDays`.

**Steps to Execute:**
1. Count Mon–Fri in period minus holidays.
2. Compare to item.workingDays.

**Expected Result:**
1. Independent count.
2. Matches helper (weekends excluded; holidays excluded).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed design of payroll-lop.

---

## TC-477 — Submit payroll run for approval

**Module:** Payroll  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** DRAFT calculated run. `payroll_run.manage`. Approver with `payroll_run.approve`.

**Test Data:** `POST /api/payroll/runs/<id>/submit` `{ "approverIds": ["<id>"] }`

**Steps to Execute:**
1. Submit.
2. GET run **PENDING_APPROVAL**.
3. Submit empty approverIds.
4. Submit a non-DRAFT run.

**Expected Result:**
1. HTTP 200.
2. PENDING_APPROVAL.
3. HTTP 400.
4. HTTP 400 `PAYROLL_RUN_NOT_DRAFT`.

**Postconditions:** PENDING_APPROVAL.

**Notes / Dependencies:** Compact PENDING_APPROVAL ≠ **PENDING_APPROVAL**.

---

## TC-478 — Approve payroll run

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** PENDING_APPROVAL run. `payroll_run.approve`.

**Test Data:** `POST /api/payroll/runs/<id>/approve`

**Steps to Execute:**
1. POST approve.
2. GET run APPROVED.
3. As HR without permission, approve another run.

**Expected Result:**
1. HTTP 200.
2. **APPROVED**.
3. HTTP 403.

**Postconditions:** APPROVED.

**Notes / Dependencies:** None.

---

## TC-479 — Process payroll run generates payslips

**Module:** Payroll  
**Scenario Type:** Positive / E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** **APPROVED** run. `payroll_run.manage`.

**Test Data:** `POST /api/payroll/runs/<id>/process`

**Steps to Execute:**
1. Process APPROVED run.
2. GET run **PROCESSED** (not compact GENERATED).
3. GET `/api/payroll/payslips?payrollRunId=` if supported, or list by employee.
4. Process DRAFT (TC-482).

**Expected Result:**
1. HTTP 200.
2. Status **PROCESSED**; payslips **GENERATED** (publish may be separate).
3. One payslip per item; PDF fileId if generator ran.
4. 400.

**Postconditions:** PROCESSED. Compact “GENERATED run” ≠ run status PROCESSED.

**Notes / Dependencies:** PayslipStatus GENERATED then PUBLISHED on mark-paid.

---

## TC-480 — Mark payroll run paid

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** PROCESSED run. `payroll_run.manage`.

**Test Data:** `POST /api/payroll/runs/<id>/mark-paid`

**Steps to Execute:**
1. Mark-paid.
2. GET run PAID.
3. Portal `/portal/payslips` as employee — slips should be **PUBLISHED**.

**Expected Result:**
1. HTTP 200.
2. Run **PAID**.
3. Employees see payslips (TC-307).

**Postconditions:** PAID.

**Notes / Dependencies:** markPayrollRunPaid publishes payslips.

---

## TC-481 — Cancel payroll run

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** New DRAFT (or PENDING_APPROVAL) run. `payroll_run.manage`.

**Test Data:** `POST /api/payroll/runs/<id>/cancel`

**Steps to Execute:**
1. Cancel DRAFT.
2. Cancel PAID/PROCESSED (should fail).

**Expected Result:**
1. HTTP 200; **CANCELLED**.
2. HTTP 400 (`DRAFT` \| `PENDING_APPROVAL` only).

**Postconditions:** CANCELLED.

**Notes / Dependencies:** Confirmed allowed statuses.

---

## TC-482 — Cannot process unapproved run

**Module:** Payroll  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** DRAFT run with items. `payroll_run.manage`.

**Test Data:** POST process.

**Steps to Execute:**
1. POST `/api/payroll/runs/<draftId>/process`.

**Expected Result:**
1. HTTP 400. Remains DRAFT.

**Postconditions:** DRAFT.

**Notes / Dependencies:** Must be APPROVED first.

---

## TC-483 — Payroll run detail page

**Module:** Payroll  
**Scenario Type:** UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `payroll_run.read`. `/payroll/runs/<id>`

**Test Data:** Existing run.

**Steps to Execute:**
1. Open detail.
2. Confirm employee items, totals, actions (calculate/submit/approve/process) matching status.

**Expected Result:**
1. Page loads.
2. Actions enabled only for allowed transitions + permissions.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-484 — Payslip PDF generated on process

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** PROCESSED run (TC-479).

**Test Data:** Payslip `fileId` / storage key.

**Steps to Execute:**
1. GET payslip via payroll list.
2. Confirm file exists (download as payroll or portal after publish).

**Expected Result:**
1. fileId/storage present (or log gap if PDF skipped in env).
2. PDF readable after PAID/PUBLISHED.

**Postconditions:** None.

**Notes / Dependencies:** pdfkit generator.

---

## TC-485 — Admin/payroll list all payslips

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `payslip.read` or `payroll_run.read`.

**Test Data:** `GET /api/payroll/payslips?employeeId=`

**Steps to Execute:**
1. GET list as payroll.
2. GET as employee (portal uses portal route).

**Expected Result:**
1. HTTP 200; all statuses.
2. HTTP 403 on payroll list.

**Postconditions:** None.

**Notes / Dependencies:** Compact matches.

---

## TC-486 — Payroll item breakdown JSON

**Module:** Payroll  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Calculated/processed run item.

**Test Data:** GET run payload `items[].breakdown` or component fields.

**Steps to Execute:**
1. GET run.
2. Assert basic, HRA, PF/tax, net, LOP present (names as implemented).

**Expected Result:**
1. HTTP 200.
2. Breakdown includes earnings/deductions/net — record exact keys.

**Postconditions:** None.

**Notes / Dependencies:** Field may be JSON `breakdown` or flat columns.

---

## TC-487 — Proration for mid-month joiner

**Module:** Payroll  
**Scenario Type:** Edge  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee `dateOfJoining` mid period (e.g. 15th). ACTIVE structure. Calculate run.

**Test Data:** Item paidDays / net vs full-month peer.

**Steps to Execute:**
1. Set joining date mid-month on a test employee.
2. Calculate.
3. Compare net to full-month employee with same structure.

**Expected Result:**
1. Joiner identified.
2. HTTP 200.
3. Joiner net **<** full month if proration exists in `payroll-lop.ts`; if equal, log **gap**.

**Postconditions:** None.

**Notes / Dependencies:** Confirm helper; compact expected proration.

---

## TC-488 — Payroll run reject flow

**Module:** Payroll  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** PENDING_APPROVAL run. `payroll_run.approve`.

**Test Data:** `POST /api/payroll/runs/<id>/reject`

**Steps to Execute:**
1. POST reject.
2. GET run — status **DRAFT** (not REJECTED).
3. Recalculate; resubmit.

**Expected Result:**
1. HTTP 200.
2. Back to **DRAFT** (`PAYROLL_RUN` has no REJECTED). Compact “REJECTED” is **wrong**.
3. Calculate/submit work again.

**Postconditions:** DRAFT after reject.

**Notes / Dependencies:** Comment in payroll.service.ts.

---

## TC-489 — Month boundary January run

**Module:** Payroll  
**Scenario Type:** Boundary  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `payroll_run.manage`. No existing 1/2026 run (or pick free year).

**Test Data:** `{ "month": 1, "year": 2026, "payPeriodStart": "2026-01-01", "payPeriodEnd": "2026-01-31" }`

**Steps to Execute:**
1. POST month=1.
2. POST month=12 year=2026.

**Expected Result:**
1. HTTP 201.
2. HTTP 201 if unique.

**Postconditions:** Runs exist.

**Notes / Dependencies:** min 1 max 12.

---

## TC-490 — Invalid month 13 rejected

**Module:** Payroll  
**Scenario Type:** Boundary / Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `payroll_run.manage`.

**Test Data:** `month: 13` · `month: 0` · `year: 1999`

**Steps to Execute:**
1. POST each.

**Expected Result:**
1. All HTTP 400.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed schema.

---

## TC-491 — BD create contact

**Module:** Business Development  
**Feature:** Contacts & Leads  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `bd.contact.create`. `/bd/contacts`

**Test Data:**
```json
{
  "firstName": "Priya",
  "lastName": "Shah",
  "email": "priya.shah@client.test",
  "company": "ClientCo",
  "designation": "CTO"
}
```

**Steps to Execute:**
1. POST `/api/bd/contacts`.
2. GET list `/api/bd/contacts?search=Priya`.

**Expected Result:**
1. HTTP 201; firstName+lastName required (not a single `name`).
2. Contact listed.

**Postconditions:** Save `contactId`.

**Notes / Dependencies:** Compact “name” is firstName+lastName.

---

## TC-492 — BD update contact

**Module:** BD  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.contact.update`. `contactId`.

**Test Data:** `PATCH /api/bd/contacts/<id>` `{ "phone": "9999999999", "linkedInUrl": "https://linkedin.com/in/qa" }`

**Steps to Execute:**
1. PATCH.
2. PATCH `email: "bad"`.
3. PATCH `linkedInUrl: "not-a-url"`.

**Expected Result:**
1. HTTP 200.
2. HTTP 400.
3. HTTP 400.

**Postconditions:** Updated.

**Notes / Dependencies:** update allows nullables.

---

## TC-493 — BD contact detail page

**Module:** BD  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.contact.read`. `/bd/contacts/<id>`

**Test Data:** Existing contact with a lead.

**Steps to Execute:**
1. Open detail.
2. Confirm contact fields + linked leads if UI shows them.

**Expected Result:**
1. Page loads.
2. Info matches GET `/api/bd/contacts/:id`.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-494 — BD create lead linked to contact

**Module:** BD  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** `bd.lead.create`. `contactId`. `/bd/leads`

**Test Data:**
```json
{
  "title": "ERP rollout",
  "status": "NEW",
  "value": 500000,
  "currency": "INR",
  "contactId": "<id>",
  "companyName": "ClientCo"
}
```

**Steps to Execute:**
1. POST `/api/bd/leads`.
2. GET lead.

**Expected Result:**
1. HTTP 201; default/NEW.
2. contactId linked; value stored.

**Postconditions:** Save `leadId`.

**Notes / Dependencies:** value optional **positive**. Status NEW is valid (compact NEW).

---

## TC-495 — BD lead pipeline board drag status

**Module:** BD  
**Scenario Type:** UI / Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `bd.lead.update`. Lead NEW. `/bd/leads` board.

**Test Data:** Drag to **QUALIFIED** (not QUALIFIED). Compact QUALIFIED ≠ **QUALIFIED**.

**Steps to Execute:**
1. Drag card NEW → QUALIFIED.
2. Confirm `PATCH /api/bd/leads/<id>` `{ "status": "QUALIFIED" }`.
3. PATCH `{ "status": "QUALIFIED" }` (invalid).

**Expected Result:**
1. UI updates.
2. HTTP 200; status QUALIFIED.
3. HTTP 400.

**Postconditions:** QUALIFIED.

**Notes / Dependencies:** Columns: NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST.

---

## TC-496 — BD lead detail with communications

**Module:** BD  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.lead.read`. `/bd/leads/<id>`

**Test Data:** Lead with communications (TC-511).

**Steps to Execute:**
1. Open lead detail.
2. Confirm communications timeline component.

**Expected Result:**
1. Page loads.
2. Comms listed (GET `/api/bd/communications?leadId=`).

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-497 — BD assign lead to user

**Module:** BD  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.lead.update`. User id.

**Test Data:** `PATCH` `{ "assignedToId": "<userId>" }`

**Steps to Execute:**
1. PATCH assignedToId.
2. GET lead; UI assignee.

**Expected Result:**
1. HTTP 200.
2. Assignee shown.

**Postconditions:** Assigned.

**Notes / Dependencies:** Compact assignedToId matches.

---

## TC-498 — BD mark lead WON

**Module:** BD  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** `bd.lead.update`. Lead not LOST.

**Test Data:** `PATCH` `{ "status": "WON" }`

**Steps to Execute:**
1. PATCH WON.
2. GET lead; note `wonAt` if set by service.
3. Create PM project with this leadId (TC-522).

**Expected Result:**
1. HTTP 200; WON.
2. wonAt populated **if** service sets it — else log gap.
3. Ready for unique project link.

**Postconditions:** WON `leadId`.

**Notes / Dependencies:** None.

---

## TC-499 — BD mark lead LOST with reason

**Module:** BD  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Another lead. `bd.lead.update`.

**Test Data:** `{ "status": "LOST", "lostReason": "Budget cut" }`

**Steps to Execute:**
1. PATCH LOST + lostReason.
2. GET lead; lostAt if any.

**Expected Result:**
1. HTTP 200.
2. lostReason stored; lostAt if service sets it.

**Postconditions:** LOST.

**Notes / Dependencies:** updateLeadSchema.lostReason.

---

## TC-500 — BD lead value negative rejected

**Module:** BD  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `bd.lead.create`.

**Test Data:** `value: -1000` · `value: 0` · omit value

**Steps to Execute:**
1. POST each with title.

**Expected Result:**
1. HTTP 400 (`positive()`).
2. HTTP 400.
3. HTTP 201 (value optional).

**Postconditions:** Optional lead.

**Notes / Dependencies:** Confirmed.

---

## TC-501 — BD list leads filter by status

**Module:** BD  
**Scenario Type:** UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.lead.read`. Mixed statuses.

**Test Data:** `GET /api/bd/leads?status=NEW` · `QUALIFIED` · `WON`

**Steps to Execute:**
1. Filter in UI/API.
2. `?search=` title/company.

**Expected Result:**
1. HTTP 200 correct subset.
2. Search works.

**Postconditions:** None.

**Notes / Dependencies:** listLeadsQuerySchema.

---

## TC-502 — BD without bd.lead.read blocked

**Module:** BD  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee without BD permissions.

**Test Data:** `GET /api/bd/leads`

**Steps to Execute:**
1. GET leads.
2. Open `/bd/leads`.

**Expected Result:**
1. HTTP 403.
2. Nav hidden.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-503 — BD dashboard metrics

**Module:** BD  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.lead.read`. `/bd/dashboard`

**Test Data:** Pipeline + counts.

**Steps to Execute:**
1. Open dashboard.
2. Confirm chart/counts vs GET `/api/bd/pipeline`.

**Expected Result:**
1. Loads.
2. Stage counts match pipeline API.

**Postconditions:** None.

**Notes / Dependencies:** May not have `/api/bd/dashboard` — uses pipeline.

---

## TC-504 — BD pipeline API

**Module:** BD  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.lead.read`.

**Test Data:** `GET /api/bd/pipeline`

**Steps to Execute:**
1. GET pipeline.
2. As employee.

**Expected Result:**
1. HTTP 200; grouped by lead status.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Compact matches.

---

## TC-505 — BD contact email format validation

**Module:** BD  
**Scenario Type:** Validation  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.contact.create`.

**Test Data:** `{ "firstName": "A", "lastName": "B", "email": "not-an-email" }`

**Steps to Execute:**
1. POST invalid email.
2. POST omit email.

**Expected Result:**
1. HTTP 400.
2. HTTP 201 (email optional).

**Postconditions:** Optional contact.

**Notes / Dependencies:** Confirmed.

---

## TC-506 — Multiple leads per contact allowed

**Module:** BD  
**Scenario Type:** Edge  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** `contactId`. `bd.lead.create`.

**Test Data:** Two leads same contactId, different titles.

**Steps to Execute:**
1. POST two leads.

**Expected Result:**
1. Both HTTP 201. No unique(contactId).

**Postconditions:** Two leads.

**Notes / Dependencies:** Compact allowed — confirmed unless DB unique exists.

---

## TC-507 — BD create bid for lead

**Module:** BD  
**Feature:** Bids, Proposals, Communications  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `bd.bid.create`. `leadId`. `/bd/bids`

**Test Data:**
```json
{
  "leadId": "<id>",
  "title": "FY27 bid",
  "amount": 750000,
  "deadline": "<future ISO datetime>"
}
```

**Steps to Execute:**
1. POST `/api/bd/bids`.
2. GET bid.

**Expected Result:**
1. HTTP 201; status default **DRAFT**.
2. leadId linked. Compact “deadline” is schema **`deadline`**.

**Postconditions:** Save `bidId`.

**Notes / Dependencies:** amount optional positive. Datetime ISO.

---

## TC-508 — BD update bid status

**Module:** BD  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.bid.update`. DRAFT bid.

**Test Data:** `PATCH` `{ "status": "SUBMITTED" }`  
Compact SUBMITTED ≠ **SUBMITTED**.

**Steps to Execute:**
1. PATCH SUBMITTED.
2. PATCH `SUBMITTED` (invalid).

**Expected Result:**
1. HTTP 200; SUBMITTED.
2. HTTP 400.

**Postconditions:** SUBMITTED.

**Notes / Dependencies:** Enum DRAFT, SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED, WITHDRAWN.

---

## TC-509 — BD create proposal

**Module:** BD  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `bd.proposal.create`. `leadId`. `/bd/proposals`

**Test Data:**
```json
{
  "leadId": "<id>",
  "title": "Technical proposal",
  "content": "Scope…",
  "validUntil": "<ISO datetime>"
}
```

**Steps to Execute:**
1. POST proposal.
2. GET proposal.

**Expected Result:**
1. HTTP 201; DRAFT.
2. Content stored. Compact `validUntil` is **`validUntil`**.

**Postconditions:** Save `proposalId`.

**Notes / Dependencies:** validUntil optional datetime.

---

## TC-510 — BD link proposal to bid

**Module:** BD  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bidId` + `leadId`. `bd.proposal.create`.

**Test Data:** POST `{ "leadId", "bidId", "title": "Bid-linked proposal" }`

**Steps to Execute:**
1. POST with bidId.
2. GET `/api/bd/proposals?bidId=`.

**Expected Result:**
1. HTTP 201; bidId set.
2. Filter returns it.

**Postconditions:** Linked.

**Notes / Dependencies:** bidId optional on create.

---

## TC-511 — BD log communication

**Module:** BD  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `bd.communication.create`. leadId and/or contactId. `/bd/communications`

**Test Data:**
```json
{
  "leadId": "<id>",
  "subject": "Intro call",
  "body": "Discussed timeline",
  "channel": "EMAIL",
  "direction": "outbound"
}
```

**Steps to Execute:**
1. POST communication.
2. POST `direction: "OUTBOUND"` (wrong case).

**Expected Result:**
1. HTTP 201.
2. HTTP 400 — enum **`inbound` \| `outbound`** lowercase. Compact OUTBOUND is wrong.

**Postconditions:** Save comm id.

**Notes / Dependencies:** subject+body required min 1.

---

## TC-512 — BD communication list on lead

**Module:** BD  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.communication.read`. Comms exist.

**Test Data:** `GET /api/bd/communications?leadId=`

**Steps to Execute:**
1. Open lead comms tab.
2. GET API.

**Expected Result:**
1. Timeline chronological.
2. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-513 — BD proposal detail page

**Module:** BD  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.proposal.read`. `/bd/proposals/<id>`

**Test Data:** Existing proposal.

**Steps to Execute:**
1. Open detail.
2. Confirm title/content/status.

**Expected Result:**
1. Loads.
2. Matches GET.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-514 — BD bid deadline in the past

**Module:** BD  
**Scenario Type:** Edge  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** `bd.bid.create`. `leadId`.

**Test Data:** `deadline` yesterday ISO.

**Steps to Execute:**
1. POST bid with past deadline.

**Expected Result:**
1. HTTP 201 — **no future-date refine** on schema. Compact “accepted or warning” — **accepted**.

**Postconditions:** Bid exists.

**Notes / Dependencies:** Zod datetime only.

---

## TC-515 — BD create without permission

**Module:** BD  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee session. Valid bid body.

**Test Data:** `POST /api/bd/bids`

**Steps to Execute:**
1. POST bid.
2. POST contact/lead.

**Expected Result:**
1. HTTP 403.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** `bd.bid.create` etc.

---

## TC-516 — BD proposal validUntil date validation

**Module:** BD  
**Scenario Type:** Validation  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.proposal.create`. `leadId`.

**Test Data:** `validUntil: "31-12-2026"` · omit · valid ISO.

**Steps to Execute:**
1. POST invalid validUntil.
2. POST valid ISO.
3. Compact field `validUntil` vs **`validUntil`**.

**Expected Result:**
1. HTTP 400 (must be ISO datetime).
2. HTTP 201.
3. Use `validUntil`.

**Postconditions:** Optional proposal.

**Notes / Dependencies:** Confirmed.

---

## TC-517 — BD communication requires lead or contact

**Module:** BD  
**Scenario Type:** Validation / Gap  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `bd.communication.create`.

**Test Data:** `{ "subject": "x", "body": "y" }` without leadId/contactId.

**Steps to Execute:**
1. POST with neither id.
2. POST with only leadId.
3. POST with only contactId.

**Expected Result:**
1. HTTP 400 **if** service requires one of them; schema has both **optional** — may 201. Compact expected 400 — **verify service**. If 201, log gap.
2. HTTP 201.
3. HTTP 201.

**Postconditions:** Optional comms.

**Notes / Dependencies:** No Zod refine for XOR.

---

## TC-518 — BD portfolio create item

**Module:** BD  
**Feature:** Portfolio & Pipeline  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.portfolio.create`. `/bd/portfolio`

**Test Data:**
```json
{
  "title": "Workforce360 ERP",
  "description": "HR+Finance suite",
  "category": "Enterprise",
  "technologies": "Next.js, Postgres",
  "isPublished": false
}
```

**Steps to Execute:**
1. POST `/api/bd/portfolio`.
2. GET item.

**Expected Result:**
1. HTTP 201.
2. Stored. Compact `isPublished` is **`isPublished`**. `technologies` is a **string**, not array.

**Postconditions:** Save `portfolioId`.

**Notes / Dependencies:** imageUrl/projectUrl must be valid URLs if sent.

---

## TC-519 — BD portfolio publish toggle

**Module:** BD  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `bd.portfolio.update`. Unpublished item.

**Test Data:** `PATCH` `{ "isPublished": true }`

**Steps to Execute:**
1. PATCH isPublished true.
2. GET `/api/bd/portfolio?isPublished=true`.

**Expected Result:**
1. HTTP 200.
2. Item in published filter.

**Postconditions:** Published.

**Notes / Dependencies:** Query transforms `"true"` string to boolean.

---

## TC-520 — BD portfolio list filter published

**Module:** BD  
**Scenario Type:** UI / API  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Mix published/unpublished. `bd.portfolio.read`.

**Test Data:** `?isPublished=true` · `?category=`

**Steps to Execute:**
1. Filter in UI.
2. GET API.

**Expected Result:**
1. Only published (or category).
2. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-521 — BD pipeline chart renders

**Module:** BD  
**Scenario Type:** UI  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Leads in several stages. `/bd/dashboard`

**Test Data:** Visual.

**Steps to Execute:**
1. Open dashboard.
2. Confirm chart segments vs pipeline counts.

**Expected Result:**
1. Chart renders (no crash).
2. Counts match GET `/api/bd/pipeline`.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-522 — BD lead WON to PM project handover E2E

**Module:** BD / PM  
**Scenario Type:** E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** WON `leadId` (TC-498). `pm.project.create`.

**Test Data:** `POST /api/pm/projects` `{ "name": "Acme ERP", "leadId": "<wonLeadId>", "status": "PLANNING" }`

**Steps to Execute:**
1. Create project with leadId.
2. Create **second** project same leadId (TC-531).
3. Open `/pm/projects/<id>`.

**Expected Result:**
1. HTTP 201; project linked.
2. HTTP 409 unique leadId **if** constraint exists — else log gap.
3. Project shows BD lead/client.

**Postconditions:** One project per lead (preferred).

**Notes / Dependencies:** Prisma unique on Project.leadId was noted in architecture.

---

## TC-523 — PM create project

**Module:** Project Management  
**Feature:** Projects & Milestones  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** `pm.project.create`. `/pm/projects`

**Test Data:**
```json
{
  "name": "Phoenix Delivery",
  "code": "PHX-523",
  "status": "PLANNING",
  "budget": 1000000,
  "currency": "INR",
  "startDate": "<ISO>",
  "endDate": "<ISO+90d>"
}
```

**Steps to Execute:**
1. POST `/api/pm/projects`.
2. GET project.

**Expected Result:**
1. HTTP 201; PLANNING (compact PLANNING ≠ **PLANNING** — Prisma PLANNING). Compact said PLANNING.
2. code/budget stored. Dates must be **ISO datetime**, not YYYY-MM-DD.

**Postconditions:** Save `projectId`.

**Notes / Dependencies:** budget optional **positive**.

---

## TC-524 — PM project detail with tabs

**Module:** PM  
**Scenario Type:** UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `pm.project.read`. `/pm/projects/<id>`

**Test Data:** Tabs: Overview, Board, Backlog, Sprints, Team, Budget.

**Steps to Execute:**
1. Open project.
2. Click each tab (`/board`, `/backlog`, `/sprints`, `/team`, `/budget`).

**Expected Result:**
1. Layout + ProjectTabs.
2. Each route loads (permissions may hide budget/team).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed project layout.

---

## TC-525 — PM update project status

**Module:** PM  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.project.update`.

**Test Data:** `PATCH` `{ "status": "ACTIVE" }`

**Steps to Execute:**
1. PATCH ACTIVE.
2. PATCH `IN_PROGRESS` (invalid).

**Expected Result:**
1. HTTP 200.
2. HTTP 400 (enum PLANNING/ACTIVE/ON_HOLD/COMPLETED/CANCELLED).

**Postconditions:** ACTIVE.

**Notes / Dependencies:** Compact ACTIVE matches.

---

## TC-526 — PM create milestone

**Module:** PM  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.milestone.create`. `projectId`.

**Test Data:** `POST /api/pm/milestones` `{ "projectId", "title": "MVP", "dueDate": "<ISO>" }`

**Steps to Execute:**
1. POST milestone (UI on overview).
2. GET `/api/pm/milestones?projectId=`.

**Expected Result:**
1. HTTP 201.
2. Listed on project.

**Postconditions:** Save `milestoneId`.

**Notes / Dependencies:** title min 1; dueDate ISO datetime.

---

## TC-527 — PM complete milestone

**Module:** PM  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.milestone.update`.

**Test Data:** `PATCH /api/pm/milestones/<id>` `{ "completedAt": "<now ISO>" }`

**Steps to Execute:**
1. PATCH completedAt.
2. UI shows done.

**Expected Result:**
1. HTTP 200.
2. Milestone completed (no separate status enum — completion is `completedAt`).

**Postconditions:** completedAt set.

**Notes / Dependencies:** Compact “complete” = set completedAt.

---

## TC-528 — PM project report

**Module:** PM  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.project.read`. Project with tasks.

**Test Data:** `GET /api/pm/projects/<projectId>/report`

**Steps to Execute:**
1. GET report.
2. As employee without permission.

**Expected Result:**
1. HTTP 200; progress metrics (task counts/budget).
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Compact `/projects/:id/report` is **`/projects/:projectId/report`**.

---

## TC-529 — PM project code uniqueness

**Module:** PM  
**Scenario Type:** Negative / DB  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Project code `PHX-523`. `pm.project.create`.

**Test Data:** POST another project same `code`.

**Steps to Execute:**
1. POST duplicate code.

**Expected Result:**
1. HTTP 409 if unique; **code is optional** and uniqueness may be missing — record 201 vs 409.

**Postconditions:** At most one live row per code if constrained.

**Notes / Dependencies:** Compact 409 — verify Prisma @@unique on code.

---

## TC-530 — PM link project to won lead

**Module:** PM  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** WON lead without a project. `pm.project.create`.

**Test Data:** POST project `{ "name": "From BD", "leadId": "<id>" }`

**Steps to Execute:**
1. POST.
2. GET project; confirm leadId.

**Expected Result:**
1. HTTP 201.
2. BD–PM link visible.

**Postconditions:** Linked.

**Notes / Dependencies:** Same as TC-522 step 1.

---

## TC-531 — PM duplicate leadId rejected

**Module:** PM  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Project already has leadId L.

**Test Data:** POST second project `{ "name": "Dup", "leadId": "L" }`

**Steps to Execute:**
1. POST duplicate leadId.

**Expected Result:**
1. HTTP 409 unique constraint **if present**; else 201 gap.

**Postconditions:** One project per lead preferred.

**Notes / Dependencies:** Compact 409.

---

## TC-532 — PM project budget boundary

**Module:** PM  
**Scenario Type:** Boundary  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.project.create`.

**Test Data:** `budget: 0` · `budget: -1` · `budget: 1`

**Steps to Execute:**
1. POST each with name.

**Expected Result:**
1. HTTP 400 (`positive()` — 0 fails).
2. HTTP 400.
3. HTTP 201.

**Postconditions:** Optional project.

**Notes / Dependencies:** Compact “0 accepted or rejected” — **rejected**.

---

## TC-533 — PM without pm.project.create blocked

**Module:** PM  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee session.

**Test Data:** POST `/api/pm/projects`

**Steps to Execute:**
1. POST project.
2. Open `/pm/projects`.

**Expected Result:**
1. HTTP 403.
2. Nav hidden.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-534 — PM dashboard

**Module:** PM  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.project.read`. `/pm/dashboard`

**Test Data:** Project summaries.

**Steps to Execute:**
1. Open dashboard.
2. Confirm cards vs GET `/api/pm/projects`.

**Expected Result:**
1. Loads.
2. Summaries accurate.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-535 — PM list projects search

**Module:** PM  
**Scenario Type:** UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.project.read`.

**Test Data:** `GET /api/pm/projects?search=Phoenix` · `?status=ACTIVE`

**Steps to Execute:**
1. Search in UI.
2. GET API.

**Expected Result:**
1. Filtered list.
2. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** listProjectsQuerySchema search + status.

---

## TC-536 — PM project manager assignment

**Module:** PM  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.project.update`. User id.

**Test Data:** `PATCH` `{ "managerId": "<userId>" }`

**Steps to Execute:**
1. PATCH managerId.
2. UI shows manager.

**Expected Result:**
1. HTTP 200.
2. Manager displayed (compact managerId vs schema **managerId**).

**Postconditions:** Manager set.

**Notes / Dependencies:** Compact managerId ≠ **managerId**.

---

## TC-537 — PM client contact link

**Module:** PM  
**Scenario Type:** Positive  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** BD `contactId`. `pm.project.update`.

**Test Data:** `PATCH` `{ "clientContactId": "<contactId>", "clientName": "ClientCo" }`

**Steps to Execute:**
1. PATCH client fields.
2. GET project.

**Expected Result:**
1. HTTP 200.
2. Contact/name stored (compact “client contact” = `clientContactId`).

**Postconditions:** Linked.

**Notes / Dependencies:** None.

---

## TC-538 — PM milestone overdue indicator

**Module:** PM  
**Scenario Type:** UI  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Milestone `dueDate` in the past, `completedAt` null.

**Test Data:** Overview milestones component.

**Steps to Execute:**
1. Open project overview.
2. Confirm overdue styling.

**Expected Result:**
1. Page loads.
2. Overdue visual **if implemented**; else log UX gap (API still has past dueDate).

**Postconditions:** None.

**Notes / Dependencies:** Compact expected indicator.

---

## TC-539 — Create task in backlog

**Module:** PM  
**Feature:** Tasks, Sprints, Kanban  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** `pm.task.create`. `/pm/projects/<id>/backlog`

**Test Data:** `POST /api/pm/tasks` `{ "projectId", "title": "Setup CI", "status": "TODO" }`

**Steps to Execute:**
1. Create task from backlog UI.
2. GET `/api/pm/tasks?projectId=&status=TODO`.

**Expected Result:**
1. HTTP 201.
2. Status **TODO** (compact BACKLOG **does not exist**). Backlog UI = tasks without sprint / TODO column.

**Postconditions:** Save `taskId`.

**Notes / Dependencies:** Default status likely TODO.

---

## TC-540 — Move task on Kanban board

**Module:** PM  
**Scenario Type:** UI / Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `pm.task.update`. `/pm/projects/<id>/board`

**Test Data:** Drag TODO → IN_PROGRESS.

**Steps to Execute:**
1. Drag card.
2. Confirm PATCH `{ "status": "IN_PROGRESS" }`.
3. Drag to IN_REVIEW then DONE.

**Expected Result:**
1. UI moves.
2. HTTP 200.
3. Columns TODO / IN_PROGRESS / IN_REVIEW / DONE (not TODO/IN_PROGRESS only). Compact TODO is **TODO**.

**Postconditions:** DONE or IN_PROGRESS.

**Notes / Dependencies:** Board page TASK_STATUSES.

---

## TC-541 — Create sprint

**Module:** PM  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `pm.sprint.create`. `/pm/projects/<id>/sprints`

**Test Data:**
```json
{
  "projectId": "<id>",
  "name": "Sprint 1",
  "goal": "Auth slice",
  "status": "PLANNING",
  "startDate": "<ISO>",
  "endDate": "<ISO+14d>"
}
```

**Steps to Execute:**
1. POST `/api/pm/sprints`.
2. GET sprints.

**Expected Result:**
1. HTTP 201; PLANNING (compact PLANNING ≠ **PLANNING**). Compact said PLANNING.
2. Listed.

**Postconditions:** Save `sprintId`.

**Notes / Dependencies:** Sprint enum PLANNING/ACTIVE/COMPLETED/CANCELLED.

---

## TC-542 — Assign tasks to sprint

**Module:** PM  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `pm.task.update`. `taskId` + `sprintId`.

**Test Data:** `PATCH /api/pm/tasks/<id>` `{ "sprintId": "<sprintId>" }`

**Steps to Execute:**
1. Move backlog task onto sprint (UI or PATCH).
2. GET `/api/pm/tasks?sprintId=`.

**Expected Result:**
1. HTTP 200; sprintId set.
2. Task on sprint board.

**Postconditions:** Task in sprint.

**Notes / Dependencies:** None.

---

## TC-543 — Sprint detail Kanban

**Module:** PM  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.sprint.read`. `/pm/sprints/<id>`

**Test Data:** Sprint with tasks.

**Steps to Execute:**
1. Open sprint page.
2. Confirm Kanban of sprint tasks only.

**Expected Result:**
1. Loads.
2. Only this sprint’s tasks.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed sprint [id] page.

---

## TC-544 — Task detail with comments

**Module:** PM  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.task.read`. `/pm/tasks/<id>`

**Test Data:** Task with comments.

**Steps to Execute:**
1. Open task detail.
2. Confirm comments + time tracking + attachments sections.

**Expected Result:**
1. Loads.
2. TaskComments visible.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-545 — Add task comment

**Module:** PM  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.task.update`. `taskId`. Current `userId` (schema **requires userId**).

**Test Data:** `POST /api/pm/tasks/comments`
```json
{ "taskId": "<id>", "userId": "<currentUserId>", "content": "Blocked on VPN." }
```

**Steps to Execute:**
1. POST comment from UI.
2. POST missing content.
3. Confirm compact `/tasks/comments` matches.

**Expected Result:**
1. HTTP 201.
2. HTTP 400 (`content` min 1).
3. Path `/api/pm/tasks/comments`.

**Postconditions:** Comment exists.

**Notes / Dependencies:** createTaskCommentSchema requires taskId, userId, content.

---

## TC-546 — Task priority enum validation

**Module:** PM  
**Scenario Type:** Validation  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.task.create`. `projectId`.

**Test Data:** `{ "projectId", "title": "x", "priority": "INVALID" }` · `"URGENT"` · `"URGENT"` if Zod includes URGENT.

**Steps to Execute:**
1. POST INVALID.
2. POST URGENT.
3. Note Zod: LOW/MEDIUM/HIGH/URGENT vs Prisma LOW/MEDIUM/HIGH/URGENT.

**Expected Result:**
1. HTTP 400.
2. HTTP 201 if URGENT in Zod.
3. Record Zod/Prisma mismatch if URGENT 400 but HIGH works. Compact INVALID → 400.

**Postconditions:** Optional task.

**Notes / Dependencies:** pm.schema priority enum.

---

## TC-547 — Task estimated hours boundary

**Module:** PM  
**Scenario Type:** Boundary  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.task.create`.

**Test Data:** `estimatedHours: 0` · `-1` · `0.5` · omit

**Steps to Execute:**
1. POST each with title+projectId.

**Expected Result:**
1. HTTP 400 (`positive()`).
2. HTTP 400.
3. HTTP 201.
4. HTTP 201 optional.

**Postconditions:** Optional tasks.

**Notes / Dependencies:** Compact 0 — **rejected**. Field is `estimatedHours` not estimatedHours vs compact estimatedHours.

---

## TC-548 — Global tasks list page

**Module:** PM  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.task.read`. `/pm/tasks`

**Test Data:** Filters status/assignee/search.

**Steps to Execute:**
1. Open `/pm/tasks`.
2. GET `/api/pm/tasks?search=` / status.

**Expected Result:**
1. All accessible tasks.
2. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-549 — Task assignee update

**Module:** PM  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `pm.task.update`. User id.

**Test Data:** `PATCH` `{ "assigneeId": "<userId>" }` then `{ "assigneeId": null }`

**Steps to Execute:**
1. PATCH assignee.
2. Unassign null.
3. Compact assigneeId vs **assigneeId**.

**Expected Result:**
1. HTTP 200; assignee shown.
2. HTTP 200; unassigned.
3. Use assigneeId.

**Postconditions:** Assignee set/cleared.

**Notes / Dependencies:** Compact assigneeId ≠ **assigneeId**.

---

## TC-550 — Delete task from backlog

**Module:** PM  
**Scenario Type:** Positive / Gap  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `taskId` on backlog. Look for DELETE `/api/pm/tasks/:id`.

**Test Data:** Attempt DELETE; or PATCH `{ "status": "CANCELLED" }`.

**Steps to Execute:**
1. DELETE `/api/pm/tasks/<id>`.
2. If 404, PATCH status CANCELLED.
3. Confirm board no longer shows it as TODO.

**Expected Result:**
1. **No DELETE route** on `pm.routes.ts` — expect 404.
2. CANCELLED 200; treat as soft-remove.
3. Board filters out CANCELLED **if** UI omits that column (board lists TODO–DONE only).

**Postconditions:** Task CANCELLED or still present.

**Notes / Dependencies:** Compact “soft delete” — **use CANCELLED**; no delete endpoint.

---

## Coverage recap (this file)

| Range | Count | Focus |
|-------|-------|--------|
| TC-383 – TC-400 | 18 | Approvals remainder |
| TC-401 – TC-412 | 12 | Dedicated assets module |
| TC-413 – TC-432 | 20 | Clients & invoices |
| TC-433 – TC-442 | 10 | Payments |
| TC-443 – TC-450 | 8 | Reimbursements |
| TC-451 – TC-458 | 8 | Payment webhooks |
| TC-459 – TC-470 | 12 | Salary structures & revisions |
| TC-471 – TC-490 | 20 | Payroll runs & payslips |
| TC-491 – TC-506 | 16 | BD contacts & leads |
| TC-507 – TC-522 | 16 | BD bids, proposals, comms, portfolio, handover |
| TC-523 – TC-538 | 16 | PM projects & milestones |
| TC-539 – TC-550 | 12 | PM tasks & sprints |
| **Total** | **168** | TC-383 through TC-550, no skipped IDs |

**Do not treat compact names as source of truth:**
- Approvals: `/pending/me`, `/stats/me` (not `my`)
- Invoice: `PENDING_APPROVAL`, `PARTIALLY_PAID`, `INACTIVE` client
- Payments: `/payments/manual`, `/checkout-session`, `/payment-config`
- Webhooks: `/api/payment-webhooks/stripe|razorpay`
- Duplicate asset tag: **400** not 409
- Salary: `SUPERSEDED`; payroll reject → **DRAFT**; process → **PROCESSED**
- Lead: `QUALIFIED` not QUALIFIED; bid `SUBMITTED`; comms `outbound`
- Portfolio: `isPublished`; proposal `validUntil`; bid `deadline`
- Tasks: **TODO** not BACKLOG; no DELETE task route (use CANCELLED)
- Project manager: `managerId`; assignee `assigneeId`; budget **0 invalid**
- Reimbursement receipt purpose: **OTHER/DOCUMENT**, not REIMBURSEMENT_RECEIPT
- Payment permission: **`payment.manage`**, not invoice.manage
