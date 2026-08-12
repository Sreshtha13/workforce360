# Phase 4 Implementation Summary — Finance & Payroll

## Overview
Phase 4 builds the Finance and Payroll modules on top of the Employee Master (Phase 2) and the generic approval workflow engine (Phase 3). Finance covers client management, invoicing, payment tracking/accounts receivable, employee reimbursements, and a dashboard, with Stripe and Razorpay integrated for online payment collection. Payroll covers versioned salary structures, salary revision workflow, batch payroll runs, backend-generated PDF payslips, and payroll history/reports. Payslips are wired into the Employee Portal with strict ownership enforcement.

## Completed Components

### 1. Database Schema (Prisma)
**Location:** `apps/api/db/schema.prisma`

#### New Models Added:
- **Client** — Finance client/customer master (company info, billing contact, status)
- **Invoice** — Header record (invoice number, dates, currency, subtotal/tax/discount/total/amountPaid, status, link to `ApprovalRequest`)
- **InvoiceLineItem** — Line items per invoice (description, quantity, unit price, amount)
- **Payment** — Payment records (manual or gateway-originated), linked to an invoice, provider, status, provider session/payment IDs
- **Reimbursement** — Employee expense reimbursement claims (category, amount, receipt file, review workflow)
- **SalaryStructure** — Versioned per-employee compensation (earnings + deductions breakdown, `effectiveFrom`/`effectiveTo`, `status: ACTIVE | SUPERSEDED`)
- **SalaryRevision** — Raise/revision requests referencing the current structure and holding proposed values, linked to an `ApprovalRequest`
- **PayrollRun** — A batch pay cycle (month/year, pay period, totals, status, link to `ApprovalRequest`)
- **PayrollRunItem** — Per-employee line item within a run (snapshot of gross/deductions/net + breakdown JSON, taken from the salary structure at calculation time)
- **Payslip** — Generated PDF record per run item (`GENERATED` → `PUBLISHED`), linked to a `StoredFile`

#### New Enums:
- `ClientStatus` — ACTIVE, INACTIVE
- `InvoiceStatus` — DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED
- `PaymentProvider` — MANUAL, STRIPE, RAZORPAY
- `PaymentStatus` — PENDING, SUCCEEDED, FAILED
- `ReimbursementStatus` — PENDING, APPROVED, REJECTED, PAID
- `SalaryStructureStatus` — ACTIVE, SUPERSEDED
- `SalaryRevisionStatus` — PENDING, APPROVED, REJECTED
- `PayrollRunStatus` — DRAFT, PENDING_APPROVAL, APPROVED, PROCESSED, PAID, CANCELLED
- `PayslipStatus` — GENERATED, PUBLISHED

All new tables follow the project standard: `createdAt`, `updatedAt`, `deletedAt` (soft delete), and monetary fields use `Decimal(12,2)`.

**Migration:** applied to the local database (drift on a pre-existing table was resolved separately; see "Errors & Fixes" in the working notes). Seed re-run successfully with new roles/permissions/demo users.

### 2. Validation Schemas (Zod)
**Location:** `apps/api/src/schemas/phase4.schema.ts`

Covers: client create/update/list, invoice create/update/submit-for-approval/list, manual payment recording, checkout-session creation, payment listing, reimbursement create/review/mark-paid/list, salary structure create/list, salary revision request/review/list, payroll run create/submit-for-approval/list, payslip listing. Zod is the authoritative validation layer, enforced as middleware on every route.

### 3. Repository Layer
**Locations:**
- `apps/api/src/repositories/finance.repository.ts` — Client, Invoice (+ line items), Payment, Reimbursement CRUD + dashboard aggregates (`groupBy`/`aggregate` for receivables, invoice totals by status, payments by provider)
- `apps/api/src/repositories/payroll.repository.ts` — SalaryStructure (versioned queries), SalaryRevision, PayrollRun/PayrollRunItem, Payslip, active-employee lookup for batch runs

All repository methods use `Prisma.XUncheckedCreateInput`/`UncheckedUpdateInput` for simpler scalar FK assignment, soft-delete filtering (`deletedAt: null`) on every read, and relation includes tuned per use case (list vs. detail).

### 4. Service Layer (Business Logic)
**Locations:**
- `apps/api/src/services/finance.service.ts`
- `apps/api/src/services/payroll.service.ts`
- `apps/api/src/services/payment-gateway.service.ts`
- `apps/api/src/services/payslip-pdf.service.ts`

