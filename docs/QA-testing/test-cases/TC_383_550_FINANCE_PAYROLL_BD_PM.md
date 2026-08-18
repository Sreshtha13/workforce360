# Test Cases TC-383 to TC-550 — Approvals, Assets, Finance, Payroll

---

## TC-383 — Approve request at current level
**Module:** Approvals | **Type:** Positive/E2E | **Steps:** `POST /api/approvals/:id/approve` | **Expected:** Advances to next level or APPROVED

## TC-384 — Reject approval request
**Module:** Approvals | **Type:** Positive | **Steps:** `POST /api/approvals/:id/reject` with reason | **Expected:** Status REJECTED

## TC-385 — Cancel own approval request
**Module:** Approvals | **Type:** Positive | **Steps:** Requester cancels pending | **Expected:** Status CANCELLED

## TC-386 — Non-approver cannot approve
**Module:** Approvals | **Type:** Security | **Steps:** Wrong user approves | **Expected:** HTTP 403

## TC-387 — List my pending approvals
**Module:** Approvals | **Type:** Positive | **Steps:** `GET /api/approvals/pending/my` | **Expected:** Only approvable items

## TC-388 — Approval history view
**Module:** Approvals | **Type:** Positive | **Steps:** `GET /api/approvals/:id/history` | **Expected:** Action timeline

## TC-389 — Create approval from workflow template
**Module:** Approvals | **Type:** Positive | **Steps:** `POST /api/approvals/from-workflow` | **Expected:** Request with configured levels

## TC-390 — Approval workflow condition routing
**Module:** Approvals | **Type:** Positive | **Steps:** Invoice > threshold routes to finance | **Expected:** Correct approver assigned | **Notes:** approval-conditions.ts

## TC-391 — Create delegation
**Module:** Approvals | **Type:** Positive | **Steps:** `/approvals/delegations` set delegate for date range | **Expected:** Delegation active

## TC-392 — Delegated approver can approve
**Module:** Approvals | **Type:** Positive/E2E | **Steps:** Delegate approves on behalf | **Expected:** Approval succeeds with delegatedFromId

## TC-393 — Expired delegation not active
**Module:** Approvals | **Type:** Negative | **Steps:** Approve after endsAt | **Expected:** Delegation not applied

## TC-394 — Process escalations job
**Module:** Approvals | **Type:** API | **Steps:** `POST /api/approvals/process-escalations` | **Expected:** Overdue requests escalated

## TC-395 — Approval stats my dashboard
**Module:** Approvals | **Type:** Positive | **Steps:** `GET /api/approvals/stats/my` | **Expected:** Pending/approved counts

## TC-396 — Multi-level approval full flow
**Module:** Approvals | **Type:** E2E | **Steps:** L1 approve → L2 approve | **Expected:** Final APPROVED

## TC-397 — Update approval workflow
**Module:** Approvals | **Type:** Positive | **Steps:** PATCH workflow add level | **Expected:** Updated

## TC-398 — Delete delegation
**Module:** Approvals | **Type:** Positive | **Steps:** DELETE delegation | **Expected:** Removed

## TC-399 — Approvals page UI pending list
**Module:** Approvals | **Type:** UI | **Steps:** `/approvals` | **Expected:** PendingApprovals widget + list

## TC-400 — Approval without approval.create for manual create
**Module:** Approvals | **Type:** Security | **Steps:** Employee POST /api/approvals | **Expected:** HTTP 403

## TC-401 — Create asset via assets module
**Module:** Assets | **Feature:** Asset CRUD, Assign, Return | **Type:** Positive | **Steps:** `POST /api/assets` tag, name, category | **Expected:** Asset AVAILABLE

## TC-402 — Update asset details
**Module:** Assets | **Type:** Positive | **Steps:** PUT asset | **Expected:** Updated

## TC-403 — Soft delete asset
**Module:** Assets | **Type:** Positive | **Steps:** DELETE asset | **Expected:** Not in list

## TC-404 — Assign asset to employee
**Module:** Assets | **Type:** Positive | **Steps:** `POST /api/assets/:id/assign` | **Expected:** ASSIGNED; history logged

