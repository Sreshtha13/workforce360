# Test Cases TC-071 to TC-150 — Detailed Executable Cases

**Scope:** Roles & permissions, permission enforcement, user CRUD/sessions, organization master data  
**Base URLs:** Web `http://localhost:3000` · API `http://localhost:4000`  
**Auth:** Login via UI or `POST /api/auth/login` (httpOnly cookies)  
**Envelope:** `{ data, error, meta }`  

**Seed users:**
| Role code | Email | Password |
|-----------|-------|----------|
| `super_admin` | `admin@workforce360.com` | `Admin@123` |
| `hr` | `hr@workforce360.com` | `Hr@123456` |
| `finance` | `finance@workforce360.com` | `Finance@123` |
| `payroll` | `payroll@workforce360.com` | `Payroll@123` |

Create an **employee** (role `employee`) and a **developer** (role `developer`, on a team) for 403 / scope cases. There is no dedicated BD/PM seed user — use employee for “no module permission” tests.

**Confirmed facts:**
- System roles (`isSystem: true`): `super_admin`, `admin`, `hr`, `employee`, `candidate`, `developer`, `finance`, `payroll`. Cannot rename/recode/delete. Super Admin **only** may change their permission sets. `requiresMfa` is the only field a system-role PUT may change.
- **Administrator (`admin`) is denied** `role.create/update/delete` and `permission.create/update/delete` (`ADMIN_DENIED_PERMISSIONS`). Custom role **create** is Super Admin (or a custom role granted `role.create`).
- List roles: `GET /api/roles` (`role.read` **or** create/update/delete).
- All permissions: `GET /api/roles/permissions/all`
- Duplicate role: `POST /api/roles/:id/duplicate` `{ name?, code? }`
- Bulk permissions: `PUT /api/roles/:id/permissions/bulk` `{ permissionIds: string[] }` min 1
- Next employee id: `GET /api/users/next-employee-id` (`user.create`)
- Revoke sessions: `POST /api/users/:id/revoke-sessions` (`user.update`)
- Next designation code: `GET /api/organization/designations/next-code?departmentId=`
- Designation `level` 1–5 required; `headcount` optional **min 1** (0 is invalid)
- Department/office **create requires `companyId`**
- Employee types seed: `FT`, `PT`, `CNT`, `INT`
- Employment statuses seed: `active`, `probation`, `on_leave`, `notice`, `suspended`, `terminated`
- Invoice approve: `POST /api/finance/invoices/:id/approve` (`invoice.approve`)
- Storage: `POST /api/storage/presign` purpose `RESUME` (not `RESUME` vs compact `RESUME` — actual **`RESUME`**)
- Reports export: `GET /api/reports/<TYPE>/export?format=csv` types `ATTENDANCE` \| `LEAVE` \| …
- Settings: `PUT /api/settings` (`settings.manage`)
- Headcount is **display metrics** (`vacantPositions`); **not enforced** on user assign

---

## TC-071 — Super Admin can list all roles

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Positive / API  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Logged in as `admin@workforce360.com` (`super_admin`). Has `role.read` (all permissions).

**Test Data:** `GET /api/roles`

**Steps to Execute:**
1. `GET /api/roles` with Super Admin cookies.
2. Inspect `data` array `code` values.
3. Repeat as employee (no role.read).

**Expected Result:**
1. HTTP 200.
2. Codes include `super_admin`, `admin`, `hr`, `employee`, `finance`, `payroll`, `developer`, `candidate`. Each has `isSystem: true` for seed roles.
3. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Seed `SYSTEM_ROLE_CODES`. Compact listed these eight.

---

## TC-072 — Super Admin creates custom role with permissions

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Super Admin. Permission `report.read` id from `GET /api/roles/permissions/all`.

**Test Data:**
```json
{ "name": "QA Tester", "code": "qa_tester", "description": "QA custom role" }
```
Then assign `report.read`.

**Steps to Execute:**
1. Open `/admin/roles`; create role (FormSheet).
2. Confirm `POST /api/roles` (`role.create`).
3. `POST /api/roles/<id>/permissions` `{ "permissionId": "<report.read id>" }` **or** bulk PUT.
4. `GET /api/roles/<id>/permissions`.
5. As **Administrator (`admin`)** user, `POST /api/roles` (control).

**Expected Result:**
1. UI succeeds.
2. HTTP 201; `isSystem: false` (service forces this).
3. HTTP 200/201.
4. Includes `report.read`.
5. HTTP **403** — `admin` is denied `role.create`. Compact said “Admin can create” — **only Super Admin / granted custom roles**.

**Postconditions:** Save `customRoleId`.

**Notes / Dependencies:** `createRoleSchema`: name required; code optional max 50.

---

## TC-073 — Non-admin cannot create role (403)

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Security / Negative / API  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:** Employee logged in (no `role.create`).

**Test Data:** Valid create body `{ "name": "Hacker Role", "code": "hacker" }`

**Steps to Execute:**
1. `POST /api/roles`.
2. Admin checks `/admin/security-events` (optional, TC-106).

**Expected Result:**
1. HTTP 403 FORBIDDEN.
2. No new role. Security event may be recorded.

**Postconditions:** None.

**Notes / Dependencies:** `requirePermission("role.create")`.

---

## TC-074 — Cannot delete system role

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Negative / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Super Admin. `super_admin` role id from GET /api/roles.

**Test Data:** `DELETE /api/roles/<superAdminRoleId>`

**Steps to Execute:**
1. DELETE super_admin role.
2. DELETE `hr` system role.
3. DELETE the custom role from TC-072 (control — should work).

**Expected Result:**
1. HTTP **403** `SYSTEM_ROLE_LOCKED` (“System roles cannot be deleted.”).
2. Same 403.
3. HTTP 200; custom role gone. Recreate if needed for later tests.

**Postconditions:** System roles unchanged.

**Notes / Dependencies:** Compact 400/403 — actual **403**. Field is `isSystem` not `isSystem` vs compact `isSystem`.

---

## TC-075 — Duplicate role code rejected

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Negative / Validation  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Super Admin. Code `admin` exists.