#### Finance Service — key logic:
- **Invoice totals:** `subtotal = Σ(quantity × unitPrice)`, `total = subtotal + tax − discount`, rejects negative totals, rounds to 2 decimals throughout.
- **Invoice numbering:** `INV-{year}-{seq}` with a small retry loop against a live uniqueness check to avoid collisions under concurrent creation.
- **Invoice lifecycle:** DRAFT → (submit) PENDING_APPROVAL → (approval engine decides) APPROVED/REJECTED → (send) SENT → (payments) PARTIALLY_PAID → PAID, or OVERDUE via a sweep job, or CANCELLED. Only DRAFT/REJECTED invoices are editable.
- **Invoice approval** reuses the Phase 3 generic `ApprovalService` (`entityType: "invoice"`).
- **Accounts receivable:** `applyPaymentToInvoice` accumulates `amountPaid` and flips status to `PARTIALLY_PAID` or `PAID` once the balance is covered — used by both manual payments and gateway webhooks.
- **Reimbursements:** simple direct review model (PENDING → APPROVED/REJECTED → PAID), no multi-level approval engine since it's a single reviewer decision.
- **Finance dashboard:** outstanding receivables, invoices grouped by status (count + totals), payments grouped by provider/status, pending reimbursement count, recent invoices.

#### Payroll Service — key logic:
- **Salary structure totals:** `gross = basic + hra + conveyance + medical + special + other`, `deductions = PF + professional tax + income tax + other`, `net = gross − deductions`; throws if net would be negative.
- **Versioning:** creating a new structure automatically supersedes the previous active one (`status: SUPERSEDED`, `effectiveTo = newEffectiveFrom − 1 day`), so historical payslips always resolve against the structure that was active at the time — a raise never rewrites history. A new structure's `effectiveFrom` must be strictly after the current active structure's.
- **Salary revision workflow:** request stores proposed values + reason, reuses the Phase 3 `ApprovalService` (`entityType: "salary_revision"`); approval automatically creates the new versioned `SalaryStructure` from the proposed values and links it back as `resultingSalaryStructureId`; rejection just records the reviewer's notes.
- **Payroll run (batch pay cycle):**
  1. `createPayrollRun` — one run per (month, year), starts as `DRAFT`.
  2. `calculatePayrollRun` — pulls every `ACTIVE` employee, skips any without an active salary structure as of the pay period end (returned as `skippedEmployeeIds` so the UI can flag them), snapshots gross/deductions/net + full breakdown into `PayrollRunItem`, sums run totals. Re-calculable while still `DRAFT` (clears and rebuilds items).
  3. `submitPayrollRunForApproval` → PENDING_APPROVAL, reuses the Phase 3 approval engine (`entityType: "payroll_run"`).
  4. `decidePayrollRunApproval` → APPROVED on approval; on rejection, sent back to `DRAFT` for revision (there is no terminal `REJECTED` run state — it must be re-submitted).
  5. `processPayrollRun` (APPROVED only) — generates a PDF payslip per line item via `pdfkit`, stores it through the storage abstraction, creates a `Payslip` row with `status: GENERATED`, run moves to `PROCESSED`.
  6. `markPayrollRunPaid` (PROCESSED only) — flips every payslip in the run to `PUBLISHED` and the run to `PAID`. **Only at this point do payslips become visible in the Employee Portal.**
  7. `cancelPayrollRun` — allowed only from DRAFT/PENDING_APPROVAL.
- **Payslip PDF generation** (`payslip-pdf.service.ts`, `pdfkit`): renders company header, employee identity (name, code, designation, department), pay period, working/paid/LOP days, itemized earnings and deductions, gross/deductions/net totals — generated entirely server-side, never in the frontend.
- **Employee portal payslip access:** `listMyPayslips(employeeId)` only ever queries `{ employeeId, status: "PUBLISHED" }`; `getMyPayslipDownload(employeeId, payslipId)` loads the payslip and explicitly checks `payslip.employeeId === employeeId && payslip.status === "PUBLISHED"` before returning a download — an employee can never fetch another employee's payslip or an unpublished one, even if they know the ID.

