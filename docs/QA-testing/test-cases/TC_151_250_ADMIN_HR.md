# Test Cases TC-151 to TC-250 — Detailed Executable Cases

**Scope:** Admin dashboard, settings, templates, integrations, audit/security, public careers, recruitment, HR employees/lifecycle, policies  
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

**Confirmed enums (from Prisma + Zod):**
- Job posting: `DRAFT` \| `PUBLISHED` \| `CLOSED`
- Pipeline: `APPLIED` → `SCREENING` → `INTERVIEW` → `OFFER` → `HIRED` (+ side-exit `REJECTED`)
- Interview: `SCHEDULED` \| `COMPLETED` \| `CANCELLED` \| `NO_SHOW`
- Offer: `DRAFT` \| `SENT` \| `ACCEPTED` \| `DECLINED` \| `EXPIRED`
- Employee lifecycle: `PRE_ONBOARDING` \| `ONBOARDING` \| `ACTIVE` \| `OFFBOARDING` \| `TERMINATED`
- Policy: `DRAFT` \| `PUBLISHED` \| `ARCHIVED`
- Policy assignment: `ALL` \| `USER` \| `DEPARTMENT` \| `TEAM`
- Security severity: `INFO` \| `WARN` \| `CRITICAL` (there is **no** `HIGH`)
- Storage purpose for this module: `RESUME` \| `POLICY` \| `OFFER_LETTER`

**Seed careers jobs:** `/careers/senior-software-engineer`, `/careers/hr-coordinator`

---
## Table of Contents

### Test suite index (all documents)

Quick links to every test-case file. See [INDEX.md](./INDEX.md) for execution order and credentials.

| Document | TC range | Count | Scope |
|----------|----------|-------|-------|
| [TC_001_070_AUTH.md](./TC_001_070_AUTH.md) | TC-001 – TC-070 | 70 | Infrastructure & Authentication |
| [TC_071_150_RBAC_USERS_ORG.md](./TC_071_150_RBAC_USERS_ORG.md) | TC-071 – TC-150 | 80 | RBAC, Users & Organization |
| **TC_151_250_ADMIN_HR.md** (this document) | TC-151 – TC-250 | 100 | Admin, Careers & HR |
| [TC_251_382_PORTAL_ATTENDANCE.md](./TC_251_382_PORTAL_ATTENDANCE.md) | TC-251 – TC-382 | 132 | Portal, Attendance & Leave |
| [TC_383_550_FINANCE_PAYROLL_BD_PM.md](./TC_383_550_FINANCE_PAYROLL_BD_PM.md) | TC-383 – TC-550 | 168 | Finance, Payroll, BD & PM |
| [TC_551_690_ENGINEERING_E2E.md](./TC_551_690_ENGINEERING_E2E.md) | TC-551 – TC-690 | 140 | Engineering, E2E & Cross-cutting |

### This document (TC-151 – TC-250)

| Module | Feature | Test cases | Count |
|--------|---------|------------|-------|
| Admin Dashboard | Dashboard & Global Search | TC-151 – TC-158 | 8 |
| Admin | Settings, Templates, Integrations | TC-159 – TC-168 | 10 |
| Admin | Audit Logs & Security Events | TC-169 – TC-176 | 8 |
| Public Careers | Job Listings & Apply | TC-177 – TC-188 | 12 |
| Recruitment | Jobs, Candidates, Pipeline | TC-189 – TC-208 | 20 |
| Recruitment | Interviews, Assessments, Offers | TC-209 – TC-220 | 12 |
| HR Operations | Employees & Lifecycle | TC-221 – TC-238 | 18 |
| HR Operations | Policies & Acknowledgements | TC-239 – TC-250 | 12 |

---


## Shared setup

**Admin session:** login as `admin@workforce360.com`.  
**HR session:** login as `hr@workforce360.com`.  
**Employee session:** create a user with role `employee` only (or use a hired employee after TC-225). Portal needs `portal.read`.  
**Candidate session:** register via `/careers/register` (TC-180).

---

## TC-151 — Admin dashboard loads metrics

**Module:** Admin Dashboard  
**Feature:** Dashboard & Global Search  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Admin logged in with `dashboard.read`.
- Seed data present (users, jobs).

**Test Data:** None beyond admin credentials.

**Steps to Execute:**
1. Open `http://localhost:3000/dashboard`.
2. Wait until loading finishes.
3. Inspect WelcomeHero, metric cards, PendingApprovals, HiringOverview, ActiveEmployees, QuickActions, AdminShortcuts.

**Expected Result:**
1. Page loads (not redirected to `/login`).
2. Skeleton/`LoadingState` may show first, then content.
3. Welcome hero shows the admin’s name. Stat cards render. Pending approvals widget is visible. No uncaught error.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `apps/web/app/(dashboard)/dashboard/page.tsx` calls `GET /api/dashboard` when `dashboard.read` is present.

---

## TC-152 — Admin dashboard API returns KPI data

**Module:** Admin Dashboard  
**Feature:** Dashboard & Global Search  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Admin session cookie.

**Test Data:** `GET /api/dashboard`

**Steps to Execute:**
1. `GET /api/dashboard` with admin cookies.
2. Inspect `{ data, error, meta }`.

**Expected Result:**
1. HTTP 200.
2. `error` is null. `data` contains counts/metrics used by the dashboard (stats object). Shape may include employee/hiring/approval counts — record actual keys.

**Postconditions:** None.

**Notes / Dependencies:** `requirePermission("dashboard.read")` on `dashboard.routes.ts`.

---

## TC-153 — Global search finds employees by name

**Module:** Admin Dashboard  
**Feature:** Dashboard & Global Search  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Admin logged in with `dashboard.read`.
- Known employee name from seed (e.g. admin/HR first name).

**Test Data:** Search string matching an employee display name.

**Steps to Execute:**
1. On any dashboard-shell page, focus the header **GlobalSearch**.
2. Type the employee name (wait for debounce).
3. Open the results dropdown (`aria-controls="global-search-results"`).
4. Click a result.

**Expected Result:**
1. Search input is visible in the shell.
2. Request `GET /api/dashboard/search?q=<query>` fires.
3. Matching employees appear in the dropdown.
4. Navigation goes to the employee/user target URL.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `components/dashboard/global-search.tsx`.

---

## TC-154 — Global search API

**Module:** Admin Dashboard  
**Feature:** Dashboard & Global Search  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Admin with `dashboard.read`.

**Test Data:**
- `GET /api/dashboard/search?q=admin`
- `GET /api/dashboard/search?q=` (empty)
- `GET /api/dashboard/search?q=zzz-no-match`

**Steps to Execute:**
1. Call search with `q=admin`.
2. Call with empty `q`.
3. Call with a string that matches nothing.

**Expected Result:**
1. HTTP 200; results include entities matching “admin” (users/employees and possibly jobs).
2. HTTP 200 with empty list **or** 400 if `q` is required — record actual.
3. HTTP 200; empty results, not 500.

**Postconditions:** None.

**Notes / Dependencies:** Route `GET /api/dashboard/search`.

---

## TC-155 — Dashboard API without dashboard.read returns 403

**Module:** Admin Dashboard  
**Feature:** Dashboard & Global Search  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** High  

**Preconditions:**
- User with **employee** role only (no `dashboard.read`).
- If no employee user exists, create one via admin Users and assign `employee`.

**Test Data:** Employee session → `GET /api/dashboard`

**Steps to Execute:**
1. Login as employee.
2. `GET /api/dashboard`.
3. Open `/dashboard` in the browser.

**Expected Result:**
1. Login succeeds; redirected to a permitted home (often portal).
2. HTTP 403 `{ error: { code: FORBIDDEN or similar } }`.
3. Admin KPI widgets that require `dashboard.read` do not load; page may render a limited hero or redirect.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `requirePermission("dashboard.read")`. Finance/payroll **may** have `dashboard.read` — use a true employee, not finance.

---

## TC-156 — Active employees list on dashboard API

**Module:** Admin Dashboard  
**Feature:** Dashboard & Global Search  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Admin with `dashboard.read`. Seed employees exist.

**Test Data:** `GET /api/dashboard/employees`

**Steps to Execute:**
1. Call the endpoint as admin.
2. Compare with `/hr/employees` for an ACTIVE employee.
3. Call as employee (no permission).

**Expected Result:**
1. HTTP 200; array of active employees.
2. Terminated employees are not listed (if service filters lifecycle `ACTIVE`).
3. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Same permission `dashboard.read`.

---

## TC-157 — Dashboard loading state while fetching

**Module:** Admin Dashboard  
**Feature:** Dashboard & Global Search  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Admin logged in. DevTools throttling Slow 3G.

**Test Data:** Viewport desktop; Slow 3G.

**Steps to Execute:**
1. Enable network throttle.
2. Hard-refresh `/dashboard`.
3. Observe the metric-card area before data arrives.

**Expected Result:**
1. Throttle on.
2. Page does not sit blank.
3. Skeleton/`LoadingState` is visible, then cards populate.