**Test Data:** `{ "name": "Another Admin", "code": "admin" }`

**Steps to Execute:**
1. `POST /api/roles` with code `admin`.
2. Inspect status/code.

**Expected Result:**
1. HTTP 409 unique **or** 400 mapped duplicate — record actual. No second `admin` row.

**Postconditions:** None.

**Notes / Dependencies:** Unique on `Role.code`.

---

## TC-076 — Bulk set role permissions replaces the set

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Custom role with at least one permission. Super Admin (`role.update`). Three permission ids.

**Test Data:** `PUT /api/roles/<customRoleId>/permissions/bulk` `{ "permissionIds": ["<id1>","<id2>","<id3>"] }`

**Steps to Execute:**
1. GET current permissions.
2. PUT bulk with a **different** trio.
3. GET permissions again.
4. PUT `{ "permissionIds": [] }`.

**Expected Result:**
1. Baseline.
2. HTTP 200.
3. Exactly those three; previous removed.
4. HTTP 400 (min 1).

**Postconditions:** Custom role has the three permissions.

**Notes / Dependencies:** Compact path matches. Schema `permissionIds` min 1.

---

## TC-077 — Duplicate role creates copy with new code

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Super Admin. Source role `hr` id. `role.create`.

**Test Data:** `POST /api/roles/<hrId>/duplicate` `{ "code": "hr_copy", "name": "HR Copy" }`

**Steps to Execute:**
1. POST duplicate.
2. GET new role permissions vs HR.
3. Confirm `isSystem: false` on copy.

**Expected Result:**
1. HTTP 201; new id; code `hr_copy`.
2. Permission set matches source.
3. Copy is custom (deletable).

**Postconditions:** Save copy id; delete after suite if desired.

**Notes / Dependencies:** `duplicateRoleSchema` name/code optional (service may auto-code).

---

## TC-078 — List all permissions (admin)

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Super Admin or user with `permission.read` / `role.update`.

**Test Data:** `GET /api/roles/permissions/all`

**Steps to Execute:**
1. GET permissions/all.
2. As employee.

**Expected Result:**
1. HTTP 200; 80+ items with `code`, `module`, `feature`, `resource`, `action`.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Compact path matches. `canReadPermissions` OR-list includes `role.update`.

---

## TC-079 — Create custom permission (Super Admin)

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Super Admin (`permission.create`). Administrator control user.

**Test Data:**
```json
{
  "name": "Custom Test Read",
  "code": "custom.test",
  "module": "test",
  "feature": "test",
  "resource": "test",
  "action": "read"
}
```

**Steps to Execute:**
1. `POST /api/roles/permissions`.
2. GET `/api/roles/permissions/all` includes `custom.test`.
3. As `admin` role, POST another permission.

**Expected Result:**
1. HTTP 201.
2. Listed.
3. HTTP 403 (`permission.create` denied for Administrator).

**Postconditions:** Save `customPermissionId`.

**Notes / Dependencies:** All of name, code, module, feature, resource, action required.

---

## TC-080 — Permission matrix UI reflects role changes

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** UI / Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Super Admin. Custom role. `/admin/roles`

**Test Data:** Toggle `report.read` (or similar) in PermissionMatrix; save.

**Steps to Execute:**
1. Open role edit; change checkboxes; save (bulk PUT).
2. Close and reopen the role.
3. GET `/api/roles/:id/permissions`.

**Expected Result:**
1. Save HTTP 200.
2. Checkmarks match the save.
3. API matches UI.

**Postconditions:** Role permissions as saved.

**Notes / Dependencies:** None.

---

## TC-081 — Administrator cannot create permissions or edit system-role permissions

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** User with system role **`admin`** (not super_admin). If no seed admin user, create one and assign `admin` only.

**Test Data:** Create-permission body (TC-079). `POST /api/roles/<super_admin id>/permissions` with any permissionId.

**Steps to Execute:**
1. POST `/api/roles/permissions`.
2. POST permission onto `super_admin` or `hr` system role.
3. PUT `/api/roles/<hrId>` `{ "name": "HR Renamed" }`.

**Expected Result:**
1. HTTP 403 `permission.create`.
2. HTTP 403 `SYSTEM_ROLE_PERMISSIONS_FORBIDDEN` **or** 403 `role.update`.
3. HTTP 403 `role.update` (Administrator denied) **and/or** `SYSTEM_ROLE_LOCKED` for Super Admin renaming.

**Postconditions:** System roles unchanged.

**Notes / Dependencies:** `ADMIN_DENIED_PERMISSIONS` + `assertCanEditRolePermissions`.

---

## TC-082 — Update role name and description

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Positive / Negative  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Super Admin. Custom role id.

**Test Data:** `PUT /api/roles/<customId>` `{ "name": "QA Tester Updated", "description": "Updated" }`  
Control: PUT `{ "name": "Nope" }` on `hr`.

**Steps to Execute:**
1. PUT custom role name.
2. GET role.
3. PUT system role name.

**Expected Result:**
1. HTTP 200.
2. Name/description updated.
3. HTTP 403 `SYSTEM_ROLE_LOCKED`.

**Postconditions:** Custom role renamed.

**Notes / Dependencies:** System roles block name/code; `requiresMfa` only exception.

---

## TC-083 — Remove permission from role

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Custom role has `report.read`. Super Admin `role.update`. A user assigned that role (optional for “next request” check).

**Test Data:** `DELETE /api/roles/<id>/permissions` `{ "permissionId": "<report.read>" }`

**Steps to Execute:**
1. DELETE permission from custom role.
2. GET role permissions — gone.
3. If a user has only that role, their next `GET /api/reports/...` is 403 without re-login (TC-105).

**Expected Result:**
1. HTTP 200.
2. Permission absent.
3. Enforcement is per-request from DB.

**Postconditions:** Permission removed.

**Notes / Dependencies:** Body `{ permissionId }` required.

---

## TC-084 — Assign permission to role

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Super Admin. Custom role. A permission id not yet on the role.

**Test Data:** `POST /api/roles/<id>/permissions` `{ "permissionId": "<id>" }`

**Steps to Execute:**
1. POST assign.
2. POST same permission again (duplicate).
3. POST invalid permissionId.

