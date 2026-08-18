# Test Cases TC-151 to TC-250 — Admin, Careers, Recruitment, HR

---

## TC-151 — Admin dashboard loads metrics
**Module:** Admin Dashboard | **Feature:** Dashboard & Global Search | **Type:** Positive/UI | **Priority:** High  
**Pre:** Admin logged in | **Steps:** 1) Go `/dashboard` 2) Verify metric cards  
**Expected:** Welcome hero, stat cards, pending approvals widget visible | **Notes:** dashboard.service.ts

## TC-152 — Admin dashboard API returns KPI data
**Module:** Admin Dashboard | **Type:** API/Positive | **Steps:** `GET /api/dashboard`  
**Expected:** HTTP 200; data with counts/metrics

## TC-153 — Global search finds employees by name
**Module:** Admin Dashboard | **Type:** Positive/UI | **Steps:** 1) Use GlobalSearch 2) Type employee name  
**Expected:** Matching employees in results dropdown

## TC-154 — Global search API `GET /api/dashboard/search?q=`
**Module:** Admin Dashboard | **Type:** API | **Steps:** Search with query param  
**Expected:** HTTP 200; relevant results across entities

## TC-155 — Dashboard not accessible without dashboard.read
**Module:** Admin Dashboard | **Type:** Security/Negative | **Steps:** Employee calls `GET /api/dashboard`  
**Expected:** HTTP 403

## TC-156 — Active employees list on dashboard
**Module:** Admin Dashboard | **Type:** Positive | **Steps:** `GET /api/dashboard/employees`  
**Expected:** List of active employees

## TC-157 — Dashboard loading state shown while fetching
**Module:** Admin Dashboard | **Type:** UI | **Steps:** Throttle network; load dashboard  
**Expected:** LoadingState/skeleton shown before data

## TC-158 — Dashboard error state with retry on API failure
**Module:** Admin Dashboard | **Type:** Negative/UI | **Steps:** Stop API; load dashboard  
**Expected:** ErrorState with retry button

## TC-159 — View and update system settings
**Module:** Admin | **Feature:** Settings, Templates, Integrations | **Type:** Positive  
**Pre:** Super Admin | **Steps:** 1) `/admin/settings` 2) Update setting 3) Save  
**Expected:** `PUT /api/settings` 200; value persisted

## TC-160 — Secret settings masked in UI
**Module:** Admin | **Type:** Security | **Steps:** View settings with `isSecret: true`  
**Expected:** Value masked/not exposed in plain text

## TC-161 — Create notification template
**Module:** Admin | **Type:** Positive | **Steps:** `/admin/notification-templates` → Create with code, channel, subject, body  
**Expected:** Template created; usable for notifications

## TC-162 — Update notification template
**Module:** Admin | **Type:** Positive | **Steps:** Edit existing template body  
**Expected:** HTTP 200; changes saved

## TC-163 — Delete notification template
**Module:** Admin | **Type:** Positive | **Steps:** Delete unused template  
**Expected:** Soft deleted

## TC-164 — Integrations page shows MVP status
**Module:** Admin | **Type:** UI/Positive | **Steps:** `/admin/integrations`  
**Expected:** Shows configured integrations status from env

## TC-165 — Settings update without settings.manage returns 403
**Module:** Admin | **Type:** Security | **Steps:** HR user `PUT /api/settings`  
**Expected:** HTTP 403

## TC-166 — Webhook integration create
**Module:** Admin | **Type:** Positive/API | **Steps:** `POST /api/integrations/webhooks` with url and events  
**Expected:** Webhook registered

## TC-167 — Webhook delete
**Module:** Admin | **Type:** Positive | **Steps:** `DELETE /api/integrations/webhooks/:id`  
**Expected:** Webhook removed

## TC-168 — Master data summary page
**Module:** Admin | **Type:** UI | **Steps:** `/admin/master-data`  
**Expected:** Overview of org entity counts

## TC-169 — Audit logs list with pagination
**Module:** Admin | **Feature:** Audit Logs & Security Events | **Type:** Positive/UI  
**Steps:** 1) `/admin/audit-logs` 2) Verify page 1 of results  
**Expected:** Table with actor, action, entity, timestamp; 25 per page

