-- Phase 5 (Business Development) + Phase 6 (Project Management)
-- These tables were previously applied with `db push` only, so a migrate reset
-- never created `projects` / `tasks` and Phase 7 failed on ALTER TABLE "tasks".

DO $$ BEGIN
  CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BidStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'REVISED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SprintStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "contacts" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "designation" TEXT,
    "linkedin_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "leads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "value" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "source" TEXT,
    "contact_id" TEXT,
    "company_name" TEXT,
    "assigned_to_id" TEXT,
    "expected_close_date" TIMESTAMP(3),
    "won_at" TIMESTAMP(3),
    "lost_at" TIMESTAMP(3),
    "lost_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "bids" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "BidStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "proposals" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "bid_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "sent_at" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "client_communications" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT,
    "contact_id" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "direction" TEXT NOT NULL DEFAULT 'outbound',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "client_communications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "portfolio_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "client_name" TEXT,
    "completed_at" TIMESTAMP(3),
    "technologies" TEXT,
    "image_url" TEXT,
    "project_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "projects" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "budget" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "manager_id" TEXT,
    "client_name" TEXT,
    "client_contact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sprints" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNING',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "milestone_id" TEXT,
    "sprint_id" TEXT,
    "release_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignee_id" TEXT,
    "reporter_id" TEXT,
    "estimated_hours" DECIMAL(8,2),
    "actual_hours" DECIMAL(8,2),
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "task_time_entries" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hours" DECIMAL(8,2) NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "task_time_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "task_comments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "project_team_allocations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT,
    "allocated_hours" DECIMAL(8,2),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "project_team_allocations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "project_budget_tracking" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "project_budget_tracking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "timesheet_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "task_id" TEXT,
    "date" DATE NOT NULL,
    "hours" DECIMAL(4,2) NOT NULL,
    "description" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "timesheet_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contacts_email_idx" ON "contacts"("email");
CREATE INDEX IF NOT EXISTS "contacts_company_idx" ON "contacts"("company");

CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads"("status");
CREATE INDEX IF NOT EXISTS "leads_assigned_to_id_idx" ON "leads"("assigned_to_id");
CREATE INDEX IF NOT EXISTS "leads_contact_id_idx" ON "leads"("contact_id");

CREATE INDEX IF NOT EXISTS "bids_lead_id_idx" ON "bids"("lead_id");
CREATE INDEX IF NOT EXISTS "bids_status_idx" ON "bids"("status");

CREATE INDEX IF NOT EXISTS "proposals_lead_id_idx" ON "proposals"("lead_id");
CREATE INDEX IF NOT EXISTS "proposals_bid_id_idx" ON "proposals"("bid_id");
CREATE INDEX IF NOT EXISTS "proposals_status_idx" ON "proposals"("status");

CREATE INDEX IF NOT EXISTS "client_communications_lead_id_idx" ON "client_communications"("lead_id");
CREATE INDEX IF NOT EXISTS "client_communications_contact_id_idx" ON "client_communications"("contact_id");
CREATE INDEX IF NOT EXISTS "client_communications_timestamp_idx" ON "client_communications"("timestamp");

CREATE INDEX IF NOT EXISTS "portfolio_items_is_published_idx" ON "portfolio_items"("is_published");

CREATE UNIQUE INDEX IF NOT EXISTS "projects_lead_id_key" ON "projects"("lead_id");
CREATE UNIQUE INDEX IF NOT EXISTS "projects_code_key" ON "projects"("code");
CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects"("status");
CREATE INDEX IF NOT EXISTS "projects_manager_id_idx" ON "projects"("manager_id");
CREATE INDEX IF NOT EXISTS "projects_lead_id_idx" ON "projects"("lead_id");

CREATE INDEX IF NOT EXISTS "milestones_project_id_idx" ON "milestones"("project_id");
CREATE INDEX IF NOT EXISTS "milestones_due_date_idx" ON "milestones"("due_date");

CREATE INDEX IF NOT EXISTS "sprints_project_id_idx" ON "sprints"("project_id");
CREATE INDEX IF NOT EXISTS "sprints_status_idx" ON "sprints"("status");

CREATE INDEX IF NOT EXISTS "tasks_project_id_idx" ON "tasks"("project_id");
CREATE INDEX IF NOT EXISTS "tasks_milestone_id_idx" ON "tasks"("milestone_id");
CREATE INDEX IF NOT EXISTS "tasks_sprint_id_idx" ON "tasks"("sprint_id");
CREATE INDEX IF NOT EXISTS "tasks_release_id_idx" ON "tasks"("release_id");
CREATE INDEX IF NOT EXISTS "tasks_assignee_id_idx" ON "tasks"("assignee_id");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks"("status");

