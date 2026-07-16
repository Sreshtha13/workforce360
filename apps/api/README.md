# Workforce 360 API

Express + TypeScript backend. **Prisma** talks to PostgreSQL here — never from `apps/web`.

## Layering

`routes → middleware → controllers → services → repositories`

## Phase 0 auth decision

JWT **access + refresh** tokens delivered as **httpOnly cookies** (see root `CODING_STANDARDS.md`). Auth routes are not implemented yet.

## Local

```bash
cp .env.example .env.local
# set DATABASE_URL
npm run db:generate
npm run db:migrate
npm run dev
```

Health: `GET http://localhost:4000/api/health`