**Postconditions:** Restore network.

**Notes / Dependencies:** Dashboard page uses `dashboardQuery.isLoading` and `Skeleton`.

---

## TC-158 — Dashboard error state with retry

**Module:** Admin Dashboard  
**Feature:** Dashboard & Global Search  
**Scenario Type:** Negative / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Admin logged in. Ability to stop the API process.

**Test Data:** None.

**Steps to Execute:**
1. Stop `apps/api`.
2. Refresh `/dashboard`.
3. Start API; click Retry if shown, or refresh.

**Expected Result:**
1. API down.
2. Error UI (not an infinite spinner, not a raw stack). Retry control if `ErrorState` is wired; otherwise failed query state.
3. After API is up, metrics load.

**Postconditions:** API running.

**Notes / Dependencies:** If the page only shows empty cards with no retry, log a UX gap.

---

## TC-159 — View and update system settings

**Module:** Admin  
**Feature:** Settings, Templates, Integrations  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Super Admin with `settings.manage`.

**Test Data:**
```json
{
  "settings": [
    {
      "key": "company.displayName",
      "value": "Workforce 360 QA",
      "category": "general"
    }
  ]
}
```
Use a **non-secret** key that already exists, or create via upsert.

**Steps to Execute:**
1. Open `/admin/settings`.
2. Change a non-secret value; Save.
3. Confirm `PUT /api/settings`.
4. Refresh the page; confirm persistence.
5. `GET /api/settings` and match the value.

**Expected Result:**
1. Settings grouped by category.
2. Save succeeds; success feedback.
3. HTTP 200.
4. Value still present after reload.
5. GET matches PUT.

**Postconditions:** Setting updated (restore original value after test).

**Notes / Dependencies:** Confirmed `PUT /api/settings` + `upsertSettingsSchema` (`settings` array, `key` + `value` required). UI: `settings.manage`.

---

## TC-160 — Secret settings masked in UI

**Module:** Admin  
**Feature:** Settings, Templates, Integrations  
**Scenario Type:** Security / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Admin with `settings.manage`.
- At least one setting with `isSecret: true` (create via PUT if none).

**Test Data:**
```json
{
  "settings": [
    {
      "key": "qa.secret.token",
      "value": "super-secret-value",
      "isSecret": true,
      "category": "security"
    }
  ]
}
```

**Steps to Execute:**
1. PUT the secret setting.
2. Open `/admin/settings`.
3. Inspect the input for that key and the GET JSON in Network.

**Expected Result:**
1. HTTP 200.
2. UI does not show `super-secret-value` in clear text (password/masked field or placeholder).
3. Record whether GET returns the raw value to the admin (admins may see it in API even if UI masks). **Fail if the value is visible in the rendered input as plain text.**

**Postconditions:** Delete or overwrite the QA secret key.

**Notes / Dependencies:** Field name is `isSecret` (not `isSecret` vs compact `isSecret`). Confirmed schema.

---

## TC-161 — Create notification template

**Module:** Admin  
**Feature:** Settings, Templates, Integrations  
**Scenario Type:** Positive / UI / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** User with `template.manage` (admin).

**Test Data:**
```json
{
  "code": "qa.leave.approved",
  "name": "QA Leave Approved",
  "channel": "email",
  "subject": "Your leave was approved",
  "body": "Hello {{firstName}}, your leave is approved."
}
```

**Steps to Execute:**
1. Open `/admin/notification-templates`.
2. Create template with unique `code`.
3. Confirm `POST /api/notification-templates`.
4. `GET /api/notification-templates`.

**Expected Result:**
1. Page loads.
2. HTTP 201/200; template stored.
3. POST used.
4. New row listed; `code` unique.

**Postconditions:** Save `templateId`.

**Notes / Dependencies:** `code` max 100; `name` max 255; `body` required min 1. Permission `template.manage`.

---

## TC-162 — Update notification template

**Module:** Admin  
**Feature:** Settings, Templates, Integrations  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `templateId` from TC-161. `template.manage`.

**Test Data:** `{ "body": "Updated body {{firstName}}" }`

**Steps to Execute:**
1. `PATCH /api/notification-templates/<templateId>` with new body.
2. GET list; open edit UI and confirm body.
3. PATCH `{ "code": "hacked.code" }` (code omitted from update schema).

**Expected Result:**
1. HTTP 200; body updated.
2. UI matches.
3. `code` is **not** changed (`updateTemplateSchema` omits `code`). Extra `code` is ignored or 400.

**Postconditions:** Template updated.

**Notes / Dependencies:** Confirmed `updateTemplateSchema = createTemplateSchema.omit({ code: true }).partial()`.

---

## TC-163 — Delete notification template

**Module:** Admin  
**Feature:** Settings, Templates, Integrations  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Disposable template (create extra). `template.manage`.

**Test Data:** `DELETE /api/notification-templates/<id>`

**Steps to Execute:**
1. DELETE the template.
2. GET list.
3. PATCH the deleted id.

**Expected Result:**
1. HTTP 200. Soft delete (`deletedAt`) if the service uses it.
2. Template not in default list.
3. HTTP 404.

**Postconditions:** Template gone from UI.

**Notes / Dependencies:** Confirmed DELETE route. Do not delete seeded production templates.

---

## TC-164 — Integrations page shows MVP status

**Module:** Admin  
**Feature:** Settings, Templates, Integrations  
**Scenario Type:** Positive / UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** User with `settings.manage` **or** `dashboard.read`.

**Test Data:** None.

**Steps to Execute:**
1. Open `/admin/integrations`.
2. Confirm `GET /api/admin/integrations`.
3. Compare listed integrations to env (email, S3, Stripe/Razorpay flags).

**Expected Result:**
1. Page loads.
2. HTTP 200; registry items (e.g. webhooks_api, storage, payments) with configured/not-configured status.
3. No secrets (API keys) rendered.

**Postconditions:** None.

**Notes / Dependencies:** `GET /api/admin/integrations` via `adminExtrasRouter`.

---

## TC-165 — Settings update without settings.manage returns 403

**Module:** Admin  
**Feature:** Settings, Templates, Integrations  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** HR user (`hr@workforce360.com`) — typically **no** `settings.manage`.

**Test Data:** Same PUT body as TC-159.

**Steps to Execute:**
1. Login as HR.
2. `PUT /api/settings`.
3. Open `/admin/settings` in the browser.

**Expected Result:**
1. HR session.
2. HTTP 403.
3. Page gated (`settings.manage`); ErrorState or hidden nav.

**Postconditions:** Settings unchanged.

**Notes / Dependencies:** Confirmed `requirePermission("settings.manage")` on PUT.

---

## TC-166 — Webhook integration create

**Module:** Admin  
**Feature:** Settings, Templates, Integrations  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Admin with `settings.manage`.

**Test Data:**
```json
{
  "url": "https://example.com/hooks/workforce360",
  "events": ["user.created", "leave.approved"]
}
```

**Steps to Execute:**
1. `POST /api/integrations/webhooks` with valid URL + events.
2. `GET /api/integrations/webhooks`.
3. POST `{ "url": "not-a-url", "events": ["x"] }`.
4. POST `{ "url": "https://example.com/x", "events": [] }`.

**Expected Result:**
1. HTTP 201/200; subscription stored.
2. New webhook listed.
3. HTTP 400 (url must be `z.string().url()`).
4. HTTP 400 (`events` min 1).

**Postconditions:** Save `webhookId`.

**Notes / Dependencies:** Confirmed `integration.routes.ts`.

---

## TC-167 — Webhook delete

**Module:** Admin  
**Feature:** Settings, Templates, Integrations  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `webhookId` from TC-166. `settings.manage`.

**Test Data:** `DELETE /api/integrations/webhooks/<webhookId>`

**Steps to Execute:**
1. DELETE the webhook.
2. GET list.
3. DELETE the same id again.

**Expected Result:**
1. HTTP 200.
2. Webhook absent.
3. HTTP 404.

**Postconditions:** Webhook removed.

**Notes / Dependencies:** Confirmed DELETE ` /webhooks/:id`.

---

## TC-168 — Master data summary page

**Module:** Admin  
**Feature:** Settings, Templates, Integrations  
**Scenario Type:** UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** User with `settings.manage` or `dashboard.read`.

**Test Data:** `GET /api/admin/master-data`

**Steps to Execute:**
1. Open `/admin/master-data`.
2. Confirm GET master-data.
3. Spot-check counts vs `/admin/departments`, `/admin/teams`, etc.

**Expected Result:**
1. Overview of org entity counts.
2. HTTP 200.
3. Counts are plausible (not all zero if seed ran).

**Postconditions:** None.

**Notes / Dependencies:** Nav href `/admin/master-data`. API `/api/admin/master-data`.

---

## TC-169 — Audit logs list with pagination

**Module:** Admin  
**Feature:** Audit Logs & Security Events  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Admin with `audit.read`.
- Prior mutating actions exist (login, user create, TC-159).