## TC-170 — Audit logs next page navigation
**Module:** Admin | **Type:** UI/Pagination | **Steps:** Click next page  
**Expected:** Page 2 loads; `meta.total` consistent

## TC-171 — Audit logs filter by date range
**Module:** Admin | **Type:** Positive | **Steps:** Set from/to dates; apply filter  
**Expected:** Only logs in range shown

## TC-172 — Audit logs filter by entity type
**Module:** Admin | **Type:** Positive | **Steps:** Filter entity=User  
**Expected:** Only User entity logs

## TC-173 — Audit logs API without audit.read returns 403
**Module:** Admin | **Type:** Security | **Steps:** Employee `GET /api/audit-logs`  
**Expected:** HTTP 403

## TC-174 — Security events list page
**Module:** Admin | **Type:** Positive/UI | **Steps:** `/admin/security-events`  
**Expected:** Events with severity, type, timestamp

## TC-175 — Security events pagination
**Module:** Admin | **Type:** Pagination | **Steps:** Navigate pages  
**Expected:** Correct pagination behavior

## TC-176 — Security events filter by severity
**Module:** Admin | **Type:** Positive | **Steps:** Filter HIGH severity  
**Expected:** Only high severity events

## TC-177 — Public careers page lists published jobs
**Module:** Public Careers | **Feature:** Job Listings & Apply | **Type:** Positive/UI  
**Steps:** 1) Open `/careers` (no login)  
**Expected:** Published job postings displayed (Senior Software Engineer, HR Coordinator from seed)

## TC-178 — Careers job detail by slug
**Module:** Public Careers | **Type:** Positive | **Steps:** `/careers/senior-software-engineer`  
**Expected:** Job title, description, apply button

## TC-179 — Careers API lists jobs without auth
**Module:** Public Careers | **Type:** API | **Steps:** `GET /api/careers/jobs`  
**Expected:** HTTP 200; only PUBLISHED jobs

## TC-180 — Candidate registration via careers
**Module:** Public Careers | **Type:** Positive/E2E | **Steps:** `/careers/register` → fill form → submit  
**Expected:** `POST /api/careers/register` 201; account created with candidate role

## TC-181 — Register with duplicate email fails
**Module:** Public Careers | **Type:** Negative | **Steps:** Register with existing email  
**Expected:** HTTP 409 or validation error

## TC-182 — Register with invalid email format
**Module:** Public Careers | **Type:** Validation | **Steps:** Submit invalid email  
**Expected:** HTTP 400

## TC-183 — Apply to job without login (guest apply)
**Module:** Public Careers | **Type:** Positive/E2E | **Steps:** `/careers/{slug}/apply` → fill application  
**Expected:** Application created; confirmation shown

## TC-184 — Apply to job as logged-in candidate
**Module:** Public Careers | **Type:** Positive | **Pre:** Candidate logged in | **Steps:** Apply to job  
**Expected:** Application linked to candidate profile

## TC-185 — Apply to same job twice rejected
**Module:** Public Careers | **Type:** Negative/DB | **Steps:** Submit duplicate application same candidate+job  
**Expected:** HTTP 409 unique constraint (candidateId, jobPostingId)

## TC-186 — Apply with resume upload
**Module:** Public Careers | **Type:** Positive | **Steps:** Attach PDF resume on apply form  
**Expected:** Presign upload → confirm → resume linked to candidate

## TC-187 — Apply to closed/unpublished job returns error
**Module:** Public Careers | **Type:** Negative | **Steps:** Apply to DRAFT job slug  
**Expected:** 404 or error — job not available

## TC-188 — Careers page responsive on mobile
**Module:** Public Careers | **Type:** UI/Responsive | **Steps:** View `/careers` at 375px width  
**Expected:** Layout usable; no horizontal scroll

## TC-189 — HR creates job posting
**Module:** Recruitment | **Feature:** Jobs, Candidates, Pipeline | **Type:** Positive/UI  
**Pre:** HR logged in | **Steps:** `/hr/jobs` → Create job with title, dept, description  
**Expected:** Job created in DRAFT; appears in list

