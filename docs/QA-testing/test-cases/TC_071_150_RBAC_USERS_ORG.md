# Test Cases TC-071 to TC-150 — RBAC, Users, Organization

---

## TC-071 — Super Admin can list all roles

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Positive / API  
**Priority:** Critical | **Severity:** High  
**Preconditions:** Logged in as `admin@workforce360.com` (super_admin)  
**Test Data:** None  
**Steps:** 1) `GET /api/roles` 2) Verify response  
**Expected Result:** HTTP 200; array includes super_admin, admin, hr, employee, finance, payroll, developer, candidate  
**Postconditions:** None | **Notes:** Confirmed seed roles

---

## TC-072 — Admin can create custom role with permissions

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Positive / UI / API  
**Priority:** High | **Severity:** High  
**Preconditions:** Super Admin logged in  
**Test Data:** Role name: `QA Tester`, code: `qa_tester`, permissions: `[report.read]`  
**Steps:** 1) Go `/admin/roles` 2) Create role via FormSheet 3) Assign permission 4) Verify API  
**Expected Result:** Role created; appears in list; `GET /api/roles/:id/permissions` includes assigned permission  
**Postconditions:** Custom role in DB | **Notes:** Requires `role.create`

---

## TC-073 — Non-admin cannot create role (403)

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Security / Negative / API  
**Priority:** Critical | **Severity:** Critical  
**Preconditions:** Employee user logged in (no role.create)  
**Steps:** 1) `POST /api/roles` with valid body  
**Expected Result:** HTTP 403 FORBIDDEN; security event may be logged  
**Postconditions:** No role created

---

## TC-074 — Cannot delete system role

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Negative / API  
**Priority:** High | **Severity:** High  
**Preconditions:** Super Admin logged in  
**Steps:** 1) `DELETE /api/roles/:superAdminRoleId`  
**Expected Result:** HTTP 400/403; system role `isSystem: true` protected  
**Postconditions:** Role unchanged | **Notes:** role.service.test.ts

---

## TC-075 — Duplicate role code rejected

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Negative / Validation  
**Priority:** Medium | **Severity:** Medium  
**Steps:** 1) Create role with code `admin` (existing)  
**Expected Result:** HTTP 409 or 400 duplicate error  
**Postconditions:** None

---

## TC-076 — Bulk set role permissions replaces permission set

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Positive / API  
**Priority:** High | **Severity:** High  
**Preconditions:** Custom role exists  
**Test Data:** permissionIds: [id1, id2, id3]  
**Steps:** 1) `PUT /api/roles/:id/permissions/bulk` 2) `GET permissions`  
**Expected Result:** Only specified permissions assigned; previous ones removed  
**Postconditions:** Permissions updated

---

## TC-077 — Duplicate role creates copy with new code

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Positive / API  
**Priority:** Medium | **Severity:** Low  
**Steps:** 1) `POST /api/roles/:id/duplicate` with `{ code: "hr_copy", name: "HR Copy" }`  
**Expected Result:** New role with same permissions as source  
**Postconditions:** Duplicate role exists

---

## TC-078 — List all permissions (admin)

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Positive / API  
**Priority:** High | **Severity:** Medium  
**Steps:** 1) `GET /api/roles/permissions/all` as admin  
**Expected Result:** HTTP 200; ~80+ permissions with module/feature metadata  
**Postconditions:** None

---

## TC-079 — Create custom permission (super admin)

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Positive / API  
**Priority:** Medium | **Severity:** Medium  
**Test Data:** code: `custom.test`, module: `test`, resource: `test`, action: `read`  
**Steps:** 1) `POST /api/roles/permissions`  
**Expected Result:** HTTP 201; permission created  
**Postconditions:** New permission in DB

---

## TC-080 — Permission matrix UI reflects role changes

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** UI / Positive  
**Priority:** High | **Severity:** Medium  
**Steps:** 1) Open `/admin/roles` 2) Edit role permissions 3) Save 4) Reopen  
**Expected Result:** PermissionMatrix shows updated checkmarks  
**Postconditions:** UI matches backend

---

## TC-081 — Admin role cannot assign role.write permissions (if restricted)

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Security  
**Priority:** High | **Severity:** High  
**Preconditions:** Admin (not super_admin) logged in  
**Steps:** 1) Attempt create permission or modify super_admin role  
**Expected Result:** HTTP 403 per rbac-matrix (admin lacks permission.create)  
**Postconditions:** None | **Notes:** Confirmed rbac-matrix.ts

---

