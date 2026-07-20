-- Add module and feature columns for permission categorization (Module → Feature → Action)
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "module" TEXT NOT NULL DEFAULT 'General';
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "feature" TEXT;

CREATE INDEX IF NOT EXISTS "permissions_module_idx" ON "permissions"("module");

-- Backfill module/feature from resource
UPDATE "permissions" SET "module" = 'Administration', "feature" = 'Users' WHERE "resource" = 'user' AND ("feature" IS NULL OR "feature" = '');
UPDATE "permissions" SET "module" = 'Administration', "feature" = 'Roles' WHERE "resource" = 'role' AND ("feature" IS NULL OR "feature" = '');
UPDATE "permissions" SET "module" = 'Administration', "feature" = 'Permissions' WHERE "resource" = 'permission' AND ("feature" IS NULL OR "feature" = '');
UPDATE "permissions" SET "module" = 'Organization', "feature" = 'Departments' WHERE "resource" = 'department' AND ("feature" IS NULL OR "feature" = '');
UPDATE "permissions" SET "module" = 'Organization', "feature" = 'Teams' WHERE "resource" = 'team' AND ("feature" IS NULL OR "feature" = '');
UPDATE "permissions" SET "module" = 'Organization', "feature" = 'Designations' WHERE "resource" = 'designation' AND ("feature" IS NULL OR "feature" = '');
UPDATE "permissions" SET "module" = 'Organization', "feature" = 'Offices' WHERE "resource" = 'office' AND ("feature" IS NULL OR "feature" = '');
UPDATE "permissions" SET "module" = 'Organization', "feature" = 'Employee Types' WHERE "resource" = 'employee_type' AND ("feature" IS NULL OR "feature" = '');
UPDATE "permissions" SET "module" = 'Organization', "feature" = 'Employment Statuses' WHERE "resource" = 'employment_status' AND ("feature" IS NULL OR "feature" = '');