## TC-405 — Return asset from employee
**Module:** Assets | **Type:** Positive | **Steps:** `POST /api/assets/:id/return` | **Expected:** AVAILABLE; employeeId null

## TC-406 — Update asset status
**Module:** Assets | **Type:** Positive | **Steps:** PATCH status MAINTENANCE | **Expected:** Status updated

## TC-407 — Asset history view
**Module:** Assets | **Type:** Positive | **Steps:** `GET /api/assets/:id/history` | **Expected:** Assignment/return events

## TC-408 — List assets by employee
**Module:** Assets | **Type:** Positive | **Steps:** `GET /api/assets/employee/:employeeId` | **Expected:** Employee's assets

## TC-409 — Asset stats summary
**Module:** Assets | **Type:** API | **Steps:** `GET /api/assets/stats/summary` | **Expected:** Counts by status

## TC-410 — Assign asset already assigned fails
**Module:** Assets | **Type:** Negative | **Steps:** Double assign | **Expected:** HTTP 400

## TC-411 — Asset tag duplicate rejected
**Module:** Assets | **Type:** Negative/DB | **Steps:** Duplicate tag | **Expected:** HTTP 409

## TC-412 — Asset history all list
**Module:** Assets | **Type:** Positive | **Steps:** `GET /api/assets/history/all` | **Expected:** Paginated history

## TC-413 — Create finance client
**Module:** Finance | **Feature:** Clients & Invoices | **Type:** Positive | **Steps:** `/finance/clients` create with billing address | **Expected:** Client ACTIVE

## TC-414 — Update client details
**Module:** Finance | **Type:** Positive | **Steps:** PUT client | **Expected:** Updated

## TC-415 — Deactivate client
**Module:** Finance | **Type:** Positive | **Steps:** Set status INACTIVE | **Expected:** Not selectable for new invoices

## TC-416 — Create invoice with line items
**Module:** Finance | **Type:** Positive | **Steps:** Create invoice + add line items qty, unitPrice | **Expected:** Totals auto-calculated

## TC-417 — Invoice total calculation accuracy
**Module:** Finance | **Type:** Positive | **Steps:** 3 line items with tax | **Expected:** subtotal + tax = total | **Notes:** finance.service.test.ts

## TC-418 — Submit invoice for approval
**Module:** Finance | **Type:** Positive/E2E | **Steps:** `POST /api/finance/invoices/:id/submit` | **Expected:** Status PENDING_APPROVAL

## TC-419 — Approve invoice
**Module:** Finance | **Type:** Positive | **Pre:** Finance approver | **Steps:** Approve | **Expected:** APPROVED

## TC-420 — Reject invoice
**Module:** Finance | **Type:** Positive | **Steps:** Reject with reason | **Expected:** REJECTED

## TC-421 — Send invoice to client
**Module:** Finance | **Type:** Positive | **Steps:** `POST /api/finance/invoices/:id/send` | **Expected:** Status SENT; email if configured

## TC-422 — Cancel invoice
**Module:** Finance | **Type:** Positive | **Steps:** Cancel DRAFT invoice | **Expected:** CANCELLED

## TC-423 — Cannot cancel paid invoice
**Module:** Finance | **Type:** Negative | **Steps:** Cancel PAID invoice | **Expected:** HTTP 400

## TC-424 — Mark overdue invoices job
**Module:** Finance | **Type:** API | **Steps:** `POST /api/finance/invoices/mark-overdue` | **Expected:** Past-due invoices OVERDUE

## TC-425 — Invoice list filter by status
**Module:** Finance | **Type:** UI | **Steps:** Filter DRAFT/SENT/PAID | **Expected:** Correct list

## TC-426 — Invoice detail page
**Module:** Finance | **Type:** UI | **Steps:** `/finance/invoices/:id` | **Expected:** Line items, totals, actions

## TC-427 — Invoice number uniqueness
**Module:** Finance | **Type:** Negative/DB | **Steps:** Duplicate invoiceNumber | **Expected:** HTTP 409

## TC-428 — Create invoice without client fails
**Module:** Finance | **Type:** Validation | **Steps:** Missing clientId | **Expected:** HTTP 400

## TC-429 — Line item zero quantity boundary
**Module:** Finance | **Type:** Boundary | **Steps:** qty: 0 | **Expected:** Validation error