## TC-082 — Update role name and description

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Positive  
**Priority:** Medium | **Severity:** Low  
**Steps:** 1) `PUT /api/roles/:id` with `{ name: "Updated Name" }`  
**Expected Result:** HTTP 200; name updated  
**Postconditions:** Role updated

---

## TC-083 — Remove permission from role

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Positive / API  
**Steps:** 1) `DELETE /api/roles/:id/permissions` with `{ permissionId }`  
**Expected Result:** Permission removed from role  
**Postconditions:** Users with role lose that permission on next request

---

## TC-084 — Assign permission to role

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Positive / API  
**Steps:** 1) `POST /api/roles/:id/permissions` with `{ permissionId }`  
**Expected Result:** HTTP 200; permission added  
**Postconditions:** None

---

## TC-085 — Permissions page lists all permissions with filters

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** UI / Positive  
**Steps:** 1) Navigate `/admin/permissions` 2) Verify table columns  
**Expected Result:** Table shows code, module, feature, resource, action  
**Postconditions:** None

---

## TC-086 — Delete custom permission not assigned to roles

**Module:** RBAC | **Feature:** Roles & Permissions | **Scenario Type:** Positive / API  
**Priority:** Medium | **Severity:** Medium  
**Steps:** 1) Create unused permission 2) `DELETE /api/roles/permissions/:id`  
**Expected Result:** HTTP 200; permission soft-deleted  
**Postconditions:** Permission removed

---

## TC-087 — Employee role cannot access `GET /api/users` (403)

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / API  
**Priority:** Critical | **Severity:** Critical  
**Preconditions:** Employee logged in (portal.read only)  
**Steps:** 1) `GET /api/users`  
**Expected Result:** HTTP 403 FORBIDDEN  
**Postconditions:** None

---

## TC-088 — HR role can access `GET /api/hr/employees`

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Positive / API  
**Preconditions:** HR logged in  
**Steps:** 1) `GET /api/hr/employees`  
**Expected Result:** HTTP 200 with employee list  
**Postconditions:** None

---

## TC-089 — Finance role cannot access payroll runs

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / Negative  
**Preconditions:** Finance user logged in  
**Steps:** 1) `GET /api/payroll/runs`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-090 — Payroll role cannot approve invoices

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / Negative  
**Preconditions:** Payroll user logged in  
**Steps:** 1) `POST /api/finance/invoices/:id/approve`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-091 — Direct URL navigation to restricted page shows permission denied

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / UI / E2E  
**Preconditions:** Employee logged in  
**Steps:** 1) Navigate directly to `/admin/users`  
**Expected Result:** RequirePermission blocks content OR redirect/error state shown  
**Postconditions:** No user data exposed

---

## TC-092 — Hidden nav item for unauthorized module

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** UI / Security  
**Preconditions:** Finance user logged in  
**Steps:** 1) Inspect sidebar  
**Expected Result:** BD, PM, Engineering nav groups NOT visible  
**Postconditions:** None | **Notes:** filterNavByPermissions

---

## TC-093 — Developer role sees team-scoped employees only

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / API  
**Priority:** High | **Severity:** High  
**Preconditions:** Developer in Team A  
**Steps:** 1) `GET /api/hr/employees` or dashboard employee list  
**Expected Result:** Only team peers returned, not all employees  
**Postconditions:** None | **Notes:** employee-scope.ts

---

## TC-094 — Candidate role sees candidate dashboard only

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** UI / E2E  
**Preconditions:** Candidate user logged in  
**Steps:** 1) Verify nav shows "My Applications" 2) Access `/candidate/dashboard`  
**Expected Result:** Candidate-specific nav; HR modules hidden  
**Postconditions:** None

---

## TC-095 — BD permissions required for lead API

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / API  
**Preconditions:** Employee without bd.lead.read  
**Steps:** 1) `GET /api/bd/leads`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-096 — PM permissions required for project creation

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / API  
**Steps:** 1) Employee without pm.project.create calls `POST /api/pm/projects`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-097 — Engineering permissions for test case CRUD

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / API  
**Steps:** 1) HR user calls `POST /api/engineering/test-cases`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-098 — Self-access: user can read own profile via `GET /api/users/:ownId`

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Positive / API  
**Preconditions:** Employee logged in  
**Steps:** 1) `GET /api/users/{ownUserId}` without user.read permission  
**Expected Result:** HTTP 200 (requireSelfOrPermission)  
**Postconditions:** None

---

