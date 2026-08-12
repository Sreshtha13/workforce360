-- Phase 8 (Help Desk upgrade) + Phase 9 (Notifications, Approval hardening, DMS)
-- Idempotent-safe where possible; preserves existing data.

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationCategory" AS ENUM (
    'TICKET', 'APPROVAL', 'LEAVE', 'PAYROLL', 'FINANCE', 'HR', 'ANNOUNCEMENT', 'SYSTEM', 'DOCUMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentContext" AS ENUM ('EMPLOYEE', 'CANDIDATE', 'PROJECT', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentAccessLevel" AS ENUM ('VIEW', 'EDIT', 'DELETE', 'MANAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend ApprovalActionType with DELEGATE / ESCALATE if missing
DO $$ BEGIN
  ALTER TYPE "ApprovalActionType" ADD VALUE IF NOT EXISTS 'DELEGATE';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "ApprovalActionType" ADD VALUE IF NOT EXISTS 'ESCALATE';
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================================
-- SUPPORT TICKETS — SLA fields + ticket_number + priority enum conversion
-- ============================================================================

ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "ticket_number" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "sla_policy_id" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "first_response_due_at" TIMESTAMP(3);
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "resolution_due_at" TIMESTAMP(3);
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "first_responded_at" TIMESTAMP(3);
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "escalated_at" TIMESTAMP(3);
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "escalation_level" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "approval_request_id" TEXT;

-- Convert priority TEXT → TicketPriority (keep old column temporarily)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'priority'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "priority_new" "TicketPriority";
    UPDATE "support_tickets" SET "priority_new" = CASE
      WHEN lower(priority) IN ('low') THEN 'LOW'::"TicketPriority"
      WHEN lower(priority) IN ('high') THEN 'HIGH'::"TicketPriority"
      WHEN lower(priority) IN ('urgent', 'critical') THEN 'URGENT'::"TicketPriority"
      ELSE 'MEDIUM'::"TicketPriority"
    END
    WHERE "priority_new" IS NULL;
    ALTER TABLE "support_tickets" DROP COLUMN "priority";
    ALTER TABLE "support_tickets" RENAME COLUMN "priority_new" TO "priority";
    ALTER TABLE "support_tickets" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM'::"TicketPriority";
    ALTER TABLE "support_tickets" ALTER COLUMN "priority" SET NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");
CREATE UNIQUE INDEX IF NOT EXISTS "support_tickets_approval_request_id_key" ON "support_tickets"("approval_request_id");
CREATE INDEX IF NOT EXISTS "support_tickets_priority_idx" ON "support_tickets"("priority");
CREATE INDEX IF NOT EXISTS "support_tickets_resolution_due_at_idx" ON "support_tickets"("resolution_due_at");

-- ============================================================================
-- NOTIFICATIONS — category + email_sent_at
-- ============================================================================

ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "category" "NotificationCategory" NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "email_sent_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "notifications_category_idx" ON "notifications"("category");

-- ============================================================================
-- APPROVAL REQUESTS / STEPS — workflow + due dates + delegation
-- ============================================================================

ALTER TABLE "approval_requests" ADD COLUMN IF NOT EXISTS "workflow_id" TEXT;
ALTER TABLE "approval_requests" ADD COLUMN IF NOT EXISTS "due_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "approval_requests_due_at_idx" ON "approval_requests"("due_at");

ALTER TABLE "approval_steps" ADD COLUMN IF NOT EXISTS "due_at" TIMESTAMP(3);
ALTER TABLE "approval_steps" ADD COLUMN IF NOT EXISTS "delegated_from_id" TEXT;

-- Rename approval_id → approval_request_id on leave/invoices/payroll if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_applications' AND column_name = 'approval_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_applications' AND column_name = 'approval_request_id'
  ) THEN
    ALTER TABLE "leave_applications" RENAME COLUMN "approval_id" TO "approval_request_id";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'approval_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'approval_request_id'
  ) THEN
    ALTER TABLE "invoices" RENAME COLUMN "approval_id" TO "approval_request_id";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_runs' AND column_name = 'approval_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payroll_runs' AND column_name = 'approval_request_id'
  ) THEN
    ALTER TABLE "payroll_runs" RENAME COLUMN "approval_id" TO "approval_request_id";
  END IF;
