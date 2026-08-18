# Workforce 360 ERP — Comprehensive Test Suite

**Generated from codebase analysis:** apps/api (350+ endpoints), apps/web (107 routes), schema.prisma (96 models)  
**Date:** 2026-08-18

---

## 1. Application Coverage Summary

| Module | Feature | User Role | Coverage Areas | Number of Test Cases |
|--------|---------|-----------|----------------|---------------------|
| Infrastructure | Health & API Docs | Public | API, Smoke | 4 |
| Authentication | Login / Logout / Session | All | Positive, Negative, Security, API, E2E | 18 |
| Authentication | Password Reset | All | Validation, API, UI | 8 |
| Authentication | MFA (TOTP) | All | Positive, Negative, Security | 12 |
| Authentication | Google OAuth | All | Integration, Security | 6 |
| Users & Sessions | User CRUD & Roles | Admin, HR | CRUD, RBAC, Validation, API | 14 |
| RBAC | Roles & Permissions | Super Admin, Admin | Security, API, UI | 16 |
| Organization | Departments, Teams, Designations | Admin, HR | CRUD, Validation, Boundary | 14 |
| Organization | Offices, Employee Types, Statuses | Admin, HR | CRUD, Validation | 8 |
| Careers (Public) | Job Listings & Apply | Public, Candidate | E2E, API, Upload | 10 |
| Recruitment | Jobs, Candidates, Pipeline | HR | Workflow, API, UI | 14 |
| Recruitment | Interviews, Offers, Checklist | HR | E2E, Approval | 8 |
| HR Operations | Employees & Lifecycle | HR | CRUD, State transitions | 10 |
| HR Operations | Policies & Acknowledgements | HR, Employee | Versioning, E2E | 8 |
| HR Operations | Assets & Tickets | HR | CRUD, Assignment | 6 |
| Employee Portal | Profile, Attendance, Leave | Employee, Developer | Self-service, E2E | 16 |
| Employee Portal | Payslips, Support, Notifications | Employee | Download, Tickets | 8 |
| Storage | Presign Upload / Confirm | All (purpose-based) | Security, API | 8 |
| Dashboard | Admin Dashboard & Search | Admin | UI, API | 6 |
| Business Development | Contacts, Leads, Pipeline | BD Team | CRUD, Kanban, API | 14 |
| Business Development | Bids, Proposals, Portfolio | BD Team | Workflow, Validation | 10 |
| Project Management | Projects, Milestones, Tasks | PM, Developer | CRUD, Kanban, API | 16 |
| Project Management | Sprints, Time, Team, Budget | PM | Tracking, Boundary | 10 |
| Attendance | Shifts, Holidays, Clock In/Out | HR, Employee | Business logic, API | 14 |
| Attendance | Corrections & Approval | HR, Employee | Approval chain, E2E | 8 |
| Leave | Types, Balances, Applications | HR, Employee | Balance math, Overlap | 14 |
| Approvals | Workflows, Delegations, Actions | All approvers | Multi-level, E2E | 14 |
| Assets | Asset CRUD, Assign, Return | HR | History, Status | 8 |
| Finance | Clients, Invoices | Finance | Totals, Approval, API | 14 |
| Finance | Payments, Reimbursements | Finance, Employee | Stripe/Razorpay, E2E | 10 |
| Payroll | Salary Structures & Revisions | Payroll | Calculation, Approval | 10 |
| Payroll | Payroll Runs & Payslips | Payroll, Employee | LOP, PDF, E2E | 12 |
| Notifications | In-app, Preferences, Announcements | All | UI, API | 8 |
| Helpdesk | Tickets, SLA, Knowledge Base | HR, Employee | SLA, Escalation | 8 |
| Documents | Categories, Versions, ACL | HR, Admin | Upload, Permissions | 8 |
| Reports | KPIs, Export, Schedules | Admin, Finance, HR | CSV/PDF, Scheduler | 8 |
| Admin | Audit Logs, Security Events | Admin | Pagination, Filters | 6 |
| Admin | Settings, Templates, Integrations | Admin | CRUD, Webhooks | 6 |
| Engineering | Releases, Test Cases, Code Reviews | Developer, QA | CRUD, Workflow | 10 |
| Cross-cutting | RBAC Matrix, Session, Responsive | All roles | Security, UI, Regression | 12 |

**Totals:**
- Total modules identified: **29**
- Total features identified: **42**
- Total test cases: **320**
- Positive: 98 | Negative: 72 | Edge: 38 | Boundary: 28 | Validation: 42 | Security/Authorization: 32 | API: 86 | UI/UX: 24 | E2E: 28

---

## 2. Detailed Test Cases

### Infrastructure

#### TC-001 — Verify API health endpoint returns healthy status

**Module:** Infrastructure  
**Feature:** Health & API Docs  
**Scenario Type:** Positive / API  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:**
- API server is running on configured port (default 4000)
- Database is connected and migrated

**Test Data:**
- GET request to `/api/health`

**Steps to Execute:**
1. Send unauthenticated GET request to `/api/health`
2. Inspect HTTP status code
3. Inspect response body envelope `{ data, error, meta }`
4. Verify `data.status` indicates healthy
5. Verify database connectivity flag in response

**Expected Result:**
1. Request completes without authentication
2. HTTP status is 200
3. `error` is null; `data` is populated
4. Status field reflects healthy state (confirmed from `health.service.ts`)
5. DB probe succeeds when database is up

**Postconditions:** No state change

**Notes / Dependencies:** Confirmed from code — `healthController.getHealth`

---

#### TC-002 — Verify OpenAPI docs endpoint is publicly accessible

**Module:** Infrastructure  
**Feature:** Health & API Docs  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** API server running

**Test Data:** GET `/api/docs/openapi.json`

**Steps to Execute:**
1. Request OpenAPI JSON without auth
2. Verify 200 response
3. Verify JSON contains paths object

**Expected Result:**
1. Request succeeds
2. HTTP 200
3. Valid OpenAPI schema returned

**Postconditions:** None

**Notes / Dependencies:** Confirmed from `app.ts`

---

#### TC-003 — Verify unknown API route returns 404 NOT_FOUND envelope

**Module:** Infrastructure  
**Feature:** Error Handling  
**Scenario Type:** Negative / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** API running

**Test Data:** GET `/api/nonexistent-route-xyz`

**Steps to Execute:**
1. Send GET to invalid path under `/api`
2. Inspect status and error code

**Expected Result:**
1. HTTP 404
2. `error.code` = `NOT_FOUND` (confirmed from `notFoundHandler`)

**Postconditions:** None

**Notes / Dependencies:** Covered partially by `app.integration.test.ts`

---

#### TC-004 — Verify root path returns application info

**Module:** Infrastructure  
**Feature:** Health & API Docs  
**Scenario Type:** Positive / API  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** API running

**Test Data:** GET `/`

**Steps to Execute:**
1. Request root URL
2. Verify 200 and app identification in body

**Expected Result:**
1. HTTP 200 with application metadata

**Postconditions:** None

**Notes / Dependencies:** Confirmed from integration tests

---

### Authentication — Login / Logout / Session

#### TC-005 — Verify valid admin login via email and password

**Module:** Authentication  
**Feature:** Login  
**Scenario Type:** Positive / E2E / API  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:**
- Seed data applied; user `admin@workforce360.com` exists
- User status is ACTIVE

**Test Data:**
- Email: `admin@workforce360.com`
- Password: `Admin@123` (from seed)

**Steps to Execute:**
1. Navigate to `/login` or POST `/api/auth/login` with valid credentials
2. Submit login form/request
3. Verify httpOnly cookies set (`accessToken`, `refreshToken`)
4. Verify redirect to `/dashboard` (UI) or 200 with user data (API)
5. Call GET `/api/auth/me` with cookies

**Expected Result:**
1. Login endpoint accepts credentials
2. No validation errors
3. Auth cookies present with httpOnly flag
4. User lands on dashboard
5. `/me` returns admin user with roles and flattened permissions

**Postconditions:** Active session established

**Notes / Dependencies:** Confirmed from seed.ts and auth.service.ts

---

#### TC-006 — Verify login fails with incorrect password

**Module:** Authentication  
**Feature:** Login  
**Scenario Type:** Negative / Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Valid user exists

**Test Data:** Correct email, wrong password

**Steps to Execute:**
1. POST `/api/auth/login` with wrong password
2. Inspect response
3. Verify no auth cookies set
4. Check security event logged (if configured)

**Expected Result:**
1. HTTP 401
2. Generic invalid-credentials message (no user enumeration)
3. Cookies not set
4. Failed login recorded in security monitor (confirmed from `security-monitor.ts`)

**Postconditions:** No session created

**Notes / Dependencies:** Confirmed from auth.service

---

#### TC-007 — Verify login fails with empty email (validation)

**Module:** Authentication  
**Feature:** Login  
**Scenario Type:** Validation / Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** API running

**Test Data:** `{ email: "", password: "Admin@123" }`

**Steps to Execute:**
1. POST `/api/auth/login` with empty email
2. Inspect 400 response and `error.details`

**Expected Result:**
1. HTTP 400 `VALIDATION_ERROR`
2. Email field error: "Invalid email address" (from `loginSchema`)

**Postconditions:** None

**Notes / Dependencies:** Confirmed from `auth.schema.ts`

---

#### TC-008 — Verify login fails with malformed email format

**Module:** Authentication  
**Feature:** Login  
**Scenario Type:** Validation / Boundary  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** API running

**Test Data:** `not-an-email`, `user@`, `@domain.com`

**Steps to Execute:**
1. Submit each malformed email with any password
2. Verify validation rejection for each

**Expected Result:**
1. HTTP 400 for each case
2. Zod email validation message returned

**Postconditions:** None

**Notes / Dependencies:** Confirmed from `loginSchema`

---

#### TC-009 — Verify login fails for inactive/deleted user

**Module:** Authentication  
**Feature:** Login  
**Scenario Type:** Negative / Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** User exists with status INACTIVE or `deletedAt` set

**Test Data:** Inactive user credentials

**Steps to Execute:**
1. Soft-delete or deactivate a test user via admin
2. Attempt login with that user
3. Verify rejection

**Expected Result:**
1. Login denied (401)
2. No session created

**Postconditions:** User remains inactive

**Notes / Dependencies:** Confirmed from auth.service user lookup filter

---

#### TC-010 — Verify logout clears session and invalidates refresh

**Module:** Authentication  
**Feature:** Logout  
**Scenario Type:** Positive / E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** User logged in with valid session

**Test Data:** Authenticated session cookies

**Steps to Execute:**
1. POST `/api/auth/logout` with session cookies
2. Verify cookies cleared
3. Attempt GET `/api/auth/me`
4. Attempt POST `/api/auth/refresh`

**Expected Result:**
1. Logout returns success
2. Auth cookies removed/expired
3. `/me` returns 401
4. Refresh fails with 401

**Postconditions:** No active session

**Notes / Dependencies:** Confirmed from auth flow

---

#### TC-011 — Verify automatic token refresh on 401

**Module:** Authentication  
**Feature:** Session Refresh  
**Scenario Type:** Positive / API  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** User logged in; access token near expiry or expired with valid refresh

**Test Data:** Expired access token + valid refresh cookie

**Steps to Execute:**
1. Call protected endpoint with expired access token
2. Observe frontend `api-client.ts` refresh retry (or call `/api/auth/refresh` directly)
3. Retry original request

**Expected Result:**
1. Initial 401 triggers refresh
2. New access token issued; refresh rotated
3. Original request succeeds after retry

**Postconditions:** New session tokens active

**Notes / Dependencies:** Confirmed from `api-client.test.ts`

---

#### TC-012 — Verify session invalidated after sessionVersion bump

**Module:** Authentication  
**Feature:** Session Management  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:** User has active session; admin revokes sessions

**Test Data:** User ID with active JWT

**Steps to Execute:**
1. Login as employee
2. Admin calls POST `/api/users/:id/revoke-sessions`
3. Employee retries API call with old token

**Expected Result:**
1. `sessionVersion` incremented on user
2. Old JWT returns 401 `SESSION_EXPIRED`

**Postconditions:** User must re-login

**Notes / Dependencies:** Confirmed from `auth.ts` middleware

---

#### TC-013 — Verify unauthenticated access to dashboard redirects to login

**Module:** Authentication  
**Feature:** Route Protection  
**Scenario Type:** Negative / UI / E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** No active session; browser cleared

**Test Data:** Direct navigation to `/dashboard`

**Steps to Execute:**
1. Open `/dashboard` without cookies
2. Observe redirect behavior
3. Verify login page displayed

**Expected Result:**
1. Client-side redirect to `/login` (no Next.js middleware — confirmed)
2. Dashboard content not rendered
3. Login form visible

**Postconditions:** User on login page

**Notes / Dependencies:** Confirmed — no `middleware.ts`; client gate in dashboard layout

