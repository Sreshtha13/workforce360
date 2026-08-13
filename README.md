# Workforce 360 ERP

Production-oriented modular ERP monorepo. **MVP status: v1.0.0-mvp** — Phases 0 through 16 implemented (with Phases 10–12 delivered as reporting, administration, and security modules).

| App | Path | Stack |
| --- | --- | --- |
| Web | `apps/web` | Next.js 14 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query |
| API | `apps/api` | Express + TypeScript, Zod, Prisma → PostgreSQL |

The web app talks to the API over HTTP only. It never holds DB credentials, ORM clients, or integration secrets — only `NEXT_PUBLIC_API_BASE_URL`.

## Architecture

```
Browser → apps/web (Next.js) → HTTP → apps/api (Express) → Prisma → PostgreSQL
```

Every protected API route runs: **auth → RBAC → Zod validation → controller → service → repository**.

See [CODING_STANDARDS.md](./CODING_STANDARDS.md) for naming, API envelope (`{ data, error, meta }`), soft-delete, audit logging, and the frontend/backend separation rule.

---

## Implemented modules (by phase)

| Phase | Module | Highlights |
| --- | --- | --- |
| **0** | Foundation | Monorepo, CI, health check, design system shell, Prisma migrations |
| **1** | Platform | Auth (JWT + refresh cookies), MFA, Google OAuth, org hierarchy, users, RBAC, audit logs, role-based dashboard |
| **2** | HR & Recruitment | Careers portal, candidate apply/register, recruitment pipeline, interviews, offers, onboarding, employee master, policies, assets, employee portal |
| **3** | Attendance & Leave | Clock in/out, shifts, holidays, leave types/balances, corrections, generic approval engine, asset history |
| **4** | Finance & Payroll | Clients, invoices, payments (manual + Stripe/Razorpay), reimbursements, salary structures, payroll runs, PDF payslips |
| **5** | Business Development | Contacts, leads pipeline, bids, proposals, communications, portfolio; **won-lead → project handover** |
| **6** | Project Management | Projects, milestones, tasks, sprints, time entries, team allocations, budget tracking, Kanban boards |
| **7** | Development & QA | Releases, test cases, technical docs, training enrollments, code reviews, engineering dashboard |
| **8** | Help Desk | SLA policies, ticket escalation, knowledge base, ticket timeline |
| **9** | Core ERP Services | Notification center, approval workflows/delegations, document management (versioned, permissioned) |
| **10** | Reporting | KPI dashboards, report definitions, scheduled exports (CSV/PDF) |
| **11** | Administration | System settings, notification templates, announcements, master-data admin |
| **12** | Security | MFA enforcement, security events, session/device management |
| **13** | Integrations | Google login, email (Resend/SMTP), S3 storage, Stripe/Razorpay webhooks, outbound webhook subscriptions |
| **14** | Infrastructure | Docker images, `docker-compose`, structured request logging, backup/restore scripts |
| **16** | Release docs | Deployment guide, UAT checklist, user/admin manuals, rollout checklist |

### API route map

| Prefix | Module |
| --- | --- |
| `/api/auth` | Authentication & MFA |
| `/api/organization` | Departments, teams, offices, designations |
| `/api/users`, `/api/roles` | User & role management |
| `/api/careers`, `/api/recruitment` | Public careers & HR recruitment |
| `/api/hr` | HR operations (employees, jobs, tickets, policies) |
| `/api/portal` | Employee self-service |
| `/api/attendance`, `/api/leave` | Attendance & leave |
| `/api/assets` | Asset management |
| `/api/finance`, `/api/payroll` | Finance & payroll |
| `/api/bd`, `/api/pm` | Business development & project management |
| `/api/approvals` | Approval workflow engine |
| `/api/notifications` | In-app & email notifications |
| `/api/helpdesk` | Help desk & knowledge base |
| `/api/documents` | Document management |
| `/api/reports` | Reporting & KPIs |
| `/api/audit-logs`, `/api/security-events` | Audit & security |
| `/api/settings`, `/api/admin` | System administration |
| `/api/integrations` | Integration registry & webhooks |
| `/api/docs` | OpenAPI / Swagger UI |

---

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local, Docker, or Supabase)
- npm 9+ (workspaces)

---

## Setup

```bash
# Install all workspaces
npm install

# API env (DB, JWT secrets, optional integrations)
cp apps/api/.env.example apps/api/.env.local
# Edit DATABASE_URL and JWT secrets

# Web env (public API URL only)
cp apps/web/.env.example apps/web/.env.local

# Generate Prisma client + apply migrations + seed demo data
npm run db:generate
npm run db:migrate
npm run db:seed -w api
```

### Docker (full stack)

```bash
docker compose up --build
# API: http://localhost:4000  |  Web: http://localhost:3000  |  Postgres: localhost:5432
```

---

## Develop

