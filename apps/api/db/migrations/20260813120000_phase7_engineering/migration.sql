-- Phase 7: Development & QA (Engineering module)

-- Enums (idempotent so a retried failed reset can re-apply this file)
DO $$ BEGIN CREATE TYPE "ReleaseStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'TESTING', 'STAGING', 'RELEASED', 'ROLLED_BACK'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ReleaseType" AS ENUM ('MAJOR', 'MINOR', 'PATCH', 'HOTFIX'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TestCaseStatus" AS ENUM ('DRAFT', 'READY', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TestCasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TrainingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Link tasks to releases when the Phase 6 `tasks` table exists.
-- Guarded: a migrate reset used to fail here because Phase 5/6 had no migration.
DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "release_id" TEXT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "releases" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReleaseType" NOT NULL DEFAULT 'MINOR',
    "status" "ReleaseStatus" NOT NULL DEFAULT 'PLANNING',
    "description" TEXT,
    "release_date" TIMESTAMP(3),
    "deployed_at" TIMESTAMP(3),
    "deployed_by_id" TEXT,
    "release_notes" TEXT,
    "tag_name" TEXT,
    "commit_hash" TEXT,
    "build_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "test_cases" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "release_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "steps" TEXT,
    "expected_result" TEXT,
    "status" "TestCaseStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "TestCasePriority" NOT NULL DEFAULT 'MEDIUM',
    "assigned_to_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3),
    "executed_by_id" TEXT,
    "actual_result" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "documentations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "url" TEXT,
    "content" TEXT,
    "version" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documentations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tech_trainings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "content" TEXT,
    "url" TEXT,
    "duration" INTEGER,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tech_trainings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "training_enrollments" (
    "id" TEXT NOT NULL,
    "training_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "TrainingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "score" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "code_reviews" (
    "id" TEXT NOT NULL,
    "task_id" TEXT,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pull_request_url" TEXT,
    "author_id" TEXT NOT NULL,
    "reviewer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "review_notes" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "code_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "releases_project_id_version_key" ON "releases"("project_id", "version");
CREATE INDEX IF NOT EXISTS "releases_project_id_idx" ON "releases"("project_id");
CREATE INDEX IF NOT EXISTS "releases_status_idx" ON "releases"("status");
CREATE INDEX IF NOT EXISTS "releases_release_date_idx" ON "releases"("release_date");

CREATE INDEX IF NOT EXISTS "test_cases_project_id_idx" ON "test_cases"("project_id");
CREATE INDEX IF NOT EXISTS "test_cases_release_id_idx" ON "test_cases"("release_id");
CREATE INDEX IF NOT EXISTS "test_cases_status_idx" ON "test_cases"("status");
CREATE INDEX IF NOT EXISTS "test_cases_assigned_to_id_idx" ON "test_cases"("assigned_to_id");

CREATE INDEX IF NOT EXISTS "documentations_project_id_idx" ON "documentations"("project_id");
CREATE INDEX IF NOT EXISTS "documentations_category_idx" ON "documentations"("category");
CREATE INDEX IF NOT EXISTS "documentations_is_published_idx" ON "documentations"("is_published");

CREATE INDEX IF NOT EXISTS "tech_trainings_category_idx" ON "tech_trainings"("category");
CREATE INDEX IF NOT EXISTS "tech_trainings_is_active_idx" ON "tech_trainings"("is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "training_enrollments_training_id_user_id_key" ON "training_enrollments"("training_id", "user_id");
CREATE INDEX IF NOT EXISTS "training_enrollments_training_id_idx" ON "training_enrollments"("training_id");
CREATE INDEX IF NOT EXISTS "training_enrollments_user_id_idx" ON "training_enrollments"("user_id");
CREATE INDEX IF NOT EXISTS "training_enrollments_status_idx" ON "training_enrollments"("status");

CREATE INDEX IF NOT EXISTS "code_reviews_task_id_idx" ON "code_reviews"("task_id");
CREATE INDEX IF NOT EXISTS "code_reviews_project_id_idx" ON "code_reviews"("project_id");
CREATE INDEX IF NOT EXISTS "code_reviews_author_id_idx" ON "code_reviews"("author_id");
CREATE INDEX IF NOT EXISTS "code_reviews_reviewer_id_idx" ON "code_reviews"("reviewer_id");
CREATE INDEX IF NOT EXISTS "code_reviews_status_idx" ON "code_reviews"("status");

DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "tasks_release_id_idx" ON "tasks"("release_id");
  END IF;
END $$;

-- Foreign keys (idempotent via DO blocks would be verbose; assume fresh migration)
ALTER TABLE "releases" DROP CONSTRAINT IF EXISTS "releases_project_id_fkey";
ALTER TABLE "releases" ADD CONSTRAINT "releases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "releases" DROP CONSTRAINT IF EXISTS "releases_deployed_by_id_fkey";
ALTER TABLE "releases" ADD CONSTRAINT "releases_deployed_by_id_fkey" FOREIGN KEY ("deployed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "test_cases" DROP CONSTRAINT IF EXISTS "test_cases_project_id_fkey";
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "test_cases" DROP CONSTRAINT IF EXISTS "test_cases_release_id_fkey";
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "test_cases" DROP CONSTRAINT IF EXISTS "test_cases_assigned_to_id_fkey";
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "test_cases" DROP CONSTRAINT IF EXISTS "test_cases_created_by_id_fkey";
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "test_cases" DROP CONSTRAINT IF EXISTS "test_cases_executed_by_id_fkey";
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_executed_by_id_fkey" FOREIGN KEY ("executed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "documentations" DROP CONSTRAINT IF EXISTS "documentations_project_id_fkey";
ALTER TABLE "documentations" ADD CONSTRAINT "documentations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documentations" DROP CONSTRAINT IF EXISTS "documentations_created_by_id_fkey";
ALTER TABLE "documentations" ADD CONSTRAINT "documentations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tech_trainings" DROP CONSTRAINT IF EXISTS "tech_trainings_created_by_id_fkey";
ALTER TABLE "tech_trainings" ADD CONSTRAINT "tech_trainings_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "training_enrollments" DROP CONSTRAINT IF EXISTS "training_enrollments_training_id_fkey";
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "tech_trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "training_enrollments" DROP CONSTRAINT IF EXISTS "training_enrollments_user_id_fkey";
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "code_reviews" DROP CONSTRAINT IF EXISTS "code_reviews_task_id_fkey";
DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    ALTER TABLE "code_reviews" ADD CONSTRAINT "code_reviews_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
ALTER TABLE "code_reviews" DROP CONSTRAINT IF EXISTS "code_reviews_project_id_fkey";
ALTER TABLE "code_reviews" ADD CONSTRAINT "code_reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "code_reviews" DROP CONSTRAINT IF EXISTS "code_reviews_author_id_fkey";
ALTER TABLE "code_reviews" ADD CONSTRAINT "code_reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "code_reviews" DROP CONSTRAINT IF EXISTS "code_reviews_reviewer_id_fkey";
ALTER TABLE "code_reviews" ADD CONSTRAINT "code_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_release_id_fkey";
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
