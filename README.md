# Workforce 360 ERP

Production-oriented modular ERP monorepo.

| App | Path | Stack |
| --- | --- | --- |
| Web | `apps/web` | Next.js 14 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query |
| API | `apps/api` | **Express** + TypeScript, Zod, **Prisma** → PostgreSQL |

The web app talks to the API over HTTP only. It never holds DB credentials or ORM clients.

## Prerequisites

- Node.js 20+
- PostgreSQL (local or Supabase connection string)

## Setup

```bash
# Install all workspaces
npm install

# API env (DB + JWT secrets)
cp apps/api/.env.example apps/api/.env.local
# Edit DATABASE_URL to your Postgres / Supabase URL

# Web env (public API URL only — zero DB secrets)
cp apps/web/.env.example apps/web/.env.local

# Generate Prisma client + apply migrations
npm run db:generate
npm run db:migrate
```

## Develop

```bash
# Terminal 1 — API (http://localhost:4000)
npm run dev:api

# Terminal 2 — Web (http://localhost:3000)
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000). The home page calls `GET /api/health` through the typed client and shows DB connectivity.

Without Postgres running, the API still starts and returns `{ status: "degraded", database.connected: false }` — proving the HTTP boundary even when the DB is offline.

## Scripts

| Script | Description |
| --- | --- |
| `npm run lint` | Lint web + API |
| `npm run typecheck` | Typecheck web + API |
| `npm run build` | Build API then web |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` |

## Phase 0 decisions

| Topic | Choice |
| --- | --- |
| HTTP framework | **Express** |
| ORM | **Prisma** (`apps/api/db/schema.prisma` + `db/migrations`) |
| Auth (later phases) | JWT access + refresh in **httpOnly cookies** |

See [CODING_STANDARDS.md](./CODING_STANDARDS.md) for naming, API envelope, soft-delete, audit log, and the frontend/backend separation rule.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs **separate jobs** for web and API (`lint` + `typecheck`).

## Phase 0 status

Foundation is in place. Known local notes:

- Set a real `DATABASE_URL` in `apps/api/.env.local`, then `npm run db:migrate`, for `status: "ok"` on health.
- Next.js may log a noisy `ENOWORKSPACES` SWC lockfile patch warning under npm workspaces; builds and `next dev` still succeed.