**Expected Result:**
1. HTTP 200/201.
2. HTTP 400 already assigned **or** 200 idempotent — record.
3. HTTP 404 `PERMISSION_NOT_FOUND`.

**Postconditions:** Permission on role.

**Notes / Dependencies:** None.

---

## TC-085 — Permissions page lists all permissions with filters

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Super Admin. `/admin/permissions`

**Test Data:** Table columns code, module, feature, resource, action.

**Steps to Execute:**
1. Open `/admin/permissions`.
2. Filter/search if UI provides module/feature filters.
3. Compare row count to GET `/api/roles/permissions/all`.

**Expected Result:**
1. Table loads with those columns.
2. Filters work or N/A.
3. Counts match.

**Postconditions:** None.

**Notes / Dependencies:** Nav `/admin/permissions`.

---

## TC-086 — Delete custom permission not assigned to roles

**Module:** RBAC  
**Feature:** Roles & Permissions  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Super Admin `permission.delete`. Unused permission (create via TC-079 clone with unique code).

**Test Data:** `DELETE /api/roles/permissions/<id>`

**Steps to Execute:**
1. DELETE unused permission.
2. GET `/api/roles/permissions/all` — absent.
3. DELETE a permission still assigned to a role (optional) — record 400 vs 200 cascade.

**Expected Result:**
1. HTTP 200; soft-delete if implemented.
2. Not listed.
3. Document FK behaviour.

**Postconditions:** Unused permission gone.

**Notes / Dependencies:** Compact expected soft-delete.

---

## TC-087 — Employee cannot list users

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / API  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:** Employee (permissions ≈ `portal.read/update`, `ticket.create` only).

**Test Data:** `GET /api/users`

**Steps to Execute:**
1. GET `/api/users`.
2. Open `/admin/users`.

**Expected Result:**
1. HTTP 403.
2. Page gated / nav hidden.

**Postconditions:** None.

**Notes / Dependencies:** `user.read` required. `EMPLOYEE_PERMISSIONS` has no user.read.

---

## TC-088 — HR can list HR employees

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** `hr@workforce360.com` (`employee.read`).

**Test Data:** `GET /api/hr/employees`

**Steps to Execute:**
1. GET `/api/hr/employees`.
2. Confirm array of employees (unscoped for HR).

**Expected Result:**
1. HTTP 200.
2. Organization-wide list (HR in `UNSCOPED_VISIBILITY_ROLE_CODES`).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-089 — Finance cannot access payroll runs

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** `finance@workforce360.com`. Finance resources exclude payroll_run.

**Test Data:** `GET /api/payroll/runs`

**Steps to Execute:**
1. GET payroll runs as finance.
2. Open `/payroll/runs`.

**Expected Result:**
1. HTTP 403 (`payroll_run.read` missing).
2. Nav hidden.

**Postconditions:** None.

**Notes / Dependencies:** `FINANCE_RESOURCES` vs `PAYROLL_RESOURCES`.

---

## TC-090 — Payroll cannot approve invoices

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** Payroll user. A PENDING_APPROVAL invoice id (or any id).

**Test Data:** `POST /api/finance/invoices/<id>/approve` `{ "notes": "nope" }`  
Compact path `/approve` matches. **Not** a fictional `/invoices/:id/approve` variant.

**Steps to Execute:**
1. As payroll, POST approve.
2. GET `/api/finance/invoices` as payroll.

**Expected Result:**
1. HTTP 403 (`invoice.approve` missing).
2. HTTP 403 (`invoice.read` missing).

**Postconditions:** Invoice unchanged.

**Notes / Dependencies:** Actual approve path `/api/finance/invoices/:id/approve`.

---

## TC-091 — Direct URL to restricted admin page

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / UI / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee logged in.

**Test Data:** `/admin/users`

**Steps to Execute:**
1. Paste `/admin/users` in the browser.
2. Inspect DOM/network for user PII.

**Expected Result:**
1. RequirePermission / error state — **no user table data**.
2. `GET /api/users` 403; page does not render names/emails.

**Postconditions:** None.

**Notes / Dependencies:** Compact `/admin/users`.

---

## TC-092 — Hidden nav for unauthorized modules

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** UI / Security  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Finance logged in.

**Test Data:** Sidebar.

**Steps to Execute:**
1. Inspect nav groups.
2. Confirm BD (`/bd/*`), PM (`/pm/*`), Engineering (`/engineering/*`) absent.
3. Confirm Finance group present.

**Expected Result:**
1. `filterNavByPermissions` hides groups without any matching permission.
2. No BD/PM/Engineering.
3. Clients/invoices/payments visible.

**Postconditions:** None.

**Notes / Dependencies:** `navigation.ts`.

---

## TC-093 — Developer sees team-scoped employees only

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Developer user with `employee.read` / `user.read` (seed developer has both). Member of Team A with 2 peers; other employees exist outside the team.

**Test Data:** `GET /api/hr/employees` and/or `GET /api/users`

**Steps to Execute:**
1. Login as developer.
2. GET employees/users.
3. GET an out-of-team employee/user id.

**Expected Result:**
1. Session ok.
2. Only self + team peers/leads (`TEAM_SCOPED_ROLE_CODES` includes `developer`).
3. HTTP 403/404.

**Postconditions:** None.

**Notes / Dependencies:** `employee-scope.ts`. Same as TC-238.

---

## TC-094 — Candidate sees candidate dashboard only

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** UI / E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Candidate user (careers register TC-180 or assign `candidate` role). `CANDIDATE_PERMISSIONS` = portal.read/update.

**Test Data:** `/candidate/dashboard`

**Steps to Execute:**
1. Login as candidate.
2. Confirm nav “My Applications” / candidate dashboard.
3. Open `/hr/jobs`, `/admin/users`.
4. `GET /api/hr/jobs`.

**Expected Result:**
1. Redirect to candidate/portal home, not admin.
2. Candidate nav only.
3. HR/admin blocked.
4. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Nav `/candidate/dashboard`.

---

## TC-095 — BD lead API requires bd.lead.read

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee without `bd.lead.read`.