## TC-430 — Line item negative price rejected
**Module:** Finance | **Type:** Negative | **Steps:** unitPrice: -100 | **Expected:** HTTP 400

## TC-431 — Finance dashboard loads
**Module:** Finance | **Type:** UI | **Steps:** `/finance/dashboard` | **Expected:** Revenue/outstanding metrics

## TC-432 — Employee without finance permission blocked
**Module:** Finance | **Type:** Security | **Steps:** Employee GET invoices | **Expected:** HTTP 403

## TC-433 — Record manual payment
**Module:** Finance | **Feature:** Payments | **Type:** Positive | **Steps:** `POST /api/finance/payments/manual` amount, invoiceId | **Expected:** Payment recorded; invoice amountPaid updated

## TC-434 — Partial payment updates balance
**Module:** Finance | **Type:** Positive | **Steps:** Pay 50% of invoice | **Expected:** PARTIALLY_PAID or balance remaining

## TC-435 — Full payment marks invoice PAID
**Module:** Finance | **Type:** Positive/E2E | **Steps:** Pay full amount | **Expected:** Invoice PAID

## TC-436 — Create Razorpay checkout session
**Module:** Finance | **Type:** Positive | **Pre:** Razorpay configured | **Steps:** `POST /api/finance/payments/checkout-session` | **Expected:** Session ID returned

## TC-437 — Razorpay checkout UI on invoice page
**Module:** Finance | **Type:** UI/E2E | **Steps:** Click Pay on invoice detail | **Expected:** Razorpay modal opens

## TC-438 — List payments with filters
**Module:** Finance | **Type:** Positive | **Steps:** `/finance/payments` | **Expected:** Payment history table

## TC-439 — Payment config returns publishable keys only
**Module:** Finance | **Type:** Security | **Steps:** `GET /api/finance/payment-config` | **Expected:** Publishable key only; no secret

## TC-440 — Overpayment rejected
**Module:** Finance | **Type:** Negative | **Steps:** Pay more than invoice total | **Expected:** HTTP 400

## TC-441 — Payment without invoice.manage permission
**Module:** Finance | **Type:** Security | **Steps:** Employee record payment | **Expected:** HTTP 403

## TC-442 — List payments API pagination
**Module:** Finance | **Type:** API | **Steps:** GET payments?page=1 | **Expected:** Paginated results

## TC-443 — Employee submit reimbursement
**Module:** Finance | **Feature:** Reimbursements | **Type:** Positive | **Steps:** `/finance/reimbursements` or portal submit amount, description, receipt | **Expected:** PENDING

## TC-444 — Finance review approve reimbursement
**Module:** Finance | **Type:** Positive/E2E | **Steps:** Approve reimbursement | **Expected:** APPROVED

## TC-445 — Finance reject reimbursement
**Module:** Finance | **Type:** Positive | **Steps:** Reject with notes | **Expected:** REJECTED

## TC-446 — Mark reimbursement paid
**Module:** Finance | **Type:** Positive | **Steps:** `POST /api/finance/reimbursements/:id/mark-paid` | **Expected:** PAID status

## TC-447 — Reimbursement receipt upload
**Module:** Finance | **Type:** Positive | **Steps:** Upload receipt via presign REIMBURSEMENT_RECEIPT | **Expected:** File linked

## TC-448 — Reimbursement amount validation positive
**Module:** Finance | **Type:** Validation | **Steps:** amount: -50 | **Expected:** HTTP 400

## TC-449 — Employee view own reimbursements only
**Module:** Finance | **Type:** Security | **Steps:** List as employee | **Expected:** Own records only

## TC-450 — Reimbursement approval workflow integration
**Module:** Finance | **Type:** E2E | **Steps:** Submit → approve → mark paid | **Expected:** Complete flow

## TC-451 — Stripe webhook valid signature
**Module:** Finance | **Feature:** Payment Webhooks | **Type:** Security/API | **Steps:** POST webhook with valid Stripe signature | **Expected:** Payment status updated

## TC-452 — Stripe webhook invalid signature rejected
**Module:** Finance | **Type:** Security/Negative | **Steps:** POST without/wrong signature | **Expected:** HTTP 400; no update