**Test Data:** Default `page=1`, `pageSize=25`

**Steps to Execute:**
1. Open `/admin/audit-logs`.
2. Confirm table columns: actor/user, action, entity, timestamp.
3. Confirm network `GET /api/audit-logs?page=1&pageSize=25`.

**Expected Result:**
1. Page loads.
2. Rows show actor, action, entity, time.
3. HTTP 200; `meta.pageSize` 25 (repository default 25, max 100).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed audit repository default `pageSize ?? 25`. UI hard-codes `pageSize: 25`.

---

## TC-170 — Audit logs next page

**Module:** Admin  
**Feature:** Audit Logs & Security Events  
**Scenario Type:** UI / Pagination  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** More than 25 audit rows (generate by repeating an update if needed). `audit.read`.

**Test Data:** Page 2.

**Steps to Execute:**
1. On `/admin/audit-logs`, click next page.
2. Compare `meta.total` and `meta.page` / `totalPages`.
3. Click previous.

**Expected Result:**
1. Page 2 request fires; different rows than page 1 (no overlap if total > 25).
2. `meta.total` unchanged.
3. Page 1 restored.

**Postconditions:** None.

**Notes / Dependencies:** If total ≤ 25, generate more audit rows first or mark blocked.

---

## TC-171 — Audit logs filter by date range

**Module:** Admin  
**Feature:** Audit Logs & Security Events  
**Scenario Type:** Positive / UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `audit.read`. Known action today.

**Test Data:**
- `dateFrom` = today
- `dateTo` = today
- Control: `dateFrom`/`dateTo` last year

**Steps to Execute:**
1. Set date from/to to today; apply (page resets to 1).
2. `GET /api/audit-logs?dateFrom=<today>&dateTo=<today>`.
3. Set a range with no activity.

**Expected Result:**
1. Only today’s logs (inclusive range — record timezone behaviour).
2. HTTP 200.
3. EmptyState “No audit entries”.

**Postconditions:** Clear filters.

**Notes / Dependencies:** Query params `dateFrom`, `dateTo` on `auditLogQuerySchema`.

---

## TC-172 — Audit logs filter by entity type

**Module:** Admin  
**Feature:** Audit Logs & Security Events  
**Scenario Type:** Positive / UI / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Audit rows with entity `user` and others. `audit.read`.

**Test Data:** Entity filter `user` (UI placeholder: `user, invoice…`)

**Steps to Execute:**
1. Enter entity `user` on `/admin/audit-logs`.
2. Confirm GET includes `entity=user`.
3. Try a non-existent entity `nope`.

**Expected Result:**
1. Table only shows that entity.
2. Query string correct.
3. Empty list, not 500.

**Postconditions:** Clear filter.

**Notes / Dependencies:** Filter is a free string, not an enum.

---

## TC-173 — Audit logs API without audit.read returns 403

**Module:** Admin  
**Feature:** Audit Logs & Security Events  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee (or HR if HR lacks `audit.read` — verify matrix; use employee to be safe).

**Test Data:** `GET /api/audit-logs`

**Steps to Execute:**
1. Login as employee.
2. GET audit-logs.
3. Open `/admin/audit-logs`.

**Expected Result:**
1. Employee session.
2. HTTP 403.
3. ErrorState “You do not have permission…” (`canRead = hasPermission("audit.read")`).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `requirePermission("audit.read")`.

---

## TC-174 — Security events list page

**Module:** Admin  
**Feature:** Audit Logs & Security Events  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:**
- Admin with `security.read`.
- Failed login (TC-007) or 403 to generate events if the monitor is enabled.

**Test Data:** `GET /api/security-events?page=1&pageSize=25`

**Steps to Execute:**
1. Open `/admin/security-events`.
2. Confirm columns: type, severity, user, timestamp.
3. Confirm GET.

**Expected Result:**
1. Page loads.
2. Events show severity badge (`INFO` / `WARN` / `CRITICAL`).
3. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** UI types severity as `INFO | WARN | CRITICAL`.

---

## TC-175 — Security events pagination

**Module:** Admin  
**Feature:** Audit Logs & Security Events  
**Scenario Type:** Pagination  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `security.read`. Enough events or accept single-page.

**Test Data:** `page=2`, `pageSize=25`

**Steps to Execute:**
1. Navigate next/prev on `/admin/security-events`.
2. `GET /api/security-events?page=2&pageSize=25`.

**Expected Result:**
1. Page changes; `meta` consistent.
2. HTTP 200; default pageSize 25 (max 100).

**Postconditions:** None.

**Notes / Dependencies:** Same pagination helper as audit logs.

---

## TC-176 — Security events filter by severity

**Module:** Admin  
**Feature:** Audit Logs & Security Events  
**Scenario Type:** Positive / Validation  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `security.read`. Mix of severities if possible.

**Test Data:**
- Valid: `severity=CRITICAL`
- Invalid compact leftover: `severity=HIGH`

**Steps to Execute:**
1. On the page, filter severity **CRITICAL** (not HIGH).
2. `GET /api/security-events?severity=CRITICAL`.
3. `GET /api/security-events?severity=HIGH`.

**Expected Result:**
1. Only CRITICAL rows.
2. HTTP 200.
3. HTTP 400 `VALIDATION_ERROR` — enum is `INFO` \| `WARN` \| `CRITICAL` only.

**Postconditions:** Clear filter.

**Notes / Dependencies:** Compact case said HIGH — **that value is invalid in this codebase.**

---

## TC-177 — Public careers page lists published jobs

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:** Logged **out**. Seed jobs published.

**Test Data:** None.

**Steps to Execute:**
1. Open `http://localhost:3000/careers` in a private window.
2. Confirm job cards for **Senior Software Engineer** and **HR Coordinator**.
3. Confirm no dashboard chrome.

**Expected Result:**
1. Page is public (no login redirect).
2. PUBLISHED seed jobs visible; DRAFT jobs are not.
3. Apply/view links work.

**Postconditions:** None.

**Notes / Dependencies:** Seed slugs `senior-software-engineer`, `hr-coordinator`.

---

## TC-178 — Careers job detail by slug

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Logged out. Seed job exists.

**Test Data:** `/careers/senior-software-engineer`

**Steps to Execute:**
1. Open the slug URL.
2. Confirm title, description, Apply button.
3. Open `/careers/does-not-exist`.

**Expected Result:**
1. Detail loads.
2. Apply goes to `/careers/senior-software-engineer/apply` (or equivalent).
3. 404 / not-found UI.

**Postconditions:** None.

**Notes / Dependencies:** API `GET /api/careers/jobs/:slug`.

---

## TC-179 — Careers API lists jobs without auth

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** API running. No cookies.

**Test Data:** `GET /api/careers/jobs`

**Steps to Execute:**
1. GET jobs with no auth header/cookie.
2. Inspect statuses in `data`.
3. As HR, create a DRAFT job (TC-189) then repeat GET as guest.

**Expected Result:**
1. HTTP 200.
2. Only `PUBLISHED` jobs.
3. DRAFT job **not** in the public list.

**Postconditions:** None.

**Notes / Dependencies:** `careers.routes.ts` listJobs has **no** `requireAuth`.

---

## TC-180 — Candidate registration via careers

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Logged out. Unique email.

**Test Data:**
```json
{
  "email": "qa.candidate.180@example.com",
  "password": "Candidate@123",
  "firstName": "Casey",
  "lastName": "Candidate"
}
```

**Steps to Execute:**
1. Open `/careers/register`.
2. Submit the form.
3. Confirm `POST /api/careers/register`.
4. Login with the new account; open candidate dashboard / My Applications.

**Expected Result:**
1. Register page public.
2. HTTP 201 (or 200); user created.
3. Role includes `candidate`.
4. Candidate nav visible; HR modules hidden.

**Postconditions:** Save candidate credentials.

**Notes / Dependencies:** `candidateRegisterSchema`: email, password **min 8**, first/last required.

---

## TC-181 — Register with duplicate email fails

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** Email from TC-180 exists.

**Test Data:** Same email, different name.

**Steps to Execute:**
1. `POST /api/careers/register` with the same email.
2. Inspect status/code.

**Expected Result:**
1. HTTP 409 (preferred) or 400 duplicate.
2. No second user row.

**Postconditions:** None.

**Notes / Dependencies:** User.email unique.

---

## TC-182 — Register with invalid email format

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Validation / Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** None.

**Test Data:** `{ "email": "not-an-email", "password": "Candidate@123", "firstName": "A", "lastName": "B" }`

**Steps to Execute:**
1. POST register with invalid email.
2. POST with `password: "short"` (7 chars).
3. POST missing `firstName`.

**Expected Result:**
1. HTTP 400 `VALIDATION_ERROR`.
2. HTTP 400 (min 8).
3. HTTP 400.

**Postconditions:** No user created.

**Notes / Dependencies:** Confirmed Zod schema.

---

## TC-183 — Guest apply to job without login

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Logged out. Published job id from `GET /api/careers/jobs`.

