# Production Rollout Checklist

## Pre-deploy (T-7 days)

- [ ] UAT sign-off on `docs/UAT_FULL_SYSTEM.md`
- [ ] Security review: no secrets in `apps/web` build output
- [ ] Load test: login, dashboard, invoice list, payroll run (targets: page &lt; 3s, API &lt; 2s)
- [ ] DR restore tested on staging (`docs/DISASTER_RECOVERY.md`)
- [ ] Runbook reviewed: `DEPLOYMENT_GUIDE.md`

## Pre-deploy (T-1 day)

- [ ] Freeze feature branch; CI green (build, lint, typecheck, tests)
- [ ] Production env vars set (API + web)
- [ ] `db:migrate:deploy` tested against staging clone
- [ ] Stripe/Razorpay webhook endpoints registered
- [ ] Google OAuth redirect URI updated for production API host
- [ ] Backup cron verified

## Deploy day

1. [ ] Maintenance window communicated
2. [ ] Run `npm run db:migrate:deploy -w api` on production DB
3. [ ] Deploy API (zero-downtime or brief maintenance)
4. [ ] Deploy web with correct `NEXT_PUBLIC_API_BASE_URL`
5. [ ] Smoke test: health, login, dashboard, one finance flow
6. [ ] Monitor error logs for 30 minutes

## Post-deploy (T+1)

- [ ] Verify scheduled jobs (reports, escalations)
- [ ] Verify backup job ran
- [ ] Update `RELEASE_NOTES.md` with deployment date
- [ ] Hand off to support with `docs/USER_MANUAL.md` and `docs/ADMIN_MANUAL.md`

## Rollback

- [ ] Redeploy previous API/web images
- [ ] If schema migration is backward-incompatible, restore DB from pre-deploy backup (see DR plan)
