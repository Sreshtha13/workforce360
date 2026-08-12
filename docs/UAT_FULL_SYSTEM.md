# UAT Checklist — Full System (MVP)

Map each item to MVP Acceptance Criteria (Section 5) and phase milestones. Mark **Pass / Fail / N/A** during UAT.

## P1 — Authentication & RBAC

| ID | Test | Criteria |
|----|------|----------|
| UAT-01 | Email/password login sets session; `/api/auth/me` returns user + permissions | Secure login |
| UAT-02 | Google OAuth login (if configured) completes without frontend secrets | Integrations |
| UAT-03 | MFA challenge enforced for privileged roles | Security |
| UAT-04 | User without permission gets 403 from API (not just hidden UI) | RBAC backend |
| UAT-05 | Super Admin can configure org hierarchy (dept, team, office) | Org hierarchy |

## P2 — HR & Recruitment

| ID | Test | Criteria |
|----|------|----------|
| UAT-06 | Create job posting → candidate applies via careers → HR moves pipeline | Recruit/onboard |
| UAT-07 | Convert candidate to employee; employee master updated | Employee lifecycle |
| UAT-08 | HR policy publish and employee acknowledgment | HR module |

## P3 — Employee self-service

| ID | Test | Criteria |
|----|------|----------|
| UAT-09 | Employee clocks attendance; manager sees team view | Attendance |
| UAT-10 | Leave request → approval workflow → balance updated | Leave |
| UAT-11 | Asset assignment and return | Assets |
| UAT-12 | Document upload via presign (no direct DB/storage from web) | Documents |
| UAT-13 | Employee downloads published payslip | Payslips |

## P4 — Finance & Payroll

| ID | Test | Criteria |
|----|------|----------|
| UAT-14 | Create invoice → approval → send (email if client email set) | Invoices |
| UAT-15 | Stripe or Razorpay test payment → webhook updates status | Payments |
| UAT-16 | Manual payment recorded; invoice balance correct | Payments |
| UAT-17 | Payroll run → approve → payslips generated | Payroll |

## P5 — Projects & Engineering

| ID | Test | Criteria |
|----|------|----------|
| UAT-18 | BD opportunity → project handover | BD/PM |
| UAT-19 | Tasks, milestones, timesheet entry | PM module |
| UAT-20 | Engineering release / test case workflow | Engineering |

## P6 — Admin & Reporting

| ID | Test | Criteria |
|----|------|----------|
| UAT-21 | Role permission matrix change affects API access | Configurable RBAC |
| UAT-22 | Approval workflow configurable and auditable | Workflows |
| UAT-23 | Audit log entry on create/update/delete | Audit logs |
| UAT-24 | Department dashboard shows live counts | Dashboards |
| UAT-25 | Report export (CSV/PDF) downloads | Reports |

## P7 — Integrations (Phase 13)

| ID | Test | Criteria |
|----|------|----------|
| UAT-26 | Real email send (Resend or SMTP) for password reset | Email integration |
| UAT-27 | File upload to configured storage (local or S3) | Storage |
| UAT-28 | Admin integrations page shows MVP status from env | Integration visibility |
| UAT-29 | Frontend bundle contains no `DATABASE_URL`, Stripe secret, etc. | Architecture rule |

## P8 — Performance (Phase 14)

| ID | Test | Criteria |
|----|------|----------|
| UAT-30 | Login + dashboard load &lt; 3s on representative data | Page load NFR |
| UAT-31 | Key API lists respond &lt; 2s | API NFR |
| UAT-32 | Backup script produces valid dump; staging restore succeeds | DR |

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| QA Lead | | | |
| Super Administrator | | | |