## TC-099 — Cannot read other user profile without user.read

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / Negative  
**Preconditions:** Employee logged in  
**Steps:** 1) `GET /api/users/{otherUserId}`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-100 — Storage upload purpose RESUME requires candidate/recruitment permission

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / API  
**Steps:** 1) Employee calls `POST /api/storage/presign` with `purpose: RESUME`  
**Expected Result:** HTTP 403 unless has resume upload permission  
**Postconditions:** None | **Notes:** storage-rbac.test.ts

---

## TC-101 — Document access respects ACL permissions

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security  
**Preconditions:** Document with user-specific READ permission  
**Steps:** 1) User A accesses doc 2) User B without permission accesses same doc  
**Expected Result:** A succeeds; B gets 403  
**Postconditions:** None | **Notes:** document-access.ts

---

## TC-102 — Audit log read requires audit.read permission

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / API  
**Steps:** 1) Employee calls `GET /api/audit-logs`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-103 — Report export requires report.export or report.read

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / API  
**Steps:** 1) User without report permissions calls `GET /api/reports/attendance/export`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-104 — Settings manage requires settings.manage

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security / API  
**Steps:** 1) HR user calls `PUT /api/settings`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-105 — Permission change takes effect without re-login

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** E2E / Edge  
**Steps:** 1) Login as user 2) Admin grants new permission 3) User calls new endpoint (may need refresh)  
**Expected Result:** Access granted on next API call (permissions loaded per request from DB)  
**Postconditions:** None

---

## TC-106 — Permission denial logs security event

**Module:** RBAC | **Feature:** Permission Enforcement | **Scenario Type:** Security  
**Steps:** 1) Trigger 403 2) Admin checks `/admin/security-events`  
**Expected Result:** Permission denied event recorded  
**Postconditions:** None | **Notes:** security-monitor.ts

---

## TC-107 — Admin creates new user with required fields

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Positive / UI / API  
**Priority:** Critical | **Severity:** High  
**Test Data:** email: `newuser@test.com`, password: `Test@1234`, firstName, lastName  
**Steps:** 1) `/admin/users` → Create 2) Fill form 3) Submit  
**Expected Result:** HTTP 201; user in list; employee ID auto-assigned if blank  
**Postconditions:** User in DB + Employee master sync

---

## TC-108 — Create user API validates email format

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Validation / Negative  
**Test Data:** email: `bad-email`  
**Steps:** 1) `POST /api/users` with invalid email  
**Expected Result:** HTTP 400 VALIDATION_ERROR  
**Postconditions:** None

---

## TC-109 — Create user password minimum 8 characters

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Validation / Boundary  
**Test Data:** password: `short` (5 chars)  
**Steps:** 1) Create user with 5-char password  
**Expected Result:** HTTP 400 — min 8 per createUserSchema  
**Postconditions:** None

---

## TC-110 — Create user password exactly 8 characters (boundary)

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Boundary / Positive  
**Test Data:** password: `Test@123` (8 chars)  
**Steps:** 1) Create user with 8-char password  
**Expected Result:** HTTP 201 success  
**Postconditions:** User created

---

## TC-111 — Duplicate email rejected on user create

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Negative / DB  
**Steps:** 1) Create user with existing email `admin@workforce360.com`  
**Expected Result:** HTTP 409 DUPLICATE or validation error  
**Postconditions:** No duplicate user

---

## TC-112 — Update user profile fields

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Positive / API  
**Steps:** 1) `PUT /api/users/:id` with `{ firstName: "Updated" }`  
**Expected Result:** HTTP 200; field updated; audit log entry created  
**Postconditions:** User updated

---

## TC-113 — Update user with empty body rejected

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Validation / Negative  
**Steps:** 1) `PUT /api/users/:id` with `{}`  
**Expected Result:** HTTP 400 — "At least one field required"  
**Postconditions:** None

---

## TC-114 — Soft delete user

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Positive / DB  
**Steps:** 1) `DELETE /api/users/:id` 2) `GET /api/users/:id`  
**Expected Result:** HTTP 200 delete; subsequent get returns 404 or filtered from list  
**Postconditions:** deletedAt set

---

## TC-115 — Assign role to user

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Positive / API  
**Steps:** 1) `POST /api/users/:id/roles` with `{ roleId }`  
**Expected Result:** HTTP 200; role appears in `GET /api/users/:id/roles`  
**Postconditions:** User has new role permissions

---

## TC-116 — Remove role from user

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Positive / API  
**Steps:** 1) `DELETE /api/users/:id/roles` with `{ roleId }`  
**Expected Result:** Role removed  
**Postconditions:** Permissions updated

