-- Account status: rename legacy "suspended" to "blocked"
UPDATE "users" SET "status" = 'blocked' WHERE "status" = 'suspended';

-- Detach users from legacy employment status lookup rows before replacement
UPDATE "users" SET "employment_status_id" = NULL WHERE "employment_status_id" IS NOT NULL;

-- Soft-delete legacy employment status lookup values
UPDATE "employment_statuses" SET "deleted_at" = CURRENT_TIMESTAMP WHERE "deleted_at" IS NULL;

-- Canonical employment types (Full Time, Part Time, Contract, Intern, Probation, Consultant)
INSERT INTO "employment_statuses" ("id", "name", "code", "is_active", "created_at", "updated_at")
VALUES
  ('empstat_full_time', 'Full Time', 'full_time', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('empstat_part_time', 'Part Time', 'part_time', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('empstat_contract', 'Contract', 'contract', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('empstat_intern', 'Intern', 'intern', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('empstat_probation', 'Probation', 'probation', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('empstat_consultant', 'Consultant', 'consultant', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "is_active" = true,
  "deleted_at" = NULL,
  "updated_at" = CURRENT_TIMESTAMP;