**Test Data:** `GET /api/bd/leads`

**Steps to Execute:**
1. GET leads.
2. POST `/api/bd/leads` with valid body.

**Expected Result:**
1. HTTP 403.
2. HTTP 403 (`bd.lead.create`).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-096 — PM project create requires pm.project.create

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee without PM permissions.

**Test Data:** `POST /api/pm/projects` `{ "name": "Shadow Project" }`

**Steps to Execute:**
1. POST project.
2. GET `/api/pm/projects`.

**Expected Result:**
1. HTTP 403.
2. HTTP 403 (`pm.project.read`).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-097 — Engineering test-case create requires engineering permission

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** HR logged in (HR_RESOURCES do not include engineering).

**Test Data:** `POST /api/engineering/test-cases` with valid projectId/title if known; 403 is enough even on 400 after auth.

**Steps to Execute:**
1. As HR, POST `/api/engineering/test-cases`.
2. GET `/api/engineering/test-cases`.

**Expected Result:**
1. HTTP 403 (`engineering.testcase.create`).
2. HTTP 403 (`engineering.testcase.read`).

**Postconditions:** None.

**Notes / Dependencies:** Path is `/test-cases` (hyphen).

---

## TC-098 — Self-access GET /api/users/:ownId

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee **without** `user.read`. Own user id from `/api/auth/me`.

**Test Data:** `GET /api/users/<ownUserId>`

**Steps to Execute:**
1. GET own user.
2. Confirm password hash **not** in JSON.

**Expected Result:**
1. HTTP 200 (`requireSelfOrPermission("user.read")`).
2. No `password` / hash fields.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed ownership middleware.

---

## TC-099 — Cannot read another user without user.read

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee. Another user’s id (HR).

**Test Data:** `GET /api/users/<hrUserId>`

**Steps to Execute:**
1. GET other user.

**Expected Result:**
1. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-100 — Storage presign purpose RESUME permission

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee with only `portal.read`/`portal.update` (RESUME **is** allowed for those). Control: a user with **no** portal/candidate/application perms if you can create one. Candidate/employee typically **can** RESUME.

**Test Data:** `POST /api/storage/presign` `{ "fileName": "cv.pdf", "mimeType": "application/pdf", "purpose": "RESUME" }`  
Compact `RESUME` ≠ **`RESUME`**.

**Steps to Execute:**
1. As employee (portal.read), POST RESUME — **expect 200** per `STORAGE_PURPOSE_PERMISSIONS.RESUME`.
2. As finance (no portal/candidate/application perms), POST RESUME.
3. POST `purpose: "RESUME"`.

**Expected Result:**
1. HTTP 200 (employee allowed). Compact “employee 403 unless resume permission” — **employee has portal.read → allowed**.
2. HTTP 403.
3. HTTP 400 invalid purpose.

**Postconditions:** None.

**Notes / Dependencies:** `storage-rbac.ts` RESUME → portal.read/update, candidate.update, application.update.

---

## TC-101 — Document ACL enforced

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Document with ACL granting user A VIEW only (TC-600). User B has `document.read` but not on ACL if ACL is restrictive — or B has no document.read.

**Test Data:** `GET /api/documents/<id>`

**Steps to Execute:**
1. As A, GET document.
2. As B, GET document.

**Expected Result:**
1. HTTP 200.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Same as TC-601. If ACL is additive on top of document.read, B with document.read may still 200 — record actual.

---

## TC-102 — Audit logs require audit.read

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee.

**Test Data:** `GET /api/audit-logs`

**Steps to Execute:**
1. GET audit-logs.
2. Open `/admin/audit-logs`.

**Expected Result:**
1. HTTP 403.
2. Gated.

**Postconditions:** None.

**Notes / Dependencies:** Same as TC-173.

---

## TC-103 — Report export requires report.export or report.read

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee without report perms.

**Test Data:** `GET /api/reports/ATTENDANCE/export?format=csv`  
Compact `/reports/attendance/export` — actual type enum is **`ATTENDANCE`** (uppercase) on `GET /api/reports/:type/export`.

**Steps to Execute:**
1. As employee, GET export.
2. As admin with `report.read` or `report.export`, GET export.

**Expected Result:**
1. HTTP 403.
2. HTTP 200 file.

**Postconditions:** None.

**Notes / Dependencies:** `requirePermission("report.export", "report.read")`.

---

## TC-104 — Settings require settings.manage

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** HR user (typically no `settings.manage`).

**Test Data:** `PUT /api/settings` `{ "settings": [{ "key": "company.displayName", "value": "Hack" }] }`  
Compact `settings.manage` ≠ **`settings.manage`**.

**Steps to Execute:**
1. As HR, PUT settings.
2. GET `/api/settings` as HR.

**Expected Result:**
1. HTTP 403.
2. HTTP 403.

**Postconditions:** Settings unchanged.

**Notes / Dependencies:** Same as TC-165.

---

## TC-105 — Permission change takes effect without re-login

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** E2E / Edge  
**Priority:** High  
**Severity:** High  

**Preconditions:** Custom role user logged in (browser A). Super Admin browser B. Endpoint the user currently cannot call (e.g. `GET /api/bd/leads`).

**Test Data:** Grant `bd.lead.read` to that custom role (TC-084).

**Steps to Execute:**
1. User A: GET `/api/bd/leads` → 403.
2. Admin B: assign `bd.lead.read` to the role.
3. User A **without logout**: GET leads again (and refresh UI).

**Expected Result:**
1. 403.
2. Role updated.
3. HTTP 200 on next request (permissions loaded from DB per request). Nav may need `/api/auth/me` refetch.

**Postconditions:** Optionally revoke the grant.

**Notes / Dependencies:** Same as TC-684.

---

## TC-106 — Permission denial logs security event

**Module:** RBAC  
**Feature:** Permission Enforcement  
**Scenario Type:** Security  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Super Admin `security.read`. Employee triggers 403.

**Test Data:** Employee GET `/api/users` then admin `GET /api/security-events`

**Steps to Execute:**
1. As employee, GET `/api/users`.
2. As admin, open `/admin/security-events` / GET API.
3. Filter recent FORBIDDEN / permission-denied.