---

## TC-117 — Revoke all user sessions

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Positive / Security  
**Steps:** 1) User logged in on browser 2) Admin `POST /api/users/:id/revoke-sessions`  
**Expected Result:** User's next API call returns SESSION_EXPIRED  
**Postconditions:** sessionVersion incremented

---

## TC-118 — Get next employee ID preview

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Positive / API  
**Steps:** 1) `GET /api/users/next-employee-id` as admin  
**Expected Result:** HTTP 200; returns next EMP### code  
**Postconditions:** None | **Notes:** employee-id.ts

---

## TC-119 — List users with search filter

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Positive / UI  
**Steps:** 1) `/admin/users` 2) Search "admin"  
**Expected Result:** Filtered results show matching users  
**Postconditions:** None

---

## TC-120 — List users by department filter

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Positive / API  
**Steps:** 1) `GET /api/users?departmentId={hrDeptId}`  
**Expected Result:** Only HR department users returned  
**Postconditions:** None

---

## TC-121 — firstName max 255 characters boundary

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Boundary  
**Test Data:** firstName: 256-char string  
**Steps:** 1) Create user with 256-char firstName  
**Expected Result:** HTTP 400 — max 255  
**Postconditions:** None

---

## TC-122 — firstName exactly 255 characters accepted

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Boundary / Positive  
**Test Data:** firstName: 255-char string  
**Steps:** 1) Create user  
**Expected Result:** HTTP 201  
**Postconditions:** User created

---

## TC-123 — Non-admin cannot create users via UI

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** Security / UI  
**Preconditions:** Employee logged in  
**Steps:** 1) Navigate `/admin/users`  
**Expected Result:** Page blocked or Create button hidden  
**Postconditions:** None

---

## TC-124 — User create writes audit log entry

**Module:** Users | **Feature:** User CRUD & Sessions | **Scenario Type:** DB / Positive  
**Steps:** 1) Create user 2) Check audit logs for CREATE action on User entity  
**Expected Result:** Audit log entry with actor, entity, after snapshot  
**Postconditions:** None

---

## TC-125 — Create department with valid data

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Positive / UI / API  
**Test Data:** name: `Engineering`, code: `ENG`  
**Steps:** 1) `/admin/departments` → Create 2) Submit  
**Expected Result:** HTTP 201; department in list  
**Postconditions:** Department in DB

---

## TC-126 — Duplicate department code per company rejected

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Negative / DB  
**Steps:** 1) Create dept with code `HR` (exists)  
**Expected Result:** HTTP 409 duplicate  
**Postconditions:** None

---

## TC-127 — Update department manager assignment

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Positive  
**Steps:** 1) `PUT /api/organization/departments/:id` with `{ managerId }`  
**Expected Result:** Manager assigned; visible on department detail  
**Postconditions:** Updated

---

## TC-128 — Soft delete department

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Positive / DB  
**Steps:** 1) `DELETE /api/organization/departments/:id`  
**Expected Result:** HTTP 200; not in active list  
**Postconditions:** deletedAt set

---

## TC-129 — Create team under department

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Positive  
**Test Data:** name: `Backend Team`, code: `BE`, departmentId  
**Steps:** 1) `/admin/teams` → Create  
**Expected Result:** Team created linked to department  
**Postconditions:** Team in DB

---

## TC-130 — Duplicate team code within department rejected

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Negative  
**Steps:** 1) Create team with duplicate code in same dept  
**Expected Result:** HTTP 409  
**Postconditions:** None

---

## TC-131 — Create designation with headcount

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Positive  
**Test Data:** name: `Senior Dev`, code: `SDEV`, headcount: 5  
**Steps:** 1) `/admin/designations` → Create  
**Expected Result:** Designation created with headcount capacity  
**Postconditions:** None

---

## TC-132 — Get next designation code auto-generated

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Positive / API  
**Steps:** 1) `GET /api/organization/designations/next-code?departmentId=X`  
**Expected Result:** HTTP 200; returns dept-prefixed code  
**Postconditions:** None | **Notes:** designation-code.ts

---

## TC-133 — Designation headcount boundary: zero

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Boundary  
**Test Data:** headcount: 0  
**Steps:** 1) Create designation with headcount 0  
**Expected Result:** Accepted or rejected per schema — document actual  
**Postconditions:** Document result | **Notes:** Verify schema min

---