```bash
# Terminal 1 — API (http://localhost:4000)
npm run dev:api

# Terminal 2 — Web (http://localhost:3000)
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000). The home page calls `GET /api/health` through the typed client and shows DB connectivity.

- **API docs:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs) (Swagger UI)
- Without Postgres, the API still starts and returns `{ status: "degraded", database.connected: false }`.

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev:api` / `dev:web` | Start API or web in dev mode |
| `npm run build` | Build API then web |
| `npm run lint` | Lint web + API |
| `npm run typecheck` | Typecheck web + API |
| `npm run test` | Run API + web test suites |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:migrate:deploy -w api` | Apply migrations (production) |
| `npm run db:seed -w api` | Seed roles, permissions, demo users |
| `npm run db:studio -w api` | Open Prisma Studio |

---

## Stack decisions

| Topic | Choice |
| --- | --- |
| HTTP framework | **Express** |
| ORM | **Prisma** (`apps/api/db/schema.prisma` + `db/migrations`) |
| Auth | JWT access + refresh in **httpOnly cookies**; MFA via TOTP |
| Validation | **Zod** on the API (authoritative) |
| Payments | Stripe Checkout + Razorpay (backend webhooks) |
| Storage | Local dev or S3-compatible (incl. Supabase Storage) |
| Email | Resend API or SMTP fallback |

---

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs separate jobs for web and API: `lint`, `typecheck`, and tests.

---

## Documentation index

### Getting started

| Document | Purpose |
| --- | --- |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Architecture rules and conventions |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Production deploy, env vars, Docker |
| [RELEASE_NOTES.md](./RELEASE_NOTES.md) | v1.0.0-mvp changelog |

### Phase implementation summaries

| Phase | Document |
| --- | --- |
| 1 | [PHASE_1_SUMMARY.md](./PHASE_1_SUMMARY.md) |
| 3 | [PHASE3_IMPLEMENTATION_SUMMARY.md](./PHASE3_IMPLEMENTATION_SUMMARY.md) |
| 4 | [PHASE4_IMPLEMENTATION_SUMMARY.md](./PHASE4_IMPLEMENTATION_SUMMARY.md) |
| 5 & 6 | [PHASE5_PHASE6_IMPLEMENTATION.md](./PHASE5_PHASE6_IMPLEMENTATION.md), [PHASE5_PHASE6_COMPLETE.md](./PHASE5_PHASE6_COMPLETE.md) |
| 7 | [PHASE7_COMPLETE.md](./PHASE7_COMPLETE.md) |
| 8 & 9 | [PHASE8_PHASE9_IMPLEMENTATION.md](./PHASE8_PHASE9_IMPLEMENTATION.md) |
| 13–16 | [PHASE13_PHASE14_PHASE16.md](./PHASE13_PHASE14_PHASE16.md) |

Frontend-focused: [PHASE3_PHASE4_FRONTEND_COMPLETE.md](./PHASE3_PHASE4_FRONTEND_COMPLETE.md), [FRONTEND_IMPLEMENTATION_SUMMARY.md](./FRONTEND_IMPLEMENTATION_SUMMARY.md)

### QA & testing

| Document | Purpose |
| --- | --- |
| [QA_PHASE1_PHASE2_MANUAL_TEST_SUITE.md](./QA_PHASE1_PHASE2_MANUAL_TEST_SUITE.md) | Manual tests for Phases 0–2 |
| [QA_RESOLUTION_REPORT.md](./QA_RESOLUTION_REPORT.md) | Early bugfix sprint report |
| [INTEGRATION_TESTING_GUIDE.md](./INTEGRATION_TESTING_GUIDE.md) | BD → PM handover integration tests |
| [UAT_FULL_SYSTEM.md](./UAT_FULL_SYSTEM.md) | Full MVP UAT checklist |

### Operations & end users

| Document | Audience |
| --- | --- |
| [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) | Backup/restore, RPO/RTO |
| [PRODUCTION_ROLLOUT_CHECKLIST.md](./PRODUCTION_ROLLOUT_CHECKLIST.md) | Pre/post deploy checklist |
| [ADMIN_MANUAL.md](./ADMIN_MANUAL.md) | Super Admins / Administrators |
| [USER_MANUAL.md](./USER_MANUAL.md) | Employees & managers |

---

## Known limitations (MVP)

- Pagination helper exists but is not yet applied to all list endpoints.
- OpenAPI docs cover ~60% of routes — extend `*.docs.ts` files for remaining modules.
- UAT is manual; automated E2E (Playwright/Cypress) is post-MVP.
- CD workflow is Docker-based locally; host-specific deploy pipeline TBD.
- Structured console logging only; external APM (Sentry/Datadog) not wired yet.

---

## Local dev notes

- Set a real `DATABASE_URL` in `apps/api/.env.local`, then `npm run db:migrate`, for `status: "ok"` on health.
- Next.js may log a noisy `ENOWORKSPACES` SWC lockfile patch warning under npm workspaces; builds and `next dev` still succeed.