## TC-190 — Publish job posting
**Module:** Recruitment | **Type:** Positive | **Steps:** Update job status to PUBLISHED  
**Expected:** Job visible on `/careers` and `GET /api/careers/jobs`

## TC-191 — Update job posting fields
**Module:** Recruitment | **Type:** Positive | **Steps:** PATCH job title/description  
**Expected:** HTTP 200; changes saved

## TC-192 — List jobs with status filter
**Module:** Recruitment | **Type:** Positive | **Steps:** Filter DRAFT vs PUBLISHED  
**Expected:** Correct filtered results

## TC-193 — HR views candidate list
**Module:** Recruitment | **Type:** Positive | **Steps:** `/hr/candidates`  
**Expected:** Candidates table with pipeline status

## TC-194 — HR views candidate detail
**Module:** Recruitment | **Type:** Positive | **Steps:** `/hr/candidates/:id`  
**Expected:** Profile, applications, resume link

## TC-195 — HR attaches resume to candidate
**Module:** Recruitment | **Type:** Positive | **Steps:** Upload resume on candidate detail  
**Expected:** Resume file linked via storage

## TC-196 — Recruitment pipeline board displays stages
**Module:** Recruitment | **Type:** UI/Positive | **Steps:** `/hr/pipeline`  
**Expected:** Kanban/pipeline columns with applications

## TC-197 — Move application to next pipeline stage
**Module:** Recruitment | **Type:** Positive/E2E | **Steps:** Update application status via pipeline  
**Expected:** `PATCH /api/recruitment/applications/:id/status` 200; stage updated

## TC-198 — Invalid pipeline stage transition rejected
**Module:** Recruitment | **Type:** Negative | **Steps:** Skip invalid stage transition  
**Expected:** HTTP 400 per pipeline-stage.service rules

## TC-199 — List applications with filters
**Module:** Recruitment | **Type:** Positive/API | **Steps:** `GET /api/recruitment/applications?status=APPLIED`  
**Expected:** Filtered applications

## TC-200 — Candidate profile self-service `GET /api/recruitment/candidates/me`
**Module:** Recruitment | **Type:** Positive | **Pre:** Candidate logged in  
**Expected:** Own candidate profile returned

## TC-201 — Non-candidate cannot access candidates/me
**Module:** Recruitment | **Type:** Negative | **Pre:** Admin logged in  
**Steps:** `GET /api/recruitment/candidates/me`  
**Expected:** 404 or empty — no candidate profile

## TC-202 — HR list jobs requires job.read
**Module:** Recruitment | **Type:** Security | **Steps:** Employee `GET /api/recruitment/jobs`  
**Expected:** HTTP 403

## TC-203 — Create job without required title fails
**Module:** Recruitment | **Type:** Validation | **Steps:** POST job missing title  
**Expected:** HTTP 400

## TC-204 — Search candidates by name/email
**Module:** Recruitment | **Type:** UI/Positive | **Steps:** Search on candidates page  
**Expected:** Filtered results

## TC-205 — Application detail view
**Module:** Recruitment | **Type:** Positive | **Steps:** `GET /api/recruitment/applications/:id`  
**Expected:** Full application with candidate and job info

## TC-206 — Pipeline API returns grouped data
**Module:** Recruitment | **Type:** API | **Steps:** `GET /api/recruitment/pipeline`  
**Expected:** Applications grouped by stage

## TC-207 — Job slug uniqueness enforced
**Module:** Recruitment | **Type:** Negative/DB | **Steps:** Create two jobs with same slug  
**Expected:** HTTP 409

## TC-208 — Close/fill job posting
**Module:** Recruitment | **Type:** Positive | **Steps:** Set job status CLOSED  
**Expected:** Removed from public careers list

## TC-209 — Schedule interview for application
**Module:** Recruitment | **Feature:** Interviews, Assessments, Offers | **Type:** Positive  
**Steps:** `/hr/interviews` or application detail → Schedule with date, interviewer  
**Expected:** `POST /api/recruitment/interviews` 201