## TC-134 — Cannot assign user beyond designation headcount

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Negative / Business Rule  
**Preconditions:** Designation headcount: 2, already 2 users assigned  
**Steps:** 1) Assign 3rd user to full designation  
**Expected Result:** HTTP 400 capacity exceeded (if enforced)  
**Postconditions:** None | **Notes:** **Inferred** from headcount field

---

## TC-135 — Department hierarchy parent-child

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Positive  
**Steps:** 1) Create child dept with parentId 2) Verify tree display  
**Expected Result:** Child linked to parent in UI and API  
**Postconditions:** Hierarchy correct

---

## TC-136 — Team lead assignment

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Positive  
**Steps:** 1) Update team with leadId  
**Expected Result:** Lead shown on team detail  
**Postconditions:** Updated

---

## TC-137 — Organization CRUD requires correct permissions

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Security  
**Preconditions:** Employee without department.create  
**Steps:** 1) `POST /api/organization/departments`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-138 — Department name required validation

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Validation  
**Steps:** 1) Create dept without name  
**Expected Result:** HTTP 400  
**Postconditions:** None

---

## TC-139 — List departments returns only non-deleted

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Positive / DB  
**Preconditions:** One soft-deleted department exists  
**Steps:** 1) `GET /api/organization/departments`  
**Expected Result:** Deleted dept not in list  
**Postconditions:** None

---

## TC-140 — Designation update partial fields

**Module:** Organization | **Feature:** Departments, Teams, Designations | **Scenario Type:** Positive  
**Steps:** 1) `PUT /api/organization/designations/:id` with `{ headcount: 10 }`  
**Expected Result:** Only headcount updated  
**Postconditions:** Updated

---

## TC-141 — Create office with address fields

**Module:** Organization | **Feature:** Offices, Employee Types, Statuses | **Scenario Type:** Positive  
**Test Data:** name, code, address, city, country  
**Steps:** 1) `/admin/offices` → Create  
**Expected Result:** Office created  
**Postconditions:** In DB

---

## TC-142 — Duplicate office code rejected

**Module:** Organization | **Feature:** Offices, Employee Types, Statuses | **Scenario Type:** Negative  
**Steps:** 1) Create office with existing code  
**Expected Result:** HTTP 409  
**Postconditions:** None

---

## TC-143 — Create employee type (FT, PT, etc.)

**Module:** Organization | **Feature:** Offices, Employee Types, Statuses | **Scenario Type:** Positive  
**Steps:** 1) `/admin/employee-types` → Create with code `TEMP`  
**Expected Result:** Type created  
**Postconditions:** None

---

## TC-144 — Employee type code required

**Module:** Organization | **Feature:** Offices, Employee Types, Statuses | **Scenario Type:** Validation  
**Steps:** 1) Create type without code  
**Expected Result:** HTTP 400  
**Postconditions:** None

---

## TC-145 — Create employment status

**Module:** Organization | **Feature:** Offices, Employee Types, Statuses | **Scenario Type:** Positive  
**Steps:** 1) `/admin/employment-statuses` → Create  
**Expected Result:** Status created (seed has Active, Probation, etc.)  
**Postconditions:** None

---

## TC-146 — Deactivate office (isActive false)

**Module:** Organization | **Feature:** Offices, Employee Types, Statuses | **Scenario Type:** Positive  
**Steps:** 1) Update office `isActive: false`  
**Expected Result:** Office marked inactive; not selectable in user form  
**Postconditions:** Updated

---

## TC-147 — List employee types returns seeded values

**Module:** Organization | **Feature:** Offices, Employee Types, Statuses | **Scenario Type:** Positive  
**Steps:** 1) `GET /api/organization/employee-types`  
**Expected Result:** Includes FT, PT, CNT, INT from seed  
**Postconditions:** None

---

## TC-148 — Delete employment status not in use

**Module:** Organization | **Feature:** Offices, Employee Types, Statuses | **Scenario Type:** Positive  
**Steps:** 1) Delete unused status  
**Expected Result:** HTTP 200 soft delete  
**Postconditions:** None

---

## TC-149 — Office CRUD permission enforcement

**Module:** Organization | **Feature:** Offices, Employee Types, Statuses | **Scenario Type:** Security  
**Steps:** 1) Employee calls `POST /api/organization/offices`  
**Expected Result:** HTTP 403  
**Postconditions:** None

---

## TC-150 — Employment status assigned to user reflects in profile

**Module:** Organization | **Feature:** Offices, Employee Types, Statuses | **Scenario Type:** Positive / E2E  
**Steps:** 1) Set user employmentStatusId to "On Probation" 2) View user detail  
**Expected Result:** Status displayed correctly  
**Postconditions:** None
