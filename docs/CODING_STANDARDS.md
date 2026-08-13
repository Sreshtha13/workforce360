# Workforce 360 ERP — Coding Standards

Phase 0 foundation standards. Aligns with `.cursorrules` and the PRD.

## Stack choices (Phase 0 decisions)

| Concern | Choice | Notes |
| --- | --- | --- |
| Backend HTTP framework | **Express** | Mature middleware ecosystem; clear layered wiring (`routes → middleware → controllers → services → repositories`). |
| ORM | **Prisma** | Schema + versioned migrations under `apps/api/db/`. |
| Database | **PostgreSQL** | Supabase-hosted Postgres is fine as the instance; only the API connects. |
| Auth tokens | **JWT access + refresh in httpOnly cookies** | Backend issues/verifies tokens. Frontend sends `credentials: "include"`. Prefer cookies over `Authorization` headers for the browser app to reduce XSS token exfiltration risk. CSRF protection will be added when auth lands. |
| Validation | **Zod** on the API (authoritative) | Frontend may reuse schemas for UX only. |
| Frontend server state | **TanStack Query** | All remote data via typed API client. |
| Frontend styling | **Tailwind CSS v4 + shadcn/ui** | Tokens live in `apps/web/app/globals.css` (`@theme`); components via shadcn. |

## Monorepo folder structure

```
/
├── apps/
│   ├── web/                 # Next.js 14 (App Router) frontend
│   │   ├── app/             # Routes / layouts
│   │   ├── components/      # UI + feature components
│   │   ├── lib/             # API client, utils, design tokens
│   │   └── types/           # Frontend type mirrors (API is source of truth)
│   └── api/                 # Node.js + Express backend
│       ├── src/
│       │   ├── routes/
│       │   ├── middleware/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── types/
│       │   └── lib/
│       └── db/
│           ├── schema.prisma
│           └── migrations/  # Versioned SQL only — never hand-edit prod
├── packages/                # Optional shared Zod/types (add when needed)
├── .github/workflows/       # CI
└── CODING_STANDARDS.md
```

## Frontend / backend separation (hard rule)

- **`apps/web` never connects to the database.** No Prisma, Knex, `pg`, Supabase Admin SDK, service-role keys, or ORM drivers in the web app — including Server Components, Server Actions, and Route Handlers.
- **`apps/web` obtains data only via HTTP** to `apps/api` through the typed client in `apps/web/lib/api-client.ts`.
- **`apps/api` owns** all DB access, business logic, auth issuing/verification, RBAC, and audit logging.
- Web `.env` / `.env.local` may contain only public config (e.g. `NEXT_PUBLIC_API_BASE_URL`). **Zero DB or service-role secrets.**

If a change would import a DB client into `apps/web`, reject it.

## Naming conventions

| Area | Convention | Examples |
| --- | --- | --- |
| Files (TS/TSX) | `kebab-case` | `health.service.ts`, `app-shell.tsx` |
| React components | `PascalCase` | `AppShell`, `HealthStatus` |
| Functions / variables | `camelCase` | `getHealth`, `apiClient` |
| Types / interfaces | `PascalCase` | `HealthCheckData`, `ApiResponse` |
| DB tables (SQL) | `snake_case` plural | `health_probes` |
| Prisma models | `PascalCase` singular | `HealthProbe` |
| Env vars | `SCREAMING_SNAKE_CASE` | `DATABASE_URL` |
| API routes | plural nouns, versionable under `/api` | `GET /api/health` |
| Permissions (later) | `resource:action` | `employees:read` |

## Backend request pipeline

Every protected route runs, in order:

1. Auth middleware  
2. RBAC / permission middleware  
3. Zod validation middleware  
4. Controller  
5. Service  
6. Repository  

Public routes (e.g. health, login) may skip auth/RBAC intentionally.

## API response shape

All responses use:

```ts
{
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
  meta: { page?: number; pageSize?: number; total?: number; ... } | null;
}
```

- Success: `error` is `null`, `data` holds the payload.
- Failure: `data` is `null`, `error` is populated.
- List endpoints must support **pagination, sorting, and filtering**; put list metadata in `meta`.

## Soft delete

- Every table includes `created_at`, `updated_at`, and `deleted_at`.
- **Never hard-delete** domain rows. Set `deleted_at` and exclude soft-deleted rows from default queries (`WHERE deleted_at IS NULL`).

## Audit log

- Every write action (create / update / delete / approve) writes an audit log entry from the **backend service layer** (never the frontend).
- Capture at minimum: actor, action, entity type + id, before/after or diff, timestamp.

## TypeScript

- `strict` mode in both apps.
- Entity types are defined in the API (source of truth) and mirrored or shared for the web app.
- Prefer explicit return types on service public methods.

## Environment files

| App | Files | Allowed secrets |
| --- | --- | --- |
| `apps/api` | `.env.example`, `.env.local` | `DATABASE_URL`, JWT secrets, etc. |
| `apps/web` | `.env.example`, `.env.local` | Public `NEXT_PUBLIC_*` only |

Copy `.env.example` → `.env.local` per app for local development. Never commit real secrets.

## CI

GitHub Actions runs **separate jobs** for web and API (`lint` + `typecheck`). See `.github/workflows/ci.yml`.

## Modules

Keep modules self-contained. Prefer extending a module in place over reaching into unrelated folders. Cross-cutting concerns (auth, audit, response helpers) live under `apps/api/src/lib` and `apps/api/src/middleware`.