## TC-210 — List scheduled interviews
**Module:** Recruitment | **Type:** Positive | **Steps:** `/hr/interviews`  
**Expected:** Interviews table with status, date, candidate

## TC-211 — Interview status update
**Module:** Recruitment | **Type:** Positive | **Steps:** Mark interview COMPLETED  
**Expected:** Status updated

## TC-212 — Assign assessment to candidate
**Module:** Recruitment | **Type:** Positive | **Steps:** `POST /api/recruitment/assessments` with due date  
**Expected:** Assessment created

## TC-213 — Create offer letter
**Module:** Recruitment | **Type:** Positive | **Steps:** `POST /api/recruitment/offers` with salary, start date  
**Expected:** Offer in DRAFT status

## TC-214 — Send offer to candidate
**Module:** Recruitment | **Type:** Positive/E2E | **Steps:** `POST /api/recruitment/offers/:id/send`  
**Expected:** Offer status SENT; notification/email triggered

## TC-215 — List offers page
**Module:** Recruitment | **Type:** UI | **Steps:** `/hr/offers`  
**Expected:** Offers list with status filters

## TC-216 — Update pre-onboarding checklist item
**Module:** Recruitment | **Type:** Positive | **Steps:** `PATCH /api/recruitment/checklist/:id` mark complete  
**Expected:** Checklist item completed

## TC-217 — Schedule interview without interview.create permission
**Module:** Recruitment | **Type:** Security | **Steps:** Employee POST interview  
**Expected:** HTTP 403

## TC-218 — Interview with past date (edge case)
**Module:** Recruitment | **Type:** Edge | **Steps:** Schedule interview in past  
**Expected:** Accepted or rejected — document behavior

## TC-219 — Offer with zero salary boundary
**Module:** Recruitment | **Type:** Boundary | **Steps:** Create offer salary=0  
**Expected:** Validation result per schema

## TC-220 — Full recruitment E2E: apply → interview → offer
**Module:** Recruitment | **Type:** E2E | **Steps:** 1) Candidate applies 2) HR moves pipeline 3) Schedule interview 4) Create/send offer  
**Expected:** Complete flow without errors

## TC-221 — HR dashboard loads
**Module:** HR Operations | **Feature:** Employees & Lifecycle | **Type:** Positive/UI  
**Steps:** `/hr/dashboard`  
**Expected:** HR metrics and shortcuts visible

## TC-222 — List employees
**Module:** HR Operations | **Type:** Positive | **Steps:** `/hr/employees`  
**Expected:** Employee list with lifecycle state, department

## TC-223 — View employee detail
**Module:** HR Operations | **Type:** Positive | **Steps:** `/hr/employees/:id`  
**Expected:** Full employee profile, lifecycle history

## TC-224 — Update employee lifecycle state
**Module:** HR Operations | **Type:** Positive/API | **Steps:** `PATCH /api/hr/employees/:id/lifecycle` to ACTIVE  
**Expected:** State updated; lifecycle event logged

## TC-225 — Hire candidate converts to employee
**Module:** HR Operations | **Type:** Positive/E2E | **Pre:** Candidate with accepted offer  
**Steps:** Hire from onboarding page  
**Expected:** Employee record created; linked to candidate

## TC-226 — Invalid lifecycle transition rejected
**Module:** HR Operations | **Type:** Negative | **Steps:** TERMINATED → ACTIVE without valid path  
**Expected:** HTTP 400

## TC-227 — Employee search/filter on list page
**Module:** HR Operations | **Type:** UI | **Steps:** Search by name or filter by department  
**Expected:** Filtered results

## TC-228 — HR interviews list (HR module view)
**Module:** HR Operations | **Type:** Positive | **Steps:** `GET /api/hr/interviews`  
**Expected:** Interviews for HR dashboard

## TC-229 — HR offers list
**Module:** HR Operations | **Type:** Positive | **Steps:** `GET /api/hr/offers`  
**Expected:** Offers list

## TC-230 — Employee without employee.read cannot list employees
**Module:** HR Operations | **Type:** Security | **Steps:** Employee `GET /api/hr/employees`  
**Expected:** HTTP 403

