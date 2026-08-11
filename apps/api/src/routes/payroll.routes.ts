import { Router } from "express";
import { PayrollController } from "../controllers/payroll.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createSalaryStructureSchema,
  listSalaryStructuresQuerySchema,
  requestSalaryRevisionSchema,
  reviewSalaryRevisionSchema,
  listSalaryRevisionsQuerySchema,
  createPayrollRunSchema,
  submitPayrollRunApprovalSchema,
  listPayrollRunsQuerySchema,
  listPayslipsQuerySchema,
} from "../schemas/phase4.schema";

const payrollRouter = Router();
const controller = new PayrollController();

// -- Salary Structures ------------------------------------------------------------
payrollRouter.post(
  "/salary-structures",
  requireAuth,
  requirePermission("salary_structure.manage"),
  validate(createSalaryStructureSchema),
  controller.createSalaryStructure,
);
payrollRouter.get(
  "/salary-structures",
  requireAuth,
  requirePermission("salary_structure.read", "salary_structure.manage"),
  validate(listSalaryStructuresQuerySchema, "query"),
  controller.listSalaryStructures,
);
payrollRouter.get(
  "/salary-structures/active/:employeeId",
  requireAuth,
  requirePermission("salary_structure.read", "salary_structure.manage"),
  controller.getActiveSalaryStructure,
);

// -- Salary Revisions ---------------------------------------------------------------
payrollRouter.post(
  "/salary-revisions",
  requireAuth,
  requirePermission("salary_revision.request", "salary_structure.manage"),
  validate(requestSalaryRevisionSchema),
  controller.requestSalaryRevision,
);
payrollRouter.get(
  "/salary-revisions",
  requireAuth,
  requirePermission("salary_revision.read", "salary_revision.approve"),
  validate(listSalaryRevisionsQuerySchema, "query"),
  controller.listSalaryRevisions,
);
payrollRouter.get(
  "/salary-revisions/:id",
  requireAuth,
  requirePermission("salary_revision.read", "salary_revision.approve"),
  controller.getSalaryRevision,
);
payrollRouter.post(
  "/salary-revisions/:id/approve",
  requireAuth,
  requirePermission("salary_revision.approve"),
  validate(reviewSalaryRevisionSchema),
  controller.approveSalaryRevision,
);
payrollRouter.post(
  "/salary-revisions/:id/reject",
  requireAuth,
  requirePermission("salary_revision.approve"),
  validate(reviewSalaryRevisionSchema),
  controller.rejectSalaryRevision,
);

// -- Payroll Runs -----------------------------------------------------------------------
payrollRouter.post(
  "/runs",
  requireAuth,
  requirePermission("payroll_run.manage"),
  validate(createPayrollRunSchema),
  controller.createPayrollRun,
);
payrollRouter.get(
  "/runs",
  requireAuth,
  requirePermission("payroll_run.read", "payroll_run.manage", "payroll_run.approve"),
  validate(listPayrollRunsQuerySchema, "query"),
  controller.listPayrollRuns,
);
payrollRouter.get(
  "/runs/:id",
  requireAuth,
  requirePermission("payroll_run.read", "payroll_run.manage", "payroll_run.approve"),
  controller.getPayrollRun,
);
payrollRouter.post(
  "/runs/:id/calculate",
  requireAuth,
  requirePermission("payroll_run.manage"),
  controller.calculatePayrollRun,
);
payrollRouter.post(
  "/runs/:id/submit",
  requireAuth,
  requirePermission("payroll_run.manage"),
  validate(submitPayrollRunApprovalSchema),
  controller.submitPayrollRunForApproval,
);
payrollRouter.post(
  "/runs/:id/approve",
  requireAuth,
  requirePermission("payroll_run.approve"),
  controller.approvePayrollRun,
);
payrollRouter.post(
  "/runs/:id/reject",
  requireAuth,
  requirePermission("payroll_run.approve"),
  controller.rejectPayrollRun,
);
payrollRouter.post(
  "/runs/:id/process",
  requireAuth,
  requirePermission("payroll_run.manage"),
  controller.processPayrollRun,
);
payrollRouter.post(
  "/runs/:id/mark-paid",
  requireAuth,
  requirePermission("payroll_run.manage"),
  controller.markPayrollRunPaid,
);
payrollRouter.post(
  "/runs/:id/cancel",
  requireAuth,
  requirePermission("payroll_run.manage"),
  controller.cancelPayrollRun,
);

// -- Payslips (admin/payroll visibility — all statuses) --------------------------------
payrollRouter.get(
  "/payslips",
  requireAuth,
  requirePermission("payslip.read", "payroll_run.read"),
  validate(listPayslipsQuerySchema, "query"),
  controller.listPayslips,
);

export { payrollRouter };
