-- Phase 3: Attendance, Leave, Asset History, and Generic Approval Workflow

CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'WEEKEND');
CREATE TYPE "AttendanceCorrectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "LeaveApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ApprovalActionType" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_CHANGES', 'CANCEL');
CREATE TYPE "AssetHistoryAction" AS ENUM ('ASSIGNED', 'RETURNED', 'STATUS_CHANGED', 'DAMAGED', 'LOST', 'MAINTENANCE', 'RETIRED');

-- Approval workflow (created first — referenced by leave/attendance corrections)
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "total_levels" INTEGER NOT NULL DEFAULT 1,
    "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_steps" (
    "id" TEXT NOT NULL,
    "approval_request_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "approver_id" TEXT NOT NULL,
    "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_actions" (
    "id" TEXT NOT NULL,
    "approval_request_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action_type" "ApprovalActionType" NOT NULL,
    "level" INTEGER NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "approval_actions_pkey" PRIMARY KEY ("id")
);

-- Attendance
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "shift_id" TEXT,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "work_hours" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attendance_correction_requests" (
    "id" TEXT NOT NULL,
    "attendance_record_id" TEXT,
    "employee_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "requested_status" "AttendanceStatus" NOT NULL,
    "requested_check_in" TIMESTAMP(3),
    "requested_check_out" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "AttendanceCorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "approval_request_id" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "attendance_correction_requests_pkey" PRIMARY KEY ("id")
);

-- Leave
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "default_balance" INTEGER NOT NULL DEFAULT 0,
    "carry_forward" BOOLEAN NOT NULL DEFAULT false,
    "max_carry_forward_days" INTEGER NOT NULL DEFAULT 0,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "allocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carried_over" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leave_applications" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "day_count" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "approval_request_id" TEXT,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "leave_applications_pkey" PRIMARY KEY ("id")
);

-- Asset history
CREATE TABLE "asset_history" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "action" "AssetHistoryAction" NOT NULL,
    "from_status" "AssetStatus",
    "to_status" "AssetStatus",
    "notes" TEXT,
    "performed_by" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_history_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "shifts_code_key" ON "shifts"("code");
CREATE UNIQUE INDEX "attendance_records_employee_id_date_key" ON "attendance_records"("employee_id", "date");
CREATE UNIQUE INDEX "leave_types_name_key" ON "leave_types"("name");
CREATE UNIQUE INDEX "leave_types_code_key" ON "leave_types"("code");
CREATE UNIQUE INDEX "leave_balances_employee_id_leave_type_id_year_key" ON "leave_balances"("employee_id", "leave_type_id", "year");

-- Indexes
CREATE INDEX "approval_requests_entity_type_entity_id_idx" ON "approval_requests"("entity_type", "entity_id");
CREATE INDEX "approval_requests_requester_id_idx" ON "approval_requests"("requester_id");
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

CREATE INDEX "approval_steps_approval_request_id_idx" ON "approval_steps"("approval_request_id");
CREATE INDEX "approval_steps_approver_id_idx" ON "approval_steps"("approver_id");
CREATE INDEX "approval_steps_status_idx" ON "approval_steps"("status");

CREATE INDEX "approval_actions_approval_request_id_idx" ON "approval_actions"("approval_request_id");
CREATE INDEX "approval_actions_actor_id_idx" ON "approval_actions"("actor_id");
CREATE INDEX "approval_actions_timestamp_idx" ON "approval_actions"("timestamp");

CREATE INDEX "holidays_date_idx" ON "holidays"("date");

CREATE INDEX "attendance_records_employee_id_idx" ON "attendance_records"("employee_id");
CREATE INDEX "attendance_records_date_idx" ON "attendance_records"("date");
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");

CREATE INDEX "attendance_correction_requests_employee_id_idx" ON "attendance_correction_requests"("employee_id");
CREATE INDEX "attendance_correction_requests_date_idx" ON "attendance_correction_requests"("date");
CREATE INDEX "attendance_correction_requests_status_idx" ON "attendance_correction_requests"("status");

CREATE INDEX "leave_balances_employee_id_idx" ON "leave_balances"("employee_id");
CREATE INDEX "leave_balances_leave_type_id_idx" ON "leave_balances"("leave_type_id");
CREATE INDEX "leave_balances_year_idx" ON "leave_balances"("year");

CREATE INDEX "leave_applications_employee_id_idx" ON "leave_applications"("employee_id");
CREATE INDEX "leave_applications_leave_type_id_idx" ON "leave_applications"("leave_type_id");
CREATE INDEX "leave_applications_status_idx" ON "leave_applications"("status");
CREATE INDEX "leave_applications_start_date_idx" ON "leave_applications"("start_date");
CREATE INDEX "leave_applications_end_date_idx" ON "leave_applications"("end_date");

CREATE INDEX "asset_history_asset_id_idx" ON "asset_history"("asset_id");
CREATE INDEX "asset_history_employee_id_idx" ON "asset_history"("employee_id");
CREATE INDEX "asset_history_timestamp_idx" ON "asset_history"("timestamp");

-- Foreign keys
ALTER TABLE "approval_steps"
  ADD CONSTRAINT "approval_steps_approval_request_id_fkey"
  FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "approval_actions"
  ADD CONSTRAINT "approval_actions_approval_request_id_fkey"
  FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_records"
  ADD CONSTRAINT "attendance_records_shift_id_fkey"
  FOREIGN KEY ("shift_id") REFERENCES "shifts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attendance_correction_requests"
  ADD CONSTRAINT "attendance_correction_requests_attendance_record_id_fkey"
  FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attendance_correction_requests"
  ADD CONSTRAINT "attendance_correction_requests_approval_request_id_fkey"
  FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leave_balances"
  ADD CONSTRAINT "leave_balances_leave_type_id_fkey"
  FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "leave_applications"
  ADD CONSTRAINT "leave_applications_leave_type_id_fkey"
  FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "leave_applications"
  ADD CONSTRAINT "leave_applications_approval_request_id_fkey"
  FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