**Expected Result:**
1. 403.
2. HTTP 200 list.
3. Event present **if** `security-monitor` records RBAC denials. If not, log **gap**.

**Postconditions:** None.

**Notes / Dependencies:** Compact assumed logging — verify eventType name.

---

## TC-107 — Admin creates user with required fields

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Positive / UI / API  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Super Admin or HR with `user.create`. `/admin/users`

**Test Data:**
```json
{
  "email": "qa.user107@workforce360.test",
  "password": "Test@1234",
  "firstName": "Qa",
  "lastName": "User"
}
```

**Steps to Execute:**
1. Create via FormSheet.
2. Confirm `POST /api/users`.
3. GET user; note `employeeId` auto EMP### if omitted.
4. Confirm employee master row if hire-sync exists.

**Expected Result:**
1. UI success.
2. HTTP **201**.
3. employeeId like `EMP003+`.
4. User in list.

**Postconditions:** Save `newUserId`.

**Notes / Dependencies:** email, password min 8, firstName, lastName required.

---

## TC-108 — Create user validates email format

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Validation / Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `user.create`.

**Test Data:** `{ "email": "bad-email", "password": "Test@1234", "firstName": "A", "lastName": "B" }`

**Steps to Execute:**
1. POST `/api/users`.

**Expected Result:**
1. HTTP 400 `VALIDATION_ERROR`.

**Postconditions:** None.

**Notes / Dependencies:** `z.string().email()`.

---

## TC-109 — Create user password minimum 8 characters

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Validation / Boundary  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `user.create`.

**Test Data:** `password: "short"` (5 chars) with valid email/names.

**Steps to Execute:**
1. POST create.

**Expected Result:**
1. HTTP 400 — “Password must be at least 8 characters”.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-110 — Create user password exactly 8 characters

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Boundary / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `user.create`. Unique email.

**Test Data:** `password: "Test@123"` (8 chars)

**Steps to Execute:**
1. POST create.
2. Login with that password.

**Expected Result:**
1. HTTP 201.
2. Login 200.

**Postconditions:** User exists.

**Notes / Dependencies:** Min 8 only — complexity not in createUserSchema (env password policy may still apply in service — if 201, schema-only).

---

## TC-111 — Duplicate email rejected

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Negative / DB  
**Priority:** High  
**Severity:** High  

**Preconditions:** `user.create`. Email `admin@workforce360.com` exists. Compact said `admin@workforce360.com` — use **seed** `admin@workforce360.com`.

**Test Data:** POST create with seed admin email.

**Steps to Execute:**
1. POST `/api/users` duplicate email.

**Expected Result:**
1. HTTP 409 or 400 duplicate. No second user.

**Postconditions:** None.

**Notes / Dependencies:** Unique email.

---

## TC-112 — Update user profile fields

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `user.update`. `newUserId`. `audit.read` optional.

**Test Data:** `PUT /api/users/<id>` `{ "firstName": "Updated" }`

**Steps to Execute:**
1. PUT firstName.
2. GET user.
3. Check audit log for user update.

**Expected Result:**
1. HTTP 200.
2. firstName Updated.
3. Audit entry if service writes one.

**Postconditions:** User updated.

**Notes / Dependencies:** PUT not PATCH.

---

## TC-113 — Update user with empty body rejected

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Validation / Negative  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `user.update`.

**Test Data:** `PUT /api/users/<id>` `{}`

**Steps to Execute:**
1. PUT empty JSON.

**Expected Result:**
1. HTTP 400 — “At least one field is required to update”.

**Postconditions:** Unchanged.

**Notes / Dependencies:** `updateUserSchema.refine`.

---

## TC-114 — Soft delete user

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Positive / DB  
**Priority:** High  
**Severity:** High  

**Preconditions:** Disposable user. `user.delete` + `user.read`.

**Test Data:** `DELETE /api/users/<id>`

**Steps to Execute:**
1. DELETE user.
2. GET `/api/users/<id>`.
3. GET `/api/users` default list.
4. GET `/api/users?includeDeleted=true` as Super Admin.

**Expected Result:**
1. HTTP 200; `deletedAt` set; status may be `deleted`.
2. HTTP 404.
3. Omitted from default list.
4. Super Admin may still see them.

**Postconditions:** Soft-deleted.

**Notes / Dependencies:** `includeDeleted` Super Admin only per swagger.

---

## TC-115 — Assign role to user

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** `user.assign_role`. User id. Role id (`employee` or custom).

**Test Data:** `POST /api/users/<id>/roles` `{ "roleId": "<id>" }`

**Steps to Execute:**
1. POST assign.
2. GET `/api/users/<id>/roles`.
3. POST same role again.

**Expected Result:**
1. HTTP 201.
2. Role listed.
3. HTTP 400 “already has this role” (swagger).

**Postconditions:** Role assigned.

**Notes / Dependencies:** Permission **`user.assign_role`** not `user.update`.

---

## TC-116 — Remove role from user

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** User has the role. `user.assign_role`.

**Test Data:** `DELETE /api/users/<id>/roles` `{ "roleId": "<id>" }`

**Steps to Execute:**
1. DELETE with body roleId.
2. GET roles.

**Expected Result:**
1. HTTP 200.
2. Role gone; permissions drop on next request.

**Postconditions:** Role removed.

**Notes / Dependencies:** Same permission as assign.

---

## TC-117 — Revoke all user sessions

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Positive / Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Target user logged in (browser). Admin with `user.update`.

**Test Data:** `POST /api/users/<id>/revoke-sessions`  
Compact `revoke-sessions` ≠ **`revoke-sessions`**.

**Steps to Execute:**
1. User A on `/portal/dashboard`.
2. Admin POST revoke-sessions.
3. User A GET `/api/auth/me` or any API.

**Expected Result:**
1. Session valid.
2. HTTP 200 revoke; session version bumped.
3. 401 `SESSION_EXPIRED` / unauthorized; redirect login.

**Postconditions:** All sessions dead.

**Notes / Dependencies:** Actual path `/revoke-sessions`.

---