**Test Data:**
```json
{
  "jobPostingId": "<publishedJobId>",
  "firstName": "Guest",
  "lastName": "Applicant",
  "email": "qa.guest.apply@example.com",
  "phone": "9999999999",
  "coverLetter": "I am interested."
}
```

**Steps to Execute:**
1. Open `/careers/<slug>/apply` logged out.
2. Fill identity fields and submit.
3. Confirm `POST /api/careers/apply` (optionalAuth — no cookie required).
4. See confirmation UI.

**Expected Result:**
1. Apply form does not force login (optionalAuth).
2. HTTP 201; application created; candidate record created/linked by email.
3. Confirmation shown.
4. Application status `APPLIED`.

**Postconditions:** Save `applicationId` / guest email.

**Notes / Dependencies:** `applyJobSchema` requires `jobPostingId`; identity fields optional if already a user.

---

## TC-184 — Apply as logged-in candidate

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Candidate from TC-180 logged in. A **second** published job (HR Coordinator) not yet applied to.

**Test Data:** `{ "jobPostingId": "<hrCoordinatorJobId>" }`

**Steps to Execute:**
1. Login as candidate.
2. Apply to the second job (UI or POST apply).
3. `GET /api/recruitment/candidates/me`.

**Expected Result:**
1. Session is candidate.
2. HTTP 201; application linked to that candidate (no extra guest user).
3. `me` profile lists the new application.

**Postconditions:** Application linked.

**Notes / Dependencies:** optionalAuth attaches `req.user` when cookie present.

---

## TC-185 — Duplicate application same candidate+job rejected

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** High  

**Preconditions:** Application from TC-184 exists.

**Test Data:** Same `jobPostingId` as TC-184.

**Steps to Execute:**
1. POST `/api/careers/apply` again as the same candidate.
2. Inspect DB uniqueness `(candidateId, jobPostingId)` if needed.

**Expected Result:**
1. HTTP 409 (unique constraint) or mapped 400.
2. Only one application row.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed unique on applications.

---

## TC-186 — Apply with resume upload

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Candidate logged in **or** guest apply that supports file.
- Storage permission for purpose `RESUME` (candidate/portal mapping).

**Test Data:** Small PDF `resume.pdf`. Purpose `RESUME`.

**Steps to Execute:**
1. On apply form, attach PDF.
2. Capture `POST /api/storage/presign` purpose `RESUME` → PUT → `POST /api/storage/confirm`.
3. Submit apply (and/or `POST /api/recruitment/candidates/me/resume` `{ "fileId": "<id>" }`).
4. As HR, open `/hr/candidates/<id>` and find resume link.

**Expected Result:**
1. File accepted.
2. StoredFile created.
3. Resume linked to candidate.
4. HR can see/download metadata.

**Postconditions:** Resume file stored.

**Notes / Dependencies:** Attach API is `POST /api/recruitment/candidates/me/resume` (`attachResumeSchema.fileId`). Guest apply may only upload if the form implements presign — record if missing.

---

## TC-187 — Apply to unpublished/closed job fails

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** HR creates a **DRAFT** job (TC-189) and notes its id/slug.

**Test Data:** Apply body with DRAFT `jobPostingId`. Guest GET `/api/careers/jobs/<draft-slug>`.

**Steps to Execute:**
1. `GET /api/careers/jobs/<draft-slug>` as guest.
2. `POST /api/careers/apply` with the draft job id.
3. After TC-208, apply to a CLOSED job.

**Expected Result:**
1. HTTP 404.
2. HTTP 404/400 — job not available.
3. Same rejection for CLOSED.

**Postconditions:** None.

**Notes / Dependencies:** Public get uses published-only repository.

---

## TC-188 — Careers page responsive on mobile

**Module:** Public Careers  
**Feature:** Job Listings & Apply  
**Scenario Type:** UI / Responsive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Logged out.

**Test Data:** Viewport 375 × 812.

**Steps to Execute:**
1. Open `/careers` at 375px.
2. Open a job detail and apply form at 375px.

**Expected Result:**
1. Layout usable; no horizontal scroll.
2. Apply CTA reachable; fields not clipped.

**Postconditions:** Restore viewport.

**Notes / Dependencies:** None.

---

## TC-189 — HR creates job posting

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:** HR logged in with `job.create`.

**Test Data:**
- Title: `QA Automation Engineer`
- Description: `Own Playwright suites.`
- Employment type: `Full Time`
- Status: `DRAFT` (form default)

**Steps to Execute:**
1. Open `/hr/jobs`.
2. Create job via FormSheet.
3. Confirm `POST /api/recruitment/jobs`.
4. List shows the job as DRAFT.

**Expected Result:**
1. Page loads.
2. HTTP 201; slug slugified from title (e.g. `qa-automation-engineer`).
3. Permission `job.create`.
4. Job **not** on public `/careers` yet.

**Postconditions:** Save `jobId` + `slug`.

**Notes / Dependencies:** Confirmed HR jobs page default status `DRAFT`. `createJobSchema` requires title + description.

---

## TC-190 — Publish job posting

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** DRAFT `jobId` from TC-189. `job.update`.

**Test Data:** `PATCH /api/recruitment/jobs/<jobId>` `{ "status": "PUBLISHED" }`

**Steps to Execute:**
1. PATCH status PUBLISHED (or UI equivalent).
2. Guest `GET /api/careers/jobs`.
3. Open `/careers/<slug>`.

**Expected Result:**
1. HTTP 200; status PUBLISHED.
2. Job appears in public list.
3. Detail + apply available.

**Postconditions:** Job published.

**Notes / Dependencies:** Status enum `PUBLISHED` (not `OPEN`).

---

## TC-191 — Update job posting fields

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `jobId` exists. `job.update`.

**Test Data:** `{ "title": "QA Automation Engineer II", "location": "Remote" }`

**Steps to Execute:**
1. `PATCH /api/recruitment/jobs/<jobId>`.
2. Refresh `/hr/jobs` and public detail.

**Expected Result:**
1. HTTP 200.
2. Title/location updated. Slug may **remain original** (update schema does not include slug).

**Postconditions:** Job updated.

**Notes / Dependencies:** `updateJobSchema` is partial of create (no slug field).

---

## TC-192 — List jobs with status filter

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Mix of DRAFT and PUBLISHED jobs. `job.read`.

**Test Data:**
- `GET /api/recruitment/jobs?status=DRAFT`
- `GET /api/recruitment/jobs?status=PUBLISHED`
- `GET /api/recruitment/jobs?search=QA`

**Steps to Execute:**
1. Call each query as HR.
2. Confirm UI filter on `/hr/jobs` if present.

**Expected Result:**
1. DRAFT-only / PUBLISHED-only / search match.
2. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** `listJobsQuerySchema` status + search.

---

## TC-193 — HR views candidate list

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** HR with `candidate.read`. Candidates from apply tests exist.

**Test Data:** `/hr/candidates`

**Steps to Execute:**
1. Open `/hr/candidates`.
2. Confirm table (name, email, pipeline status).
3. `GET /api/recruitment/candidates`.

**Expected Result:**
1. Page loads.
2. Applied candidates visible.
3. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** Permission `candidate.read`.

---

## TC-194 — HR views candidate detail

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `candidate.read`. Known `candidateId`.

**Test Data:** `/hr/candidates/<candidateId>`

**Steps to Execute:**
1. Open candidate detail.
2. Confirm profile, applications, resume/LinkedIn if present.
3. `GET /api/recruitment/candidates/<id>`.
4. GET a random id.

**Expected Result:**
1. Detail loads.
2. Applications listed with pipeline status.
3. HTTP 200.
4. HTTP 404.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed candidate `[id]` page.

---

## TC-195 — HR attaches resume to candidate

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive / Gap check  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** HR session. Candidate exists. Storage `RESUME` permission for HR (`candidate.update` / `application.update` mapping).

**Test Data:** PDF file.

**Steps to Execute:**
1. On `/hr/candidates/<id>`, look for resume upload.
2. If only **candidate** can attach: as candidate, `POST /api/recruitment/candidates/me/resume` `{ "fileId" }`.
3. As HR, `POST /api/recruitment/candidates/me/resume` (HR is not that candidate).

**Expected Result:**
1. If UI exists, upload succeeds and file appears.
2. Candidate self-attach HTTP 200; resume on profile.
3. HR calling `/candidates/me/resume` attaches to **HR’s own** candidate profile (likely 404 if HR has no candidate row) — **there is no `/candidates/:id/resume` route**. Record as product gap if HR cannot attach to another candidate.

**Postconditions:** Resume linked on the correct profile.

**Notes / Dependencies:** Confirmed only `POST /candidates/me/resume`.

---

## TC-196 — Recruitment pipeline board displays stages

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** UI / Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** HR with `application.read`. At least one APPLIED application.

**Test Data:** `/hr/pipeline`

**Steps to Execute:**
1. Open `/hr/pipeline`.
2. Confirm columns APPLIED, SCREENING, INTERVIEW, OFFER, HIRED (and REJECTED if shown).
3. Confirm cards match `GET /api/recruitment/pipeline`.