## TC-231 — Lifecycle update writes EmployeeLifecycleEvent
**Module:** HR Operations | **Type:** DB | **Steps:** Change lifecycle; check events table  
**Expected:** Event with fromState, toState, changedBy

## TC-232 — Employee detail shows linked user account
**Module:** HR Operations | **Type:** Positive | **Steps:** View employee with userId  
**Expected:** User email/name displayed

## TC-233 — Onboarding page lists pending hires
**Module:** HR Operations | **Type:** UI | **Steps:** `/hr/onboarding`  
**Expected:** Pre-onboarding candidates/checklist items

## TC-234 — Employee code format EMP###
**Module:** HR Operations | **Type:** Validation | **Steps:** Verify employee codes in list  
**Expected:** Match EMP### pattern

## TC-235 — Duplicate employee code rejected
**Module:** HR Operations | **Type:** Negative/DB | **Steps:** Create employee with existing code  
**Expected:** HTTP 409

## TC-236 — Employee soft delete not in active list
**Module:** HR Operations | **Type:** DB | **Steps:** Terminate/soft-delete employee  
**Expected:** Not in default employee list

## TC-237 — HR dashboard API
**Module:** HR Operations | **Type:** API | **Steps:** `GET /api/hr/dashboard`  
**Expected:** HTTP 200 with HR KPIs

## TC-238 — Developer sees scoped employee list only
**Module:** HR Operations | **Type:** Security | **Pre:** Developer in team  
**Expected:** Only team members visible

## TC-239 — Create HR policy
**Module:** HR Operations | **Feature:** Policies & Acknowledgements | **Type:** Positive  
**Steps:** `/hr/policies` → Create with title, content  
**Expected:** Policy in DRAFT status

## TC-240 — Publish policy
**Module:** HR Operations | **Type:** Positive | **Steps:** `POST /api/hr/policies/:id/publish`  
**Expected:** Status PUBLISHED; visible to employees

## TC-241 — Create new policy version
**Module:** HR Operations | **Type:** Positive | **Steps:** `POST /api/hr/policies/:id/versions`  
**Expected:** New version with incremented version number

## TC-242 — Assign policy to department
**Module:** HR Operations | **Type:** Positive | **Steps:** `POST /api/hr/policy-assignments` target DEPT  
**Expected:** Assignment created for department

## TC-243 — Employee acknowledges policy from portal
**Module:** HR Operations | **Type:** Positive/E2E | **Pre:** Published policy assigned  
**Steps:** `/portal/policies` → Acknowledge  
**Expected:** `POST /api/portal/policies/:id/acknowledge` 200

## TC-244 — View policy acknowledgements (HR)
**Module:** HR Operations | **Type:** Positive | **Steps:** `GET /api/hr/policies/:id/acknowledgements`  
**Expected:** List of users who acknowledged

## TC-245 — Cannot acknowledge unpublished policy
**Module:** HR Operations | **Type:** Negative | **Steps:** Attempt acknowledge DRAFT policy  
**Expected:** HTTP 400

## TC-246 — Duplicate acknowledgement prevented
**Module:** HR Operations | **Type:** Negative/DB | **Steps:** Acknowledge same policy twice  
**Expected:** HTTP 409 unique (policyId, userId)

## TC-247 — Policy version chain integrity
**Module:** HR Operations | **Type:** DB | **Steps:** Create v2 from v1; verify previousVersionId  
**Expected:** Version chain linked correctly

## TC-248 — Upload policy document file
**Module:** HR Operations | **Type:** Positive | **Steps:** Attach PDF via presign purpose POLICY  
**Expected:** File stored and linked

## TC-249 — Policy list filter by status
**Module:** HR Operations | **Type:** UI | **Steps:** Filter DRAFT vs PUBLISHED  
**Expected:** Correct filtered list

## TC-250 — Employee sees only assigned policies in portal
**Module:** HR Operations | **Type:** Security | **Steps:** Employee views `/portal/policies`  
**Expected:** Only policies assigned to user/dept/ALL
