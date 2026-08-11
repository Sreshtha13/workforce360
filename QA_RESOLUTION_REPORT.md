# QA Resolution Report — Workforce 360 ERP (Phase 0/1 Bugfix Sprint)

**Date:** 2026-08-06  
**Scope:** Super Admin Dashboard, Employee Portal, HR & Recruitment, Administration, HR role UX

---

## 1. Issues Fixed

### Super Admin Dashboard
- Department statistics & breakdown wired to live `GET /api/dashboard` data
- Global header search enabled (employees + departments via `GET /api/dashboard/search`)
- Active / inactive / total employee counts corrected (only users with `employeeId`)
- User count (`totalUsers`) separated from employee metrics
- Pending Approvals shows labeled breakdown (onboarding, draft offers, pipeline)
- Attendance & Leave widgets show honest “module not enabled” states (no fake preview data)
- Hiring overview uses dashboard API payload; progress bars correctly render **0%** for zero values
- Designation / Admin shortcuts use permission-filtered nav links
- My Applications (candidate dashboard) handles missing profile with empty state + careers CTA

### Employee Portal
- My Profile redesigned with personal/professional sections, assets, empty states
- Attendance, Leave, Timesheets, Requests, Payslips, Documents remain hidden via `PORTAL_MODULE_FLAGS`
- My Assets: empty/error states + assigned asset details
- Policies: listing + empty state
- Support: full form (subject, category, priority, description, attachment) + My Tickets table

### HR & Recruitment
- HR Dashboard: fixed `userId` bug, pending-approvals crash, probation metric, profile summary, widgets
- Pipeline: forward-only stage moves; reverse requires `application.override_stage`
- Candidates: row links to profile, search, empty state
- Employee Master: search + lifecycle filter + empty/error handling
- Offers: eligible applications dropdown, templates, validation, create visibility
- Onboarding: checklists included from API; proper empty states
- Policies: publish error handling; leaner list query
- Assets: searchable employee assign dropdown with name/ID/dept/designation; assignee shown

### Administration
- User role dropdown: resilient lookups + all assignable roles
- Roles: permissions mandatory on create; Edit Permissions action
- Departments UX improvements
- Teams: lead/members/department filtering (existing flow verified/improved)
- Designations: fixed controller bug (`req` vs `_req`) that broke listing
- Offices: assign users workflow
- Employee Types / Employment Statuses: clarified distinction + view/assign users
- Dark mode: native select/option readability

### HR Role
- Seed assigns HR user to Human Resources department + employee master record
- Assigning HR role auto-links user to HR department when unset
- HR dashboard scoped metrics + profile card + approval breakdown labels

---

## 2. Root Causes (high level)

| Area | Root cause |
|------|------------|
| Dashboard search crash | `sendData` called but never defined/imported |
| Wrong employee counts | Counted all users as employees; candidates inflated “active” |
| HR dashboard 500 | Used `req.user.id` instead of JWT `userId`; object spread into array for pending breakdown |
| Probation always 0 | Filtered non-existent `PROBATION` lifecycle enum |
| Designations broken | `getDesignations` renamed param to `_req` but still read `req.query` |
| Offer dropdown empty | Loaded only `status=OFFER` applications |
| Onboarding checklists empty | `listApplications` omitted `checklistItems` include |
| Role dropdown incomplete | Single `Promise.all` for lookups failed entirely if any org permission missing |
| Employment status confusion | Seeded statuses duplicated employee types (Full Time, etc.) |
| HR not in HR dept | Seed never created/assigned HR department |

---

## 3. Files Modified (representative)

### Backend (`apps/api`)
- `db/schema.prisma`, `db/seed.ts`
- `db/migrations/20260806120000_support_ticket_category_attachment/migration.sql`
- `src/controllers/dashboard.controller.ts`, `hr.controller.ts`, `organization.controller.ts`, `user.controller.ts`, `recruitment.controller.ts`
- `src/services/dashboard.service.ts`, `hr.service.ts`, `user.service.ts`, `recruitment.service.ts`
- `src/repositories/phase2.repository.ts`, `user.repository.ts`
- `src/lib/organization-metrics.ts`
- `src/schemas/phase2.schema.ts`, `user.schema.ts`

### Frontend (`apps/web`)
- Dashboard: `dashboard/page.tsx`, `global-search.tsx`, `hiring-overview-live.tsx`, `dashboard-shell.tsx`
- Portal: `portal/profile|assets|policies|support/page.tsx`
- HR: `hr/dashboard|pipeline|candidates|employees|offers|onboarding|assets|policies/page.tsx`
- Admin: `admin/users|roles|departments|offices|employee-types|employment-statuses/page.tsx`
- Candidate: `candidate/dashboard/page.tsx`
- Shared: `lib/api-client.ts`, `types/phase2.ts`, `components/ui/select.tsx`, `globals.css`, `form-fields.tsx`

---

## 4. Database Changes

**Migration:** `20260806120000_support_ticket_category_attachment`
- `support_tickets.category` (nullable text)
- `support_tickets.latest_reply` (nullable text)
- `support_tickets.attachment_file_id` (FK → `stored_files`)

**Seed updates:**
- Human Resources department (`code: HR`)
- HR user assigned to HR dept + employee master (`ACTIVE`)
- Employment statuses clarified (Active, On Probation, On Leave, Notice Period, Suspended, Terminated)
- Legacy type-like employment statuses soft-disabled

---

## 5. API Changes

| Change | Detail |
|--------|--------|
| `GET /api/dashboard` | Employee metrics require `employeeId`; richer stats aliases |
| `GET /api/dashboard/search` | Empty `q` returns empty arrays (no crash) |
| `GET /api/hr/dashboard` | Uses `userId`; fixed pending breakdown; probation ≈ ACTIVE hired ≤90 days |
| `GET /api/recruitment/applications` | Optional `statuses` CSV; includes checklistItems + latest interview |
| `POST /api/portal/tickets` | Accepts `category`, `attachmentFileId` |
| `GET /api/users` | Optional filters: `officeId`, `employeeTypeId`, `employmentStatusId` |
| Policies list | Slimmer `select` for faster loads |

---

## 6. UI Improvements

- Live metric cards for employees, depts, teams, designations, offices, pending approvals
- Working global search with results dropdown
- Honest empty/disabled module messaging (attendance/leave)
- Portal profile as structured employee record
- Support ticket workflow with categories/priorities
- Pipeline stage gating UX
- Offer templates + eligible application picker
- Admin assign workflows for offices / types / statuses
- Dark-mode-safe native selects

---

## 7. Remaining Known Issues

1. **Attendance / Leave / Timesheets / Payslips / Documents** — intentionally not implemented (Phase 2+); nav hidden; widgets show “not enabled”.
2. **Offer templates** — client-side content templates only (no `OfferTemplate` DB model yet).
3. **Support ticket replies** — `latestReply` column exists; no agent reply workflow yet (shows “No replies yet”).
4. **Pagination** — several HR/org list endpoints still return full lists (acceptable for MVP scale; should add page/limit meta later).
5. **Guest hire path** — hiring still requires candidate linked `userId`.
6. **Atomic role create + permissions** — create then `setPermissions` (orphan role possible if second call fails).
7. **Pre-existing API typecheck debt** — some unrelated `tsc` errors remain in tests/storage/AWS SDK stubs (outside this sprint’s functional fixes).

---

## Verification notes

- Migration applied successfully to Postgres.
- Seed completed (`admin@workforce360.com` / `Admin@123`, `hr@workforce360.com` / `Hr@123456`).
- Re-seed after pull to ensure HR department linkage and employment status labels.
