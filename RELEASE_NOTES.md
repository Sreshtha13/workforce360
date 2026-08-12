# Release Notes — Workforce 360 ERP MVP

## v1.0.0-mvp (Phase 13–16)

### Integrations (Phase 13)

- **Google Login**: Backend OAuth flow with login UI, callback route, and account linking for existing emails.
- **Email**: Resend API + SMTP fallback; invoice send emails clients when email is set.
- **Storage**: AWS SDK dependencies for S3-compatible storage (including Supabase Storage).
- **Payments**: Stripe Checkout redirect + Razorpay Checkout.js on invoice detail; payment config API shape aligned with frontend.
- **Webhook framework**: Outbound webhook subscriptions (admin API) and `payment.succeeded` dispatch; integration registry on admin page.

### Performance & infrastructure (Phase 14)

- CI: lint and typecheck gates for API and web.
- Docker images for API and web; `docker-compose.yml` for local full stack.
- Structured request logging middleware.
- Pagination utilities (foundation for list endpoints).
- Database backup/restore scripts and disaster recovery documentation.

### Documentation (Phase 16)

- Deployment guide, user/admin manuals, full-system UAT checklist, production rollout checklist, release notes.

### Architecture

- Frontend holds **only** `NEXT_PUBLIC_API_BASE_URL` — no integration secrets in client bundles.

---

## Upgrade notes

1. Run `npm ci` (new `@aws-sdk/*` dependencies).
2. Run `npm run db:migrate:deploy -w api` if pending migrations exist.
3. Update production env per `DEPLOYMENT_GUIDE.md`.
4. Rebuild web with `output: standalone` for Docker deployments.