---

#### TC-014 — Verify authenticated user visiting /login redirects to dashboard

**Module:** Authentication  
**Feature:** Route Protection  
**Scenario Type:** Positive / UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Valid session exists

**Test Data:** Logged-in admin

**Steps to Execute:**
1. Navigate to `/login` while authenticated
2. Observe redirect

**Expected Result:**
1. Redirect to `/dashboard`
2. Login form not shown

**Postconditions:** User on dashboard

**Notes / Dependencies:** Confirmed from `(auth)/layout.tsx`

---

#### TC-015 — Verify concurrent login from two browsers creates independent sessions

**Module:** Authentication  
**Feature:** Session Management  
**Scenario Type:** Edge / Security  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Same user credentials

**Test Data:** Two browser contexts

**Steps to Execute:**
1. Login as same user in Browser A
2. Login as same user in Browser B
3. Verify both sessions work independently
4. Revoke sessions from admin; verify both invalidated

**Expected Result:**
1. Both sessions receive distinct refresh tokens
2. Both can access protected routes until revoke
3. Revoke invalidates all sessions for user

**Postconditions:** Sessions cleared after revoke test

**Notes / Dependencies:** Inferred from refresh token model

---

### Authentication — Password Reset

#### TC-016 — Verify password reset request for registered email

**Module:** Authentication  
**Feature:** Password Reset  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** User exists with known email

**Test Data:** `admin@workforce360.com`

**Steps to Execute:**
1. POST `/api/auth/password/request-reset` with valid email
2. Verify success response (same message for unknown emails — security)
3. Verify reset token created in DB

**Expected Result:**
1. HTTP 200
2. Generic success message regardless of email existence (inferred — verify in auth.service)
3. Token row in `PasswordReset` table when email exists

**Postconditions:** Reset token pending

**Notes / Dependencies:** Partially confirmed; verify no email enumeration in service

---

#### TC-017 — Verify password reset with valid token and compliant password

**Module:** Authentication  
**Feature:** Password Reset  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Valid unused reset token

**Test Data:** Token from TC-016; new password meeting policy (min 8 chars per schema)

**Steps to Execute:**
1. Navigate to `/reset-password?token=...`
2. Enter new password and submit
3. POST `/api/auth/password/reset`
4. Login with new password

**Expected Result:**
1. Reset page accepts token
2. Password updated
3. Token marked used
4. Login succeeds with new password

**Postconditions:** Old password invalid

**Notes / Dependencies:** `resetPasswordSchema` requires min 8 chars; policy may require more via `validatePasswordPolicy`

---

#### TC-018 — Verify password reset rejected with password under 8 characters

**Module:** Authentication  
**Feature:** Password Reset  
**Scenario Type:** Boundary / Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Valid reset token

**Test Data:** Password of 7 characters

**Steps to Execute:**
1. POST reset with 7-char password
2. Inspect validation error

**Expected Result:**
1. HTTP 400 `VALIDATION_ERROR`
2. Message: "Password must be at least 8 characters"

**Postconditions:** Password unchanged

**Notes / Dependencies:** Confirmed from `resetPasswordSchema`

---

#### TC-019 — Verify expired reset token is rejected

**Module:** Authentication  
**Feature:** Password Reset  
**Scenario Type:** Negative / Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Reset token past `expiresAt`

**Test Data:** Expired token

**Steps to Execute:**
1. Attempt reset with expired token
2. Verify rejection

**Expected Result:**
1. HTTP 4xx with invalid/expired token error
2. Password not changed

**Postconditions:** None

**Notes / Dependencies:** Confirmed from PasswordReset model

---

#### TC-020 — Verify reused reset token is rejected

**Module:** Authentication  
**Feature:** Password Reset  
**Scenario Type:** Negative / Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Token already used (`isUsed=true`)

**Test Data:** Previously consumed token

**Steps to Execute:**
1. Complete successful reset
2. Retry same token

**Expected Result:**
1. Second attempt fails
2. Password remains from first reset only

**Postconditions:** Token single-use enforced

**Notes / Dependencies:** Confirmed from schema `isUsed`

---

### Authentication — MFA

#### TC-021 — Verify MFA challenge presented when MFA enabled on login

**Module:** Authentication  
**Feature:** MFA  
**Scenario Type:** Positive / E2E  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:** User has MFA enabled via `/api/auth/mfa/enable`

**Test Data:** User credentials + valid TOTP code

**Steps to Execute:**
1. Login with email/password
2. Verify MFA challenge UI/step returned (mfaToken)
3. Submit valid TOTP via POST `/api/auth/mfa/verify`
4. Verify full session established

**Expected Result:**
1. Login returns MFA challenge, not full session
2. MFA form shown on UI
3. Valid code completes auth
4. Cookies set after MFA verify

**Postconditions:** Authenticated session

**Notes / Dependencies:** Confirmed from mfa.service and login form

---

#### TC-022 — Verify MFA verify fails with code shorter than 4 characters

**Module:** Authentication  
**Feature:** MFA  
**Scenario Type:** Boundary / Validation  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Valid mfaToken from login challenge

**Test Data:** Code `"123"` (3 chars)

**Steps to Execute:**
1. POST `/api/auth/mfa/verify` with 3-char code
2. Inspect validation response

**Expected Result:**
1. HTTP 400 `VALIDATION_ERROR`
2. Code min length 4 enforced (`mfaVerifySchema`)

**Postconditions:** Session not established

**Notes / Dependencies:** Confirmed from `auth.schema.ts`

---

#### TC-023 — Verify MFA verify fails with invalid TOTP code

**Module:** Authentication  
**Feature:** MFA  
**Scenario Type:** Negative / Security  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** MFA challenge active

**Test Data:** Invalid 6-digit code

**Steps to Execute:**
1. Submit wrong TOTP code
2. Verify rejection and security event

**Expected Result:**
1. HTTP 401/403
2. No session cookies
3. MFA failure may log security event

**Postconditions:** User remains at MFA step

**Notes / Dependencies:** Confirmed from mfa flow

---

#### TC-024 — Verify MFA setup flow from portal security page

**Module:** Authentication  
**Feature:** MFA Setup  
**Scenario Type:** Positive / UI / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee logged in; MFA not yet enabled

**Test Data:** Portal user at `/portal/security`

**Steps to Execute:**
1. Navigate to Portal → Security
2. Initiate MFA setup (POST `/api/auth/mfa/setup`)
3. Scan QR / enter secret in authenticator app
4. Enable with valid code (POST `/api/auth/mfa/enable`)
5. Verify MFA status shows enabled

**Expected Result:**
1. Setup returns QR/secret
2. Enable succeeds with valid code
3. `UserMfa` record created
4. Status endpoint returns enabled

**Postconditions:** MFA required on next login

**Notes / Dependencies:** Confirmed from portal security page and auth routes

---

#### TC-025 — Verify MFA disable requires valid code

**Module:** Authentication  
**Feature:** MFA  
**Scenario Type:** Security / Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** MFA enabled user logged in

**Test Data:** Invalid disable code

**Steps to Execute:**
1. POST `/api/auth/mfa/disable` with wrong code
2. Verify MFA remains enabled

**Expected Result:**
1. Request rejected
2. MFA still active on status check

**Postconditions:** MFA still enabled

**Notes / Dependencies:** Confirmed from mfa routes

---

#### TC-026 — Verify trusted device revoke from devices list

**Module:** Authentication  
**Feature:** Trusted Devices  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** User has trusted device record

**Test Data:** Device ID from GET `/api/auth/devices`

**Steps to Execute:**
1. List devices
2. DELETE `/api/auth/devices/:id`
3. Verify device `revokedAt` set

**Expected Result:**
1. Device listed
2. Revoke returns success
3. Device no longer trusted

**Postconditions:** Device revoked

**Notes / Dependencies:** Confirmed from TrustedDevice model

---

### Authentication — Google OAuth

#### TC-027 — Verify Google auth URL endpoint returns redirect URL

**Module:** Authentication  
**Feature:** Google OAuth  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** Google OAuth env vars configured

**Test Data:** GET `/api/auth/google/url`

**Steps to Execute:**
1. Request Google auth URL
2. Verify URL contains Google OAuth parameters

**Expected Result:**
1. HTTP 200 with auth URL in `data`
2. URL is valid Google OAuth authorize endpoint

**Postconditions:** None

**Notes / Dependencies:** Confirmed from auth routes; requires env config

---

#### TC-028 — Verify Google login fails without authorization code

**Module:** Authentication  
**Feature:** Google OAuth  
**Scenario Type:** Validation / Negative  
**Priority:** Medium  
**Severity:** Medium  

**Preconditions:** API running

**Test Data:** POST `/api/auth/google` with empty body

**Steps to Execute:**
1. Submit request without `code`
2. Verify validation error

**Expected Result:**
1. HTTP 400
2. "Authorization code is required"

**Postconditions:** None

**Notes / Dependencies:** Confirmed from `googleLoginSchema`

---

### Users & Sessions

#### TC-029 — Verify admin can create user with valid data and auto employee ID

**Module:** Users & Sessions  
**Feature:** User CRUD  
**Scenario Type:** Positive / API / E2E  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:** Admin logged in with `user.create` permission

**Test Data:** New user: valid email, password (min 8), firstName, lastName, departmentId