## TC-453 — Razorpay webhook valid signature
**Module:** Finance | **Type:** Security/API | **Steps:** Valid Razorpay webhook | **Expected:** Payment processed

## TC-454 — Razorpay webhook invalid signature
**Module:** Finance | **Type:** Negative | **Steps:** Invalid signature | **Expected:** Rejected

## TC-455 — Duplicate webhook idempotency
**Module:** Finance | **Type:** Edge | **Steps:** Send same webhook twice | **Expected:** Second ignored; no double payment

## TC-456 — Webhook for unknown payment ID
**Module:** Finance | **Type:** Negative | **Steps:** Webhook unknown payment | **Expected:** Handled gracefully 404/400

## TC-457 — Webhook malformed JSON body
**Module:** Finance | **Type:** Negative | **Steps:** Invalid JSON | **Expected:** HTTP 400

## TC-458 — Webhook updates invoice to PAID
**Module:** Finance | **Type:** Positive/E2E | **Steps:** Complete checkout → webhook | **Expected:** Invoice PAID

## TC-459 — Create salary structure
**Module:** Payroll | **Feature:** Salary Structures & Revisions | **Type:** Positive | **Steps:** `/payroll/salary-structures` basic, HRA, PF, tax components | **Expected:** Structure ACTIVE for employee

## TC-460 — Supersede existing salary structure
**Module:** Payroll | **Type:** Positive | **Steps:** Create new structure for same employee | **Expected:** Old SUPERSEDED; new ACTIVE

## TC-461 — Get active structure for employee
**Module:** Payroll | **Type:** API | **Steps:** `GET /api/payroll/salary-structures/active/:employeeId` | **Expected:** Current active structure

## TC-462 — Request salary revision
**Module:** Payroll | **Type:** Positive | **Steps:** `POST /api/payroll/salary-revisions` proposed components | **Expected:** Revision PENDING

## TC-463 — Approve salary revision
**Module:** Payroll | **Type:** Positive/E2E | **Steps:** Approve revision | **Expected:** New structure created

## TC-464 — Reject salary revision
**Module:** Payroll | **Type:** Positive | **Steps:** Reject revision | **Expected:** REJECTED; no structure change

## TC-465 — Salary revision without approve permission
**Module:** Payroll | **Type:** Security | **Steps:** HR approve revision | **Expected:** HTTP 403

## TC-466 — Salary structure component validation
**Module:** Payroll | **Type:** Validation | **Steps:** Negative basic salary | **Expected:** HTTP 400

## TC-467 — List salary structures filter
**Module:** Payroll | **Type:** UI | **Steps:** Filter by employee/status | **Expected:** Correct list

## TC-468 — Only one ACTIVE structure per employee
**Module:** Payroll | **Type:** DB/Business Rule | **Steps:** Verify DB constraint | **Expected:** Single ACTIVE

## TC-469 — Salary revision approval creates audit log
**Module:** Payroll | **Type:** DB | **Steps:** Approve; check audit | **Expected:** Audit entry

## TC-470 — Revision request by employee (if allowed)
**Module:** Payroll | **Type:** Edge | **Steps:** Employee request revision | **Expected:** 403 or allowed — verify

## TC-471 — Payroll dashboard loads
**Module:** Payroll | **Feature:** Payroll Runs & Payslips | **Type:** UI | **Steps:** `/payroll/dashboard` | **Expected:** Metrics visible

## TC-472 — Create payroll run for month/year
**Module:** Payroll | **Type:** Positive | **Steps:** `POST /api/payroll/runs` month=8, year=2026 | **Expected:** Run DRAFT created

## TC-473 — Duplicate payroll run month/year rejected
**Module:** Payroll | **Type:** Negative/DB | **Steps:** Second run same month | **Expected:** HTTP 409 unique (month,year)

## TC-474 — Calculate payroll run
**Module:** Payroll | **Type:** Positive | **Steps:** `POST /api/payroll/runs/:id/calculate` | **Expected:** Items generated per employee with LOP

## TC-475 — LOP calculation from attendance
**Module:** Payroll | **Type:** Positive | **Pre:** Employee absent 2 days | **Expected:** lopDays=2; paidDays reduced | **Notes:** payroll-lop.ts

