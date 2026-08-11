import { PayrollRepository } from "../repositories/payroll.repository";
import { HrRepository } from "../repositories/phase2.repository";
import { ApprovalService } from "./approval.service";
import { generatePayslipPdf } from "./payslip-pdf.service";
import { writeStoredFile, createPresignedDownload, readStoredFile } from "../lib/storage";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeStructureTotals(input: {
  basic: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
  providentFund: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
}) {
  const grossSalary = round2(
    input.basic + input.hra + input.conveyanceAllowance + input.medicalAllowance + input.specialAllowance + input.otherAllowances,
  );
  const totalDeductions = round2(input.providentFund + input.professionalTax + input.incomeTax + input.otherDeductions);
  const netSalary = round2(grossSalary - totalDeductions);
  if (netSalary < 0) {
    throw new AppError("INVALID_SALARY_STRUCTURE", "Net salary cannot be negative", 400);
  }
  return { grossSalary, totalDeductions, netSalary };
}

function daysBetweenInclusive(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

export class PayrollService {
  private payrollRepo = new PayrollRepository();
  private hrRepo = new HrRepository();
  private approvalService = new ApprovalService();

  // ==========================================================================
  // SALARY STRUCTURE (versioned — historical payslips remain accurate after a raise)
  // ==========================================================================

  async createSalaryStructure(
    data: {
      employeeId: string;
      effectiveFrom: string;
      currency: string;
      basic: number;
      hra: number;
      conveyanceAllowance: number;
      medicalAllowance: number;
      specialAllowance: number;
      otherAllowances: number;
      providentFund: number;
      professionalTax: number;
      incomeTax: number;
      otherDeductions: number;
      revisionReason?: string;
    },
    actorId: string,
  ) {
    const employee = await this.hrRepo.findEmployeeById(data.employeeId);
    if (!employee) throw new AppError("EMPLOYEE_NOT_FOUND", "Employee not found", 404);

    const effectiveFrom = new Date(data.effectiveFrom);
    const totals = computeStructureTotals(data);

    const existingActive = await this.payrollRepo.findActiveSalaryStructure(data.employeeId);
    if (existingActive && new Date(existingActive.effectiveFrom) >= effectiveFrom) {
      throw new AppError(
        "INVALID_EFFECTIVE_DATE",
        "New salary structure must be effective after the current active structure",
        400,
      );
    }

    if (existingActive) {
      const effectiveTo = new Date(effectiveFrom);
      effectiveTo.setDate(effectiveTo.getDate() - 1);
      await this.payrollRepo.supersedeSalaryStructure(existingActive.id, effectiveTo);
    }

    const structure = await this.payrollRepo.createSalaryStructure({
      employeeId: data.employeeId,
      effectiveFrom,
      currency: data.currency,
      basic: data.basic,
      hra: data.hra,
      conveyanceAllowance: data.conveyanceAllowance,
      medicalAllowance: data.medicalAllowance,
      specialAllowance: data.specialAllowance,
      otherAllowances: data.otherAllowances,
      grossSalary: totals.grossSalary,
      providentFund: data.providentFund,
      professionalTax: data.professionalTax,
      incomeTax: data.incomeTax,
      otherDeductions: data.otherDeductions,
      totalDeductions: totals.totalDeductions,
      netSalary: totals.netSalary,
      status: "ACTIVE",
      revisionReason: data.revisionReason,
      createdById: actorId,
    });

    await writeAuditLog({ userId: actorId, action: "create", entity: "salary_structure", entityId: structure.id, after: structure });
    return structure;
  }

  async listSalaryStructures(filters: { employeeId?: string }) {
    const where: Prisma.SalaryStructureWhereInput = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    return this.payrollRepo.findManySalaryStructures(where);
  }

  async getActiveSalaryStructure(employeeId: string) {
    const structure = await this.payrollRepo.findActiveSalaryStructure(employeeId);
    if (!structure) throw new AppError("SALARY_STRUCTURE_NOT_FOUND", "No active salary structure for this employee", 404);
    return structure;
  }

  // ==========================================================================
  // SALARY REVISION WORKFLOW (approval engine reused via ApprovalService)
  // ==========================================================================

  async requestSalaryRevision(
    data: {
      employeeId: string;
      proposedBasic: number;
      proposedHra: number;
      proposedConveyanceAllowance: number;
      proposedMedicalAllowance: number;
      proposedSpecialAllowance: number;
      proposedOtherAllowances: number;
      effectiveFrom: string;
      reason: string;
      approverIds: string[];
    },
    actorId: string,
  ) {
    const employee = await this.hrRepo.findEmployeeById(data.employeeId);
    if (!employee) throw new AppError("EMPLOYEE_NOT_FOUND", "Employee not found", 404);

    const currentStructure = await this.payrollRepo.findActiveSalaryStructure(data.employeeId);

    const revision = await this.payrollRepo.createSalaryRevision({
      employeeId: data.employeeId,
      currentSalaryStructureId: currentStructure?.id,
      proposedBasic: data.proposedBasic,
      proposedHra: data.proposedHra,
      proposedConveyanceAllowance: data.proposedConveyanceAllowance,
      proposedMedicalAllowance: data.proposedMedicalAllowance,
      proposedSpecialAllowance: data.proposedSpecialAllowance,
      proposedOtherAllowances: data.proposedOtherAllowances,
      effectiveFrom: new Date(data.effectiveFrom),
      reason: data.reason,
      status: "PENDING",
      requestedById: actorId,
    });

    const approvalRequest = await this.approvalService.createApprovalRequest(
      { entityType: "salary_revision", entityId: revision.id, requesterId: actorId, approverIds: data.approverIds },
      actorId,
    );

    const updated = await this.payrollRepo.updateSalaryRevision(revision.id, {
      approvalRequestId: approvalRequest.id,
    });

    await writeAuditLog({ userId: actorId, action: "request", entity: "salary_revision", entityId: revision.id, after: updated });
    return updated;
  }

  async decideSalaryRevision(id: string, decision: "APPROVE" | "REJECT", approverId: string, notes?: string) {
    const revision = await this.payrollRepo.findSalaryRevisionById(id);
    if (!revision) throw new AppError("SALARY_REVISION_NOT_FOUND", "Salary revision not found", 404);
    if (revision.status !== "PENDING" || !revision.approvalRequestId) {
      throw new AppError("SALARY_REVISION_NOT_PENDING", "Salary revision is not pending", 400);
    }

    const approvalRequest =
      decision === "APPROVE"
        ? await this.approvalService.approveRequest(revision.approvalRequestId, approverId, notes, approverId)
        : await this.approvalService.rejectRequest(revision.approvalRequestId, approverId, notes ?? "Rejected", approverId);

    if (approvalRequest?.status === "APPROVED") {
      const newStructure = await this.createSalaryStructure(
        {
          employeeId: revision.employeeId,
          effectiveFrom: revision.effectiveFrom.toISOString().split("T")[0],
          currency: revision.currentSalaryStructure?.currency ?? "USD",
          basic: Number(revision.proposedBasic),
          hra: Number(revision.proposedHra),
          conveyanceAllowance: Number(revision.proposedConveyanceAllowance),
          medicalAllowance: Number(revision.proposedMedicalAllowance),
          specialAllowance: Number(revision.proposedSpecialAllowance),
          otherAllowances: Number(revision.proposedOtherAllowances),
          providentFund: Number(revision.currentSalaryStructure?.providentFund ?? 0),
          professionalTax: Number(revision.currentSalaryStructure?.professionalTax ?? 0),
          incomeTax: Number(revision.currentSalaryStructure?.incomeTax ?? 0),
          otherDeductions: Number(revision.currentSalaryStructure?.otherDeductions ?? 0),
          revisionReason: revision.reason,
        },
        approverId,
      );

      const updated = await this.payrollRepo.updateSalaryRevision(id, {
        status: "APPROVED",
        resultingSalaryStructureId: newStructure.id,
        reviewedById: approverId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      });
      await writeAuditLog({ userId: approverId, action: "approve", entity: "salary_revision", entityId: id, after: updated });
      return updated;
    }

    const updated = await this.payrollRepo.updateSalaryRevision(id, {
      status: "REJECTED",
      reviewedById: approverId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    });
    await writeAuditLog({ userId: approverId, action: "reject", entity: "salary_revision", entityId: id, after: updated });
    return updated;
  }

  async listSalaryRevisions(filters: { employeeId?: string; status?: string }) {
    const where: Prisma.SalaryRevisionWhereInput = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status as Prisma.SalaryRevisionWhereInput["status"];
    return this.payrollRepo.findManySalaryRevisions(where);
  }

  async getSalaryRevisionById(id: string) {
    const revision = await this.payrollRepo.findSalaryRevisionById(id);
    if (!revision) throw new AppError("SALARY_REVISION_NOT_FOUND", "Salary revision not found", 404);
    return revision;
  }

  // ==========================================================================
  // PAYROLL RUN (batch processing per pay period)
  // ==========================================================================

  async createPayrollRun(data: { month: number; year: number; payPeriodStart: string; payPeriodEnd: string }, actorId: string) {
    const existing = await this.payrollRepo.findPayrollRunByPeriod(data.month, data.year);
    if (existing) {
      throw new AppError("PAYROLL_RUN_EXISTS", "A payroll run already exists for this pay period", 400);
    }

    const run = await this.payrollRepo.createPayrollRun({
      month: data.month,
      year: data.year,
      payPeriodStart: new Date(data.payPeriodStart),
      payPeriodEnd: new Date(data.payPeriodEnd),
      status: "DRAFT",
      createdById: actorId,
    });

    await writeAuditLog({ userId: actorId, action: "create", entity: "payroll_run", entityId: run.id, after: run });
    return run;
  }

  /** Computes/recomputes payroll line items for every active employee with an active salary structure. */
  async calculatePayrollRun(id: string, actorId: string) {
    const run = await this.payrollRepo.findPayrollRunById(id);
    if (!run) throw new AppError("PAYROLL_RUN_NOT_FOUND", "Payroll run not found", 404);
    if (run.status !== "DRAFT") {
      throw new AppError("PAYROLL_RUN_NOT_DRAFT", "Only draft payroll runs can be (re)calculated", 400);
    }

    await prisma.payrollRunItem.deleteMany({ where: { payrollRunId: id } });

    const employeeIds = await this.payrollRepo.findActiveEmployeeIds();
    const workingDays = daysBetweenInclusive(run.payPeriodStart, run.payPeriodEnd);

    const items: Prisma.PayrollRunItemUncheckedCreateInput[] = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    const skipped: string[] = [];

    for (const employeeId of employeeIds) {
      const structure = await this.payrollRepo.findActiveSalaryStructure(employeeId);
      if (!structure || new Date(structure.effectiveFrom) > run.payPeriodEnd) {
        skipped.push(employeeId);
        continue;
      }

      const grossSalary = Number(structure.grossSalary);
      const deductions = Number(structure.totalDeductions);
      const netSalary = Number(structure.netSalary);

      items.push({
        payrollRunId: id,
        employeeId,
        salaryStructureId: structure.id,
        workingDays,
        paidDays: workingDays,
        lopDays: 0,
        grossSalary,
        totalDeductions: deductions,
        netSalary,
        breakdown: {
          basic: Number(structure.basic),
          hra: Number(structure.hra),
          conveyanceAllowance: Number(structure.conveyanceAllowance),
          medicalAllowance: Number(structure.medicalAllowance),
          specialAllowance: Number(structure.specialAllowance),
          otherAllowances: Number(structure.otherAllowances),
          providentFund: Number(structure.providentFund),
          professionalTax: Number(structure.professionalTax),
          incomeTax: Number(structure.incomeTax),
          otherDeductions: Number(structure.otherDeductions),
        },
      });

      totalGross = round2(totalGross + grossSalary);
      totalDeductions = round2(totalDeductions + deductions);
      totalNet = round2(totalNet + netSalary);
    }

    if (items.length > 0) {
      await this.payrollRepo.createManyPayrollRunItems(items);
    }

    const updated = await this.payrollRepo.updatePayrollRun(id, {
      totalGross,
      totalDeductions,
      totalNet,
      employeeCount: items.length,
    });

    await writeAuditLog({
      userId: actorId,
      action: "calculate",
      entity: "payroll_run",
      entityId: id,
      after: { ...updated, skippedEmployeeIds: skipped },
    });

    return { run: updated, skippedEmployeeIds: skipped };
  }

  async submitPayrollRunForApproval(id: string, approverIds: string[], actorId: string) {
    const run = await this.payrollRepo.findPayrollRunById(id);
    if (!run) throw new AppError("PAYROLL_RUN_NOT_FOUND", "Payroll run not found", 404);
    if (run.status !== "DRAFT") {
      throw new AppError("PAYROLL_RUN_NOT_DRAFT", "Only draft payroll runs can be submitted for approval", 400);
    }
    if (run.items.length === 0) {
      throw new AppError("PAYROLL_RUN_EMPTY", "Calculate the payroll run before submitting for approval", 400);
    }

    const approvalRequest = await this.approvalService.createApprovalRequest(
      { entityType: "payroll_run", entityId: id, requesterId: actorId, approverIds },
      actorId,
    );

    const updated = await this.payrollRepo.updatePayrollRun(id, {
      status: "PENDING_APPROVAL",
      approvalRequestId: approvalRequest.id,
    });

    await writeAuditLog({ userId: actorId, action: "submit_for_approval", entity: "payroll_run", entityId: id, after: updated });
    return updated;
  }

  async decidePayrollRunApproval(id: string, decision: "APPROVE" | "REJECT", approverId: string, notes?: string) {
    const run = await this.payrollRepo.findPayrollRunById(id);
    if (!run) throw new AppError("PAYROLL_RUN_NOT_FOUND", "Payroll run not found", 404);
    if (run.status !== "PENDING_APPROVAL" || !run.approvalRequestId) {
      throw new AppError("PAYROLL_RUN_NOT_PENDING_APPROVAL", "Payroll run is not pending approval", 400);
    }

    const approvalRequest =
      decision === "APPROVE"
        ? await this.approvalService.approveRequest(run.approvalRequestId, approverId, notes, approverId)
        : await this.approvalService.rejectRequest(run.approvalRequestId, approverId, notes ?? "Rejected", approverId);

    // PayrollRunStatus has no REJECTED state — a rejection sends it back to DRAFT for revision.
    const newStatus = approvalRequest?.status === "APPROVED" ? "APPROVED" : "DRAFT";
    const updated = await this.payrollRepo.updatePayrollRun(id, { status: newStatus });

    await writeAuditLog({
      userId: approverId,
      action: decision === "APPROVE" ? "approve" : "reject",
      entity: "payroll_run",
      entityId: id,
      after: updated,
    });
    return updated;
  }

  /** Generates payslip PDFs for every line item and marks the run PROCESSED. */
  async processPayrollRun(id: string, actorId: string) {
    const run = await this.payrollRepo.findPayrollRunById(id);
    if (!run) throw new AppError("PAYROLL_RUN_NOT_FOUND", "Payroll run not found", 404);
    if (run.status !== "APPROVED") {
      throw new AppError("PAYROLL_RUN_NOT_APPROVED", "Only approved payroll runs can be processed", 400);
    }

    for (const item of run.items) {
      const employee = await this.hrRepo.findEmployeeById(item.employeeId);
      const breakdown = (item.breakdown ?? {}) as Record<string, number>;
      const currency = item.salaryStructure.currency;

      const pdfBuffer = await generatePayslipPdf({
        companyName: "Workforce 360",
        employeeName: employee ? `${employee.user.firstName} ${employee.user.lastName}` : item.employeeId,
        employeeCode: employee?.employeeCode ?? item.employeeId,
        designation: employee?.user.designation?.name,
        department: employee?.user.department?.name,
        month: run.month,
        year: run.year,
        currency,
        workingDays: item.workingDays,
        paidDays: item.paidDays,
        lopDays: item.lopDays,
        earnings: [
          { label: "Basic", amount: breakdown.basic ?? 0 },
          { label: "HRA", amount: breakdown.hra ?? 0 },
          { label: "Conveyance Allowance", amount: breakdown.conveyanceAllowance ?? 0 },
          { label: "Medical Allowance", amount: breakdown.medicalAllowance ?? 0 },
          { label: "Special Allowance", amount: breakdown.specialAllowance ?? 0 },
          { label: "Other Allowances", amount: breakdown.otherAllowances ?? 0 },
        ],
        deductions: [
          { label: "Provident Fund", amount: breakdown.providentFund ?? 0 },
          { label: "Professional Tax", amount: breakdown.professionalTax ?? 0 },
          { label: "Income Tax", amount: breakdown.incomeTax ?? 0 },
          { label: "Other Deductions", amount: breakdown.otherDeductions ?? 0 },
        ],
        grossSalary: Number(item.grossSalary),
        totalDeductions: Number(item.totalDeductions),
        netSalary: Number(item.netSalary),
      });

      const storageKey = `payslip/${run.year}/${String(run.month).padStart(2, "0")}/${item.employeeId}-${Date.now()}.pdf`;
      await writeStoredFile(storageKey, pdfBuffer);

      const storedFile = await prisma.storedFile.create({
        data: {
          storageKey,
          originalName: `payslip-${run.year}-${String(run.month).padStart(2, "0")}.pdf`,
          mimeType: "application/pdf",
          sizeBytes: pdfBuffer.length,
          purpose: "PAYSLIP",
          uploadedById: actorId,
          entityType: "payroll_run_item",
          entityId: item.id,
        },
      });

      await this.payrollRepo.createPayslip({
        payrollRunItemId: item.id,
        employeeId: item.employeeId,
        month: run.month,
        year: run.year,
        fileId: storedFile.id,
        status: "GENERATED",
      });
    }

    const updated = await this.payrollRepo.updatePayrollRun(id, { status: "PROCESSED", processedAt: new Date() });
    await writeAuditLog({ userId: actorId, action: "process", entity: "payroll_run", entityId: id, after: updated });
    return updated;
  }

  /** Marks the run as paid and publishes payslips so employees can view/download them in the portal. */
  async markPayrollRunPaid(id: string, actorId: string) {
    const run = await this.payrollRepo.findPayrollRunById(id);
    if (!run) throw new AppError("PAYROLL_RUN_NOT_FOUND", "Payroll run not found", 404);
    if (run.status !== "PROCESSED") {
      throw new AppError("PAYROLL_RUN_NOT_PROCESSED", "Only processed payroll runs can be marked paid", 400);
    }

    await prisma.payslip.updateMany({
      where: { payrollRunItem: { payrollRunId: id } },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    const updated = await this.payrollRepo.updatePayrollRun(id, { status: "PAID", paidAt: new Date() });
    await writeAuditLog({ userId: actorId, action: "mark_paid", entity: "payroll_run", entityId: id, after: updated });
    return updated;
  }

  async cancelPayrollRun(id: string, actorId: string) {
    const run = await this.payrollRepo.findPayrollRunById(id);
    if (!run) throw new AppError("PAYROLL_RUN_NOT_FOUND", "Payroll run not found", 404);
    if (!["DRAFT", "PENDING_APPROVAL"].includes(run.status)) {
      throw new AppError("PAYROLL_RUN_NOT_CANCELLABLE", "Only draft or pending payroll runs can be cancelled", 400);
    }

    await prisma.payrollRunItem.deleteMany({ where: { payrollRunId: id } });
    const updated = await this.payrollRepo.updatePayrollRun(id, { status: "CANCELLED", employeeCount: 0, totalGross: 0, totalDeductions: 0, totalNet: 0 });
    await writeAuditLog({ userId: actorId, action: "cancel", entity: "payroll_run", entityId: id, after: updated });
    return updated;
  }

  async listPayrollRuns(filters: { year?: number; status?: string }) {
    const where: Prisma.PayrollRunWhereInput = {};
    if (filters.year) where.year = filters.year;
    if (filters.status) where.status = filters.status as Prisma.PayrollRunWhereInput["status"];
    return this.payrollRepo.findManyPayrollRuns(where);
  }

  async getPayrollRunById(id: string) {
    const run = await this.payrollRepo.findPayrollRunById(id);
    if (!run) throw new AppError("PAYROLL_RUN_NOT_FOUND", "Payroll run not found", 404);
    return run;
  }

  // ==========================================================================
  // PAYSLIPS (admin visibility — all statuses)
  // ==========================================================================

  async listPayslips(filters: { employeeId?: string; year?: number }) {
    const where: Prisma.PayslipWhereInput = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.year) where.year = filters.year;
    return this.payrollRepo.findManyPayslips(where);
  }

  // ==========================================================================
  // EMPLOYEE PORTAL — self-service payslips (published only, own records only)
  // ==========================================================================

  async listMyPayslips(employeeId: string) {
    return this.payrollRepo.findManyPayslips({ employeeId, status: "PUBLISHED" });
  }

  async getMyPayslipDownload(employeeId: string, payslipId: string) {
    const payslip = await prisma.payslip.findFirst({
      where: { id: payslipId, deletedAt: null },
      include: { file: true },
    });

    if (!payslip || payslip.employeeId !== employeeId || payslip.status !== "PUBLISHED") {
      throw new AppError("PAYSLIP_NOT_FOUND", "Payslip not found", 404);
    }
    if (!payslip.file) {
      throw new AppError("PAYSLIP_FILE_MISSING", "Payslip file is not available", 404);
    }

    const presignedUrl = await createPresignedDownload(payslip.file.storageKey);
    if (presignedUrl) {
      return { mode: "redirect" as const, url: presignedUrl, fileName: payslip.file.originalName };
    }

    const buffer = await readStoredFile(payslip.file.storageKey);
    return {
      mode: "stream" as const,
      buffer,
      fileName: payslip.file.originalName,
      mimeType: payslip.file.mimeType,
    };
  }
}

export const payrollService = new PayrollService();
