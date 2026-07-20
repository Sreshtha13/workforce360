-- Normalize legacy employee type codes and names
UPDATE "employee_types"
SET "code" = 'FT', "name" = 'Full Time'
WHERE "code" = 'full_time' OR LOWER("name") IN ('full-time', 'full time');

UPDATE "employee_types"
SET "code" = 'PT', "name" = 'Part Time'
WHERE "code" = 'part_time' OR LOWER("name") IN ('part-time', 'part time');

UPDATE "employee_types"
SET "code" = 'CNT', "name" = 'Contract'
WHERE "code" = 'contract' OR LOWER("name") = 'contract';

UPDATE "employee_types"
SET "code" = 'INT', "name" = 'Intern'
WHERE "code" = 'intern' OR LOWER("name") = 'intern';

UPDATE "employee_types"
SET "code" = 'CON', "name" = 'Consultant'
WHERE "code" = 'consultant' OR LOWER("name") = 'consultant';

-- Backfill any remaining null codes before enforcing NOT NULL
UPDATE "employee_types"
SET "code" = UPPER(LEFT(REPLACE("id", '-', ''), 8))
WHERE "code" IS NULL;

ALTER TABLE "employee_types" ALTER COLUMN "code" SET NOT NULL;