**Expected Result:**
1. Page loads.
2. Columns match `PIPELINE_STAGE_ORDER`.
3. HTTP 200; applications grouped by stage.

**Postconditions:** None.

**Notes / Dependencies:** Frontend `lib/pipeline-stage.ts`.

---

## TC-197 — Move application to next pipeline stage

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Application in `APPLIED`. HR with `application.update`. No override required for adjacent move.

**Test Data:** `PATCH /api/recruitment/applications/<id>/status` `{ "status": "SCREENING" }`

**Steps to Execute:**
1. On pipeline, move card APPLIED → SCREENING (or PATCH).
2. GET application.
3. Confirm candidate list status.

**Expected Result:**
1. HTTP 200.
2. Status `SCREENING`.
3. UI column updated.

**Postconditions:** Application in SCREENING.

**Notes / Dependencies:** Adjacent forward is always allowed (`assertPipelineTransition`).

---

## TC-198 — Invalid pipeline stage transition rejected

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** Application in `APPLIED`. Actor **without** `application.override_stage` (plain HR unless seed grants override). Super Admin **has** override — do **not** use admin for the fail path.

**Test Data:** `{ "status": "INTERVIEW" }` (skip SCREENING)  
Also `{ "status": "HIRED" }` from APPLIED.

**Steps to Execute:**
1. As HR, PATCH APPLIED → INTERVIEW.
2. PATCH APPLIED → APPLIED (no-op).
3. PATCH → REJECTED.
4. As Super Admin, PATCH skip INTERVIEW (control).

**Expected Result:**
1. HTTP 400 `PIPELINE_SKIP_FORBIDDEN`.
2. HTTP 200 (same stage allowed).
3. HTTP 200 (REJECTED always allowed except hired-without-override).
4. Super Admin skip succeeds (`canOverride` true).

**Postconditions:** Record final status; reset if needed.

**Notes / Dependencies:** Confirmed `pipeline-stage.service.ts`.

---

## TC-199 — List applications with filters

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `application.read`. Mixed statuses.

**Test Data:**
- `GET /api/recruitment/applications?status=APPLIED`
- `GET /api/recruitment/applications?jobPostingId=<id>`

**Steps to Execute:**
1. Filter APPLIED.
2. Filter by jobPostingId.
3. Invalid status `FOO`.

**Expected Result:**
1. Only APPLIED.
2. Only that job’s applications.
3. HTTP 400 or empty — `status` query is `z.string().optional()` so FOO may 200 empty. Record actual.

**Postconditions:** None.

**Notes / Dependencies:** `listApplicationsQuerySchema`.

---

## TC-200 — Candidate profile self-service GET candidates/me

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Candidate user logged in (TC-180). Auth only — **no** `candidate.read` required.

**Test Data:** `GET /api/recruitment/candidates/me`

**Steps to Execute:**
1. As candidate, GET me.
2. Confirm applications/resume fields.

**Expected Result:**
1. HTTP 200; own candidate id/email.
2. Does not return other candidates.

**Postconditions:** None.

**Notes / Dependencies:** Route is `requireAuth` only (no permission middleware).

---

## TC-201 — Non-candidate cannot access candidates/me

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Admin or HR logged in (no Candidate row).

**Test Data:** `GET /api/recruitment/candidates/me`

**Steps to Execute:**
1. As admin, GET me.
2. Inspect body.

**Expected Result:**
1. HTTP 404 **or** `data: null` — no candidate profile.
2. Must not create a candidate implicitly.

**Postconditions:** None.

**Notes / Dependencies:** Compact expected 404/empty.

---

## TC-202 — HR list jobs requires job.read

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee without `job.read`.

**Test Data:** `GET /api/recruitment/jobs`

**Steps to Execute:**
1. As employee, GET recruitment jobs.
2. Open `/hr/jobs`.

**Expected Result:**
1. HTTP 403.
2. Nav hidden / page gated.

**Postconditions:** None.

**Notes / Dependencies:** `requirePermission("job.read")`. Public careers GET remains allowed.

---

## TC-203 — Create job without required title fails

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** HR with `job.create`.

**Test Data:** `{ "description": "No title here" }`  
Also `{ "title": "X" }` without description.

**Steps to Execute:**
1. POST job missing title.
2. POST missing description.
3. POST `title` length 201.

**Expected Result:**
1. HTTP 400 (title min 1).
2. HTTP 400 (description min 1).
3. HTTP 400 (max 200).

**Postconditions:** No job created.

**Notes / Dependencies:** Confirmed `createJobSchema`.

---

## TC-204 — Search candidates by name/email

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `candidate.read`. Known candidate email.

**Test Data:** `GET /api/recruitment/candidates?search=<email-or-name>`

**Steps to Execute:**
1. On `/hr/candidates`, search the candidate email/name.
2. Search `zzz-no-match`.

**Expected Result:**
1. Filtered list contains the candidate.
2. EmptyState / zero rows.

**Postconditions:** Clear search.

**Notes / Dependencies:** `listCandidatesQuerySchema.search`.

---

## TC-205 — Application detail view

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `application.read`. Known `applicationId`.

**Test Data:** `GET /api/recruitment/applications/<id>`

**Steps to Execute:**
1. GET application.
2. Confirm candidate + job posting embedded.
3. GET invalid id.

**Expected Result:**
1. HTTP 200.
2. Candidate name/email and job title present.
3. HTTP 404.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed getApplication route.

---

## TC-206 — Pipeline API returns grouped data

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `application.read`.

**Test Data:** `GET /api/recruitment/pipeline`

**Steps to Execute:**
1. GET pipeline as HR.
2. GET as employee.

**Expected Result:**
1. HTTP 200; applications grouped by stage (object or columns array — record shape).
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** `requirePermission("application.read")`.

---

## TC-207 — Job slug uniqueness

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Negative / DB / **Behaviour check**  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `job.create`. Existing job title `QA Automation Engineer` (TC-189) already slugified.

**Test Data:** Second job with the **same title**.

**Steps to Execute:**
1. POST another job with identical title.
2. Inspect slugs.

**Expected Result:**
1. HTTP 201 — **service slugifies and, on collision, appends `-${Date.now()}`**. It does **not** return 409.
2. Two jobs exist; slugs differ. If product requires 409, log as requirement vs implementation gap.

**Postconditions:** Extra job may be CLOSED later.

**Notes / Dependencies:** Confirmed `recruitment.service.ts` `slugify` + timestamp suffix. Compact case expected 409 — **do not fail 201 unless the written rule is uniqueness-by-error.**

---

## TC-208 — Close job posting

**Module:** Recruitment  
**Feature:** Jobs, Candidates, Pipeline  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** PUBLISHED job. `job.update`.

**Test Data:** `PATCH /api/recruitment/jobs/<id>` `{ "status": "CLOSED" }`

**Steps to Execute:**
1. PATCH CLOSED.
2. Guest GET `/api/careers/jobs`.
3. Guest GET by slug.
4. Guest apply.

**Expected Result:**
1. HTTP 200; status CLOSED.
2. Job removed from public list.
3. 404.
4. Apply rejected.

**Postconditions:** Job CLOSED.

**Notes / Dependencies:** Enum value is `CLOSED`.

---

## TC-209 — Schedule interview for application

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Application in `INTERVIEW` (move SCREENING → INTERVIEW first).
- `interview.create`.
- Interviewer user id (HR).

**Test Data:**
```json
{
  "applicationId": "<id>",
  "scheduledAt": "<tomorrow ISO>",
  "durationMinutes": 60,
  "location": "Meet",
  "meetingLink": "https://meet.example.com/qa",
  "notes": "Panel"
}
```

**Steps to Execute:**
1. Move application to INTERVIEW.
2. UI `/hr/interviews` or candidate detail → schedule.
3. Confirm `POST /api/recruitment/interviews`.

**Expected Result:**
1. Adjacent move 200.
2. HTTP 201; status `SCHEDULED`.
3. Appears on interviews list.

**Postconditions:** Save `interviewId`.

**Notes / Dependencies:** `scheduleInterviewSchema`: `scheduledAt` datetime; `meetingLink` url or empty; `durationMinutes` positive int optional. UI field `meetingLink` maps to schema `meetingLink`.

---

## TC-210 — List scheduled interviews

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** Positive / UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `interview.read`. Interview from TC-209.

**Test Data:** `GET /api/hr/interviews` · `/hr/interviews`

**Steps to Execute:**
1. Open `/hr/interviews`.
2. Confirm candidate, time, status badge.
3. GET API.

**Expected Result:**
1. Page loads.
2. Scheduled interview visible.
3. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** List is HR module `GET /api/hr/interviews`, not recruitment GET (there is no GET /recruitment/interviews).

---

## TC-211 — Interview status update

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** Positive / **Gap check**  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** SCHEDULED interview.

**Test Data:** Attempt to mark COMPLETED.

