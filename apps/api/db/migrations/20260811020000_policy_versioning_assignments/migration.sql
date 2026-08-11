-- Policy versioning, assignments, and acknowledgements

-- Version chain + family grouping on existing policies
ALTER TABLE "company_policies" ADD COLUMN IF NOT EXISTS "family_id" TEXT;
ALTER TABLE "company_policies" ADD COLUMN IF NOT EXISTS "previous_version_id" TEXT;

-- Each policy is its own family until grouped; backfill family_id = id
UPDATE "company_policies"
SET "family_id" = "id"
WHERE "family_id" IS NULL;

ALTER TABLE "company_policies" ALTER COLUMN "family_id" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "company_policies_previous_version_id_key"
  ON "company_policies"("previous_version_id");

CREATE INDEX IF NOT EXISTS "company_policies_family_id_idx"
  ON "company_policies"("family_id");

ALTER TABLE "company_policies"
  ADD CONSTRAINT "company_policies_previous_version_id_fkey"
  FOREIGN KEY ("previous_version_id") REFERENCES "company_policies"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Assignment targets (ALL, USER, DEPARTMENT, TEAM)
CREATE TYPE "PolicyAssignmentTarget" AS ENUM ('ALL', 'USER', 'DEPARTMENT', 'TEAM');

CREATE TABLE IF NOT EXISTS "policy_assignments" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "target_type" "PolicyAssignmentTarget" NOT NULL,
    "user_id" TEXT,
    "department_id" TEXT,
    "team_id" TEXT,
    "assigned_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "policy_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "policy_assignments_family_id_idx" ON "policy_assignments"("family_id");
CREATE INDEX IF NOT EXISTS "policy_assignments_user_id_idx" ON "policy_assignments"("user_id");
CREATE INDEX IF NOT EXISTS "policy_assignments_department_id_idx" ON "policy_assignments"("department_id");
CREATE INDEX IF NOT EXISTS "policy_assignments_team_id_idx" ON "policy_assignments"("team_id");

ALTER TABLE "policy_assignments"
  ADD CONSTRAINT "policy_assignments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "policy_assignments"
  ADD CONSTRAINT "policy_assignments_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "policy_assignments"
  ADD CONSTRAINT "policy_assignments_team_id_fkey"
  FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "policy_assignments"
  ADD CONSTRAINT "policy_assignments_assigned_by_id_fkey"
  FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Per-user acknowledgement of a specific published version
CREATE TABLE IF NOT EXISTS "policy_acknowledgements" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "acknowledged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_acknowledgements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "policy_acknowledgements_policy_id_user_id_key"
  ON "policy_acknowledgements"("policy_id", "user_id");

CREATE INDEX IF NOT EXISTS "policy_acknowledgements_user_id_idx"
  ON "policy_acknowledgements"("user_id");

ALTER TABLE "policy_acknowledgements"
  ADD CONSTRAINT "policy_acknowledgements_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "company_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "policy_acknowledgements"
  ADD CONSTRAINT "policy_acknowledgements_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
