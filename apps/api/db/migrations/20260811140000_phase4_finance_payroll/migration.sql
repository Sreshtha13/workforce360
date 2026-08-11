-- Phase 4: Finance (Clients, Invoices, Payments, Reimbursements) and
-- Payroll (Salary Structures, Salary Revisions, Payroll Runs, Payslips)

CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REJECTED');
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'RAZORPAY', 'MANUAL');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
CREATE TYPE "ReimbursementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
CREATE TYPE "SalaryStructureStatus" AS ENUM ('ACTIVE', 'SUPERSEDED');
CREATE TYPE "SalaryRevisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSED', 'PAID', 'CANCELLED');
CREATE TYPE "PayslipStatus" AS ENUM ('GENERATED', 'PUBLISHED');

ALTER TYPE "StoredFilePurpose" ADD VALUE 'RECEIPT';
ALTER TYPE "StoredFilePurpose" ADD VALUE 'PAYSLIP';

-- Finance
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "billing_address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "tax_id" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "approval_request_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MANUAL',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "provider_payment_id" TEXT,
    "provider_session_id" TEXT,
    "recorded_by_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reimbursements" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "expense_date" DATE NOT NULL,
    "receipt_file_id" TEXT,
    "status" "ReimbursementStatus" NOT NULL DEFAULT 'PENDING',
    "approval_request_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "payment_reference" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "reimbursements_pkey" PRIMARY KEY ("id")
);

-- Payroll
CREATE TABLE "salary_structures" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "basic" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "conveyance_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "medical_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "special_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gross_salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "provident_fund" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "professional_tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "income_tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "SalaryStructureStatus" NOT NULL DEFAULT 'ACTIVE',
    "revision_reason" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salary_revisions" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "current_salary_structure_id" TEXT,
    "resulting_salary_structure_id" TEXT,
    "proposed_basic" DECIMAL(12,2) NOT NULL,
    "proposed_hra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "proposed_conveyance_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "proposed_medical_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "proposed_special_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "proposed_other_allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "effective_from" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "SalaryRevisionStatus" NOT NULL DEFAULT 'PENDING',
    "approval_request_id" TEXT,
    "requested_by_id" TEXT NOT NULL,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "salary_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "pay_period_start" DATE NOT NULL,
    "pay_period_end" DATE NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "total_gross" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_net" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "employee_count" INTEGER NOT NULL DEFAULT 0,
    "approval_request_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payroll_run_items" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "salary_structure_id" TEXT NOT NULL,
    "working_days" DOUBLE PRECISION NOT NULL,
    "paid_days" DOUBLE PRECISION NOT NULL,
    "lop_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gross_salary" DECIMAL(12,2) NOT NULL,
    "total_deductions" DECIMAL(12,2) NOT NULL,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "breakdown" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payroll_run_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "payroll_run_item_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "file_id" TEXT,
    "status" "PayslipStatus" NOT NULL DEFAULT 'GENERATED',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "clients_status_idx" ON "clients"("status");

CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
CREATE INDEX "invoices_client_id_idx" ON "invoices"("client_id");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

CREATE INDEX "invoice_line_items_invoice_id_idx" ON "invoice_line_items"("invoice_id");

CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payments_provider_payment_id_idx" ON "payments"("provider_payment_id");

CREATE INDEX "reimbursements_employee_id_idx" ON "reimbursements"("employee_id");
CREATE INDEX "reimbursements_status_idx" ON "reimbursements"("status");

CREATE INDEX "salary_structures_employee_id_idx" ON "salary_structures"("employee_id");
CREATE INDEX "salary_structures_status_idx" ON "salary_structures"("status");

CREATE INDEX "salary_revisions_employee_id_idx" ON "salary_revisions"("employee_id");
CREATE INDEX "salary_revisions_status_idx" ON "salary_revisions"("status");

CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs"("status");
CREATE UNIQUE INDEX "payroll_runs_month_year_key" ON "payroll_runs"("month", "year");

CREATE INDEX "payroll_run_items_employee_id_idx" ON "payroll_run_items"("employee_id");
CREATE UNIQUE INDEX "payroll_run_items_payroll_run_id_employee_id_key" ON "payroll_run_items"("payroll_run_id", "employee_id");

CREATE UNIQUE INDEX "payslips_payroll_run_item_id_key" ON "payslips"("payroll_run_item_id");
CREATE INDEX "payslips_employee_id_idx" ON "payslips"("employee_id");
CREATE UNIQUE INDEX "payslips_employee_id_month_year_key" ON "payslips"("employee_id", "month", "year");

-- Foreign keys
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_receipt_file_id_fkey" FOREIGN KEY ("receipt_file_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "salary_revisions" ADD CONSTRAINT "salary_revisions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "salary_revisions" ADD CONSTRAINT "salary_revisions_current_salary_structure_id_fkey" FOREIGN KEY ("current_salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "salary_revisions" ADD CONSTRAINT "salary_revisions_resulting_salary_structure_id_fkey" FOREIGN KEY ("resulting_salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "salary_revisions" ADD CONSTRAINT "salary_revisions_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payroll_run_items" ADD CONSTRAINT "payroll_run_items_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payroll_run_items" ADD CONSTRAINT "payroll_run_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_run_items" ADD CONSTRAINT "payroll_run_items_salary_structure_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_item_id_fkey" FOREIGN KEY ("payroll_run_item_id") REFERENCES "payroll_run_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
