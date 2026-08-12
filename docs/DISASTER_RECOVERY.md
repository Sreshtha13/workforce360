# Disaster Recovery Plan — Workforce 360 ERP

## Objectives

| Metric | Target |
|--------|--------|
| **RPO** (max data loss) | 24 hours (daily backups) |
| **RTO** (time to restore service) | 4 hours |

## Backup strategy

### Automated daily backup

Use `scripts/backup-db.sh` with cron:

```bash
0 2 * * * /path/to/workforce360/scripts/backup-db.sh /var/backups/workforce360
```

For Supabase-hosted Postgres, also enable provider **Point-in-Time Recovery (PITR)** in the Supabase dashboard.

### What is backed up

- Full PostgreSQL logical dump (`pg_dump`) compressed with gzip
- Application uploads: S3 bucket versioning or periodic sync of `STORAGE_LOCAL_DIR` if using local storage

### Retention

- Daily backups: 30 days
- Weekly copies: 90 days (optional off-site copy)

## Restore procedure

1. **Announce maintenance** and stop API instances (prevent writes during restore).
2. **Restore database:**

   ```bash
   ./scripts/restore-db.sh /var/backups/workforce360/workforce360_YYYYMMDD_HHMMSS.sql.gz
   ```

3. **Verify:**

   ```bash
   npm run db:migrate:deploy -w api   # ensure schema matches
   curl https://<api>/api/health
   ```

4. **Restart API and web**; smoke-test login and dashboard.
5. **Document incident** in ops log.

## Restore test (quarterly)

1. Restore latest backup to a **staging** database (never prod first).
2. Run UAT smoke tests from `docs/UAT_FULL_SYSTEM.md` sections P1–P3.
3. Record restore duration and any issues.

## Failure scenarios

| Scenario | Response |
|----------|----------|
| DB corruption | Restore from latest `pg_dump`; use PITR if available |
| API host failure | Redeploy from CI image; DB unchanged |
| S3 bucket loss | Restore from bucket versioning / replica |
| Region outage | Failover to DR region (manual — multi-region not in MVP) |

## Contacts

Document your on-call rotation and escalation path here before production launch.