## TC-118 — Get next employee ID preview

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `user.create`.

**Test Data:** `GET /api/users/next-employee-id`  
Compact `next-employee-id` ≠ **`next-employee-id`**.

**Steps to Execute:**
1. GET next-employee-id.
2. As employee without user.create.

**Expected Result:**
1. HTTP 200; next `EMP###` (does not consume until create).
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Actual `/next-employee-id`.

---

## TC-119 — List users with search filter

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Positive / UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `user.read`. `/admin/users`

**Test Data:** Search `admin`

**Steps to Execute:**
1. Search “admin” on users page.
2. `GET /api/users?search=admin`.

**Expected Result:**
1. Matching name/email/employeeId.
2. HTTP 200 filtered.

**Postconditions:** None.

**Notes / Dependencies:** listUsersQuerySchema.search.

---

## TC-120 — List users by department filter

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `user.read`. HR department id. Users in that dept.

**Test Data:** `GET /api/users?departmentId=<hrDeptId>`

**Steps to Execute:**
1. GET with departmentId.
2. GET with officeId / status=active.

**Expected Result:**
1. Only that department.
2. Other filters work (`status` enum active/inactive/blocked/deleted).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed query schema.

---

## TC-121 — firstName max 255 boundary (over)

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Boundary  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `user.create`. Unique email.

**Test Data:** `firstName` 256 characters.

**Steps to Execute:**
1. POST create.

**Expected Result:**
1. HTTP 400 max 255.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed `.max(255)`.

---

## TC-122 — firstName exactly 255 accepted

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Boundary / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `user.create`. Unique email.

**Test Data:** `firstName` 255 chars; valid password/lastName.

**Steps to Execute:**
1. POST create.

**Expected Result:**
1. HTTP 201.

**Postconditions:** User created (delete after).

**Notes / Dependencies:** None.

---

## TC-123 — Non-admin cannot create users via UI

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** Security / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee logged in.

**Test Data:** `/admin/users`

**Steps to Execute:**
1. Open `/admin/users`.
2. POST `/api/users` as employee.

**Expected Result:**
1. Page blocked or Create hidden.
2. HTTP 403 `user.create`.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-124 — User create writes audit log

**Module:** Users  
**Feature:** User CRUD & Sessions  
**Scenario Type:** DB / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `user.create` + `audit.read`. Perform TC-107.

**Test Data:** `GET /api/audit-logs?entity=user` (or search)

**Steps to Execute:**
1. Create user.
2. Filter audit for create/user.

**Expected Result:**
1. 201.
2. Entry with actor, entity, after snapshot **if** user.service writes audit — confirm. If missing, log gap.

**Postconditions:** None.

**Notes / Dependencies:** Compact assumed audit on create.

---

## TC-125 — Create department with valid data

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Positive / UI / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Super Admin/HR `department.create`. **Company id** from seed/GET companies if exposed; UI may inject `companyId`.

**Test Data:** `/admin/departments`
```json
{ "companyId": "<companyId>", "name": "Engineering", "code": "ENG" }
```

**Steps to Execute:**
1. Create via UI.
2. Confirm `POST /api/organization/departments`.
3. POST without `companyId`.

**Expected Result:**
1. HTTP 201; in list.
2. Path `/api/organization/departments`.
3. HTTP 400 (`companyId` required). Compact omitted companyId.

**Postconditions:** Save `departmentId`. Use a unique code if `ENG` exists.

**Notes / Dependencies:** `createDepartmentSchema.companyId` min 1.

---

## TC-126 — Duplicate department code rejected

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Negative / DB  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Code `HR` or `ENG` exists for the company. `department.create`.

**Test Data:** POST same `code` + `companyId`.

**Steps to Execute:**
1. POST duplicate code.

**Expected Result:**
1. HTTP 409 unique(companyId, code) **or** 400. No second row.

**Postconditions:** None.

**Notes / Dependencies:** Compact 409.

---

## TC-127 — Update department manager

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `department.update`. User id for manager. `departmentId`.

**Test Data:** `PUT /api/organization/departments/<id>` `{ "managerId": "<userId>" }`

**Steps to Execute:**
1. PUT managerId.
2. GET department.
3. PUT `{ "managerId": null }` to clear.

**Expected Result:**
1. HTTP 200.
2. Manager shown.
3. HTTP 200; cleared (nullable).

**Postconditions:** Manager set.

**Notes / Dependencies:** `managerId` nullable optional.

---

## TC-128 — Soft delete department

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Positive / DB  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Unused department. `department.delete`.

**Test Data:** `DELETE /api/organization/departments/<id>`

**Steps to Execute:**
1. DELETE.
2. GET list; GET by id.

**Expected Result:**
1. HTTP 200; `deletedAt` set.
2. Absent from list; GET 404.

**Postconditions:** Soft-deleted.

**Notes / Dependencies:** None.

---

## TC-129 — Create team under department

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `departmentId`. `team.create`. `/admin/teams`

**Test Data:**
```json
{
  "departmentId": "<id>",
  "name": "Backend Team",
  "code": "BE",
  "leadId": "<optional userId>",
  "memberIds": ["<userId>"]
}
```

**Steps to Execute:**
1. POST `/api/organization/teams`.
2. GET team.
3. POST without departmentId.

**Expected Result:**
1. HTTP 201; linked to department.
2. Members/lead if sent.
3. HTTP 400.

**Postconditions:** Save `teamId`.

**Notes / Dependencies:** departmentId required.

---

## TC-130 — Duplicate team code within department rejected

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Team code `BE` in department D. `team.create`.

**Test Data:** POST same departmentId + code `BE`, different name.

**Steps to Execute:**
1. POST duplicate.
2. POST same code in a **different** department (control).

**Expected Result:**
1. HTTP 409 if unique(departmentId, code).
2. HTTP 201 if uniqueness is per-department only.

**Postconditions:** At most one BE per dept.

**Notes / Dependencies:** Compact 409 same dept.

---

## TC-131 — Create designation with headcount

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Positive  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** `departmentId`. `designation.create`. `/admin/designations`

