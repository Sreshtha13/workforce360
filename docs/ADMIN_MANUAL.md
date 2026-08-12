# Admin Manual — Workforce 360 ERP (MVP)

Audience: **Super Administrators** and **Administrators**.

## Initial setup

1. Deploy per `DEPLOYMENT_GUIDE.md`.
2. Seed or create Super Admin user.
3. Configure organization master data: departments, teams, offices, designations, employee types.
4. Assign roles and verify permission matrix under **Admin → Roles**.

## Integrations (Phase 13)

Configure in API environment (never in frontend):

| Integration | Configuration |
|-------------|---------------|
| Google Login | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, callback `https://<api>/api/auth/google/callback` |
| Email | `RESEND_API_KEY` + verified `SMTP_FROM`, or SMTP vars |
| Storage | `STORAGE_PROVIDER=s3` + S3/Supabase credentials |
| Stripe | Secret + publishable keys + webhook secret |
| Razorpay | Key ID + secret + webhook secret |

View live status: **Admin → Integrations**.

### Outbound webhooks (future connectors)

Admins with `settings.manage` can register outbound webhook subscriptions via API:

- `GET /api/integrations/webhooks`
- `POST /api/integrations/webhooks` — `{ url, events: ["payment.succeeded", ...] }`
- `DELETE /api/integrations/webhooks/:id`

Events are signed with `X-Workforce360-Signature` (HMAC-SHA256).

## Security

- Enforce MFA for admin/finance roles via role policy.
- Review **Security Events** and **Audit Logs** regularly.
- Revoke compromised sessions via user device management.

## Workflows & templates

- **Approval workflows**: configure approver chains per module.
- **Notification templates**: customize email/in-app templates.
- **Report schedules**: cron-driven report delivery.

## Operations

- Health: `GET /api/health`
- API docs: `/api/docs`
- Backups: `scripts/backup-db.sh` (see `docs/DISASTER_RECOVERY.md`)
- Logs: structured JSON request logs from API process

## Support escalation

For application bugs, capture: user ID, timestamp, request ID from API logs, and steps to reproduce.
