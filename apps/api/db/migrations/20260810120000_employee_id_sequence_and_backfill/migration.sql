-- Employee ID sequence table for atomic EMP### generation
CREATE TABLE IF NOT EXISTS "employee_id_sequences" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_id_sequences_pkey" PRIMARY KEY ("id")
);

-- Seed sequence from the highest existing EMP### in users or employees
INSERT INTO "employee_id_sequences" ("id", "last_value", "updated_at")
SELECT
    'default',
    COALESCE(
        (
            SELECT MAX(seq) FROM (
                SELECT CAST(SUBSTRING("employee_id" FROM 'EMP([0-9]+)') AS INTEGER) AS seq
                FROM "users"
                WHERE "employee_id" ~* '^EMP[0-9]+$' AND "deleted_at" IS NULL
                UNION ALL
                SELECT CAST(SUBSTRING("employee_code" FROM 'EMP([0-9]+)') AS INTEGER) AS seq
                FROM "employees"
                WHERE "employee_code" ~* '^EMP[0-9]+$' AND "deleted_at" IS NULL
            ) AS combined
        ),
        0
    ),
    CURRENT_TIMESTAMP
ON CONFLICT ("id") DO UPDATE
SET "last_value" = GREATEST("employee_id_sequences"."last_value", EXCLUDED."last_value"),
    "updated_at" = CURRENT_TIMESTAMP;

-- Backfill Employee master rows for users that have employee_id but no employees record
INSERT INTO "employees" (
    "id",
    "user_id",
    "employee_code",
    "lifecycle_state",
    "hired_at",
    "created_at",
    "updated_at"
)
SELECT
    'backfill_' || u."id",
    u."id",
    u."employee_id",
    'ACTIVE'::"EmployeeLifecycleState",
    COALESCE(u."date_of_joining", CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE u."employee_id" IS NOT NULL
  AND u."deleted_at" IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM "employees" e
      WHERE e."user_id" = u."id" AND e."deleted_at" IS NULL
  );