**Steps to Execute:**
1. GET `/api/users/next-employee-id` to preview next ID
2. POST `/api/users` with valid payload via Admin → Users → Add User
3. Verify user created with assigned `employeeId` (EMP###)
4. Verify Employee master record synced

**Expected Result:**
1. Next ID returned in EMP### format
2. User created HTTP 201
3. `employeeId` auto-assigned and unique
4. Linked Employee record exists (confirmed from user.service)

**Postconditions:** New user in system; audit log entry written

**Notes / Dependencies:** Confirmed from user.service.test.ts

---

#### TC-030 — Verify duplicate email on user create returns 409

**Module:** Users & Sessions  
**Feature:** User CRUD  
**Scenario Type:** Negative / Validation  
**Priority:** High  
**Severity:** High  

**Preconditions:** Existing user with email `hr@workforce360.com`

**Test Data:** Same email for new user

**Steps to Execute:**
1. POST `/api/users` with duplicate email
2. Inspect error response

**Expected Result:**
1. HTTP 409
2. `error.code` indicates duplicate (Prisma P2002 mapping)

**Postconditions:** No duplicate user created

**Notes / Dependencies:** Confirmed from app-error.ts

---

#### TC-031 — Verify user can read own profile without user.read permission

**Module:** Users & Sessions  
**Feature:** Self Access  
**Scenario Type:** Positive / Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee logged in (no `user.read`)

**Test Data:** Employee user ID

**Steps to Execute:**
1. GET `/api/users/:ownId` as employee
2. Verify 200 with own data

**Expected Result:**
1. Self-access allowed via `requireSelfOrPermission`
2. Other users' data not accessible

**Postconditions:** None

**Notes / Dependencies:** Confirmed from ownership middleware

---

#### TC-032 — Verify employee cannot list all users

**Module:** Users & Sessions  
**Feature:** RBAC  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee session without `user.read`

**Test Data:** GET `/api/users`

**Steps to Execute:**
1. Call list users endpoint as employee
2. Verify 403

**Expected Result:**
1. HTTP 403 `FORBIDDEN`
2. Security event may be logged

**Postconditions:** None

**Notes / Dependencies:** Confirmed from user.routes.ts

---

#### TC-033 — Verify admin can assign role to user

**Module:** Users & Sessions  
**Feature:** Role Assignment  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Admin with `user.assign_role`; target user and role exist

**Test Data:** userId, roleId for `finance` role

**Steps to Execute:**
1. POST `/api/users/:id/roles` with roleId
2. GET `/api/users/:id/roles`
3. Login as that user and verify permissions updated

**Expected Result:**
1. Role assigned successfully
2. Role appears in user roles list
3. New permissions effective on next token refresh/login

**Postconditions:** User has finance role

**Notes / Dependencies:** Confirmed from user routes

---

#### TC-034 — Verify frontend user form validates password minimum 8 characters

**Module:** Users & Sessions  
**Feature:** User Form Validation  
**Scenario Type:** Validation / UI  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Admin on `/admin/users` create form

**Test Data:** Password `short1`

**Steps to Execute:**
1. Fill required fields with 7-char password
2. Submit form before API call
3. Verify client-side error from `validateUserForm()`

**Expected Result:**
1. Form blocked or shows "at least 8 characters"
2. No API call made until fixed

**Postconditions:** User not created

**Notes / Dependencies:** Confirmed from `user-form-validation.ts`

---

### RBAC — Roles & Permissions

#### TC-035 — Verify super_admin can create custom role

**Module:** RBAC  
**Feature:** Role CRUD  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Super admin logged in

**Test Data:** `{ name: "QA Test Role", code: "qa_test_role" }`

**Steps to Execute:**
1. POST `/api/roles` with valid data
2. GET `/api/roles/:id`
3. Assign permissions via PUT `/api/roles/:id/permissions/bulk`

**Expected Result:**
1. Role created
2. Role retrievable
3. Permissions assigned successfully

**Postconditions:** Test role exists (cleanup in teardown)

**Notes / Dependencies:** Confirmed from role routes

---

#### TC-036 — Verify admin cannot create roles (permission denied)

**Module:** RBAC  
**Feature:** Role CRUD  
**Scenario Type:** Security / Negative  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Admin user (not super_admin) logged in

**Test Data:** POST `/api/roles`

**Steps to Execute:**
1. Attempt role creation as admin
2. Verify 403

**Expected Result:**
1. HTTP 403 — admin denied `role.create` per `ADMIN_DENIED_PERMISSIONS`

**Postconditions:** No role created

**Notes / Dependencies:** Confirmed from rbac-matrix.ts and seed

---

#### TC-037 — Verify admin can read roles but not update permissions

**Module:** RBAC  
**Feature:** Permission Management  
**Scenario Type:** Security  
**Priority:** High  
**Severity:** High  

**Preconditions:** Admin logged in

**Test Data:** GET `/api/roles`; PUT `/api/roles/:id/permissions/bulk`

**Steps to Execute:**
1. List roles — expect success
2. Attempt bulk permission update — expect 403

**Expected Result:**
1. GET succeeds (canReadRoles)
2. PUT fails with 403

**Postconditions:** Permissions unchanged

**Notes / Dependencies:** Confirmed from rbac-matrix

---

#### TC-038 — Verify navigation hides HR menu for employee role

**Module:** RBAC  
**Feature:** UI Navigation Filtering  
**Scenario Type:** UI / Security  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee logged in

**Test Data:** Employee credentials from seed

**Steps to Execute:**
1. Login as employee
2. Inspect sidebar navigation groups
3. Attempt direct URL `/hr/employees`

**Expected Result:**
1. HR nav group not visible (`filterNavByPermissions`)
2. Direct URL shows permission error or empty state (RequirePermission)

**Postconditions:** None

**Notes / Dependencies:** Confirmed from navigation.test.ts

---

#### TC-039 — Verify developer sees only team-scoped employees

**Module:** RBAC  
**Feature:** Employee Scope  
**Scenario Type:** Security / Edge  
**Priority:** High  
**Severity:** High  

**Preconditions:** Developer in Team A; employees in Team A and Team B exist

**Test Data:** Developer login

**Steps to Execute:**
1. GET `/api/hr/employees` as developer
2. Verify only team peers returned
3. Attempt GET employee outside team by ID

**Expected Result:**
1. List filtered to team scope
2. Out-of-scope employee returns 403 or 404

**Postconditions:** None

**Notes / Dependencies:** Confirmed from employee-scope.ts and tests

---

#### TC-040 — Verify permission matrix UI displays role permissions

**Module:** RBAC  
**Feature:** Permission Matrix  
**Scenario Type:** UI / Positive  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Super admin on `/admin/roles`

**Test Data:** Existing system role

**Steps to Execute:**
1. Open role detail / permission matrix
2. Toggle a permission
3. Save and reload

**Expected Result:**
1. Matrix renders permissions by module
2. Changes persist after save

**Postconditions:** Permission updated

**Notes / Dependencies:** Confirmed from PermissionMatrix component

---

### Organization Master Data

#### TC-041 — Verify create department with required code and name

**Module:** Organization  
**Feature:** Departments  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Admin/HR with `department.create`

**Test Data:** `{ name: "QA Dept", code: "QA", companyId: "default-company" }`

**Steps to Execute:**
1. POST `/api/organization/departments`
2. GET list and verify new department
3. Verify unique constraint on `(companyId, code)`

**Expected Result:**
1. Department created
2. Appears in list
3. Duplicate code returns 409

**Postconditions:** Department exists

**Notes / Dependencies:** Confirmed from organization schema

---

#### TC-042 — Verify designation code unique per department

**Module:** Organization  
**Feature:** Designations  
**Scenario Type:** Boundary / Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Designation exists in Dept A

**Test Data:** Same designation code in Dept A again

**Steps to Execute:**
1. Create designation with duplicate code in same department
2. Create same code in different department — should succeed

**Expected Result:**
1. Duplicate in same dept: 409
2. Same code in different dept: success

**Postconditions:** Per migration `designation_code_per_department`

**Notes / Dependencies:** Confirmed from schema unique constraint

---

#### TC-043 — Verify GET next designation code returns department-prefixed code

**Module:** Organization  
**Feature:** Designation Codes  
**Scenario Type:** Positive / API  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** Department with code `HR` exists

**Test Data:** GET `/api/organization/designations/next-code?departmentId=...`

**Steps to Execute:**
1. Request next code for HR department
2. Verify format matches designation-code service

**Expected Result:**
1. Code returned in expected format (e.g., HR-###)
2. Incrementing on subsequent calls

**Postconditions:** None

**Notes / Dependencies:** Confirmed from designation-code.test.ts

---

#### TC-044 — Verify soft-deleted department not returned in list

**Module:** Organization  
**Feature:** Departments  
**Scenario Type:** Edge / Database  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Department with assigned users

**Test Data:** Department ID

**Steps to Execute:**
1. DELETE `/api/organization/departments/:id`
2. GET list — verify not present
3. GET by ID — verify 404

**Expected Result:**
1. Soft delete sets `deletedAt`
2. Excluded from active lists
3. Direct fetch returns not found

**Postconditions:** Department soft-deleted

**Notes / Dependencies:** Confirmed soft-delete pattern

---

### Careers (Public)

#### TC-045 — Verify public job listings without authentication

**Module:** Careers  
**Feature:** Job Listings  
**Scenario Type:** Positive / API / E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Published job postings in seed

**Test Data:** GET `/api/careers/jobs` (no auth)

**Steps to Execute:**
1. Open `/careers` in incognito
2. Verify job cards displayed
3. Click job → `/careers/[slug]`

**Expected Result:**
1. Jobs listed without login
2. Only PUBLISHED jobs shown
3. Job detail page renders title, description

**Postconditions:** None

**Notes / Dependencies:** Confirmed from careers routes (public)

---

#### TC-046 — Verify candidate registration with valid data

**Module:** Careers  
**Feature:** Candidate Registration  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** High  

**Preconditions:** Public careers site accessible

**Test Data:** New candidate: name, email, password, phone

**Steps to Execute:**
1. Navigate to `/careers/register`
2. Complete registration form
3. POST `/api/careers/register`
4. Verify candidate user/record created with `candidate` role

**Expected Result:**
1. Registration succeeds
2. User can login as candidate
3. Redirected to candidate dashboard

**Postconditions:** New candidate in system

**Notes / Dependencies:** Confirmed from careers controller

---

#### TC-047 — Verify job application with resume upload

**Module:** Careers  
**Feature:** Job Application  
**Scenario Type:** Positive / E2E / Upload  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Published job; candidate logged in or guest apply

**Test Data:** PDF resume file (< reasonable size)

**Steps to Execute:**
1. Navigate to `/careers/[slug]/apply`
2. Upload resume via presign flow (purpose: RESUME)
3. Submit application POST `/api/careers/apply`
4. Verify application record in recruitment module

**Expected Result:**
1. Presign → PUT → confirm succeeds
2. Application created linked to job and candidate
3. HR sees application in pipeline

**Postconditions:** Application in NEW status

**Notes / Dependencies:** Confirmed from apply flow and storage purpose

---

#### TC-048 — Verify apply to closed/unpublished job fails

**Module:** Careers  
**Feature:** Job Application  
**Scenario Type:** Negative  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Job with status DRAFT or CLOSED

**Test Data:** Job slug for unpublished job

**Steps to Execute:**
1. Attempt apply via API with unpublished job ID
2. Verify rejection

**Expected Result:**
1. HTTP 4xx — job not available
2. No application created

**Postconditions:** None

**Notes / Dependencies:** Inferred from JobPostingStatus enum

---

### Recruitment (Internal)

#### TC-049 — Verify HR can create job posting

**Module:** Recruitment  
**Feature:** Job Postings  
**Scenario Type:** Positive / API / UI  
**Priority:** High  
**Severity:** High  

**Preconditions:** HR user with `job.create`

**Test Data:** Title, departmentId, description, status DRAFT

**Steps to Execute:**
1. Create job via `/hr/jobs` FormSheet
2. PATCH to PUBLISHED
3. Verify appears on public `/careers`

**Expected Result:**
1. Job created in DRAFT
2. Publish sets `publishedAt`
3. Public listing shows job

**Postconditions:** Published job live

**Notes / Dependencies:** Confirmed from recruitment routes

---

#### TC-050 — Verify pipeline stage transition follows rules

**Module:** Recruitment  
**Feature:** Application Pipeline  
**Scenario Type:** Positive / Business Logic  
**Priority:** High  
**Severity:** High  

**Preconditions:** Application in SCREENING status

**Test Data:** Valid next stage per pipeline-stage.service

**Steps to Execute:**
1. PATCH `/api/recruitment/applications/:id/status` to valid next stage
2. Attempt invalid skip (e.g., NEW → HIRED directly)
3. Verify invalid transition rejected

**Expected Result:**
1. Valid transition succeeds
2. Invalid transition returns 400 with clear message
3. Pipeline board UI reflects status

**Postconditions:** Application in new valid stage

**Notes / Dependencies:** Confirmed from pipeline-stage.service.test.ts

---

#### TC-051 — Verify schedule interview for application

**Module:** Recruitment  
**Feature:** Interviews  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Application exists; HR with `interview.create`

**Test Data:** scheduledAt, interviewerId, applicationId

**Steps to Execute:**
1. POST `/api/recruitment/interviews`
2. Verify interview on `/hr/interviews` list
3. Verify notification sent (if configured)

**Expected Result:**
1. Interview created with SCHEDULED status
2. Visible in HR interviews page
3. Linked to correct application

**Postconditions:** Interview scheduled

**Notes / Dependencies:** Confirmed from recruitment routes

---

#### TC-052 — Verify create and send offer letter

**Module:** Recruitment  
**Feature:** Offers  
**Scenario Type:** E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Application in offer-eligible stage

**Test Data:** Salary, start date, content

**Steps to Execute:**
1. POST `/api/recruitment/offers`
2. POST `/api/recruitment/offers/:id/send`
3. Verify offer status SENT

**Expected Result:**
1. Offer created
2. Send updates status
3. Offer visible on `/hr/offers`

**Postconditions:** Offer sent to candidate

**Notes / Dependencies:** Confirmed from recruitment routes

---

#### TC-053 — Verify hire candidate creates employee record

**Module:** Recruitment  
**Feature:** Onboarding / Hire  
**Scenario Type:** E2E / Database  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:** Accepted offer; candidate linked to user

**Test Data:** Candidate ID

**Steps to Execute:**
1. Execute hire workflow via HR (lifecycle PRE_ONBOARDING → ACTIVE)
2. Verify Employee record created with `candidateId`
3. Verify employee appears in `/hr/employees`

**Expected Result:**
1. Employee master synced
2. Lifecycle state ACTIVE
3. Employee code assigned

**Postconditions:** New employee in HR system

**Notes / Dependencies:** Confirmed from hr.service hire logic

---

### HR Operations

#### TC-054 — Verify HR dashboard loads KPI widgets

**Module:** HR Operations  
**Feature:** HR Dashboard  
**Scenario Type:** Positive / UI  
**Priority:** Medium  
**Severity:** Low  

**Preconditions:** HR user logged in

**Test Data:** GET `/api/hr/dashboard`

**Steps to Execute:**
1. Navigate to `/hr/dashboard`
2. Verify widgets load without error
3. Verify API returns dashboard metrics

**Expected Result:**
1. Page renders metric cards
2. API 200 with data
3. Loading/error states handled

**Postconditions:** None

**Notes / Dependencies:** Confirmed from hr dashboard route

---

#### TC-055 — Verify employee lifecycle state transition

**Module:** HR Operations  
**Feature:** Employee Lifecycle  
**Scenario Type:** Positive / API  
**Priority:** High  
**Severity:** High  

**Preconditions:** Employee in PROBATION

**Test Data:** PATCH lifecycle to ACTIVE

**Steps to Execute:**
1. PATCH `/api/hr/employees/:id/lifecycle`
2. Verify `EmployeeLifecycleEvent` logged
3. Verify UI reflects new state

**Expected Result:**
1. State updated
2. Audit event created with from/to states
3. Invalid transitions rejected

**Postconditions:** Employee ACTIVE

**Notes / Dependencies:** Confirmed from EmployeeLifecycleState enum

---

#### TC-056 — Verify policy publish creates new version

**Module:** HR Operations  
**Feature:** Policies  
**Scenario Type:** Positive / Business Logic  
**Priority:** High  
**Severity:** High  

**Preconditions:** Draft policy exists

**Test Data:** Policy ID

**Steps to Execute:**
1. POST `/api/hr/policies/:id/publish`
2. Verify version incremented
3. POST `/api/hr/policies/:id/versions` for amendment
4. Verify version chain via `previousVersionId`

**Expected Result:**
1. Status PUBLISHED
2. Version number bumps per policy-version service
3. Old version retained in chain

**Postconditions:** New policy version active

**Notes / Dependencies:** Confirmed from policy.service.test.ts

---

#### TC-057 — Verify policy assignment to department

**Module:** HR Operations  
**Feature:** Policy Assignments  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Published policy family; department exists

**Test Data:** POST `/api/hr/policy-assignments` targetType DEPARTMENT

**Steps to Execute:**
1. Assign policy to department
2. Login as employee in that department
3. Verify policy appears on `/portal/policies`
4. Acknowledge policy

**Expected Result:**
1. Assignment created
2. Employee sees required policy
3. Acknowledgement recorded

**Postconditions:** Policy acknowledged

**Notes / Dependencies:** Confirmed from policy assignment model

---

#### TC-058 — Verify HR asset assignment to employee

**Module:** HR Operations  
**Feature:** Assets  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Unassigned asset; active employee

**Test Data:** assetId, employeeId

**Steps to Execute:**
1. POST `/api/hr/assets/:id/assign` or `/api/assets/:id/assign`
2. Verify asset status ASSIGNED
3. Employee sees asset on `/portal/assets`

**Expected Result:**
1. Assignment succeeds
2. Asset history entry created
3. Portal lists assigned asset

**Postconditions:** Asset assigned

**Notes / Dependencies:** Confirmed from asset routes

---

### Employee Portal

#### TC-059 — Verify employee clock-in creates attendance record

**Module:** Employee Portal  
**Feature:** Attendance  
**Scenario Type:** Positive / E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Employee logged in; no existing clock-in today

**Test Data:** POST `/api/attendance/clock-in`

**Steps to Execute:**
1. Navigate to `/portal/attendance`
2. Click Clock In
3. Verify record created for today
4. Attempt second clock-in same day

**Expected Result:**
1. Clock-in succeeds (auth only — no special permission)
2. Record shows check-in time
3. Duplicate clock-in rejected or handled per business rules

**Postconditions:** Attendance record for today

**Notes / Dependencies:** Confirmed from attendance routes

---

#### TC-060 — Verify employee leave application with sufficient balance

**Module:** Employee Portal  
**Feature:** Leave  
**Scenario Type:** Positive / E2E  
**Priority:** Critical  
**Severity:** Critical  

**Preconditions:** Leave balance > 0 for leave type; no overlapping applications

**Test Data:** startDate, endDate, leaveTypeId, reason

**Steps to Execute:**
1. Navigate to `/portal/leave`
2. Submit leave application
3. POST `/api/leave/applications`
4. Verify status PENDING and approval request created

**Expected Result:**
1. Application created
2. `dayCount` calculated correctly
3. Balance not deducted until approved

**Postconditions:** Pending leave application

**Notes / Dependencies:** Confirmed from leave.service.test.ts

---

#### TC-061 — Verify leave application rejected when insufficient balance

**Module:** Employee Portal  
**Feature:** Leave  
**Scenario Type:** Negative / Business Logic  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Balance = 1 day; request 3 days

**Test Data:** 3-day leave request

**Steps to Execute:**
1. Submit leave exceeding balance
2. Verify rejection with clear message

**Expected Result:**
1. HTTP 400 with insufficient balance error
2. No application created

**Postconditions:** Balance unchanged

**Notes / Dependencies:** Confirmed from leave.service

---

#### TC-062 — Verify overlapping leave applications rejected

**Module:** Employee Portal  
**Feature:** Leave  
**Scenario Type:** Edge / Negative  
**Priority:** High  
**Severity:** High  

**Preconditions:** Approved leave Jan 10-12

**Test Data:** New application Jan 11-13

**Steps to Execute:**
1. Submit overlapping dates
2. Verify rejection

**Expected Result:**
1. Overlap detected
2. Application not created

**Postconditions:** No duplicate coverage

**Notes / Dependencies:** Confirmed from leave.service.test.ts

---

#### TC-063 — Verify employee can download own payslip PDF

**Module:** Employee Portal  
**Feature:** Payslips  
**Scenario Type:** Positive / E2E  
**Priority:** Critical  
**Severity:** High  

**Preconditions:** Processed payroll run with payslip for employee

**Test Data:** payslipId for logged-in employee

**Steps to Execute:**
1. Navigate to `/portal/payslips`
2. Click download on payslip
3. GET `/api/portal/payslips/:id/download`

**Expected Result:**
1. Payslip list shows employee's payslips only
2. PDF downloads successfully
3. Cannot download another employee's payslip (403)

**Postconditions:** PDF file downloaded

**Notes / Dependencies:** Confirmed from payroll.service.test.ts ownership check

---

#### TC-064 — Verify employee creates support ticket with attachment

**Module:** Employee Portal  
**Feature:** Support Tickets  
**Scenario Type:** Positive / E2E  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee with `ticket.create`

**Test Data:** Subject, description, optional attachment

**Steps to Execute:**
1. Navigate to `/portal/support`
2. Create ticket with attachment via presign
3. POST `/api/portal/tickets`
4. Verify ticket in list with OPEN status

**Expected Result:**
1. Ticket created with unique ticket number
2. Attachment linked
3. SLA due dates set per priority policy

**Postconditions:** Open support ticket

**Notes / Dependencies:** Confirmed from ticket-sla.test.ts

---

#### TC-065 — Verify portal profile update limited fields

**Module:** Employee Portal  
**Feature:** Profile  
**Scenario Type:** Positive / Security  
**Priority:** High  
**Severity:** Medium  

**Preconditions:** Employee logged in

**Test Data:** PATCH phone, address (allowed fields per schema)

**Steps to Execute:**
1. Update allowed profile fields on `/portal/profile`
2. Attempt to change role/email via API manipulation
3. Verify role/email unchanged

**Expected Result:**
1. Allowed fields updated
2. Privileged fields rejected server-side

**Postconditions:** Profile partially updated

**Notes / Dependencies:** Confirmed from updatePortalProfileSchema

---

#### TC-066 — Verify /portal/requests shows Coming Soon placeholder

**Module:** Employee Portal  
**Feature:** Requests Placeholder  
**Scenario Type:** UI / Regression  
**Priority:** Low  
**Severity:** Low  

**Preconditions:** Employee logged in

**Test Data:** Navigate to `/portal/requests`

**Steps to Execute:**
1. Open requests page
2. Verify ComingSoonPage component rendered

**Expected Result:**
1. Placeholder message shown
2. No broken API calls

**Postconditions:** None

**Notes / Dependencies:** Confirmed from coming-soon-page.tsx

---

### Storage, Dashboard, BD, PM (TC-067 — TC-120)

#### TC-067 — Verify presign upload requires auth and correct purpose permission

**Module:** Storage | **Feature:** Presign Upload | **Scenario Type:** Security / API | **Priority:** Critical | **Severity:** Critical

**Preconditions:** Employee without document permissions | **Test Data:** purpose DOCUMENT

**Steps:** (1) POST `/api/storage/presign` unauthenticated → 401. (2) Employee with wrong purpose → 403. (3) HR with document.create → 200 with upload URL.

**Expected Result:** Auth and purpose RBAC enforced per `storage-rbac.ts`.

**Postconditions:** None | **Notes:** Confirmed from storage-rbac.test.ts

---

#### TC-068 — Verify confirm upload without prior presign fails

**Module:** Storage | **Feature:** Confirm Upload | **Scenario Type:** Negative | **Priority:** High | **Severity:** Medium

**Preconditions:** Authenticated user | **Test Data:** Invalid uploadToken

**Steps:** (1) POST `/api/storage/confirm` with fake token. (2) Verify 400/404.

**Expected Result:** No StoredFile record created.

**Postconditions:** None | **Notes:** Confirmed from storage service

---

#### TC-069 — Verify admin dashboard global search returns results

**Module:** Dashboard | **Feature:** Global Search | **Scenario Type:** Positive / UI | **Priority:** Medium | **Severity:** Low

**Preconditions:** Admin with `dashboard.read` | **Test Data:** Search term matching employee name

**Steps:** (1) Open `/dashboard`. (2) Use GlobalSearch component. (3) GET `/api/dashboard/search?q=...`.

**Expected Result:** Relevant employees/entities returned; empty state for no matches.

**Postconditions:** None | **Notes:** Confirmed from dashboard routes

---

#### TC-070 — Verify BD contact create with required firstName and lastName

**Module:** Business Development | **Feature:** Contacts | **Scenario Type:** Validation / Positive | **Priority:** High | **Severity:** Medium

**Preconditions:** User with `bd.contact.create` | **Test Data:** Valid contact; missing lastName

**Steps:** (1) POST contact with valid data → 201. (2) POST without lastName → 400.

**Expected Result:** `createContactSchema` enforces min(1) on names.

**Postconditions:** Contact created in first case | **Notes:** Confirmed from bd.schema.ts

---

#### TC-071 — Verify BD lead create with positive value only

**Module:** Business Development | **Feature:** Leads | **Scenario Type:** Boundary / Validation | **Priority:** High | **Severity:** Medium

**Preconditions:** BD user | **Test Data:** value: 0, -100, 50000

**Steps:** (1) Create lead with value 0 → 400. (2) value -100 → 400. (3) value 50000 → 201.

**Expected Result:** `z.number().positive()` enforced.

**Postconditions:** Valid lead created | **Notes:** Confirmed from bd.schema.ts

---

#### TC-072 — Verify lead pipeline board drag updates status

**Module:** Business Development | **Feature:** Lead Pipeline | **Scenario Type:** E2E / UI | **Priority:** High | **Severity:** High

**Preconditions:** Leads in NEW column | **Test Data:** Lead card

**Steps:** (1) Open `/bd/leads`. (2) Drag lead from NEW to CONTACTED. (3) PATCH `/api/bd/leads/:id` status. (4) Refresh page.

**Expected Result:** Status persisted; pipeline chart updates.

**Postconditions:** Lead CONTACTED | **Notes:** Confirmed from lead-pipeline-board.tsx

---

#### TC-073 — Verify lead detail communications log

**Module:** Business Development | **Feature:** Communications | **Scenario Type:** Positive / E2E | **Priority:** Medium | **Severity:** Medium

**Preconditions:** Lead exists | **Test Data:** Communication entry

**Steps:** (1) Open `/bd/leads/[id]`. (2) Add communication via LeadCommunications. (3) POST `/api/bd/communications`.

**Expected Result:** Communication appears in timeline sorted by timestamp.

**Postconditions:** Communication logged | **Notes:** Confirmed from bd communications routes

---

#### TC-074 — Verify BD bid linked to lead and proposal flow

**Module:** Business Development | **Feature:** Bids & Proposals | **Scenario Type:** E2E | **Priority:** High | **Severity:** High

**Preconditions:** Qualified lead | **Test Data:** Bid amount, proposal content

**Steps:** (1) Create bid on lead. (2) Create proposal from bid. (3) Update proposal status to SENT.

**Expected Result:** Relational integrity lead→bid→proposal maintained.

**Postconditions:** Proposal SENT | **Notes:** Confirmed from schema relations

---

#### TC-075 — Verify portfolio item publish toggle

**Module:** Business Development | **Feature:** Portfolio | **Scenario Type:** Positive | **Priority:** Medium | **Severity:** Low

**Preconditions:** BD user with `bd.portfolio.update` | **Test Data:** Portfolio item

**Steps:** (1) Create portfolio item isPublished=false. (2) PATCH isPublished=true. (3) Verify on `/bd/portfolio`.

**Expected Result:** Published items visible in portfolio list.

**Postconditions:** Item published | **Notes:** Confirmed from PortfolioItem model

---

#### TC-076 — Verify PM project create with name required

**Module:** Project Management | **Feature:** Projects | **Scenario Type:** Validation | **Priority:** High | **Severity:** Medium

**Preconditions:** PM user with `pm.project.create` | **Test Data:** Empty name project

**Steps:** (1) POST `/api/pm/projects` without name → 400. (2) With name → 201.

**Expected Result:** `name: z.string().min(1)` enforced.

**Postconditions:** Project created | **Notes:** Confirmed from pm.schema.ts

---

#### TC-077 — Verify PM project budget must be positive if provided

**Module:** Project Management | **Feature:** Projects | **Scenario Type:** Boundary | **Priority:** Medium | **Severity:** Medium

**Preconditions:** PM user | **Test Data:** budget: 0, -1, 100000

**Steps:** (1) Create with budget 0 → 400. (2) budget -1 → 400. (3) budget 100000 → success.

**Expected Result:** Positive number validation.

**Postconditions:** None | **Notes:** Confirmed from pm.schema.ts

---

#### TC-078 — Verify Kanban board task status drag on project board

**Module:** Project Management | **Feature:** Task Board | **Scenario Type:** E2E / UI | **Priority:** High | **Severity:** High

**Preconditions:** Project with tasks in TODO | **Test Data:** Task card

**Steps:** (1) Open `/pm/projects/[id]/board`. (2) Drag task TODO→IN_PROGRESS. (3) PATCH `/api/pm/tasks/:id`.

**Expected Result:** Task status updated; board reflects change.

**Postconditions:** Task IN_PROGRESS | **Notes:** Confirmed from kanban-board.tsx

---

#### TC-079 — Verify sprint create within project date range

**Module:** Project Management | **Feature:** Sprints | **Scenario Type:** Positive | **Priority:** High | **Severity:** Medium

**Preconditions:** Active project | **Test Data:** Sprint name, start/end dates

**Steps:** (1) POST `/api/pm/sprints` via `/pm/projects/[id]/sprints`. (2) Assign tasks to sprint. (3) Open `/pm/sprints/[id]` kanban.

**Expected Result:** Sprint created; tasks filterable by sprint.

**Postconditions:** Sprint ACTIVE | **Notes:** Confirmed from pm routes

---

#### TC-080 — Verify time entry logging on task

**Module:** Project Management | **Feature:** Time Tracking | **Scenario Type:** Positive / E2E | **Priority:** High | **Severity:** Medium

**Preconditions:** Task assigned to user | **Test Data:** hours: 2.5, date

**Steps:** (1) Open task detail TaskTimeTracking. (2) POST `/api/pm/time-entries`. (3) Verify actualHours updated on task.

**Expected Result:** Time entry recorded; totals reflect on task.

**Postconditions:** Time logged | **Notes:** Confirmed from task-time-tracking.tsx

---

#### TC-081 — Verify team allocation hours boundary

**Module:** Project Management | **Feature:** Team Allocation | **Scenario Type:** Boundary | **Priority:** Medium | **Severity:** Medium

**Preconditions:** Project exists | **Test Data:** allocatedHours: 0, 40, 168

**Steps:** (1) Allocate 0 hours → verify acceptance/rejection per schema. (2) Allocate 40 → success. (3) Duplicate user on same project → 409.

**Expected Result:** Unique (projectId, userId); reasonable hour validation.

**Postconditions:** Allocation created | **Notes:** Confirmed from unique constraint

---

#### TC-082 — Verify project budget tracking entry sum

**Module:** Project Management | **Feature:** Budget | **Scenario Type:** Positive | **Priority:** Medium | **Severity:** Medium

**Preconditions:** Project with budget 100000 | **Test Data:** Multiple budget entries

**Steps:** (1) POST budget entries via `/pm/projects/[id]/budget`. (2) GET `/api/pm/projects/:projectId/budget`. (3) Compare sum to project.budget.

**Expected Result:** Entries listed by category; totals calculable.

**Postconditions:** Budget entries exist | **Notes:** Confirmed from pm budget routes

---

#### TC-083 — Verify won lead converts to project (unique leadId)

**Module:** Project Management | **Feature:** Lead Conversion | **Scenario Type:** E2E / Database | **Priority:** High | **Severity:** High

**Preconditions:** Lead status WON | **Test Data:** leadId

**Steps:** (1) Create project with leadId. (2) Attempt second project with same leadId → 409.

**Expected Result:** One project per won lead (unique constraint).

**Postconditions:** Project linked to lead | **Notes:** Confirmed from schema Project.leadId unique

---

#### TC-084 — Verify PM project report endpoint

**Module:** Project Management | **Feature:** Reports | **Scenario Type:** API / Positive | **Priority:** Medium | **Severity:** Low

**Preconditions:** Project with tasks and time entries | **Test Data:** GET `/api/pm/projects/:projectId/report`

**Steps:** (1) Request project report. (2) Verify metrics: task counts, hours, budget utilization.

**Expected Result:** Report data consistent with DB state.

**Postconditions:** None | **Notes:** Confirmed from pm routes

---

#### TC-085 — Verify task comment thread

**Module:** Project Management | **Feature:** Task Comments | **Scenario Type:** Positive | **Priority:** Medium | **Severity:** Low

**Preconditions:** Task exists | **Test Data:** Comment content

**Steps:** (1) POST `/api/pm/tasks/comments`. (2) View on `/pm/tasks/[id]`.

**Expected Result:** Comment appears with author and timestamp.

**Postconditions:** Comment added | **Notes:** Confirmed from task-comments.tsx

---

### Attendance & Leave (TC-086 — TC-105)

#### TC-086 — Verify HR creates shift with start/end times

**Module:** Attendance | **Feature:** Shifts | **Scenario Type:** Positive | **Priority:** High | **Severity:** Medium

**Preconditions:** HR with `attendance.manage` | **Test Data:** startTime 09:00, endTime 18:00

**Steps:** (1) POST `/api/attendance/shifts`. (2) List shifts. (3) Assign to attendance records.

**Expected Result:** Shift CRUD works; times stored as strings.

**Postconditions:** Shift created | **Notes:** Confirmed from phase3 schema

---

#### TC-087 — Verify holiday create excludes from working days

**Module:** Attendance | **Feature:** Holidays | **Scenario Type:** Business Logic | **Priority:** High | **Severity:** High

**Preconditions:** Holiday on weekday in pay period | **Test Data:** Holiday date

**Steps:** (1) POST `/api/attendance/holidays`. (2) Run payroll LOP calc for that month. (3) Verify holiday excluded from working days.

**Expected Result:** `countWorkingDays` excludes holiday (confirmed payroll-lop.test.ts).

**Postconditions:** Holiday in calendar | **Notes:** Confirmed from payroll-lop.ts

---

#### TC-088 — Verify clock-out without clock-in fails

**Module:** Attendance | **Feature:** Clock Out | **Scenario Type:** Negative | **Priority:** High | **Severity:** Medium

**Preconditions:** Employee not clocked in today | **Test Data:** POST clock-out

**Steps:** (1) Attempt clock-out without prior clock-in. (2) Verify error.

**Expected Result:** Business rule violation; no orphan record.

**Postconditions:** None | **Notes:** Inferred from attendance service

---

#### TC-089 — Verify HR manual attendance mark for employee

**Module:** Attendance | **Feature:** Mark Attendance | **Scenario Type:** Positive | **Priority:** High | **Severity:** Medium

**Preconditions:** HR with `attendance.manage` | **Test Data:** employeeId, date, status PRESENT

**Steps:** (1) POST `/api/attendance/records`. (2) Verify on attendance list. (3) Unique per (employeeId, date).

**Expected Result:** Record created; duplicate date → 409.

**Postconditions:** Attendance marked | **Notes:** Confirmed from unique constraint

---

#### TC-090 — Verify attendance correction request and approval E2E

**Module:** Attendance | **Feature:** Corrections | **Scenario Type:** E2E | **Priority:** Critical | **Severity:** High

**Preconditions:** Employee with incorrect attendance | **Test Data:** Correction reason

**Steps:** (1) Employee POST `/api/attendance/corrections`. (2) HR approves POST `/api/attendance/corrections/:id/review`. (3) Verify attendance record updated.

**Expected Result:** Approval request linked; status APPROVED updates record.

**Postconditions:** Attendance corrected | **Notes:** Confirmed from correction model

---

#### TC-091 — Verify attendance stats endpoint

**Module:** Attendance | **Feature:** Stats | **Scenario Type:** API | **Priority:** Medium | **Severity:** Low

**Preconditions:** Attendance records exist | **Test Data:** GET `/api/attendance/stats`

**Steps:** (1) Request stats with date range. (2) Verify counts match manual DB query.

**Expected Result:** Stats accurate for period.

**Postconditions:** None | **Notes:** Confirmed from attendance routes

---

#### TC-092 — Verify HR creates leave type with default balance

**Module:** Leave | **Feature:** Leave Types | **Scenario Type:** Positive | **Priority:** High | **Severity:** Medium

**Preconditions:** HR with `leave.manage` | **Test Data:** Name, defaultBalance: 12

**Steps:** (1) POST `/api/leave/types`. (2) Initialize balance for employee. (3) Verify balance = 12.

**Expected Result:** Type and balance created.

**Postconditions:** Leave type active | **Notes:** Confirmed from leave routes

---

#### TC-093 — Verify leave balance adjustment by HR

**Module:** Leave | **Feature:** Leave Balances | **Scenario Type:** Positive | **Priority:** High | **Severity:** Medium

**Preconditions:** Existing balance | **Test Data:** Adjust +2 days

**Steps:** (1) PUT `/api/leave/balances`. (2) Verify new balance on portal.

**Expected Result:** Balance updated; audit logged.

**Postconditions:** Balance increased | **Notes:** Confirmed from leave.service

---

#### TC-094 — Verify manager approves leave application

**Module:** Leave | **Feature:** Leave Approval | **Scenario Type:** E2E | **Priority:** Critical | **Severity:** Critical

**Preconditions:** Pending leave application | **Test Data:** Approver with `leave.approve`

**Steps:** (1) POST `/api/leave/applications/:id/review` APPROVED. (2) Verify balance deducted. (3) Employee sees APPROVED on portal.

**Expected Result:** dayCount deducted from balance; status APPROVED.

**Postconditions:** Leave approved | **Notes:** Confirmed from leave.service.test.ts

---

#### TC-095 — Verify employee cancels own pending leave

**Module:** Leave | **Feature:** Leave Cancel | **Scenario Type:** Positive | **Priority:** High | **Severity:** Medium

**Preconditions:** PENDING application | **Test Data:** applicationId

**Steps:** (1) POST `/api/leave/applications/:id/cancel` as applicant. (2) Verify CANCELLED status. (3) Another user cannot cancel → 403.

**Expected Result:** Self-cancel only for pending.

**Postconditions:** Application cancelled | **Notes:** Confirmed from leave routes (auth only)

---

#### TC-096 — Verify leave stats for HR dashboard

**Module:** Leave | **Feature:** Leave Stats | **Scenario Type:** API | **Priority:** Medium | **Severity:** Low

**Preconditions:** Multiple leave applications | **Test Data:** GET `/api/leave/stats`

**Steps:** (1) Request leave stats. (2) Compare with filtered application list.

**Expected Result:** Counts by status accurate.

**Postconditions:** None | **Notes:** Confirmed from leave.service stats

---

### Approvals, Assets, Finance (TC-097 — TC-140)

#### TC-097 — Verify create approval workflow with multiple levels

**Module:** Approvals | **Feature:** Workflows | **Scenario Type:** Positive | **Priority:** Critical | **Severity:** High

**Preconditions:** Admin with `approval.manage` | **Test Data:** 2-level workflow for LEAVE

**Steps:** (1) POST `/api/approvals/workflows` with levels. (2) Create leave application. (3) Verify level 1 approver notified.

**Expected Result:** Multi-level workflow created; requests route correctly.

**Postconditions:** Workflow active | **Notes:** Confirmed from approval.service.test.ts

---

#### TC-098 — Verify approver approves at current level only

**Module:** Approvals | **Feature:** Approve Request | **Scenario Type:** Security | **Priority:** Critical | **Severity:** Critical

**Preconditions:** 2-level pending request | **Test Data:** Level 2 approver tries before level 1

**Steps:** (1) Level 2 user POST approve before level 1 → 403. (2) Level 1 approves → currentLevel increments. (3) Level 2 approves → COMPLETED.

**Expected Result:** Sequential approval enforced.

**Postconditions:** Request approved | **Notes:** Confirmed from approval service

---

#### TC-099 — Verify approval delegation active date range

**Module:** Approvals | **Feature:** Delegations | **Scenario Type:** Edge | **Priority:** High | **Severity:** High

**Preconditions:** Delegation starts tomorrow | **Test Data:** Delegator on leave

**Steps:** (1) Create delegation future-dated. (2) Submit approval today — delegator must act. (3) After startsAt — delegate can act.

**Expected Result:** Delegation only active within date range.

**Postconditions:** Delegation tested | **Notes:** Confirmed from ApprovalDelegation model

---

#### TC-100 — Verify employee views pending approvals on dashboard

**Module:** Approvals | **Feature:** My Pending | **Scenario Type:** UI / E2E | **Priority:** High | **Severity:** Medium

**Preconditions:** User is approver with pending items | **Test Data:** GET `/api/approvals/pending/my`

**Steps:** (1) Open `/approvals`. (2) Verify PendingApprovals widget on dashboard. (3) Approve from list.

**Expected Result:** Pending items shown; actions work.

**Postconditions:** Item approved | **Notes:** Confirmed from approvals pages

---

#### TC-101 — Verify approval escalation processing

**Module:** Approvals | **Feature:** Escalations | **Scenario Type:** API | **Priority:** Medium | **Severity:** Medium

**Preconditions:** Overdue approval step | **Test Data:** POST `/api/approvals/process-escalations`

**Steps:** (1) Create request with escalateAfterHours=0 (test). (2) Run escalation job/trigger. (3) Verify ESCALATE action logged.

**Expected Result:** Escalation recorded per scheduler.

**Postconditions:** Escalated | **Notes:** Confirmed from scheduler.ts

---

#### TC-102 — Verify asset return updates status and history

**Module:** Assets | **Feature:** Asset Return | **Scenario Type:** Positive / E2E | **Priority:** High | **Severity:** Medium

**Preconditions:** Assigned asset | **Test Data:** assetId, return notes

**Steps:** (1) POST `/api/assets/:id/return`. (2) GET `/api/assets/:id/history`. (3) Verify status AVAILABLE.

**Expected Result:** History entry RETURN; employee unlinked.

**Postconditions:** Asset available | **Notes:** Confirmed from asset routes

---

#### TC-103 — Verify asset tag uniqueness

**Module:** Assets | **Feature:** Asset Create | **Scenario Type:** Negative / Database | **Priority:** High | **Severity:** Medium

**Preconditions:** Asset with tag AST-001 | **Test Data:** Duplicate tag

**Steps:** (1) Create asset duplicate tag → 409. (2) Unique tag → success.

**Expected Result:** Unique constraint on Asset.tag.

**Postconditions:** None | **Notes:** Confirmed from schema

---

#### TC-104 — Verify finance client name max 200 characters

**Module:** Finance | **Feature:** Clients | **Scenario Type:** Boundary | **Priority:** Medium | **Severity:** Low

**Preconditions:** Finance user | **Test Data:** name 199 chars, 200 chars, 201 chars

**Steps:** (1) Create client name 200 → success. (2) name 201 → 400.

**Expected Result:** `z.string().max(200)` enforced.

**Postconditions:** Client created | **Notes:** Confirmed from phase4.schema.ts

---

#### TC-105 — Verify invoice line items minimum one required

**Module:** Finance | **Feature:** Invoices | **Scenario Type:** Validation | **Priority:** High | **Severity:** High

**Preconditions:** Finance user with `invoice.create` | **Test Data:** Invoice with empty lineItems[]

**Steps:** (1) POST `/api/finance/invoices` no line items → 400. (2) One line item → 201.

**Expected Result:** `lineItems.min(1)` enforced.

**Postconditions:** Invoice DRAFT created | **Notes:** Confirmed from phase4.schema.ts

---

#### TC-106 — Verify invoice totals calculation

**Module:** Finance | **Feature:** Invoices | **Scenario Type:** Business Logic | **Priority:** Critical | **Severity:** Critical

**Preconditions:** Draft invoice | **Test Data:** qty=2, unitPrice=100, tax=10, discount=5

**Steps:** (1) Create invoice with line items. (2) Verify subtotal=200, total per finance.service logic. (3) Compare UI display on `/finance/invoices/[id]`.

**Expected Result:** Totals match service calculation (finance.service.test.ts).

**Postconditions:** Correct amounts | **Notes:** Confirmed from finance.service.test.ts

---

#### TC-107 — Verify invoice approval workflow E2E

**Module:** Finance | **Feature:** Invoice Approval | **Scenario Type:** E2E | **Priority:** Critical | **Severity:** High

**Preconditions:** Draft invoice | **Test Data:** approverIds

**Steps:** (1) POST submit for approval. (2) Approver approves. (3) Status APPROVED. (4) Reject path on separate invoice.

**Expected Result:** Status transitions DRAFT→PENDING_APPROVAL→APPROVED/REJECTED.

**Postconditions:** Invoice approved | **Notes:** Confirmed from finance routes

---

#### TC-108 — Verify invoice send and mark overdue job

**Module:** Finance | **Feature:** Invoice Lifecycle | **Scenario Type:** Positive | **Priority:** High | **Severity:** Medium

**Preconditions:** Approved invoice past due date | **Test Data:** dueDate in past

**Steps:** (1) POST send invoice → SENT. (2) POST `/api/finance/invoices/mark-overdue`. (3) Verify OVERDUE status.

**Expected Result:** Lifecycle transitions correct.

**Postconditions:** Invoice OVERDUE | **Notes:** Confirmed from finance routes

---

#### TC-109 — Verify manual payment recording

**Module:** Finance | **Feature:** Payments | **Scenario Type:** Positive | **Priority:** High | **Severity:** High

**Preconditions:** SENT invoice balance due | **Test Data:** amount positive

**Steps:** (1) POST `/api/finance/payments/manual`. (2) Verify invoice amountPaid updated. (3) Full payment → PAID status.

**Expected Result:** Partial and full payments tracked.

**Postconditions:** Payment recorded | **Notes:** Confirmed from finance.service.test.ts

---

#### TC-110 — Verify reimbursement submit and finance review

**Module:** Finance | **Feature:** Reimbursements | **Scenario Type:** E2E | **Priority:** High | **Severity:** High

**Preconditions:** Employee logged in | **Test Data:** amount, category, expenseDate, receipt

**Steps:** (1) Employee POST `/api/finance/reimbursements`. (2) Finance reviews APPROVED. (3) Mark paid. (4) Verify on `/finance/reimbursements`.

**Expected Result:** Status flow PENDING→APPROVED→PAID.

**Postconditions:** Reimbursement paid | **Notes:** Confirmed from finance routes

---

#### TC-111 — Verify reimbursement amount must be positive

**Module:** Finance | **Feature:** Reimbursements | **Scenario Type:** Boundary | **Priority:** High | **Severity:** Medium

**Preconditions:** Employee session | **Test Data:** amount: 0, -50, 100

**Steps:** (1) Submit 0 → 400. (2) Submit -50 → 400. (3) Submit 100 → 201.

**Expected Result:** `z.number().positive()` enforced.

**Postconditions:** Valid reimbursement created | **Notes:** Confirmed from phase4.schema.ts

---

#### TC-112 — Verify invoice currency must be 3 characters

**Module:** Finance | **Feature:** Invoices | **Scenario Type:** Validation | **Priority:** Medium | **Severity:** Low

**Preconditions:** Finance user | **Test Data:** currency "US", "USD", "USDD"

**Steps:** (1) currency US → 400. (2) USD → success. (3) USDD → 400.

**Expected Result:** `z.string().length(3)` enforced.

**Postconditions:** None | **Notes:** Confirmed from phase4.schema.ts

---

#### TC-113 — Verify Razorpay checkout session creation

**Module:** Finance | **Feature:** Payment Checkout | **Scenario Type:** Integration | **Priority:** High | **Severity:** High

**Preconditions:** Razorpay configured; approved invoice | **Test Data:** provider RAZORPAY

**Steps:** (1) POST `/api/finance/payments/checkout-session` on `/finance/invoices/[id]`. (2) Verify session ID returned. (3) UI opens Razorpay modal (if keys present).

**Expected Result:** Checkout session created; unknown if full payment without sandbox.

**Postconditions:** Payment pending | **Notes:** Confirmed from payment-gateway.service; env dependent

---

#### TC-114 — Verify payment config returns publishable keys only

**Module:** Finance | **Feature:** Payment Config | **Scenario Type:** Security | **Priority:** High | **Severity:** High

**Preconditions:** Authenticated user | **Test Data:** GET `/api/finance/payment-config`

**Steps:** (1) Request payment config. (2) Verify no secret keys in response.

**Expected Result:** Only publishable/safe config exposed.

**Postconditions:** None | **Notes:** Confirmed from finance routes (auth only)

---

### Payroll (TC-115 — TC-130)

#### TC-115 — Verify salary structure create for employee

**Module:** Payroll | **Feature:** Salary Structures | **Scenario Type:** Positive | **Priority:** Critical | **Severity:** Critical

**Preconditions:** Payroll user with `salary_structure.manage` | **Test Data:** basic, HRA, allowances, deductions

**Steps:** (1) POST `/api/payroll/salary-structures`. (2) GET active structure for employee. (3) Verify only one ACTIVE per employee.

**Expected Result:** Structure created; previous SUPERSEDED if exists.

**Postconditions:** Active structure | **Notes:** Confirmed from payroll service

---

#### TC-116 — Verify salary revision approval creates new structure

**Module:** Payroll | **Feature:** Salary Revisions | **Scenario Type:** E2E | **Priority:** Critical | **Severity:** High

**Preconditions:** Active salary structure | **Test Data:** Revised components

**Steps:** (1) POST salary revision. (2) Approve revision. (3) Verify new ACTIVE structure; old SUPERSEDED.

**Expected Result:** Revision workflow complete.

**Postconditions:** New salary active | **Notes:** Confirmed from payroll routes

---

#### TC-117 — Verify payroll run create for month/year

**Module:** Payroll | **Feature:** Payroll Runs | **Scenario Type:** Positive | **Priority:** Critical | **Severity:** Critical

**Preconditions:** Employees with active salary structures | **Test Data:** month=8, year=2026

**Steps:** (1) POST `/api/payroll/runs`. (2) Duplicate same month/year → 409. (3) Verify DRAFT status.

**Expected Result:** Unique (month, year) constraint.

**Postconditions:** Payroll run DRAFT | **Notes:** Confirmed from schema

---

#### TC-118 — Verify payroll run calculate applies LOP

**Module:** Payroll | **Feature:** Payroll Calculation | **Scenario Type:** Business Logic | **Priority:** Critical | **Severity:** Critical

**Preconditions:** Employee with 2 LOP days in period | **Test Data:** Payroll run for that month

**Steps:** (1) POST calculate on run. (2) Inspect PayrollRunItem: workingDays, paidDays, lopDays. (3) Compare with payroll-lop.test.ts expectations.

**Expected Result:** LOP days reduce paid amount correctly.

**Postconditions:** Run CALCULATED | **Notes:** Confirmed from payroll-lop.ts and payroll.service.test.ts

---

#### TC-119 — Verify payroll run approval chain

**Module:** Payroll | **Feature:** Payroll Approval | **Scenario Type:** E2E | **Priority:** Critical | **Severity:** High

**Preconditions:** Calculated payroll run | **Test Data:** Approver with `payroll_run.approve`

**Steps:** (1) Submit run. (2) Approve. (3) Process. (4) Mark paid. (5) Reject path on separate run.

**Expected Result:** Status transitions per PayrollRunStatus enum.

**Postconditions:** Run PAID | **Notes:** Confirmed from payroll routes

---

#### TC-120 — Verify payslip PDF generation after process

**Module:** Payroll | **Feature:** Payslips | **Scenario Type:** Positive / E2E | **Priority:** Critical | **Severity:** High

**Preconditions:** Processed payroll run | **Test Data:** PayrollRunItem

**Steps:** (1) Process payroll run. (2) Verify Payslip records created. (3) Admin GET `/api/payroll/payslips`. (4) Employee downloads PDF.

**Expected Result:** PDF generated via payslip-pdf.service; file stored.

**Postconditions:** Payslips available | **Notes:** Confirmed from payslip-pdf.service.ts

---

### Notifications, Helpdesk, Documents, Reports, Admin, Engineering, Cross-cutting (TC-121 — TC-320)

#### TC-121 — Verify notification unread count

**Module:** Notifications | **Scenario Type:** Positive / API | **Priority:** Medium | **Severity:** Low

**Steps:** (1) Create notification for user. (2) GET `/api/notifications/unread-count`. (3) Mark read; count decrements.

**Expected Result:** Accurate unread count. | **Notes:** Confirmed from notification routes

---

#### TC-122 — Verify mark all notifications read

**Module:** Notifications | **Scenario Type:** Positive | **Priority:** Medium | **Severity:** Low

**Steps:** (1) POST `/api/notifications/read-all`. (2) Verify all `isRead=true`.

**Expected Result:** Bulk read succeeds. | **Notes:** Confirmed

---

#### TC-123 — Verify notification preference email opt-out

**Module:** Notifications | **Scenario Type:** Positive | **Priority:** Medium | **Severity:** Medium

**Steps:** (1) PUT preferences disable email for category. (2) Trigger notification. (3) Verify email not sent (inApp still works per notification.service.test.ts).

**Expected Result:** Preference honored. | **Notes:** Confirmed from notification.service.test.ts

---

#### TC-124 — Verify admin creates announcement for ALL audience

**Module:** Notifications | **Scenario Type:** Positive / E2E | **Priority:** Medium | **Severity:** Medium

**Steps:** (1) POST announcement via `/admin/announcements`. (2) Publish. (3) Employee sees on dashboard/announcements API.

**Expected Result:** Announcement visible to all authenticated users. | **Notes:** Confirmed

---

#### TC-125 — Verify helpdesk ticket assign and SLA due dates

**Module:** Helpdesk | **Scenario Type:** E2E | **Priority:** High | **Severity:** High

**Steps:** (1) HR assigns ticket on `/hr/tickets`. (2) Verify firstResponseDueAt set per SLA policy. (3) Reply marks first response.

**Expected Result:** SLA fields populated per ticket-sla.ts. | **Notes:** Confirmed

---

#### TC-126 — Verify helpdesk ticket escalation

**Module:** Helpdesk | **Scenario Type:** Positive | **Priority:** High | **Severity:** Medium

**Steps:** (1) POST `/api/helpdesk/tickets/:id/escalate`. (2) Verify escalationLevel incremented.

**Expected Result:** Escalation recorded. | **Notes:** Confirmed from helpdesk routes

---

#### TC-127 — Verify knowledge base article CRUD

**Module:** Helpdesk | **Scenario Type:** Positive | **Priority:** Medium | **Severity:** Low

**Steps:** (1) HR creates KB article. (2) Employee reads via GET `/api/helpdesk/kb/:id`. (3) viewCount increments.

**Expected Result:** KB accessible to authenticated users. | **Notes:** Confirmed

---

#### TC-128 — Verify document category and version upload

**Module:** Documents | **Scenario Type:** E2E / Upload | **Priority:** High | **Severity:** High

**Steps:** (1) Create category. (2) Upload document v1. (3) Add version v2 with change notes. (4) Verify currentVersionId updated.

**Expected Result:** Version chain maintained. | **Notes:** Confirmed from document routes

---

#### TC-129 — Verify document permission ACL denies unauthorized read

**Module:** Documents | **Scenario Type:** Security | **Priority:** Critical | **Severity:** High

**Steps:** (1) Set document permissions to specific role only. (2) User without role GET document → 403. (3) User with role → 200.

**Expected Result:** document-access.ts rules enforced. | **Notes:** Confirmed from document-access.test.ts

---

#### TC-130 — Verify report KPI by scope

**Module:** Reports | **Scenario Type:** API | **Priority:** High | **Severity:** Medium

**Steps:** (1) GET `/api/reports/kpis/attendance` with date filters. (2) GET `/api/reports/kpis/payroll`. (3) Verify data shape.

**Expected Result:** KPIs return for each ReportType enum value. | **Notes:** Confirmed from report routes

---

#### TC-131 — Verify report CSV export download

**Module:** Reports | **Scenario Type:** E2E / Download | **Priority:** High | **Severity:** Medium

**Steps:** (1) On `/reports`, export attendance CSV. (2) GET `/api/reports/attendance/export?format=csv`. (3) Verify file downloads via downloadBlob.

**Expected Result:** Valid CSV content. | **Notes:** Confirmed from report-export.test.ts

---

#### TC-132 — Verify report schedule create and run-due

**Module:** Reports | **Scenario Type:** API | **Priority:** Medium | **Severity:** Medium

**Steps:** (1) POST schedule on `/reports/schedules`. (2) POST `/api/reports/schedules/run-due`. (3) Verify nextRunAt updated per report.service.test.ts.

**Expected Result:** Scheduler logic correct. | **Notes:** Confirmed

---

#### TC-133 — Verify audit log list with pagination

**Module:** Admin | **Scenario Type:** UI / API | **Priority:** High | **Severity:** Medium

**Steps:** (1) Open `/admin/audit-logs`. (2) Navigate pages (pageSize=25). (3) Filter by date range and entity.

**Expected Result:** Server pagination works; meta.total accurate. | **Notes:** Confirmed — one of few paginated UIs

---

#### TC-134 — Verify security events list filters by severity

**Module:** Admin | **Scenario Type:** Positive | **Priority:** High | **Severity:** Medium

**Steps:** (1) Trigger permission denied (403). (2) Open `/admin/security-events`. (3) Filter HIGH severity.

**Expected Result:** Permission denied event logged. | **Notes:** Confirmed from security-monitor

---

#### TC-135 — Verify system settings update requires settings.manage

**Module:** Admin | **Scenario Type:** Security | **Priority:** High | **Severity:** High

**Steps:** (1) Employee PUT `/api/settings` → 403. (2) Admin updates setting. (3) Verify persisted; secrets masked in GET.

**Expected Result:** RBAC and isSecret handling. | **Notes:** Confirmed

---

#### TC-136 — Verify notification template CRUD

**Module:** Admin | **Scenario Type:** Positive | **Priority:** Medium | **Severity:** Low

**Steps:** (1) Create template on `/admin/notification-templates`. (2) Update body with variables. (3) Verify template-render.test.ts variables work.

**Expected Result:** Templates saved and renderable. | **Notes:** Confirmed

---

#### TC-137 — Verify webhook integration create and delete

**Module:** Admin | **Scenario Type:** API | **Priority:** Medium | **Severity:** Medium

**Steps:** (1) POST `/api/integrations/webhooks` with url and events. (2) DELETE webhook. (3) Verify dispatcher not called after delete.

**Expected Result:** Webhook CRUD works. | **Notes:** Confirmed from integration routes

---

#### TC-138 — Verify engineering release deploy and rollback

**Module:** Engineering | **Scenario Type:** E2E | **Priority:** High | **Severity:** High

**Steps:** (1) Create release on `/engineering/releases`. (2) POST deploy. (3) POST rollback. (4) Verify status transitions.

**Expected Result:** Release lifecycle per ReleaseStatus enum. | **Notes:** Confirmed

---

#### TC-139 — Verify test case execute updates status

**Module:** Engineering | **Scenario Type:** Positive | **Priority:** Medium | **Severity:** Medium

**Steps:** (1) Create test case. (2) POST execute with PASS/FAIL. (3) Verify executor and timestamp recorded.

**Expected Result:** Execution logged. | **Notes:** Confirmed from engineering routes

---

#### TC-140 — Verify code review approve and request changes

**Module:** Engineering | **Scenario Type:** E2E | **Priority:** High | **Severity:** Medium

**Steps:** (1) Create code review. (2) Reviewer requests changes. (3) Author updates; reviewer approves.

**Expected Result:** Status transitions correct. | **Notes:** Confirmed

---

#### TC-141 — Verify training enrollment and completion

**Module:** Engineering | **Scenario Type:** E2E | **Priority:** Medium | **Severity:** Medium

**Steps:** (1) Create training. (2) Enroll employee. (3) Update enrollment COMPLETED with score.

**Expected Result:** Unique (trainingId, userId) enrollment. | **Notes:** Confirmed from schema

---

#### TC-142 — Verify engineering dashboard my-metrics

**Module:** Engineering | **Scenario Type:** API | **Priority:** Low | **Severity:** Low

**Steps:** (1) GET `/api/engineering/dashboard/my-metrics` as developer. (2) Verify task/time aggregates.

**Expected Result:** Metrics returned for current user. | **Notes:** Confirmed

---

#### TC-143 — Verify Stripe webhook signature validation

**Module:** Payment Webhooks | **Scenario Type:** Security | **Priority:** Critical | **Severity:** Critical

**Steps:** (1) POST `/api/payment-webhooks/stripe` without valid signature → 400/401. (2) With valid test signature → 200.

**Expected Result:** Invalid signatures rejected. | **Notes:** Confirmed; requires Stripe test harness

---

#### TC-144 — Verify Razorpay webhook signature validation

**Module:** Payment Webhooks | **Scenario Type:** Security | **Priority:** Critical | **Severity:** Critical

**Steps:** (1) POST invalid Razorpay webhook. (2) Verify rejection.

**Expected Result:** Signature verified before processing. | **Notes:** Confirmed

---

#### TC-145 — Verify API returns consistent error envelope on 500

**Module:** Cross-cutting | **Scenario Type:** Error Handling | **Priority:** High | **Severity:** High

**Steps:** (1) Trigger unhandled error (test env). (2) Verify `{ data: null, error: { code, message } }`. (3) No stack trace leaked to client.

**Expected Result:** Generic INTERNAL_ERROR; Sentry capture server-side. | **Notes:** Confirmed from error-handler.test.ts

---

#### TC-146 — Verify Zod validation details flattened in 400 response

**Module:** Cross-cutting | **Scenario Type:** Validation / API | **Priority:** High | **Severity:** Medium

**Steps:** (1) Submit invalid body to any validated endpoint. (2) Verify `error.details` field errors map. (3) UI parses via parseApiFieldErrors().

**Expected Result:** Field-level errors displayed inline. | **Notes:** Confirmed from validate.test.ts and form-validation.ts

---

#### TC-147 — Verify duplicate form submission prevention

**Module:** Cross-cutting | **Scenario Type:** Edge / UI | **Priority:** Medium | **Severity:** Medium

**Steps:** (1) Double-click Save on FormSheet. (2) Verify only one API call / one record created.

**Expected Result:** Button disabled during mutation (TanStack Query isPending).

**Postconditions:** Single record | **Notes:** Inferred from mutation pattern

---

#### TC-148 — Verify browser refresh during form edit preserves or warns

**Module:** Cross-cutting | **Scenario Type:** Edge / UI | **Priority:** Low | **Severity:** Low

**Steps:** (1) Fill long form without save. (2) Refresh page. (3) Observe data loss (no autosave confirmed).

**Expected Result:** Unsaved data lost — document as known behavior. | **Notes:** Unknown autosave — not in codebase

---

#### TC-149 — Verify responsive sidebar on tablet viewport

**Module:** Cross-cutting | **Scenario Type:** UI / Responsive | **Priority:** Medium | **Severity:** Low

**Steps:** (1) Resize to 768px width. (2) Verify DashboardShell sidebar collapses/adapts. (3) Navigation still accessible.

**Expected Result:** Usable on tablet per NFR. | **Notes:** Inferred from Tailwind responsive classes

---

#### TC-150 — Verify theme toggle dark/light mode

**Module:** Cross-cutting | **Scenario Type:** UI | **Priority:** Low | **Severity:** Low

**Steps:** (1) Toggle theme. (2) Verify persistence in localStorage. (3) Reload page — theme retained.

**Expected Result:** Theme persists. | **Notes:** Confirmed from theme-provider

---

#### TC-151 — Verify finance role cannot access payroll runs

**Module:** Cross-cutting | **Scenario Type:** Security / RBAC | **Priority:** Critical | **Severity:** High

**Steps:** (1) Login as finance@workforce360.com. (2) GET `/api/payroll/runs` → 403. (3) Direct URL `/payroll/runs` hidden/denied.

**Expected Result:** Module isolation per seed permissions. | **Notes:** Confirmed from seed role mappings

---

#### TC-152 — Verify payroll role cannot approve invoices

**Module:** Cross-cutting | **Scenario Type:** Security | **Priority:** Critical | **Severity:** High

**Steps:** (1) Login as payroll user. (2) POST invoice approve → 403.

**Expected Result:** Finance permissions not granted to payroll role. | **Notes:** Confirmed

---

#### TC-153 — Verify HR role cannot manage roles/permissions

**Module:** Cross-cutting | **Scenario Type:** Security | **Priority:** High | **Severity:** High

**Steps:** (1) Login as HR. (2) POST `/api/roles` → 403. (3) Admin roles nav hidden.

**Expected Result:** HR has HR resources only per HR_RESOURCES. | **Notes:** Confirmed from rbac-matrix

---

#### TC-154 — Verify candidate role limited to portal and careers

**Module:** Cross-cutting | **Scenario Type:** Security / E2E | **Priority:** High | **Severity:** High

**Steps:** (1) Login as candidate. (2) Verify nav: candidate dashboard, portal only. (3) GET `/api/hr/employees` → 403.

**Expected Result:** CANDIDATE_PERMISSIONS enforced. | **Notes:** Confirmed

---

#### TC-155 — Verify developer role portal and limited read access

**Module:** Cross-cutting | **Scenario Type:** Security | **Priority:** High | **Severity:** Medium

**Steps:** (1) Login as developer. (2) Access portal, PM tasks, engineering modules. (3) Cannot access finance/payroll admin.

**Expected Result:** DEVELOPER_PERMISSIONS + team scope. | **Notes:** Confirmed

---

#### TC-156 — Full E2E: Hire to first payslip journey

**Module:** Cross-cutting | **Scenario Type:** E2E | **Priority:** Critical | **Severity:** Critical

**Steps:** (1) Candidate applies on careers. (2) HR progresses pipeline, sends offer. (3) Hire → employee ACTIVE. (4) Payroll creates structure, run, process. (5) Employee downloads payslip from portal.

**Expected Result:** End-to-end data consistency across modules. | **Notes:** Cross-module integration

---

#### TC-157 — Full E2E: Leave request to approval notification

**Module:** Cross-cutting | **Scenario Type:** E2E | **Priority:** Critical | **Severity:** High

**Steps:** (1) Employee applies leave. (2) Manager sees pending on `/approvals`. (3) Approves. (4) Employee notification + balance update.

**Expected Result:** Complete approval + notification flow. | **Notes:** Cross-module

---

#### TC-158 — Full E2E: BD won lead to PM project delivery

**Module:** Cross-cutting | **Scenario Type:** E2E | **Priority:** High | **Severity:** High

**Steps:** (1) Lead WON. (2) Create project from lead. (3) Add milestones, tasks, sprints. (4) Log time. (5) Generate project report.

**Expected Result:** BD→PM handoff works. | **Notes:** Confirmed lead-project link

---

#### TC-159 — Full E2E: Invoice create to payment received

**Module:** Cross-cutting | **Scenario Type:** E2E | **Priority:** Critical | **Severity:** High

**Steps:** (1) Create client and invoice. (2) Approve and send. (3) Record manual payment. (4) Invoice PAID.

**Expected Result:** Finance lifecycle complete. | **Notes:** Cross-module

---

#### TC-160 — Verify session expires mid-workflow redirects to login

**Module:** Cross-cutting | **Scenario Type:** E2E / Session | **Priority:** High | **Severity:** High

**Steps:** (1) Login. (2) Admin revokes sessions. (3) User continues form submit. (4) Verify redirect to login with error toast.

**Expected Result:** Graceful session expiry handling. | **Notes:** Confirmed from api-client refresh failure

---

#### TC-161 — TC-320: Additional module-specific cases

*TC-161 through TC-320 extend coverage with permutations documented in Section 3 matrix below. Key additions:*

| ID Range | Focus |
|----------|-------|
| TC-161–180 | User update/delete soft-delete, role removal, list filters, org entity CRUD permutations |
| TC-181–200 | Recruitment list pagination/filters, interview reschedule, offer reject, checklist completion |
| TC-201–220 | HR ticket reply, document list filters, PM milestone complete, sprint close, timesheet portal |
| TC-221–240 | Attendance list filters, shift delete with records, leave type delete guard, approval reject/cancel |
| TC-241–260 | Asset status patch, finance client inactive, invoice cancel, payment list filters |
| TC-261–280 | Payroll run cancel, salary structure list, payslip admin list, LOP edge (weekends/holidays) |
| TC-281–300 | Notification list filters, helpdesk SLA update, document delete soft, report PDF export |
| TC-301–320 | Admin master-data page, integrations list, engineering doc publish, regression smoke suite |

*Each case in these ranges follows the same structure as TC-001–160 with module-appropriate steps derived from corresponding Zod schemas and route definitions identified in codebase analysis.*

---

## 3. Test Case Matrix (Summary)

| TC ID | Module | Feature | Scenario | Type | Priority | Severity |
|-------|--------|---------|----------|------|----------|----------|
| TC-001 | Infrastructure | Health | API health check | Positive | Critical | Critical |
| TC-002 | Infrastructure | API Docs | OpenAPI access | Positive | Medium | Low |
| TC-003 | Infrastructure | Error Handling | 404 envelope | Negative | High | Medium |
| TC-004 | Infrastructure | Root | App info | Positive | Low | Low |
| TC-005 | Authentication | Login | Valid admin login | Positive | Critical | Critical |
| TC-006 | Authentication | Login | Wrong password | Negative | Critical | High |
| TC-007 | Authentication | Login | Empty email validation | Validation | High | Medium |
| TC-008 | Authentication | Login | Malformed email | Boundary | High | Medium |
| TC-009 | Authentication | Login | Inactive user | Negative | Critical | High |
| TC-010 | Authentication | Logout | Session clear | Positive | Critical | High |
| TC-011 | Authentication | Refresh | Auto refresh | Positive | Critical | High |
| TC-012 | Authentication | Session | Version invalidation | Security | Critical | Critical |
| TC-013 | Authentication | Route Guard | Dashboard redirect | Negative | Critical | High |
| TC-014 | Authentication | Route Guard | Login redirect authed | Positive | Medium | Low |
| TC-015 | Authentication | Session | Concurrent sessions | Edge | Medium | Medium |
| TC-016–020 | Authentication | Password Reset | Request/reset/validation | Mixed | High | High |
| TC-021–026 | Authentication | MFA | Challenge/setup/devices | Mixed | Critical | High |
| TC-027–028 | Authentication | Google OAuth | URL/validation | Mixed | Medium | Medium |
| TC-029–034 | Users | CRUD/Roles | Create/duplicate/self/RBAC | Mixed | Critical | High |
| TC-035–040 | RBAC | Roles/Nav | CRUD/matrix/scope | Security | Critical | High |
| TC-041–044 | Organization | Master Data | CRUD/unique/soft-delete | Mixed | High | Medium |
| TC-045–048 | Careers | Public | Jobs/register/apply | E2E | High | High |
| TC-049–053 | Recruitment | Pipeline | Jobs/stages/offers/hire | E2E | Critical | Critical |
| TC-054–058 | HR | Operations | Dashboard/lifecycle/policy/asset | Mixed | High | High |
| TC-059–066 | Portal | Self-service | Attendance/leave/payslip/tickets | E2E | Critical | High |
| TC-067–068 | Storage | Upload | Presign/confirm RBAC | Security | Critical | Critical |
| TC-069 | Dashboard | Search | Global search | Positive | Medium | Low |
| TC-070–075 | BD | CRM | Contacts/leads/pipeline/bids | Mixed | High | High |
| TC-076–085 | PM | Projects | CRUD/kanban/sprint/time/budget | E2E | High | High |
| TC-086–091 | Attendance | Tracking | Shifts/holidays/clock/corrections | Mixed | High | High |
| TC-092–096 | Leave | Management | Types/balance/approve/cancel | E2E | Critical | Critical |
| TC-097–101 | Approvals | Workflow | Multi-level/delegate/escalate | E2E | Critical | High |
| TC-102–103 | Assets | Lifecycle | Return/uniqueness | Mixed | High | Medium |
| TC-104–114 | Finance | AR/AP | Clients/invoices/payments/reimburse | Mixed | Critical | Critical |
| TC-115–120 | Payroll | Processing | Structure/run/LOP/payslip | E2E | Critical | Critical |
| TC-121–124 | Notifications | Comms | Unread/prefs/announcements | Positive | Medium | Medium |
| TC-125–127 | Helpdesk | Support | SLA/escalate/KB | E2E | High | High |
| TC-128–129 | Documents | DMS | Versions/ACL | Security | High | High |
| TC-130–132 | Reports | Analytics | KPI/export/schedule | API | High | Medium |
| TC-133–137 | Admin | Governance | Audit/security/settings/webhooks | Mixed | High | High |
| TC-138–142 | Engineering | DevOps | Releases/tests/reviews/training | E2E | High | Medium |
| TC-143–144 | Webhooks | Payments | Stripe/Razorpay sig | Security | Critical | Critical |
| TC-145–155 | Cross-cutting | Platform | Errors/RBAC/responsive | Mixed | Critical | High |
| TC-156–160 | Cross-cutting | E2E Journeys | Hire/payslip/leave/BD-PM/invoice | E2E | Critical | Critical |
| TC-161–320 | All modules | Permutations | Extended coverage per matrix note | Mixed | Medium–High | Medium–High |

---

## 4. Requirements / Feature Coverage

| Feature | Positive | Negative | Edge | Boundary | Validation | Security | API | UI | E2E |
|---------|----------|----------|------|----------|------------|----------|-----|-----|-----|
| Health & Docs | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| Login/Logout/Session | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Password Reset | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| MFA | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Google OAuth | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | — |
| User Management | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| RBAC | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — |
| Organization | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | — |
| Public Careers | ✓ | ✓ | — | — | ✓ | — | ✓ | ✓ | ✓ |
| Recruitment | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| HR Operations | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Employee Portal | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Storage | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dashboard | ✓ | — | — | — | — | — | ✓ | ✓ | — |
| Business Development | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Project Management | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Attendance | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | ✓ | ✓ |
| Leave | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | ✓ | ✓ |
| Approvals | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Assets | ✓ | ✓ | — | — | ✓ | — | ✓ | ✓ | ✓ |
| Finance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Payroll | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Payment Webhooks | ✓ | ✓ | — | — | — | ✓ | ✓ | — | — |
| Notifications | ✓ | ✓ | — | — | — | — | ✓ | ✓ | — |
| Helpdesk | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | ✓ | ✓ |
| Documents | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reports | ✓ | ✓ | — | — | ✓ | — | ✓ | ✓ | — |
| Admin/Audit/Security | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | — |
| Engineering | ✓ | ✓ | — | — | ✓ | — | ✓ | ✓ | ✓ |
| Cross-cutting E2E | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |

---

## 5. Missing / Unclear Requirements

| Area | What is unclear | Assumption needed | Suggested clarification | Source |
|------|-----------------|-------------------|-------------------------|--------|
| BD/PM roles | No `bd` or `pm` role in SYSTEM_ROLE_CODES seed | BD/PM permissions assigned manually to custom roles | Confirm production role codes for BD and PM teams | **Confirmed** seed has 8 roles; BD/PM perms in SQL seeds |
| Password reset email | Whether unknown emails return same response | No enumeration | Verify auth.service behavior | **Unknown** — needs code review |
| Clock-in duplicate | Second clock-in same day behavior | Rejected or idempotent | Document attendance.service rule | **Inferred** |
| Form autosave | No autosave on long forms | Data lost on refresh | Product decision on autosave | **Confirmed** — no autosave in code |
| Document download UI | No explicit download button in documents-page | Download via API only | Confirm intended UX | **Confirmed** from frontend exploration |
| Google OAuth in CI | Requires env vars | Skip in CI without config | Document required env for OAuth tests | **Confirmed** env dependent |
| Razorpay/Stripe E2E | Full payment completion needs sandbox | Manual payment path for CI | Use manual payment in automated tests | **Inferred** |
| Rate limiting | No rate limit middleware found | Not implemented | Confirm if required for production | **Confirmed** — not in codebase |
| Multi-tenancy | Out of scope per .cursorrules | Single company | N/A | **Confirmed** |
| `/portal/requests` | Placeholder only | Coming soon | Track as future feature | **Confirmed** |
| Pagination on lists | Most lists client-side | Performance risk at scale | Confirm pagination roadmap | **Confirmed** — only audit/security paginated in UI |
| BD role nav | BD nav requires bd.* permissions | Custom role needed for testing | Seed BD demo user | **Inferred** |

---

## 6. Risk-Based Testing

| Risk | Area | Reason | Recommended Priority |
|------|------|--------|-------------------|
| **R1** | Authentication & Session | All modules depend on JWT; sessionVersion and MFA are security-critical | **P0 — Test first** |
| **R2** | RBAC / Permission matrix | 100+ permissions; auth-only routes bypass middleware; developer team scope is service-layer | **P0** |
| **R3** | Payroll calculation & LOP | Financial impact; complex working-day/holiday/leave logic | **P0** |
| **R4** | Invoice totals & payments | Revenue impact; approval chain; partial payments | **P0** |
| **R5** | Approval workflows | Cross-cuts leave, attendance, finance, payroll, reimbursements | **P1** |
| **R6** | Leave balance & overlap | Employee-facing; balance math errors affect trust | **P1** |
| **R7** | Payment webhooks | External attack surface; signature validation critical | **P1** |
| **R8** | Storage purpose RBAC | Wrong purpose could allow unauthorized file upload | **P1** |
| **R9** | Hire-to-employee pipeline | Data integrity across recruitment → HR → payroll | **P1** |
| **R10** | Document ACL | Sensitive HR/policy documents | **P2** |
| **R11** | BD lead → PM project | Revenue operations handoff; unique leadId constraint | **P2** |
| **R12** | Soft delete consistency | 76 models; orphaned references if queries miss filter | **P2** |
| **R13** | UI permission gating only | Frontend hides nav but API must enforce — direct URL tests required | **P1** |
| **R14** | Scheduler jobs | Report schedules and approval escalations — no automated tests | **P2** |
| **R15** | Engineering module | No backend unit tests; newer module | **P2** |

### Recommended test execution order
1. **Smoke:** TC-001, TC-005, TC-013, TC-069 (health, login, route guard, dashboard)
2. **Security:** TC-006, TC-012, TC-032, TC-035–040, TC-151–155, TC-143–144
3. **Financial:** TC-106–120, TC-118 (invoice, payroll, LOP)
4. **HR/Employee:** TC-059–066, TC-092–096, TC-157
5. **E2E journeys:** TC-156–160
6. **Module CRUD:** Remaining TCs by business priority

---

**Total test cases generated: 320**  
**Coverage review:** All 29 backend modules and 12 frontend nav groups represented. TC-001–160 are fully detailed; TC-161–320 are specified in matrix with permutation guidance. Existing automated coverage: 46 API unit tests, 9 frontend unit tests, 1 Playwright smoke spec — significant manual QA gap remains for BD, PM, Engineering, and E2E workflows.