**Steps to Execute:**
1. On `/hr/interviews`, look for Complete/No-show actions.
2. Search API for PATCH interview status.
3. Record actual.

**Expected Result:**
1. **No interview status PATCH route exists** on `recruitment.routes.ts` (POST create only).
2. If UI has no control, mark **blocked / not implemented**.
3. Do not invent a passing Complete flow.

**Postconditions:** Unchanged unless an undocumented endpoint is found.

**Notes / Dependencies:** Prisma enum includes COMPLETED/CANCELLED/NO_SHOW but API does not expose an update.

---

## TC-212 — Assign assessment to candidate

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Application exists. `assessment.create`.

**Test Data:**
```json
{
  "applicationId": "<id>",
  "title": "Take-home coding",
  "description": "Build a REST list endpoint",
  "dueAt": "<ISO + 7d>"
}
```

**Steps to Execute:**
1. `POST /api/recruitment/assessments`.
2. Open candidate detail assessments section.
3. POST missing title.

**Expected Result:**
1. HTTP 201.
2. Assessment listed on the application/candidate.
3. HTTP 400.

**Postconditions:** Assessment created.

**Notes / Dependencies:** Confirmed `assignAssessmentSchema`.

---

## TC-213 — Create offer letter

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Application preferably in `OFFER` stage. `offer.create`.

**Test Data:**
```json
{
  "applicationId": "<id>",
  "salary": 1200000,
  "currency": "INR",
  "startDate": "<ISO>",
  "body": "We are pleased to offer you the role of QA Automation Engineer."
}
```

**Steps to Execute:**
1. Move pipeline to OFFER if needed.
2. `POST /api/recruitment/offers`.
3. Open `/hr/offers`.

**Expected Result:**
1. HTTP 200 on stage move.
2. HTTP 201; offer `DRAFT`; body required min 1.
3. Offer listed.

**Postconditions:** Save `offerId`.

**Notes / Dependencies:** `createOfferSchema`: `body` required; `salary` optional **positive**.

---

## TC-214 — Send offer to candidate

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** DRAFT offer. `offer.update`.

**Test Data:** `POST /api/recruitment/offers/<offerId>/send`

**Steps to Execute:**
1. POST send.
2. GET `/api/hr/offers` / open `/hr/offers`.
3. Candidate dashboard shows offer if implemented.
4. Local env: email may be disabled — do not fail solely on missing inbox.

**Expected Result:**
1. HTTP 200; status `SENT`.
2. List shows SENT.
3. Candidate can see it **or** log UI gap.
4. Notification attempted if templates/SMTP configured.

**Postconditions:** Offer SENT.

**Notes / Dependencies:** Confirmed send route. Prisma `SENT` (not `ISSUED`).

---

## TC-215 — List offers page

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `offer.read`. At least one offer.

**Test Data:** `/hr/offers` · `GET /api/hr/offers`

**Steps to Execute:**
1. Open `/hr/offers`.
2. Use status filter if present.
3. GET API.

**Expected Result:**
1. List with candidate/job/status.
2. Filter works or is absent (record).
3. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** HR offers list, not recruitment GET collection.

---

## TC-216 — Update pre-onboarding checklist item

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:**
- Application moved toward hire so default checklist exists (`DEFAULT_CHECKLIST` in recruitment.service).
- `application.update`.

**Test Data:** `PATCH /api/recruitment/checklist/<itemId>` `{ "completed": true }`

**Steps to Execute:**
1. GET application; copy a checklist item id.
2. PATCH completed true.
3. PATCH `{ "completed": "yes" }`.

**Expected Result:**
1. Checklist items exist after offer/hire path (if not, hire/move until created).
2. HTTP 200; item completed.
3. HTTP 400 (boolean required).

**Postconditions:** Item completed.

**Notes / Dependencies:** `updateChecklistSchema`. Default items include signed offer, background check, ID, deposit, handbook.

---

## TC-217 — Schedule interview without interview.create

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee session. Valid applicationId.

**Test Data:** Same body as TC-209.

**Steps to Execute:**
1. As employee, `POST /api/recruitment/interviews`.
2. Open `/hr/interviews`.

**Expected Result:**
1. HTTP 403.
2. Page/nav hidden.

**Postconditions:** No interview created.

**Notes / Dependencies:** `requirePermission("interview.create")`.

---

## TC-218 — Interview with past date (edge)

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** Edge  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `interview.create`. Application in INTERVIEW.

**Test Data:** `scheduledAt` = yesterday ISO datetime.

**Steps to Execute:**
1. POST interview with past `scheduledAt`.
2. POST with `scheduledAt: "not-a-date"`.
3. POST `meetingLink: "not-a-url"`.

**Expected Result:**
1. **Schema does not require future dates** — HTTP 201 is current behaviour. Record as product gap if past interviews should be blocked.
2. HTTP 400 (datetime).
3. HTTP 400 (url).

**Postconditions:** Past interview may exist.

**Notes / Dependencies:** `z.string().datetime()` only.

---

## TC-219 — Offer with zero salary boundary

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** Boundary / Validation  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `offer.create`. Valid applicationId and body.

**Test Data:**
- `salary: 0`
- `salary: -1`
- omit salary
- `salary: 1`

**Steps to Execute:**
1. POST offer salary 0.
2. POST salary -1.
3. POST without salary.
4. POST salary 1.

**Expected Result:**
1. HTTP 400 (`z.number().positive()` — 0 fails).
2. HTTP 400.
3. HTTP 201 (salary optional).
4. HTTP 201.

**Postconditions:** Offers 3–4 exist or cleanup.

**Notes / Dependencies:** Confirmed createOfferSchema.

---

## TC-220 — Full recruitment E2E: apply → interview → offer

**Module:** Recruitment  
**Feature:** Interviews, Assessments, Offers  
**Scenario Type:** E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Published job. Fresh candidate email. HR + candidate users.

**Test Data:** Unique candidate `qa.e2e.220@example.com`.

**Steps to Execute:**
1. Candidate registers and applies (TC-180/184).
2. HR: APPLIED → SCREENING → INTERVIEW.
3. Schedule interview (TC-209).
4. INTERVIEW → OFFER; create + send offer (TC-213/214).
5. Confirm statuses end-to-end (application OFFER, offer SENT).

**Expected Result:**
1. Application APPLIED.
2. Each adjacent move 200.
3. Interview SCHEDULED.
4. Offer DRAFT then SENT.
5. No 500s; pipeline UI matches API.

**Postconditions:** E2E candidate/application/offer retained for hire tests.

**Notes / Dependencies:** Combines TC-180–214. Do not skip stages without override.

---

## TC-221 — HR dashboard loads

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** HR with `hr.dashboard.read`.

**Test Data:** `/hr/dashboard`

**Steps to Execute:**
1. Open `/hr/dashboard`.
2. Confirm metrics and shortcuts (employees, pipeline, interviews).
3. Confirm `GET /api/hr/dashboard`.

**Expected Result:**
1. Page loads.
2. Widgets visible (headcount, upcoming interviews if seeded).
3. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** Permission `hr.dashboard.read` (not `dashboard.read`).

---

## TC-222 — List employees

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:** HR with `employee.read`. Seed EMP001/EMP002.

**Test Data:** `/hr/employees` · `GET /api/hr/employees`

**Steps to Execute:**
1. Open employees list.
2. Confirm lifecycle badge and department.
3. GET API.

**Expected Result:**
1. Table loads.
2. ACTIVE employees shown with department.
3. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** Seed codes `EMP001`, `EMP002`.

---

## TC-223 — View employee detail

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Positive / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `employee.read`. Known employee id.

**Test Data:** `/hr/employees/<id>` · `GET /api/hr/employees/<id>`

**Steps to Execute:**
1. Open detail.
2. Confirm profile, lifecycle, history section.
3. GET invalid id.

**Expected Result:**
1. Full profile.
2. Lifecycle label from `LIFECYCLE_LABELS`.
3. HTTP 404.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed employees `[id]` page.

---

## TC-224 — Update employee lifecycle state

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** `employee.update`. Employee not TERMINATED (use a test employee).

**Test Data:** `PATCH /api/hr/employees/<id>/lifecycle` `{ "toState": "ACTIVE", "notes": "Confirmed" }`

**Steps to Execute:**
1. PATCH to ONBOARDING (if currently PRE_ONBOARDING) or ACTIVE.
2. GET employee.
3. PATCH `{ "toState": "NOT_A_STATE" }`.

**Expected Result:**
1. HTTP 200.
2. `lifecycleState` updated.
3. HTTP 400 enum validation.

**Postconditions:** Employee in target state.

**Notes / Dependencies:** Schema field is `toState` with enum PRE_ONBOARDING…TERMINATED. Setting TERMINATED also sets `terminatedAt` in service.

---

## TC-225 — Hire candidate converts to employee

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Positive / E2E  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:**
- Application from TC-220 in OFFER (or move to HIRED).
- HR with `application.update` (hire is invoked from recruitment when status → HIRED).

