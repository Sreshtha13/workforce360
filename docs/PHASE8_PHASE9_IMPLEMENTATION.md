# Phase 8 & 9 Implementation Summary

## Overview

**Phase 8 — Help Desk** upgrades the Phase 2 ticket stack with SLA tracking, escalation (via the approval engine), ticket timeline, and a searchable Knowledge Base.

**Phase 9 — Core ERP Services** hardens the generic Approval Workflow Engine, adds a Notification Center (in-app + email + announcements + preferences), and ships a Document Management System on top of existing storage/presign.

---

## Milestone acceptance

| Milestone | Status |
|-----------|--------|
| Any employee can raise a ticket; staff triage/assign/resolve with visible SLA countdown | ✅ |
| Generic approval request with multi-level + conditions, used across Leave / Invoice / Payroll / Expense / Ticket | ✅ (engine + wiring; leave/expense/ticket escalate opt-in via `approverIds` or workflows) |
| Documents uploaded, versioned, permissioned (Employee / Candidate / Project); checks enforced on backend | ✅ |

---

## Phase 8 — Help Desk

### Schema / migration
- `SlaPolicy` (per `TicketPriority`: LOW / MEDIUM / HIGH / URGENT)
- `SupportTicket` extensions: `ticketNumber`, SLA dues, first response, escalation, `approvalRequestId`
- `KnowledgeBaseArticle` (title, slug, content, tags, publish, viewCount)
- Migration: `apps/api/db/migrations/20260812120000_phase8_phase9_helpdesk_core_services/`
- Default SLA seeds: LOW 8h/48h, MEDIUM 4h/24h, HIGH 1h/8h, URGENT 30m/4h

### Backend
- `/api/helpdesk` — staff tickets, assign/status/reply, **escalate** → `ApprovalService`, SLA upsert, KB CRUD
- Existing `/api/portal/tickets` and `/api/hr/tickets` still work; create path applies SLA + ticket number
- SYSTEM messages on assign / status / escalate (timeline)
- Notifications on assign / reply / escalate / resolve

### Frontend
- `/hr/tickets` — SLA countdown badges, ticket #, escalate
- `/portal/support` — SLA + KB search
- `/hr/knowledge-base` — article management
- `/hr/sla-policies` — SLA policy upsert UI

---

## Phase 9 — Notifications, Approvals, DMS

### Notifications (`/api/notifications`)
- In-app create/list/mark-read/mark-all-read/unread count
- Categories + per-user `NotificationPreference` (in-app / email opt-out)
- Announcements + publish fan-out
- Email via SMTP (`SMTP_*` env) or console fallback; optional `SENDGRID_API_KEY` reserved
- UI: portal notifications (+ mark read), preferences, admin announcements, unread badge in shell

### Approval engine hardening
- Schema aligned with Phase 3 migration shape (`entityType`, `currentLevel`, `totalLevels`, `ApprovalAction`)
- `ApprovalWorkflow` + levels + conditions; `createFromWorkflow`
- `ApprovalDelegation` (OOO); applied when creating requests
- `escalateOverdueSteps` + `POST /api/approvals/process-escalations`
- Full action history (`GET /:id/history`)
- Domain wiring:
  - Invoice / Payroll (existing)
  - Leave / Reimbursement: optional `approverIds` → links `approvalRequestId`
  - Ticket escalate: creates approval request
- UI: `/approvals` inbox, `/admin/approval-workflows`, `/approvals/delegations`

### Document Management (`/api/documents`)
- `DocumentCategory`, `ManagedDocument`, `DocumentVersion`, `DocumentPermission`
- Contexts: EMPLOYEE | CANDIDATE | PROJECT | GENERAL
- Access levels: VIEW / EDIT / DELETE / MANAGE (enforced in service)
- Reuses storage presign → confirm → attach `StoredFile`
- UI: portal documents (enabled), `/hr/documents`, `/pm/documents`

### Permissions seeded
`ticket.*`, `approval.read|action|manage|delegate|create`, `announcement.manage`, `document.read|create|update|delete|manage`, notification-related as seeded in `db/seed.ts` + `db/seeds/phase8-phase9-permissions.sql`

---

## How to apply

```bash
cd apps/api
npm run db:migrate:deploy   # or db:migrate
npm run db:generate
npm run db:seed
```

Optional email (`.env`):

```
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=noreply@yourorg.com
```

---

## Tests

Unit tests passing for SLA due-date calc, approval condition matching, document access helpers, notification email opt-out, ticket SLA create path.

---

## Assumptions & shortcuts

1. **Approval schema drift fixed** for the approval engine; broader leave/finance Prisma models may still diverge from older Phase 3 repos in places unrelated to this phase — leave/finance services that already called `ApprovalService` continue to use `approvalRequestId`.
2. Workflow condition matching is AND across conditions; role → first user with that role code.
3. Overdue approval escalate → next-level approver, else manager.
4. Ticket escalate requires explicit `approverIds` (UI collects one approver id).
5. Document download opens via existing storage download when wired; version list shows metadata.
6. Workflow editor UI is intentionally simple (level 1 + role code); multi-level can be posted via API.
7. Email marks `emailSentAt` even when using console transport in dev.

## TODOs / follow-ups

- [ ] Cron/job to call `POST /api/approvals/process-escalations` and ticket SLA breach alerts
- [ ] Richer multi-level workflow builder UI
- [ ] User picker for escalate / delegate (instead of raw user IDs)
- [ ] PM documents entry in sidebar when PM nav group is expanded
- [ ] Align remaining leave/finance Prisma ↔ migration drift if typecheck fails on older modules
- [ ] Wire SendGrid HTTP API if preferred over SMTP
