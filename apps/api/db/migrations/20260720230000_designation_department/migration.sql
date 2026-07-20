-- Add department ownership and required hierarchy level to designations

ALTER TABLE "designations" ADD COLUMN "department_id" TEXT;

UPDATE "designations" d
SET "department_id" = (
  SELECT dep."id"
  FROM "departments" dep
  WHERE dep."deleted_at" IS NULL
  ORDER BY dep."created_at" ASC
  LIMIT 1
)
WHERE d."department_id" IS NULL;

UPDATE "designations"
SET "level" = 1
WHERE "level" IS NULL;

ALTER TABLE "designations" ALTER COLUMN "department_id" SET NOT NULL;
ALTER TABLE "designations" ALTER COLUMN "level" SET NOT NULL;

CREATE INDEX "designations_department_id_idx" ON "designations"("department_id");

ALTER TABLE "designations"
ADD CONSTRAINT "designations_department_id_fkey"
FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