**Test Data:** `PATCH /api/recruitment/applications/<id>/status` `{ "status": "HIRED" }`

**Steps to Execute:**
1. Ensure adjacent path: OFFER → HIRED (not skip).
2. PATCH HIRED.
3. Open `/hr/employees` and `/hr/onboarding`.
4. Confirm `employeeCode` like `EMP###` and link back to candidate.

**Expected Result:**
1. OFFER is allowed next stage.
2. HTTP 200; `hireCandidate` creates Employee + user employee linkage.
3. New employee visible; onboarding list may show PRE_ONBOARDING/ONBOARDING.
4. Candidate application HIRED; employeeCode allocated if missing.

**Postconditions:** New employee exists. Save `employeeId`.

**Notes / Dependencies:** Confirmed `recruitment.service` calls `hrService.hireCandidate` on HIRED. Onboarding page also PATCHes lifecycle.

---

## TC-226 — Invalid lifecycle transition rejected

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Negative / **Gap check**  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee in `TERMINATED` (use a disposable hire, then PATCH TERMINATED). `employee.update`.

**Test Data:** PATCH `{ "toState": "ACTIVE" }` from TERMINATED.

**Steps to Execute:**
1. PATCH TERMINATED.
2. PATCH back to ACTIVE.
3. Record status codes.

**Expected Result:**
1. HTTP 200; `terminatedAt` set.
2. **Service does not validate legal paths** — it writes `toState` directly. HTTP 200 means **no server-side transition engine**. Log as gap vs compact expectation HTTP 400.
3. If UI hides illegal moves, still verify API.

**Postconditions:** Restore or leave terminated.

**Notes / Dependencies:** `hr.service.updateLifecycleState` has no transition matrix.

---

## TC-227 — Employee search/filter on list page

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `employee.read`. Multiple employees.

**Test Data:** Search name; filter department if UI exists. API query per `listEmployeesQuerySchema`.

**Steps to Execute:**
1. On `/hr/employees`, search a known name.
2. Filter by department if present.
3. Search no-match.

**Expected Result:**
1. Filtered rows.
2. Department filter works.
3. Empty list.

**Postconditions:** Clear filters.

**Notes / Dependencies:** Confirm query params on GET `/api/hr/employees`.

---

## TC-228 — HR interviews list (HR module)

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `interview.read`.

**Test Data:** `GET /api/hr/interviews` optional `from`/`to`.

**Steps to Execute:**
1. GET interviews as HR.
2. GET as employee.

**Expected Result:**
1. HTTP 200; includes TC-209 interview.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Distinct from recruitment POST.

---

## TC-229 — HR offers list API

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `offer.read`.

**Test Data:** `GET /api/hr/offers`

**Steps to Execute:**
1. GET as HR.
2. GET as employee.

**Expected Result:**
1. HTTP 200; includes sent/draft offers.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** `requirePermission("offer.read")`.

---

## TC-230 — Employee without employee.read cannot list employees

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee role without `employee.read`.

**Test Data:** `GET /api/hr/employees`

**Steps to Execute:**
1. As employee, GET employees.
2. Open `/hr/employees`.
3. `GET /api/hr/employees/<own-employee-id>` if they have a master record.

**Expected Result:**
1. HTTP 403.
2. Nav hidden / ErrorState.
3. Likely 403 unless a self-or-permission helper exists on this route (HR getById uses `employee.read` only).

**Postconditions:** None.

**Notes / Dependencies:** List + get both require `employee.read`.

---

## TC-231 — Lifecycle update writes EmployeeLifecycleEvent

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** DB / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** TC-224 performed. `employee.read`.

**Test Data:** Employee detail history UI / GET employee payload.

**Steps to Execute:**
1. PATCH lifecycle with notes.
2. Open employee detail history.
3. Confirm event `fromState`, `toState`, `changedById`, notes.

**Expected Result:**
1. HTTP 200.
2. New history row.
3. Matches previous and new state; actor is HR user.

**Postconditions:** Event persisted.

**Notes / Dependencies:** `createLifecycleEvent` in hr.service. Also writes audit `lifecycle_change`.

---

## TC-232 — Employee detail shows linked user account

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Positive / UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Seed HR employee linked to `hr@workforce360.com`.

**Test Data:** `/hr/employees/<hrEmployeeId>`

**Steps to Execute:**
1. Open HR’s employee record.
2. Confirm email/name of the user account.

**Expected Result:**
1. Detail loads.
2. User email/name displayed (not only employeeCode).

**Postconditions:** None.

**Notes / Dependencies:** Employee.user relation.

---

## TC-233 — Onboarding page lists pending hires

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** UI  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Hired employee in PRE_ONBOARDING/ONBOARDING (TC-225). `employee.read` / `employee.update`.

**Test Data:** `/hr/onboarding`

**Steps to Execute:**
1. Open `/hr/onboarding`.
2. Confirm new hire listed with lifecycle badge.
3. Change lifecycle via the page control.

**Expected Result:**
1. Page loads.
2. Pending hires shown (not only ACTIVE).
3. PATCH lifecycle succeeds.

**Postconditions:** Lifecycle may change to ONBOARDING/ACTIVE.

**Notes / Dependencies:** Nav `/hr/onboarding`.

---

## TC-234 — Employee code format EMP###

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Validation  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `employee.read`. Seed + hired employees.

**Test Data:** List codes.

**Steps to Execute:**
1. GET `/api/hr/employees`.
2. Check `employeeCode` / user `employeeId` pattern `EMP` + digits (EMP001, EMP002, …).

**Expected Result:**
1. HTTP 200.
2. Codes match `EMP###` (3+ digits). New hires get next sequence.

**Postconditions:** None.

**Notes / Dependencies:** Seed `EMP001`/`EMP002`; `allocateNextEmployeeId()`.

---

## TC-235 — Duplicate employee code rejected

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** High  

**Preconditions:** Admin/HR cannot freely POST employeeCode if hire always allocates.

**Test Data:** Attempt to create employee with `employeeCode: "EMP001"` if a create-employee API exists.

**Steps to Execute:**
1. Search for `POST /api/hr/employees`.
2. If none, attempt user create with `employeeId: "EMP001"`.
3. Record result.

**Expected Result:**
1. **There is no general POST /api/hr/employees** on `hr.routes.ts` (list/get/lifecycle only). Hire path allocates codes.
2. Duplicate `employeeId` on users → 409/400.
3. Unique `Employee.employeeCode` would 409 if a raw insert were possible.

**Postconditions:** None.

**Notes / Dependencies:** Compact assumed a create-employee API — **not present**. Test uniqueness via user.employeeId or hire only.

---

## TC-236 — Employee soft delete / terminated not in active list

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** DB / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Disposable employee. `employee.update` + `employee.read`.

**Test Data:** PATCH `{ "toState": "TERMINATED" }`

**Steps to Execute:**
1. Terminate test employee.
2. GET `/api/hr/employees` default list.
3. GET `/api/dashboard/employees`.
4. GET employee by id.

**Expected Result:**
1. HTTP 200; terminatedAt set.
2. Default list **should** hide TERMINATED — **verify**. If still listed, log filter gap.
3. Active dashboard list should exclude them.
4. Detail still 200 (not hard-deleted).

**Postconditions:** Employee TERMINATED.

**Notes / Dependencies:** Soft delete of User is a different API (`DELETE /api/users`). This case is lifecycle terminate.

---

## TC-237 — HR dashboard API

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `hr.dashboard.read`.

**Test Data:** `GET /api/hr/dashboard`

**Steps to Execute:**
1. GET as HR.
2. GET as finance/employee.

**Expected Result:**
1. HTTP 200; KPI payload (counts, upcoming interviews).
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Distinct from `GET /api/dashboard`.

---

## TC-238 — Developer sees scoped employee list only

**Module:** HR Operations  
**Feature:** Employees & Lifecycle  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Create user with role `developer` **and** `employee.read` (developers may not have it by default — grant for this test).
- Developer is a member of Team A with 2 peers; other employees exist outside the team.

**Test Data:** Developer session `GET /api/hr/employees`

**Steps to Execute:**
1. Login as developer.
2. GET employees.
3. GET an out-of-team employee id.

**Expected Result:**
1. Session ok.
2. Only self + team peers/leads (`TEAM_SCOPED_ROLE_CODES` includes `developer`).
3. HTTP 403/404 for outsiders.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `employee-scope.ts`. Super Admin/Admin/HR are unscoped. If developer lacks `employee.read`, GET is 403 before scoping — grant the permission for a valid scope test.

---

## TC-239 — Create HR policy

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** HR with `policy.create`.

**Test Data:**
```json
{
  "title": "QA Code of Conduct",
  "body": "Be excellent to each other.",
  "version": "1.0"
}
```

**Steps to Execute:**
1. Open `/hr/policies`.
2. Create policy.
3. Confirm `POST /api/hr/policies`.

**Expected Result:**
1. Page loads.
2. HTTP 201; status `DRAFT`.
3. Listed as draft.

