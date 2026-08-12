# Deployment Guide — Workforce 360 ERP

This guide covers **independent deployment** of `/apps/api` (Node.js backend) and `/apps/web` (Next.js frontend).

## Architecture rule

- **Frontend** (`apps/web`) only calls the backend REST API via `NEXT_PUBLIC_API_BASE_URL`.
- **Backend** (`apps/api`) holds all secrets: `DATABASE_URL`, JWT secrets, OAuth, SMTP/Resend, S3, Stripe, Razorpay.
- Never put database credentials or integration secrets in the frontend bundle.

---

## 1. Prerequisites

| Component | Version |
|-----------|---------|
| Node.js | 20+ |
| PostgreSQL | 14+ (Supabase-hosted Postgres works) |
| npm | 9+ (monorepo workspaces) |

---

## 2. Environment variables

### API (`apps/api/.env`)

Copy `apps/api/.env.example` and set:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_ACCESS_SECRET` | Yes (prod) | Min 32 characters |
| `JWT_REFRESH_SECRET` | Yes (prod) | Min 32 characters |
| `CORS_ORIGIN` | Yes | Exact frontend origin(s), comma-separated |
| `COOKIE_SECURE` | Yes (prod) | `true` when served over HTTPS |
| `APP_PUBLIC_BASE_URL` | Yes | Frontend URL for redirects (OAuth, payments) |
| `GOOGLE_*` | Optional | Google OAuth |
| `SMTP_*` / `RESEND_API_KEY` | Optional | Email; console fallback if unset |
| `STORAGE_PROVIDER` | Yes | `local` or `s3` |
| `S3_*` | If s3 | Supabase Storage uses S3-compatible endpoint |
| `STRIPE_*` / `RAZORPAY_*` | Optional | Payment gateways |

### Web (`apps/web/.env`)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Public API URL (e.g. `https://api.yourcompany.com`) |

**Only** `NEXT_PUBLIC_*` vars may appear in the web app.

---

## 3. Database setup

```bash
npm ci
npm run db:generate -w api
npm run db:migrate:deploy -w api   # production migrations
npm run db:seed -w api               # optional demo data
```

---

## 4. Build & run (without Docker)

### API

```bash
npm run build:api
cd apps/api && node dist/index.js
# Or: npm run start -w api
```

Default port: `4000`. Health check: `GET /api/health`.

### Web

```bash
npm run build:web
npm run start -w web
```

Default port: `3000`.

---

## 5. Docker / docker-compose

```bash
docker compose up --build
```

Services: Postgres (`5432`), API (`4000`), Web (`3000`).

After first boot, run migrations inside the API container:

```bash
docker compose exec api npm run db:migrate:deploy -w api
```

---

## 6. Production checklist

- [ ] HTTPS on both frontend and API
- [ ] `COOKIE_SECURE=true`
- [ ] `CORS_ORIGIN` matches exact frontend origin
- [ ] Strong JWT secrets (32+ chars, unique per environment)
- [ ] `STORAGE_PROVIDER=s3` with private bucket
- [ ] Payment webhook URLs registered in Stripe/Razorpay dashboards:
  - `https://<api-host>/api/payment-webhooks/stripe`
  - `https://<api-host>/api/payment-webhooks/razorpay`
- [ ] Google OAuth redirect URI: `https://<api-host>/api/auth/google/callback`
- [ ] Daily backups scheduled (`scripts/backup-db.sh`)
- [ ] Scheduler jobs running (report schedules, approval escalations)

---

## 7. API documentation

Live OpenAPI UI: `https://<api-host>/api/docs`

---

## 8. Monitoring

- Structured request logs (JSON per request) via request logger middleware
- Health endpoint: `GET /api/health` (includes DB latency)
- Audit logs and security events in database tables

For external APM (Datadog, Sentry), forward container logs or add SDK in a future ops pass.