## TC-476 — Working days excludes weekends and holidays
**Module:** Payroll | **Type:** Positive | **Steps:** Verify workingDays count | **Expected:** Mon-Fri minus holidays

## TC-477 — Submit payroll run for approval
**Module:** Payroll | **Type:** Positive/E2E | **Steps:** Submit run | **Expected:** PENDING_APPROVAL

## TC-478 — Approve payroll run
**Module:** Payroll | **Type:** Positive | **Steps:** Approve | **Expected:** APPROVED

## TC-479 — Process payroll run generates payslips
**Module:** Payroll | **Type:** Positive/E2E | **Steps:** Process approved run | **Expected:** Payslips GENERATED per employee

## TC-480 — Mark payroll run paid
**Module:** Payroll | **Type:** Positive | **Steps:** Mark paid | **Expected:** PAID status

## TC-481 — Cancel payroll run
**Module:** Payroll | **Type:** Positive | **Steps:** Cancel DRAFT run | **Expected:** CANCELLED

## TC-482 — Cannot process unapproved run
**Module:** Payroll | **Type:** Negative | **Steps:** Process DRAFT run | **Expected:** HTTP 400

## TC-483 — Payroll run detail page
**Module:** Payroll | **Type:** UI | **Steps:** `/payroll/runs/:id` | **Expected:** Employee items, totals, actions

## TC-484 — Payslip PDF generated on process
**Module:** Payroll | **Type:** Positive | **Steps:** Check payslip fileId after process | **Expected:** PDF in storage

## TC-485 — Admin list all payslips
**Module:** Payroll | **Type:** Positive | **Steps:** `GET /api/payroll/payslips` | **Expected:** All payslips for payroll team

## TC-486 — Payroll item breakdown JSON structure
**Module:** Payroll | **Type:** API | **Steps:** Inspect breakdown field | **Expected:** Contains basic, HRA, deductions, net

## TC-487 — Proration for mid-month joiner
**Module:** Payroll | **Type:** Edge | **Pre:** Employee joined mid-month | **Expected:** Pro-rated salary | **Notes:** payroll-lop.ts proration

## TC-488 — Payroll run reject flow
**Module:** Payroll | **Type:** Positive | **Steps:** Reject submitted run | **Expected:** REJECTED; can recalculate

## TC-489 — Month boundary: January run
**Module:** Payroll | **Type:** Boundary | **Steps:** Create run month=1 | **Expected:** Accepted

## TC-490 — Invalid month 13 rejected
**Module:** Payroll | **Type:** Boundary/Validation | **Steps:** month=13 | **Expected:** HTTP 400

## TC-491 — BD create contact
**Module:** Business Development | **Feature:** Contacts & Leads | **Type:** Positive | **Steps:** `/bd/contacts` create name, email, company | **Expected:** Contact created

## TC-492 — BD update contact
**Module:** BD | **Type:** Positive | **Steps:** PATCH contact | **Expected:** Updated

## TC-493 — BD contact detail page
**Module:** BD | **Type:** UI | **Steps:** `/bd/contacts/:id` | **Expected:** Contact info + linked leads

## TC-494 — BD create lead linked to contact
**Module:** BD | **Type:** Positive | **Steps:** `/bd/leads` create with value, status NEW | **Expected:** Lead created

## TC-495 — BD lead pipeline board drag status
**Module:** BD | **Type:** UI/Positive | **Steps:** Drag lead card to QUALIFIED column | **Expected:** Status updated via PATCH

## TC-496 — BD lead detail with communications
**Module:** BD | **Type:** UI | **Steps:** `/bd/leads/:id` | **Expected:** LeadCommunications component

## TC-497 — BD assign lead to user
**Module:** BD | **Type:** Positive | **Steps:** Set assignedToId | **Expected:** Assignee shown

## TC-498 — BD mark lead WON
**Module:** BD | **Type:** Positive/E2E | **Steps:** Status WON; wonAt set | **Expected:** Ready for project conversion

## TC-499 — BD mark lead LOST with reason
**Module:** BD | **Type:** Positive | **Steps:** Status LOST | **Expected:** lostAt set