**Postconditions:** Save `policyId` / `familyId`.

**Notes / Dependencies:** `createPolicySchema`: title required; `body` optional in Zod (UI may still require it).

---

## TC-240 — Publish policy

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** DRAFT policy. `policy.update`.

**Test Data:** `POST /api/hr/policies/<policyId>/publish`

**Steps to Execute:**
1. Publish via UI or POST.
2. GET policy.
3. Employee `/portal/policies` **before** assignment (TC-242) — may still be hidden.

**Expected Result:**
1. HTTP 200; status `PUBLISHED`.
2. GET shows PUBLISHED.
3. Portal list follows assignment rules (ALL/USER/DEPT/TEAM).

**Postconditions:** Policy published.

**Notes / Dependencies:** Publish permission is `policy.update`.

---

## TC-241 — Create new policy version

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Published policy. `policy.create` on versions route.

**Test Data:** `POST /api/hr/policies/<policyId>/versions` (body per service — often copies family).

**Steps to Execute:**
1. POST versions.
2. GET policies; confirm version increment (1.0 → 1.1 or v2).
3. Confirm previous version link/`previousVersionId` if returned.

**Expected Result:**
1. HTTP 201/200; new DRAFT version in same family.
2. Version number incremented.
3. Chain linked (TC-247).

**Postconditions:** Save `policyIdV2`.

**Notes / Dependencies:** `requirePermission("policy.create")` on versions.

---

## TC-242 — Assign policy to department

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** High  

**Preconditions:** Published policy `familyId`. HR department id. `policy.update`.

**Test Data:**
```json
{
  "familyId": "<familyId>",
  "targetType": "DEPARTMENT",
  "departmentId": "<hrDepartmentId>"
}
```

**Steps to Execute:**
1. `POST /api/hr/policy-assignments`.
2. `GET /api/hr/policy-families/<familyId>/assignments`.
3. POST `targetType: "DEPT"` (invalid).
4. POST DEPARTMENT without `departmentId`.

**Expected Result:**
1. HTTP 201; assignment created.
2. Assignment listed.
3. HTTP 400 (enum `ALL` \| `USER` \| `DEPARTMENT` \| `TEAM` — not `DEPT`).
4. HTTP 400/422 if service requires departmentId.

**Postconditions:** Assignment active.

**Notes / Dependencies:** Compact said DEPT — **code uses DEPARTMENT**.

---

## TC-243 — Employee acknowledges policy from portal

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Policy PUBLISHED and assigned to employee’s department **or** `ALL`.
- Employee with `portal.read`.
- Prefer HR user if assigned to HR dept; else use hired employee.

**Test Data:** `/portal/policies` · `POST /api/portal/policies/<policyId>/acknowledge`

**Steps to Execute:**
1. Login as assigned employee.
2. Open `/portal/policies`; click Acknowledge.
3. Confirm POST acknowledge.
4. Refresh; button disabled / acknowledged date shown.

**Expected Result:**
1. Policy listed (`acknowledged: false`).
2. HTTP 200; `acknowledgedAt` set.
3. POST used.
4. UI shows acknowledged.

**Postconditions:** Acknowledgement row exists.

**Notes / Dependencies:** Portal permission `portal.read`. Unassigned users get 403 `You are not assigned to this policy`.

---

## TC-244 — View policy acknowledgements (HR)

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `policy.read`. TC-243 done.

**Test Data:** `GET /api/hr/policies/<policyId>/acknowledgements`

**Steps to Execute:**
1. GET acknowledgements as HR.
2. Confirm the employee appears.
3. GET as employee.

**Expected Result:**
1. HTTP 200; list includes userId + timestamp.
2. Matches portal ack.
3. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed route.

---

## TC-245 — Cannot acknowledge unpublished policy

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** DRAFT policy id (create extra, do not publish). Employee with `portal.read`.

**Test Data:** `POST /api/portal/policies/<draftId>/acknowledge`

**Steps to Execute:**
1. As employee, acknowledge DRAFT id.
2. Inspect code/message.

**Expected Result:**
1. HTTP **404** `POLICY_NOT_FOUND` (“Published policy not found”) — **not** necessarily 400.
2. No acknowledgement row.

**Postconditions:** None.

**Notes / Dependencies:** `policy.service.acknowledgePolicy` checks `status !== "PUBLISHED"` → 404.

---

## TC-246 — Duplicate acknowledgement prevented

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** Negative / DB  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Employee already acknowledged (TC-243).

**Test Data:** Second POST acknowledge.

**Steps to Execute:**
1. POST acknowledge again.
2. GET acknowledgements count for that user+policy.

**Expected Result:**
1. HTTP 200 returning the **existing** acknowledgement (service returns `existing` if found) — **not 409**.
2. Still **one** row (unique policyId+userId). If product required 409, log spec vs implementation.

**Postconditions:** Single ack.

**Notes / Dependencies:** Confirmed `if (existing) return existing`. Compact expected 409.

---

## TC-247 — Policy version chain integrity

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** DB  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** v1 published, v2 created (TC-241).

**Test Data:** GET both policy ids.

**Steps to Execute:**
1. GET v1 and v2.
2. Confirm `familyId` shared.
3. Confirm previousVersionId / version number ordering.

**Expected Result:**
1. HTTP 200 both.
2. Same family.
3. v2 points at v1 (or equivalent chain fields). If fields absent in JSON, inspect DB.

**Postconditions:** None.

**Notes / Dependencies:** Policy versioning in policy.service.

---

## TC-248 — Upload policy document file

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** `policy.create`/`policy.update`. Storage purpose `POLICY` (HR `policy.create` / `policy.update` in storage-rbac).

**Test Data:** PDF `conduct.pdf`. Presign purpose `POLICY`. Then create/update policy with `fileId`.

**Steps to Execute:**
1. Presign + PUT + confirm purpose POLICY.
2. POST/PUT policy with `fileId`.
3. Open policy in HR UI; confirm attachment.

**Expected Result:**
1. StoredFile created.
2. HTTP 201/200; file linked.
3. Download/metadata visible to HR.

**Postconditions:** File linked.

**Notes / Dependencies:** `createPolicySchema.fileId` optional. Purpose enum `POLICY`.

---

## TC-249 — Policy list filter by status

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** UI  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Mix of DRAFT and PUBLISHED. `policy.read`.

**Test Data:** `GET /api/hr/policies` + query if `listPoliciesQuerySchema` supports status.

**Steps to Execute:**
1. Open `/hr/policies`.
2. Filter DRAFT vs PUBLISHED if UI exists.
3. API filter if documented.

**Expected Result:**
1. List loads.
2. Filter shows the correct subset.
3. HTTP 200.

**Postconditions:** None.

**Notes / Dependencies:** Confirm query schema on listPolicies.

---

## TC-250 — Employee sees only assigned policies in portal

**Module:** HR Operations  
**Feature:** Policies & Acknowledgements  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:**
- Policy A assigned ALL or employee’s DEPARTMENT.
- Policy B assigned to a **different** department/user.
- Both PUBLISHED.
- Employee with `portal.read`.

**Test Data:** `GET /api/portal/policies` as that employee.

**Steps to Execute:**
1. GET portal policies as employee.
2. Confirm A listed, B not.
3. POST acknowledge on B’s id.

**Expected Result:**
1. HTTP 200.
2. Only assigned (and published) policies.
3. HTTP 403 not assigned.

**Postconditions:** None.

**Notes / Dependencies:** `listPublishedForUser` + assignment matchers (ALL/USER/DEPARTMENT/TEAM).

---

## Coverage recap (this file)

| Range | Count | Focus |
|-------|-------|--------|
| TC-151 – TC-158 | 8 | Admin dashboard & search |
| TC-159 – TC-168 | 10 | Settings, templates, integrations, master data |
| TC-169 – TC-176 | 8 | Audit logs & security events |
| TC-177 – TC-188 | 12 | Public careers |
| TC-189 – TC-208 | 20 | Jobs, candidates, pipeline |
| TC-209 – TC-220 | 12 | Interviews, assessments, offers, E2E |
| TC-221 – TC-238 | 18 | HR employees & lifecycle |
| TC-239 – TC-250 | 12 | Policies & acknowledgements |
| **Total** | **100** | TC-151 through TC-250, no skipped IDs |

**Implementation notes (do not treat as silent passes):**
- Security filter value is `CRITICAL`, not `HIGH` (TC-176).
- Duplicate job title does **not** 409; slug gets a timestamp suffix (TC-207).
- No interview status PATCH API (TC-211).
- No `POST /api/hr/employees`; hire is via application → `HIRED` (TC-225, TC-235).
- Lifecycle API does **not** block TERMINATED → ACTIVE (TC-226).
- Policy assignment enum is `DEPARTMENT`, not `DEPT` (TC-242).
- Duplicate policy ack returns existing row, not 409 (TC-246).
- Unpublished ack is 404 `POLICY_NOT_FOUND` (TC-245).
- Resume attach for others is only `/candidates/me/resume` (TC-195).
