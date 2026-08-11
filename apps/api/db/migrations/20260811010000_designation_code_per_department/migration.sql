-- Scope designation codes per department (same short code may exist in different depts).
DROP INDEX IF EXISTS "designations_code_key";

CREATE UNIQUE INDEX IF NOT EXISTS "designations_department_id_code_key"
  ON "designations"("department_id", "code");
