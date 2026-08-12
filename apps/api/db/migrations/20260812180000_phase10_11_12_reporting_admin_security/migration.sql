-- Phase 10 (Reporting) + Phase 11 (Admin) + Phase 12 (Security)
-- Idempotent-safe where possible.

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "ReportType" AS ENUM (
    'ATTENDANCE', 'LEAVE', 'RECRUITMENT', 'INVOICE', 'PAYROLL', 'PROJECT', 'EXECUTIVE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportFormat" AS ENUM ('CSV', 'PDF');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ROLE.requires_mfa
-- ============================================================================

ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "requires_mfa" BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- REPORT SCHEDULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "report_schedules" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "report_type" "ReportType" NOT NULL,
  "format" "ReportFormat" NOT NULL DEFAULT 'CSV',
  "frequency" "ReportScheduleFrequency" NOT NULL DEFAULT 'WEEKLY',
  "day_of_period" INTEGER,
  "hour_utc" INTEGER NOT NULL DEFAULT 8,
  "recipients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "filters" JSONB,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_run_at" TIMESTAMP(3),
  "next_run_at" TIMESTAMP(3),
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "report_schedules"
    ADD CONSTRAINT "report_schedules_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "report_schedules_report_type_idx" ON "report_schedules"("report_type");
CREATE INDEX IF NOT EXISTS "report_schedules_is_active_idx" ON "report_schedules"("is_active");
CREATE INDEX IF NOT EXISTS "report_schedules_next_run_at_idx" ON "report_schedules"("next_run_at");

-- ============================================================================
-- NOTIFICATION TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "notification_templates" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'EMAIL',
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "updated_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),

  CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_code_key" ON "notification_templates"("code");
CREATE INDEX IF NOT EXISTS "notification_templates_channel_idx" ON "notification_templates"("channel");

DO $$ BEGIN
  ALTER TABLE "notification_templates"
    ADD CONSTRAINT "notification_templates_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "description" TEXT,
  "is_secret" BOOLEAN NOT NULL DEFAULT false,
  "updated_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_key_key" ON "system_settings"("key");
CREATE INDEX IF NOT EXISTS "system_settings_category_idx" ON "system_settings"("category");

DO $$ BEGIN
  ALTER TABLE "system_settings"
    ADD CONSTRAINT "system_settings_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- USER MFA
-- ============================================================================

CREATE TABLE IF NOT EXISTS "user_mfa" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "backup_codes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "enforced_by_role" BOOLEAN NOT NULL DEFAULT false,
  "verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_mfa_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_mfa_user_id_key" ON "user_mfa"("user_id");

DO $$ BEGIN
  ALTER TABLE "user_mfa"
    ADD CONSTRAINT "user_mfa_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TRUSTED DEVICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "trusted_devices" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "device_hash" TEXT NOT NULL,
  "label" TEXT,
  "user_agent" TEXT,
  "ip_address" TEXT,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "refresh_token_id" TEXT,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trusted_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "trusted_devices_user_id_device_hash_key"
  ON "trusted_devices"("user_id", "device_hash");
CREATE INDEX IF NOT EXISTS "trusted_devices_user_id_idx" ON "trusted_devices"("user_id");
CREATE INDEX IF NOT EXISTS "trusted_devices_revoked_at_idx" ON "trusted_devices"("revoked_at");

DO $$ BEGIN
  ALTER TABLE "trusted_devices"
    ADD CONSTRAINT "trusted_devices_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECURITY EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "security_events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "event_type" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'INFO',
  "message" TEXT NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "security_events_user_id_idx" ON "security_events"("user_id");
CREATE INDEX IF NOT EXISTS "security_events_event_type_idx" ON "security_events"("event_type");
CREATE INDEX IF NOT EXISTS "security_events_severity_idx" ON "security_events"("severity");
CREATE INDEX IF NOT EXISTS "security_events_created_at_idx" ON "security_events"("created_at");

DO $$ BEGIN
  ALTER TABLE "security_events"
    ADD CONSTRAINT "security_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SEED: Notification templates
-- ============================================================================

INSERT INTO "notification_templates" ("id", "code", "name", "channel", "subject", "body", "description", "is_active", "created_at", "updated_at")
VALUES
  (
    'ntpl_ticket_assigned',
    'ticket_assigned',
    'Ticket Assigned',
    'EMAIL',
    'Ticket assigned: {{ticketNumber}}',
    'Hello {{assigneeName}},\n\nTicket {{ticketNumber}} ({{subject}}) has been assigned to you.\n\nPriority: {{priority}}\nLink: {{link}}',
    'Sent when a support ticket is assigned',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'ntpl_approval_pending',
    'approval_pending',
    'Approval Pending',
    'EMAIL',
    'Approval needed: {{entityType}}',
    'Hello {{approverName}},\n\nYou have a pending approval for {{entityType}} {{entityId}}.\n\nRequested by: {{requesterName}}\nLink: {{link}}',
    'Sent when an approval step is awaiting action',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'ntpl_leave_decision',
    'leave_decision',
    'Leave Decision',
    'EMAIL',
    'Leave request {{status}}',
    'Hello {{employeeName}},\n\nYour leave request from {{startDate}} to {{endDate}} was {{status}}.\n\nNotes: {{notes}}',
    'Sent when a leave application is approved or rejected',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'ntpl_password_reset',
    'password_reset',
    'Password Reset',
    'EMAIL',
    'Reset your Workforce 360 password',
    'Hello {{firstName}},\n\nUse this link to reset your password (expires in 1 hour):\n{{resetLink}}\n\nIf you did not request this, ignore this email.',
    'Sent when a password reset is requested',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'ntpl_report_ready',
    'report_ready',
    'Scheduled Report Ready',
    'EMAIL',
    'Report ready: {{reportName}}',
    'Hello,\n\nYour scheduled report "{{reportName}}" ({{reportType}}) is attached / ready.\n\nGenerated at: {{generatedAt}}',
    'Sent when a scheduled report finishes',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;

-- ============================================================================
-- SEED: System settings
-- ============================================================================

INSERT INTO "system_settings" ("id", "key", "value", "category", "description", "is_secret", "created_at", "updated_at")
VALUES
  (
    'sysset_company_name',
    'company.name',
    'Workforce 360',
    'company',
    'Display name for the organization',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'sysset_mfa_optional',
    'security.mfa_optional',
    'true',
    'security',
    'When true, MFA is optional unless a role requires it',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'sysset_lockout_threshold',
    'security.lockout_threshold',
    '5',
    'security',
    'Failed login attempts in 15 minutes before CRITICAL alert',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'sysset_soft_delete_days',
    'retention.soft_delete_days',
    '2555',
    'retention',
    'Days to retain soft-deleted records (~7 years)',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("key") DO NOTHING;