#### Payment Gateway Service — abstraction over Stripe & Razorpay:
- `createStripeCheckoutSession` / `createRazorpayOrder` — create a checkout session/order server-side and return only a client-safe session/order reference to the frontend (never secret keys).
- `getPublicConfig()` — returns only the Stripe **publishable** key and Razorpay **key id** (never secrets) for the frontend to initialize the client SDK.
- Webhook handlers verify the provider's signature (Stripe signing secret / Razorpay HMAC) before trusting any payload, then call back into `FinanceService` (`handleStripeCheckoutCompleted/Failed`, `handleRazorpayPaymentCaptured/Failed`) to reconcile `Payment` + `Invoice` state. Webhook routes are mounted with raw-body parsing in `app.ts` (before the global JSON body parser) since signature verification requires the unparsed request body.

### 5. Controller Layer
**Locations:**
- `apps/api/src/controllers/finance.controller.ts`
- `apps/api/src/controllers/payroll.controller.ts`
- `apps/api/src/controllers/payment-webhook.controller.ts`

Thin controllers: parse `req.params`/`req.query`/`req.body` (already Zod-validated), delegate to the service layer, respond via `sendSuccess`/`sendError`.

### 6. Routes with RBAC
**Locations:**
- `apps/api/src/routes/finance.routes.ts` → mounted at `/api/finance`
- `apps/api/src/routes/payroll.routes.ts` → mounted at `/api/payroll`
- `apps/api/src/routes/portal.routes.ts` → payslip self-service endpoints added at `/api/portal/payslips`
- Webhook routes registered directly in `apps/api/src/app.ts` (raw body, no auth — verified by provider signature instead)

#### New API Endpoints:

**Finance** (`/api/finance`):
- `GET /dashboard` — Finance dashboard (`finance.dashboard.read`)
- `GET /payment-config` — Client-safe publishable keys (authenticated, no extra permission)
- `POST /clients`, `GET /clients`, `GET /clients/:id`, `PUT /clients/:id`, `DELETE /clients/:id` (`client.manage`/`client.read`)
- `POST /invoices`, `GET /invoices`, `GET /invoices/:id`, `PUT /invoices/:id` (`invoice.manage`/`invoice.read`/`invoice.approve`)
- `POST /invoices/:id/submit`, `/approve`, `/reject`, `/send`, `/cancel`, `POST /invoices/mark-overdue`
- `POST /payments/manual`, `POST /payments/checkout-session`, `GET /payments` (`payment.manage`/`payment.read`)
- `POST /reimbursements` (self-service, any authenticated employee), `GET /reimbursements`, `GET /reimbursements/:id`, `POST /reimbursements/:id/review`, `POST /reimbursements/:id/mark-paid` (`reimbursement.review`)

**Payroll** (`/api/payroll`):
- `POST /salary-structures`, `GET /salary-structures`, `GET /salary-structures/active/:employeeId` (`salary_structure.manage`/`.read`)
- `POST /salary-revisions`, `GET /salary-revisions`, `GET /salary-revisions/:id`, `POST /salary-revisions/:id/approve`, `/reject` (`salary_revision.request`/`.read`/`.approve`)
- `POST /runs`, `GET /runs`, `GET /runs/:id`, `POST /runs/:id/calculate`, `/submit`, `/approve`, `/reject`, `/process`, `/mark-paid`, `/cancel` (`payroll_run.manage`/`.read`/`.approve`)
- `GET /payslips` — admin/payroll visibility across all employees and statuses (`payslip.read`/`payroll_run.read`)

**Employee Portal** (`/api/portal`):
- `GET /payslips` — the caller's own **published** payslips only
- `GET /payslips/:id/download` — presigned S3 URL (redirect) or an authenticated proxy stream for local storage; enforces ownership + published status server-side

**Payment webhooks** (raw body, provider-signature verified, no user auth):
- `POST /api/payment-webhooks/stripe`
- `POST /api/payment-webhooks/razorpay`

### 7. RBAC & Permissions
**Updated Files:**
- `apps/api/src/constants/rbac-matrix.ts` — added `finance` and `payroll` to `SYSTEM_ROLE_CODES`; added `FINANCE_RESOURCES` (`client`, `invoice`, `payment`, `reimbursement`, `finance`) and `PAYROLL_RESOURCES` (`salary_structure`, `salary_revision`, `payroll_run`, `payslip`) granted wholesale to their respective roles.
- `apps/api/db/seed.ts` — new permission rows for every finance/payroll resource-action pair, new `financeRole`/`payrollRole`, demo `financeUser`/`payrollUser` accounts with employee records. Added a `nextEmployeeCode()` helper to avoid `employee_code` collisions across all seeded demo users.