CREATE INDEX IF NOT EXISTS "task_time_entries_task_id_idx" ON "task_time_entries"("task_id");
CREATE INDEX IF NOT EXISTS "task_time_entries_user_id_idx" ON "task_time_entries"("user_id");
CREATE INDEX IF NOT EXISTS "task_time_entries_date_idx" ON "task_time_entries"("date");

CREATE INDEX IF NOT EXISTS "task_comments_task_id_idx" ON "task_comments"("task_id");
CREATE INDEX IF NOT EXISTS "task_comments_user_id_idx" ON "task_comments"("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "project_team_allocations_project_id_user_id_key" ON "project_team_allocations"("project_id", "user_id");
CREATE INDEX IF NOT EXISTS "project_team_allocations_project_id_idx" ON "project_team_allocations"("project_id");
CREATE INDEX IF NOT EXISTS "project_team_allocations_user_id_idx" ON "project_team_allocations"("user_id");

CREATE INDEX IF NOT EXISTS "project_budget_tracking_project_id_idx" ON "project_budget_tracking"("project_id");
CREATE INDEX IF NOT EXISTS "project_budget_tracking_date_idx" ON "project_budget_tracking"("date");

CREATE INDEX IF NOT EXISTS "timesheet_entries_user_id_idx" ON "timesheet_entries"("user_id");
CREATE INDEX IF NOT EXISTS "timesheet_entries_project_id_idx" ON "timesheet_entries"("project_id");
CREATE INDEX IF NOT EXISTS "timesheet_entries_task_id_idx" ON "timesheet_entries"("task_id");
CREATE INDEX IF NOT EXISTS "timesheet_entries_date_idx" ON "timesheet_entries"("date");

ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_contact_id_fkey";
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_assigned_to_id_fkey";
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bids" DROP CONSTRAINT IF EXISTS "bids_lead_id_fkey";
ALTER TABLE "bids" ADD CONSTRAINT "bids_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "proposals" DROP CONSTRAINT IF EXISTS "proposals_lead_id_fkey";
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposals" DROP CONSTRAINT IF EXISTS "proposals_bid_id_fkey";
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "client_communications" DROP CONSTRAINT IF EXISTS "client_communications_lead_id_fkey";
ALTER TABLE "client_communications" ADD CONSTRAINT "client_communications_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_communications" DROP CONSTRAINT IF EXISTS "client_communications_contact_id_fkey";
ALTER TABLE "client_communications" ADD CONSTRAINT "client_communications_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_lead_id_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_manager_id_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_client_contact_id_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_contact_id_fkey" FOREIGN KEY ("client_contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "milestones" DROP CONSTRAINT IF EXISTS "milestones_project_id_fkey";
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sprints" DROP CONSTRAINT IF EXISTS "sprints_project_id_fkey";
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_project_id_fkey";
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_milestone_id_fkey";
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_sprint_id_fkey";
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_assignee_id_fkey";
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_reporter_id_fkey";
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_time_entries" DROP CONSTRAINT IF EXISTS "task_time_entries_task_id_fkey";
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_time_entries" DROP CONSTRAINT IF EXISTS "task_time_entries_user_id_fkey";
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_comments" DROP CONSTRAINT IF EXISTS "task_comments_task_id_fkey";
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_comments" DROP CONSTRAINT IF EXISTS "task_comments_user_id_fkey";
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "project_team_allocations" DROP CONSTRAINT IF EXISTS "project_team_allocations_project_id_fkey";
ALTER TABLE "project_team_allocations" ADD CONSTRAINT "project_team_allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_team_allocations" DROP CONSTRAINT IF EXISTS "project_team_allocations_user_id_fkey";
ALTER TABLE "project_team_allocations" ADD CONSTRAINT "project_team_allocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "project_budget_tracking" DROP CONSTRAINT IF EXISTS "project_budget_tracking_project_id_fkey";
ALTER TABLE "project_budget_tracking" ADD CONSTRAINT "project_budget_tracking_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "timesheet_entries" DROP CONSTRAINT IF EXISTS "timesheet_entries_user_id_fkey";
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" DROP CONSTRAINT IF EXISTS "timesheet_entries_project_id_fkey";
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" DROP CONSTRAINT IF EXISTS "timesheet_entries_task_id_fkey";
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