**Test Data:**
```json
{
  "departmentId": "<id>",
  "name": "Senior Dev",
  "code": "SDEV",
  "level": 3,
  "headcount": 5
}
```

**Steps to Execute:**
1. POST designation (**level required** 1–5).
2. GET list; confirm vacantPositions metric ≈ headcount − assigned.

**Expected Result:**
1. HTTP 201.
2. headcount 5; metrics on UI.

**Postconditions:** Save `designationId`.

**Notes / Dependencies:** Compact omitted `level` — **required**.

---

## TC-132 — Get next designation code

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `designation.create`. `departmentId`.

**Test Data:** `GET /api/organization/designations/next-code?departmentId=<id>`  
Compact `next-code` ≠ **`next-code`**.

**Steps to Execute:**
1. GET next-code.
2. As employee.

**Expected Result:**
1. HTTP 200; dept-prefixed code.
2. HTTP 403.

**Postconditions:** None (preview).

**Notes / Dependencies:** Actual `/next-code`.

---

## TC-133 — Designation headcount boundary zero

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Boundary  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `designation.create`. departmentId, name, **level**.

**Test Data:** `headcount: 0` · omit headcount · `headcount: 1`

**Steps to Execute:**
1. POST headcount 0.
2. POST omit headcount.
3. POST 1.

**Expected Result:**
1. HTTP 400 — **min 1** (`headcount` optional but if sent ≥ 1). Compact “document” — **0 rejected**.
2. HTTP 201 (optional).
3. HTTP 201.

**Postconditions:** Optional designation.

**Notes / Dependencies:** Confirmed schema.

---

## TC-134 — Assign user beyond designation headcount

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Negative / Business rule / **Gap**  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Designation headcount 2; already 2 users with that `designationId`. `user.update`.

**Test Data:** PUT third user `{ "designationId": "<fullDesignationId>" }`

**Steps to Execute:**
1. Assign 3rd user to the designation.
2. Check designations UI vacantPositions (should be 0 before assign).

**Expected Result:**
1. HTTP 200 **likely** — headcount is **metrics only** (`organization-metrics.ts`), **not** enforced on user update. Compact expected 400 — **log gap** if 200.
2. vacantPositions formula `max(0, headcount − assigned)` can go to 0; assigned can exceed headcount.

**Postconditions:** Possibly 3 assignees.

**Notes / Dependencies:** Compact **inferred**; implementation does not block.

---

## TC-135 — Department parent-child hierarchy

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Parent `departmentId`. `department.create`. `companyId`.

**Test Data:** POST `{ "companyId", "name": "Platform", "code": "PLT", "parentId": "<parentId>" }`

**Steps to Execute:**
1. POST child.
2. GET departments / UI tree.
3. GET child by id.

**Expected Result:**
1. HTTP 201.
2. Child nested under parent if UI tree exists.
3. `parentId` set.

**Postconditions:** Child department.

**Notes / Dependencies:** `parentId` nullable.

---

## TC-136 — Team lead assignment

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `teamId`. `team.update`. User id.

**Test Data:** `PUT /api/organization/teams/<id>` `{ "leadId": "<userId>" }` then `{ "leadId": null }`

**Steps to Execute:**
1. PUT leadId.
2. GET team; UI detail.
3. Clear lead with null / `""`.

**Expected Result:**
1. HTTP 200.
2. Lead shown.
3. HTTP 200; lead cleared (`""` preprocessed to null on update).

**Postconditions:** Lead set/cleared.

**Notes / Dependencies:** Compact leadId matches.

---

## TC-137 — Organization CRUD requires permissions

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee without `department.create`.

**Test Data:** `POST /api/organization/departments` valid body.

**Steps to Execute:**
1. POST department.
2. POST team / designation.

**Expected Result:**
1. HTTP 403.
2. HTTP 403.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-138 — Department name required

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Validation  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `department.create`. companyId.

**Test Data:** `{ "companyId": "<id>", "code": "NONAME" }` missing name.

**Steps to Execute:**
1. POST.

**Expected Result:**
1. HTTP 400 name min 1.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-139 — List departments excludes soft-deleted

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Positive / DB  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Soft-deleted department (TC-128). `department.read`.

**Test Data:** `GET /api/organization/departments`

**Steps to Execute:**
1. GET list.
2. Confirm deleted id absent.

**Expected Result:**
1. HTTP 200.
2. Only `deletedAt` null.

**Postconditions:** None.

**Notes / Dependencies:** None.

---

## TC-140 — Designation update partial fields

**Module:** Organization  
**Feature:** Departments, Teams, Designations  
**Scenario Type:** Positive  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** `designationId`. `designation.update`.

**Test Data:** `PUT /api/organization/designations/<id>` `{ "headcount": 10 }`

**Steps to Execute:**
1. PUT headcount only.
2. GET designation — name unchanged.

**Expected Result:**
1. HTTP 200.
2. Partial update.

**Postconditions:** headcount 10.

**Notes / Dependencies:** `updateDesignationSchema.partial()`.

---

## TC-141 — Create office with address fields

**Module:** Organization  
**Feature:** Offices, Employee Types, Statuses  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `office.create`. `companyId`. `/admin/offices`

**Test Data:**
```json
{
  "companyId": "<id>",
  "name": "Bengaluru HQ",
  "code": "BLR",
  "address": "MG Road",
  "city": "Bengaluru",
  "country": "IN"
}
```

**Steps to Execute:**
1. POST `/api/organization/offices`.
2. POST without companyId.

**Expected Result:**
1. HTTP 201.
2. HTTP 400.

**Postconditions:** Save `officeId`. Use unique code.

**Notes / Dependencies:** companyId required.

---

## TC-142 — Duplicate office code rejected

**Module:** Organization  
**Feature:** Offices, Employee Types, Statuses  
**Scenario Type:** Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Office code exists for company. `office.create`.

**Test Data:** POST same companyId + code.

**Steps to Execute:**
1. POST duplicate.

**Expected Result:**
1. HTTP 409/400 unique(company, code).

**Postconditions:** None.

**Notes / Dependencies:** Compact 409.

---

## TC-143 — Create employee type