## TC-500 — BD lead value validation negative
**Module:** BD | **Type:** Validation | **Steps:** value: -1000 | **Expected:** HTTP 400

## TC-501 — BD list leads filter by status
**Module:** BD | **Type:** UI | **Steps:** Filter NEW/QUALIFIED/WON | **Expected:** Correct list

## TC-502 — BD without bd.lead.read blocked
**Module:** BD | **Type:** Security | **Steps:** Employee GET leads | **Expected:** HTTP 403

## TC-503 — BD dashboard metrics
**Module:** BD | **Type:** UI | **Steps:** `/bd/dashboard` | **Expected:** Pipeline chart, lead counts

## TC-504 — BD pipeline API
**Module:** BD | **Type:** API | **Steps:** `GET /api/bd/pipeline` | **Expected:** Grouped by status

## TC-505 — BD contact email format validation
**Module:** BD | **Type:** Validation | **Steps:** Invalid email | **Expected:** HTTP 400

## TC-506 — BD duplicate lead same contact allowed
**Module:** BD | **Type:** Edge | **Steps:** Multiple leads per contact | **Expected:** Allowed

## TC-507 — BD create bid for lead
**Module:** BD | **Feature:** Bids, Proposals, Communications | **Type:** Positive | **Steps:** `/bd/bids` amount, deadline | **Expected:** Bid DRAFT

## TC-508 — BD update bid status
**Module:** BD | **Type:** Positive | **Steps:** PATCH bid SUBMITTED | **Expected:** Updated

## TC-509 — BD create proposal
**Module:** BD | **Type:** Positive | **Steps:** `/bd/proposals` content, validUntil | **Expected:** Proposal created

## TC-510 — BD link proposal to bid
**Module:** BD | **Type:** Positive | **Steps:** Create proposal with bidId | **Expected:** Linked

## TC-511 — BD log communication
**Module:** BD | **Type:** Positive | **Steps:** `/bd/communications` channel EMAIL, direction OUTBOUND | **Expected:** Communication logged

## TC-512 — BD communication list on lead
**Module:** BD | **Type:** UI | **Steps:** View lead communications tab | **Expected:** Timeline of comms

## TC-513 — BD proposal detail page
**Module:** BD | **Type:** UI | **Steps:** `/bd/proposals/:id` | **Expected:** Content displayed

## TC-514 — BD bid deadline past (edge)
**Module:** BD | **Type:** Edge | **Steps:** Create bid with past deadline | **Expected:** Accepted or warning

## TC-515 — BD create without permission
**Module:** BD | **Type:** Security | **Steps:** Employee POST bid | **Expected:** HTTP 403

## TC-516 — BD proposal validUntil date validation
**Module:** BD | **Type:** Validation | **Steps:** Invalid date format | **Expected:** HTTP 400

## TC-517 — BD communication requires lead or contact
**Module:** BD | **Type:** Validation | **Steps:** Missing leadId and contactId | **Expected:** HTTP 400

## TC-518 — BD portfolio create item
**Module:** BD | **Feature:** Portfolio & Pipeline | **Type:** Positive | **Steps:** `/bd/portfolio` title, description, technologies | **Expected:** Item created

## TC-519 — BD portfolio publish toggle
**Module:** BD | **Type:** Positive | **Steps:** Set isPublished true | **Expected:** Visible in published list

## TC-520 — BD portfolio list filter published
**Module:** BD | **Type:** UI | **Steps:** Filter published only | **Expected:** Correct items

## TC-521 — BD pipeline chart renders
**Module:** BD | **Type:** UI | **Steps:** Dashboard pipeline chart | **Expected:** Chart with stage counts

## TC-522 — BD lead won to project handover E2E
**Module:** BD | **Type:** E2E | **Steps:** Win lead → create PM project with leadId | **Expected:** One project per lead (unique constraint)

## TC-523 — PM create project
**Module:** Project Management | **Feature:** Projects & Milestones | **Type:** Positive | **Steps:** `/pm/projects` name, code, dates, budget | **Expected:** Project PLANNING

## TC-524 — PM project detail with tabs
**Module:** PM | **Type:** UI | **Steps:** `/pm/projects/:id` | **Expected:** Overview, Board, Backlog, Sprints, Team, Budget tabs

