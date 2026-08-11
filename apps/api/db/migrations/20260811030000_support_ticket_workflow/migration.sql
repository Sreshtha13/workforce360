-- Support ticket workflow: assignee, WAITING_FOR_EMPLOYEE, message thread

DO $$ BEGIN
  ALTER TYPE "SupportTicketStatus" ADD VALUE 'WAITING_FOR_EMPLOYEE';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportTicketMessageAuthor" AS ENUM ('EMPLOYEE', 'STAFF', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "assigned_to_id" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP(3);
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "closed_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "support_tickets_assigned_to_id_idx" ON "support_tickets"("assigned_to_id");

DO $$ BEGIN
  ALTER TABLE "support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_id_fkey"
    FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "support_ticket_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT,
    "author_type" "SupportTicketMessageAuthor" NOT NULL,
    "body" TEXT NOT NULL,
    "attachment_file_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "support_ticket_messages_ticket_id_idx"
  ON "support_ticket_messages"("ticket_id");

CREATE INDEX IF NOT EXISTS "support_ticket_messages_author_id_idx"
  ON "support_ticket_messages"("author_id");

DO $$ BEGIN
  ALTER TABLE "support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey"
    FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_attachment_file_id_fkey"
    FOREIGN KEY ("attachment_file_id") REFERENCES "stored_files"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Seed initial EMPLOYEE message from existing ticket description for history continuity
INSERT INTO "support_ticket_messages" (
  "id",
  "ticket_id",
  "author_id",
  "author_type",
  "body",
  "attachment_file_id",
  "created_at",
  "updated_at"
)
SELECT
  'seed_' || t."id",
  t."id",
  t."user_id",
  'EMPLOYEE'::"SupportTicketMessageAuthor",
  t."description",
  t."attachment_file_id",
  t."created_at",
  t."created_at"
FROM "support_tickets" t
WHERE t."deleted_at" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "support_ticket_messages" m WHERE m."ticket_id" = t."id"
  );
