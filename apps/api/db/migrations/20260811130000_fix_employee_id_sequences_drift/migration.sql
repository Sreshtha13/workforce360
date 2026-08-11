-- Pre-existing drift fix (discovered while preparing the Phase 4 migration):
-- the "employee_id_sequences" table was defined in schema.prisma and marked as
-- applied via migration 20260810120000_employee_id_sequence_and_backfill, but was
-- never actually created on this environment's database. Recreate it idempotently.

CREATE TABLE IF NOT EXISTS "employee_id_sequences" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_id_sequences_pkey" PRIMARY KEY ("id")
);