## TC-525 — PM update project status
**Module:** PM | **Type:** Positive | **Steps:** PATCH status ACTIVE | **Expected:** Updated

## TC-526 — PM create milestone
**Module:** PM | **Type:** Positive | **Steps:** Add milestone with dueDate | **Expected:** Milestone on project

## TC-527 — PM complete milestone
**Module:** PM | **Type:** Positive | **Steps:** Set completedAt | **Expected:** Milestone done

## TC-528 — PM project report
**Module:** PM | **Type:** API | **Steps:** `GET /api/pm/projects/:id/report` | **Expected:** Progress metrics

## TC-529 — PM project code uniqueness
**Module:** PM | **Type:** Negative/DB | **Steps:** Duplicate project code | **Expected:** HTTP 409

## TC-530 — PM link project to won lead
**Module:** PM | **Type:** Positive | **Steps:** Create project with leadId | **Expected:** BD-PM link

## TC-531 — PM duplicate leadId on second project rejected
**Module:** PM | **Type:** Negative/DB | **Steps:** Second project same leadId | **Expected:** HTTP 409

## TC-532 — PM project budget field boundary
**Module:** PM | **Type:** Boundary | **Steps:** budget: 0 | **Expected:** Accepted or rejected — verify

## TC-533 — PM without pm.project.create blocked
**Module:** PM | **Type:** Security | **Steps:** Employee create project | **Expected:** HTTP 403

## TC-534 — PM dashboard
**Module:** PM | **Type:** UI | **Steps:** `/pm/dashboard` | **Expected:** Project summaries

## TC-535 — PM list projects search
**Module:** PM | **Type:** UI | **Steps:** Search project name | **Expected:** Filtered

## TC-536 — PM project manager assignment
**Module:** PM | **Type:** Positive | **Steps:** Set managerId | **Expected:** Manager shown

## TC-537 — PM client contact link
**Module:** PM | **Type:** Positive | **Steps:** Link BD contact as client | **Expected:** Contact on project

## TC-538 — PM milestone overdue indicator
**Module:** PM | **Type:** UI | **Steps:** Milestone past dueDate | **Expected:** Visual overdue indicator

## TC-539 — Create task in backlog
**Module:** PM | **Feature:** Tasks, Sprints, Kanban | **Type:** Positive | **Steps:** `/pm/projects/:id/backlog` create task | **Expected:** Task BACKLOG status

## TC-540 — Move task on Kanban board
**Module:** PM | **Type:** UI/Positive | **Steps:** Drag task TODO → IN_PROGRESS on board | **Expected:** Status updated

## TC-541 — Create sprint
**Module:** PM | **Type:** Positive | **Steps:** `/pm/projects/:id/sprints` name, goal, dates | **Expected:** Sprint PLANNING

## TC-542 — Assign tasks to sprint
**Module:** PM | **Type:** Positive | **Steps:** Move backlog tasks to sprint | **Expected:** sprintId set

## TC-543 — Sprint detail Kanban
**Module:** PM | **Type:** UI | **Steps:** `/pm/sprints/:id` | **Expected:** KanbanBoard with sprint tasks

## TC-544 — Task detail with comments
**Module:** PM | **Type:** UI | **Steps:** `/pm/tasks/:id` | **Expected:** TaskComments component

## TC-545 — Add task comment
**Module:** PM | **Type:** Positive | **Steps:** `POST /api/pm/tasks/comments` | **Expected:** Comment added

## TC-546 — Task priority enum validation
**Module:** PM | **Type:** Validation | **Steps:** priority: INVALID | **Expected:** HTTP 400

## TC-547 — Task estimated hours boundary
**Module:** PM | **Type:** Boundary | **Steps:** estimatedHours: 0 | **Expected:** Accepted or 400

## TC-548 — Global tasks list page
**Module:** PM | **Type:** UI | **Steps:** `/pm/tasks` | **Expected:** All accessible tasks

## TC-549 — Task assignee update
**Module:** PM | **Type:** Positive | **Steps:** PATCH assigneeId | **Expected:** Assignee changed

## TC-550 — Delete task from backlog
**Module:** PM | **Type:** Positive | **Steps:** Soft delete task | **Expected:** Removed from board