**Module:** Organization  
**Feature:** Offices, Employee Types, Statuses  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `employee_type.create`. `/admin/employee-types`

**Test Data:** `{ "name": "Temporary", "code": "temp" }` → stored **`TEMP`** (uppercase transform).

**Steps to Execute:**
1. POST `/api/organization/employee-types`.
2. GET list.

**Expected Result:**
1. HTTP 201; code `TEMP` (max 10, uppercased).
2. Listed. Compact `TEMP` matches after transform.

**Postconditions:** Type exists.

**Notes / Dependencies:** code required min 1 max 10.

---

## TC-144 — Employee type code required

**Module:** Organization  
**Feature:** Offices, Employee Types, Statuses  
**Scenario Type:** Validation  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `employee_type.create`.

**Test Data:** `{ "name": "NoCode" }`

**Steps to Execute:**
1. POST without code.

**Expected Result:**
1. HTTP 400.

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-145 — Create employment status

**Module:** Organization  
**Feature:** Offices, Employee Types, Statuses  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `employment_status.create`. `/admin/employment-statuses`

**Test Data:** `{ "name": "Sabbatical", "code": "sabbatical" }`

**Steps to Execute:**
1. POST `/api/organization/employment-statuses`.
2. GET list — seed includes Active, On Probation, etc.

**Expected Result:**
1. HTTP 201.
2. Seed codes `active`, `probation`, `on_leave`, `notice`, `suspended`, `terminated` present.

**Postconditions:** Custom status exists.

**Notes / Dependencies:** code optional max 50.

---

## TC-146 — Deactivate office

**Module:** Organization  
**Feature:** Offices, Employee Types, Statuses  
**Scenario Type:** Positive / Gap  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `office.update`. `officeId`.

**Test Data:** Look for `isActive` on `updateOfficeSchema` — **not present**. PUT name/code only.

**Steps to Execute:**
1. Inspect schema/UI for isActive.
2. If UI has a toggle, PUT and GET.
3. Open `/admin/users` create form office dropdown.

**Expected Result:**
1. **updateOfficeSchema has no isActive** — compact may not apply.
2. If a flag exists on the model and UI sends it, extra keys may be stripped (Zod) — toggle would **not persist**. Log gap.
3. Document whether inactive offices still appear.

**Postconditions:** None unless a real flag is found.

**Notes / Dependencies:** Compact `isActive: false` **not in Zod**. Soft-delete is DELETE instead.

---

## TC-147 — List employee types includes seed values

**Module:** Organization  
**Feature:** Offices, Employee Types, Statuses  
**Scenario Type:** Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `employee_type.read`. Seeded DB.

**Test Data:** `GET /api/organization/employee-types`

**Steps to Execute:**
1. GET list.
2. Confirm codes.

**Expected Result:**
1. HTTP 200.
2. Includes **`FT`, `PT`, `CNT`, `INT`** (not compact `FT/PT/CNT/INT` vs `FULL_TIME`). Compact FULL_TIME is **wrong**.

**Postconditions:** None.

**Notes / Dependencies:** seed.ts employee types.

---

## TC-148 — Delete unused employment status

**Module:** Organization  
**Feature:** Offices, Employee Types, Statuses  
**Scenario Type:** Positive  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Unused status (TC-145). `employment_status.delete`.

**Test Data:** `DELETE /api/organization/employment-statuses/<id>`

**Steps to Execute:**
1. DELETE.
2. GET list.

**Expected Result:**
1. HTTP 200 soft delete.
2. Absent from list. Seed statuses should not be deleted in shared envs.

**Postconditions:** Custom status deleted.

**Notes / Dependencies:** None.

---

## TC-149 — Office create requires office.create

**Module:** Organization  
**Feature:** Offices, Employee Types, Statuses  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee session.

**Test Data:** `POST /api/organization/offices` valid body.

**Steps to Execute:**
1. POST office.
2. GET offices.

**Expected Result:**
1. HTTP 403.
2. HTTP 403 unless `office.read` granted (employee typically no).

**Postconditions:** None.

**Notes / Dependencies:** Confirmed.

---

## TC-150 — Employment status on user shows in profile

**Module:** Organization  
**Feature:** Offices, Employee Types, Statuses  
**Scenario Type:** Positive / E2E  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** `user.update` + `user.read`. Status id for `probation` (“On Probation”). User id.

**Test Data:** `PUT /api/users/<id>` `{ "employmentStatusId": "<probationStatusId>" }`

**Steps to Execute:**
1. PUT employmentStatusId.
2. GET user; open `/admin/users` detail.
3. Open `/portal/profile` as that user if they have portal access.

**Expected Result:**
1. HTTP 200.
2. Status name “On Probation” (or code `probation`) displayed.
3. Portal may show employment status (TC-275).

**Postconditions:** User on probation status.

**Notes / Dependencies:** Field `employmentStatusId` (nullable). Compact “On Probation” matches seed name.

---

## Coverage recap (this file)

| Range | Count | Focus |
|-------|-------|--------|
| TC-071 – TC-086 | 16 | Roles & permissions CRUD |
| TC-087 – TC-106 | 20 | Permission enforcement |
| TC-107 – TC-124 | 18 | Users & sessions |
| TC-125 – TC-140 | 16 | Departments, teams, designations |
| TC-141 – TC-150 | 10 | Offices, types, statuses |
| **Total** | **80** | TC-071 through TC-150, no skipped IDs |

**Do not treat the compact file as source of truth:**
- Custom **role.create** is Super Admin; system **Administrator is denied** `role.create/update/delete`
- System role delete/rename: **403** `SYSTEM_ROLE_LOCKED`
- Paths: `/api/users/next-employee-id`, `/revoke-sessions`, `/organization/designations/next-code`
- Storage purpose **`RESUME`**; reports type **`ATTENDANCE`**; settings **`settings.manage`**
- Invoice approve: `POST /api/finance/invoices/:id/approve`
- Designation **level 1–5 required**; headcount **min 1**; **headcount not enforced** on user assign
- Department/office create needs **`companyId`**
- Employee types **FT/PT/CNT/INT**; office **`isActive` not in update schema**
- Employee **can** presign `RESUME` via `portal.read`