#### New Permissions (representative):
`client.read/manage`, `invoice.read/manage/approve`, `payment.read/manage`, `reimbursement.read/review` (create is open to any authenticated employee), `finance.dashboard.read`, `salary_structure.read/manage`, `salary_revision.request/read/approve`, `payroll_run.read/manage/approve`, `payslip.read`.

### 8. Frontend (`apps/web`)
**New types & API client:**
- `types/phase4.ts` — full TypeScript types for every Phase 4 entity and input shape.
- `lib/api-client.ts` — `apiClient.finance.*` and `apiClient.payroll.*` namespaces; `apiClient.portal.listPayslips()` / `downloadPayslip()` (handles both presigned-URL redirect and direct blob streaming transparently).
- `lib/phase4-status.ts` — badge-variant helpers per status enum + `formatMoney`.
- `lib/module-availability.ts` — `payslips` portal module flag flipped from `false` to `true`.
- `lib/navigation.ts` / `components/layout/dashboard-shell.tsx` — new collapsible "Finance" and "Payroll" sidebar sections, permission-gated per item.

**New admin pages:**
- `/finance/dashboard` — receivables, invoice/payment breakdowns, recent invoices.
- `/finance/clients` — CRUD with search/status filter.
- `/finance/invoices` (list + create) and `/finance/invoices/[id]` (detail: line items, payments, approval actions, manual payment recording).
- `/finance/payments` — list with status filter, linked back to invoices.
- `/finance/reimbursements` — review/approve/reject/mark-paid.
- `/payroll/salary-structures` — versioned structure list + create form with live gross/deduction/net calculation.
- `/payroll/salary-revisions` — request/approve/reject raise workflow.
- `/payroll/runs` (list + create) and `/payroll/runs/[id]` (detail: calculate → submit → approve/reject → process → mark paid, with per-employee line items and payslip status).

**Employee Portal:**
- `/portal/payslips` — replaced the Phase 2 "coming soon" placeholder; lists the employee's own published payslips and downloads them (presigned redirect or streamed blob).
- `/portal/dashboard` — payslip count metric now live instead of "Soon", card links to `/portal/payslips`.

### 9. Tests
**Locations:**
- `apps/api/src/services/finance.service.test.ts` (14 tests)
- `apps/api/src/services/payroll.service.test.ts` (14 tests)

#### Test Coverage:

**Finance:**
- ✓ Invoice subtotal/total computed correctly from line items + tax − discount
- ✓ Fractional line-item rounding to 2 decimals
- ✓ Negative invoice total rejected
- ✓ Due date before issue date rejected
- ✓ Nonexistent client rejected
- ✓ Invoice approval → APPROVED / rejection → REJECTED via the approval engine
- ✓ Deciding on a non-pending invoice rejected
- ✓ Cancelling a PAID invoice rejected; cancelling a SENT invoice allowed
- ✓ Manual payment → PARTIALLY_PAID when balance only partly covered
- ✓ Manual payment → PAID once the full balance is covered

**Payroll:**
- ✓ Salary structure gross/deductions/net computed correctly from components
- ✓ Structure with deductions exceeding earnings (negative net) rejected
- ✓ New structure supersedes the previous active one with correct `effectiveTo`
- ✓ New structure effective before the current active one rejected
- ✓ Payroll run calculation includes only active employees with an active structure, skips and reports the rest, sums totals correctly
- ✓ Calculating a non-DRAFT run rejected
- ✓ Payroll run approval → APPROVED / rejection → back to DRAFT (no terminal REJECTED state)
- ✓ Processing a non-APPROVED run rejected; marking a non-PROCESSED run paid rejected; marking a PROCESSED run paid succeeds
- ✓ `listMyPayslips` scoped to `{ employeeId, status: PUBLISHED }` only
- ✓ Download rejected when the payslip belongs to a different employee
- ✓ Download rejected when the payslip is not yet published
- ✓ Download succeeds for the owner (both presigned-redirect and local-stream paths)

Both suites mock repositories and the approval/gateway/storage services (mirroring the Phase 3 test pattern) so they run without a live database. Full backend suite: **309/309 tests passing.**

## Architecture Highlights

### Reused vs. bespoke approval models
- **Invoice** and **PayrollRun** approvals reuse the Phase 3 generic `ApprovalService` (multi-level, sequential, full audit trail) since both can plausibly need more than one sign-off level in a real org.
- **Reimbursement** and **SalaryRevision** use a simpler direct single-reviewer decision baked into their own status field, since a versioned/approval-request relation would be overkill for what is fundamentally a single yes/no review.