END $$;

ALTER TABLE "reimbursements" ADD COLUMN IF NOT EXISTS "approval_request_id" TEXT;
ALTER TABLE "leave_applications" ADD COLUMN IF NOT EXISTS "approval_request_id" TEXT;

-- ============================================================================
-- APPROVAL ACTIONS (may already exist from phase3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "approval_actions" (
    "id" TEXT NOT NULL,
    "approval_request_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action_type" "ApprovalActionType" NOT NULL,
    "level" INTEGER NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "approval_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "approval_actions_approval_request_id_idx" ON "approval_actions"("approval_request_id");
CREATE INDEX IF NOT EXISTS "approval_actions_actor_id_idx" ON "approval_actions"("actor_id");

-- ============================================================================
-- APPROVAL WORKFLOWS / LEVELS / CONDITIONS / DELEGATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "approval_workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "approval_workflows_code_key" ON "approval_workflows"("code");
CREATE INDEX IF NOT EXISTS "approval_workflows_entity_type_idx" ON "approval_workflows"("entity_type");
CREATE INDEX IF NOT EXISTS "approval_workflows_is_active_idx" ON "approval_workflows"("is_active");

CREATE TABLE IF NOT EXISTS "approval_workflow_levels" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "approver_role_code" TEXT,
    "approver_user_id" TEXT,
    "escalate_after_hours" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "approval_workflow_levels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "approval_workflow_levels_workflow_id_level_key"
  ON "approval_workflow_levels"("workflow_id", "level");
CREATE INDEX IF NOT EXISTS "approval_workflow_levels_workflow_id_idx"
  ON "approval_workflow_levels"("workflow_id");

CREATE TABLE IF NOT EXISTS "approval_workflow_conditions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "approval_workflow_conditions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "approval_workflow_conditions_workflow_id_idx"
  ON "approval_workflow_conditions"("workflow_id");

CREATE TABLE IF NOT EXISTS "approval_delegations" (
    "id" TEXT NOT NULL,
    "delegator_id" TEXT NOT NULL,
    "delegate_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "approval_delegations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "approval_delegations_delegator_id_idx" ON "approval_delegations"("delegator_id");
CREATE INDEX IF NOT EXISTS "approval_delegations_delegate_id_idx" ON "approval_delegations"("delegate_id");
CREATE INDEX IF NOT EXISTS "approval_delegations_starts_at_ends_at_idx"
  ON "approval_delegations"("starts_at", "ends_at");

-- ============================================================================
-- SLA POLICIES + KNOWLEDGE BASE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "sla_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "first_response_minutes" INTEGER NOT NULL,
    "resolution_minutes" INTEGER NOT NULL,
    "escalate_after_minutes" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sla_policies_priority_key" ON "sla_policies"("priority");

CREATE TABLE IF NOT EXISTS "knowledge_base_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "knowledge_base_articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_base_articles_slug_key" ON "knowledge_base_articles"("slug");
CREATE INDEX IF NOT EXISTS "knowledge_base_articles_is_published_idx" ON "knowledge_base_articles"("is_published");
CREATE INDEX IF NOT EXISTS "knowledge_base_articles_category_idx" ON "knowledge_base_articles"("category");

-- ============================================================================
-- NOTIFICATION PREFERENCES + ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_user_id_category_key"
  ON "notification_preferences"("user_id", "category");
CREATE INDEX IF NOT EXISTS "notification_preferences_user_id_idx"
  ON "notification_preferences"("user_id");

CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "published_by_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "announcements_is_active_idx" ON "announcements"("is_active");
CREATE INDEX IF NOT EXISTS "announcements_published_at_idx" ON "announcements"("published_at");

-- ============================================================================
-- DMS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "document_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "context" "DocumentContext",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "document_categories_code_key" ON "document_categories"("code");

CREATE TABLE IF NOT EXISTS "managed_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT,
    "context" "DocumentContext" NOT NULL DEFAULT 'GENERAL',
    "context_entity_id" TEXT,
    "current_version_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "managed_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "managed_documents_current_version_id_key"
  ON "managed_documents"("current_version_id");
CREATE INDEX IF NOT EXISTS "managed_documents_context_context_entity_id_idx"
  ON "managed_documents"("context", "context_entity_id");
CREATE INDEX IF NOT EXISTS "managed_documents_category_id_idx" ON "managed_documents"("category_id");
CREATE INDEX IF NOT EXISTS "managed_documents_created_by_id_idx" ON "managed_documents"("created_by_id");

CREATE TABLE IF NOT EXISTS "document_versions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "file_id" TEXT NOT NULL,
    "change_notes" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "document_versions_document_id_version_number_key"
  ON "document_versions"("document_id", "version_number");
CREATE INDEX IF NOT EXISTS "document_versions_document_id_idx" ON "document_versions"("document_id");
CREATE INDEX IF NOT EXISTS "document_versions_file_id_idx" ON "document_versions"("file_id");

CREATE TABLE IF NOT EXISTS "document_permissions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT,
    "role_code" TEXT,
    "access_level" "DocumentAccessLevel" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "document_permissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_permissions_document_id_idx" ON "document_permissions"("document_id");
CREATE INDEX IF NOT EXISTS "document_permissions_user_id_idx" ON "document_permissions"("user_id");
CREATE INDEX IF NOT EXISTS "document_permissions_role_code_idx" ON "document_permissions"("role_code");

-- ============================================================================
-- FOREIGN KEYS (guarded)
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_sla_policy_id_fkey') THEN
    ALTER TABLE "support_tickets"
      ADD CONSTRAINT "support_tickets_sla_policy_id_fkey"
      FOREIGN KEY ("sla_policy_id") REFERENCES "sla_policies"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_approval_request_id_fkey') THEN
    ALTER TABLE "support_tickets"
      ADD CONSTRAINT "support_tickets_approval_request_id_fkey"
      FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_requests_workflow_id_fkey') THEN
    ALTER TABLE "approval_requests"
      ADD CONSTRAINT "approval_requests_workflow_id_fkey"
      FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_steps_delegated_from_id_fkey') THEN
    ALTER TABLE "approval_steps"
      ADD CONSTRAINT "approval_steps_delegated_from_id_fkey"
      FOREIGN KEY ("delegated_from_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_workflow_levels_workflow_id_fkey') THEN
    ALTER TABLE "approval_workflow_levels"
      ADD CONSTRAINT "approval_workflow_levels_workflow_id_fkey"
      FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_workflow_conditions_workflow_id_fkey') THEN
    ALTER TABLE "approval_workflow_conditions"
      ADD CONSTRAINT "approval_workflow_conditions_workflow_id_fkey"
      FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_delegations_delegator_id_fkey') THEN
    ALTER TABLE "approval_delegations"
      ADD CONSTRAINT "approval_delegations_delegator_id_fkey"
      FOREIGN KEY ("delegator_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_delegations_delegate_id_fkey') THEN
    ALTER TABLE "approval_delegations"
      ADD CONSTRAINT "approval_delegations_delegate_id_fkey"
      FOREIGN KEY ("delegate_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_actions_approval_request_id_fkey') THEN
    ALTER TABLE "approval_actions"
      ADD CONSTRAINT "approval_actions_approval_request_id_fkey"
      FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'approval_actions_actor_id_fkey') THEN
    ALTER TABLE "approval_actions"
      ADD CONSTRAINT "approval_actions_actor_id_fkey"
      FOREIGN KEY ("actor_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_base_articles_author_id_fkey') THEN
    ALTER TABLE "knowledge_base_articles"
      ADD CONSTRAINT "knowledge_base_articles_author_id_fkey"
      FOREIGN KEY ("author_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_preferences_user_id_fkey') THEN
    ALTER TABLE "notification_preferences"
      ADD CONSTRAINT "notification_preferences_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_published_by_id_fkey') THEN
    ALTER TABLE "announcements"
      ADD CONSTRAINT "announcements_published_by_id_fkey"
      FOREIGN KEY ("published_by_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'managed_documents_category_id_fkey') THEN
    ALTER TABLE "managed_documents"
      ADD CONSTRAINT "managed_documents_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "document_categories"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'managed_documents_created_by_id_fkey') THEN
    ALTER TABLE "managed_documents"
      ADD CONSTRAINT "managed_documents_created_by_id_fkey"
      FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_versions_document_id_fkey') THEN
    ALTER TABLE "document_versions"
      ADD CONSTRAINT "document_versions_document_id_fkey"
      FOREIGN KEY ("document_id") REFERENCES "managed_documents"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_versions_file_id_fkey') THEN
    ALTER TABLE "document_versions"
      ADD CONSTRAINT "document_versions_file_id_fkey"
      FOREIGN KEY ("file_id") REFERENCES "stored_files"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_versions_uploaded_by_id_fkey') THEN
    ALTER TABLE "document_versions"
      ADD CONSTRAINT "document_versions_uploaded_by_id_fkey"
      FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'managed_documents_current_version_id_fkey') THEN
    ALTER TABLE "managed_documents"
      ADD CONSTRAINT "managed_documents_current_version_id_fkey"
      FOREIGN KEY ("current_version_id") REFERENCES "document_versions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_permissions_document_id_fkey') THEN
    ALTER TABLE "document_permissions"
      ADD CONSTRAINT "document_permissions_document_id_fkey"
      FOREIGN KEY ("document_id") REFERENCES "managed_documents"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'document_permissions_user_id_fkey') THEN
    ALTER TABLE "document_permissions"
      ADD CONSTRAINT "document_permissions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reimbursements_approval_request_id_fkey') THEN
    ALTER TABLE "reimbursements"
      ADD CONSTRAINT "reimbursements_approval_request_id_fkey"
      FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- SEED DEFAULT SLA POLICIES
-- ============================================================================

INSERT INTO "sla_policies" (
  "id", "name", "priority", "first_response_minutes", "resolution_minutes",
  "escalate_after_minutes", "is_active", "created_at", "updated_at"
)
VALUES
  ('sla-low', 'Low priority SLA', 'LOW', 480, 2880, 1440, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla-medium', 'Medium priority SLA', 'MEDIUM', 240, 1440, 720, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla-high', 'High priority SLA', 'HIGH', 60, 480, 240, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sla-urgent', 'Urgent priority SLA', 'URGENT', 30, 240, 120, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Also upsert by priority uniqueness if ids differ
INSERT INTO "sla_policies" (
  "id", "name", "priority", "first_response_minutes", "resolution_minutes",
  "escalate_after_minutes", "is_active", "created_at", "updated_at"
)
SELECT
  'sla-' || lower(p::text),
  initcap(p::text) || ' priority SLA',
  p,
  CASE p WHEN 'LOW' THEN 480 WHEN 'MEDIUM' THEN 240 WHEN 'HIGH' THEN 60 ELSE 30 END,
  CASE p WHEN 'LOW' THEN 2880 WHEN 'MEDIUM' THEN 1440 WHEN 'HIGH' THEN 480 ELSE 240 END,
  CASE p WHEN 'LOW' THEN 1440 WHEN 'MEDIUM' THEN 720 WHEN 'HIGH' THEN 240 ELSE 120 END,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (VALUES ('LOW'::"TicketPriority"), ('MEDIUM'::"TicketPriority"), ('HIGH'::"TicketPriority"), ('URGENT'::"TicketPriority")) AS t(p)
WHERE NOT EXISTS (SELECT 1 FROM "sla_policies" sp WHERE sp.priority = t.p);