### Versioned salary structures
```
Employee hired → SalaryStructure v1 (ACTIVE, effectiveFrom: 2024-01-01)
Raise approved on 2024-06-15, effective 2024-07-01:
  v1 → SUPERSEDED, effectiveTo: 2024-06-30
  v2 → ACTIVE, effectiveFrom: 2024-07-01
Payroll run for June 2024 (calculated after the raise) still resolves
against v1, because it looks up the structure whose effectiveFrom is
on/before the pay period end and was active during that period.
```

### Payroll run state machine
```
DRAFT --calculate--> DRAFT (items populated, re-calculable)
DRAFT --submit--> PENDING_APPROVAL
PENDING_APPROVAL --approve--> APPROVED
PENDING_APPROVAL --reject--> DRAFT (revise & resubmit)
APPROVED --process--> PROCESSED (payslips generated, status GENERATED)
PROCESSED --mark paid--> PAID (payslips flip to PUBLISHED, now visible in portal)
DRAFT | PENDING_APPROVAL --cancel--> CANCELLED
```

### Payslip ownership enforcement (Milestone 4 requirement)
The backend never trusts a client-supplied employee ID for payslip access:
1. `requireAuth` resolves the JWT to a `userId`.
2. The portal service layer resolves `userId → employee.id` server-side.
3. Every payslip query/download is filtered by that resolved `employee.id` **and** requires `status: PUBLISHED` — enforced in the service layer, not just the route, so it can't be bypassed by calling the admin endpoints (which require separate, higher-level permissions the employee role doesn't have).

### Payment gateway key hygiene
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` are read only in `apps/api` via `env.ts` (Zod-validated), never referenced anywhere in `apps/web`.
- The frontend only ever receives `STRIPE_PUBLISHABLE_KEY` / `RAZORPAY_KEY_ID` (via `GET /api/finance/payment-config`) and an opaque checkout session/order reference (via `POST /api/finance/payments/checkout-session`).

## Milestone 4 Acceptance Criteria

✅ **Finance can create and send an invoice, and track its payment status.**
`POST /api/finance/invoices` → `POST /invoices/:id/submit` → approval → `POST /invoices/:id/send` → payment recorded (manual or gateway webhook) → status automatically progresses through `SENT → PARTIALLY_PAID → PAID`, all visible on the invoice detail page and the finance dashboard.

✅ **Payroll can run a pay cycle for all active employees and generate payslips employees can view/download from the portal, with the backend enforcing that an employee can only ever fetch their own payslips.**
`POST /api/payroll/runs` → `calculate` (all active employees with a structure) → `submit`/`approve` → `process` (PDF payslips generated server-side) → `mark-paid` (published) → employees see them at `GET /api/portal/payslips` and download via `GET /api/portal/payslips/:id/download`, with ownership + publication status enforced in the service layer (covered by dedicated unit tests).

## Verification Performed
- `npm run typecheck` in `apps/api` and `apps/web` — no new errors introduced by Phase 4 code (a handful of pre-existing errors remain in unrelated files from earlier phases: `storage.ts`'s optional `@aws-sdk/*` dynamic imports, some Phase-1/2 test files, `admin/teams`, `hr/candidates`, `hr/offers`).
- `npx vitest run` in `apps/api` — **309/309 tests passing**, including the 28 new Phase 4 tests.
- Live smoke-testing of the running API (login as demo finance/payroll users, exercising the full invoice and payroll-run lifecycle end-to-end against the dev server) was **not completed in this session** — shell command execution for that step was declined. The dev/seed data (`financeUser`, `payrollUser` demo accounts) is already in place; recommend running through the milestone flows manually or asking for a follow-up session to finish that check.

## Shortcuts & Assumptions
- **LOP (loss-of-pay) days**: `calculatePayrollRun` currently sets `lopDays: 0` and `paidDays = workingDays` for every employee — there's no integration yet with actual attendance/leave records to prorate pay for unpaid leave or absences. This is called out as a TODO; wiring it up would mean reading `AttendanceRecord`/`LeaveApplication` data from Phase 3 for the pay period.
- **Tax calculation**: `incomeTax` and `professionalTax` are entered manually per salary structure rather than computed from a tax slab engine — acceptable for MVP per the "reasonable assumption" guidance, but a real payroll system would need a jurisdiction-aware tax calculator.
- **Reimbursement approval** deliberately does not use the generic `ApprovalRequest` engine (see "Architecture Highlights" above) — flagged here in case multi-level reimbursement sign-off becomes a requirement later.
- **Invoice numbering** uses a count-then-retry strategy rather than a DB sequence; sufficient for expected finance-team invoice volume but not strictly gap-free under very high concurrency.
- Payslip currency is taken from the `SalaryStructure.currency` field per employee (not a single company-wide currency), since salary structures were already modeled as per-employee/versioned.

## Files Created/Modified

### Created:
- `apps/api/src/schemas/phase4.schema.ts`
- `apps/api/src/repositories/finance.repository.ts`
- `apps/api/src/repositories/payroll.repository.ts`
- `apps/api/src/services/finance.service.ts`
- `apps/api/src/services/payroll.service.ts`
- `apps/api/src/services/payment-gateway.service.ts`
- `apps/api/src/services/payslip-pdf.service.ts`
- `apps/api/src/services/finance.service.test.ts`
- `apps/api/src/services/payroll.service.test.ts`
- `apps/api/src/controllers/finance.controller.ts`
- `apps/api/src/controllers/payroll.controller.ts`
- `apps/api/src/controllers/payment-webhook.controller.ts`
- `apps/api/src/routes/finance.routes.ts`
- `apps/api/src/routes/payroll.routes.ts`
- `apps/api/src/routes/finance.docs.ts`, `apps/api/src/routes/payroll.docs.ts` (Swagger)
- `apps/web/types/phase4.ts`
- `apps/web/lib/phase4-status.ts`
- `apps/web/app/(dashboard)/finance/dashboard/page.tsx`
- `apps/web/app/(dashboard)/finance/clients/page.tsx`
- `apps/web/app/(dashboard)/finance/invoices/page.tsx`
- `apps/web/app/(dashboard)/finance/invoices/[id]/page.tsx`
- `apps/web/app/(dashboard)/finance/payments/page.tsx`
- `apps/web/app/(dashboard)/finance/reimbursements/page.tsx`
- `apps/web/app/(dashboard)/payroll/salary-structures/page.tsx`
- `apps/web/app/(dashboard)/payroll/salary-revisions/page.tsx`
- `apps/web/app/(dashboard)/payroll/runs/page.tsx`
- `apps/web/app/(dashboard)/payroll/runs/[id]/page.tsx`

### Modified:
- `apps/api/db/schema.prisma` — added Phase 4 models and enums
- `apps/api/db/seed.ts` — finance/payroll permissions, roles, demo users, `nextEmployeeCode()` helper
- `apps/api/src/lib/env.ts` — Stripe/Razorpay env vars
- `apps/api/src/app.ts` — raw-body webhook routes mounted before the JSON body parser
- `apps/api/src/routes/index.ts` — registered `financeRouter`/`payrollRouter`
- `apps/api/src/routes/portal.routes.ts` — added `GET /payslips`, `GET /payslips/:id/download`
- `apps/api/src/services/hr.service.ts` — `listMyPayslips`/`getMyPayslipDownload` delegating to `PayrollService` with employee-scoped ownership
- `apps/api/src/constants/rbac-matrix.ts` — `finance`/`payroll` roles + resource lists
- `apps/api/src/constants/rbac-matrix.test.ts` — updated `SYSTEM_ROLE_CODES` expectation
- `apps/web/lib/api-client.ts` — `finance.*`, `payroll.*`, `portal.listPayslips/downloadPayslip`
- `apps/web/lib/module-availability.ts` — `payslips: true`
- `apps/web/lib/navigation.ts` — Finance/Payroll nav sections
- `apps/web/components/layout/dashboard-shell.tsx` — Finance/Payroll sidebar sections
- `apps/web/app/(dashboard)/portal/payslips/page.tsx` — real implementation (was "coming soon")
- `apps/web/app/(dashboard)/portal/dashboard/page.tsx` — live payslip count/link

---

**Phase 4 Implementation Complete** ✅ (pending a manual/live smoke-test pass against the running dev server, see "Verification Performed")

Finance (clients, invoicing, payments, reimbursements, dashboard, Stripe/Razorpay) and Payroll (versioned salary structures, salary revisions, batch payroll runs, backend PDF payslip generation) are fully implemented end-to-end, with payslips flowing through to the Employee Portal under strict backend-enforced ownership.
