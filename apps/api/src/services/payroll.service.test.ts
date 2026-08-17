import { describe, it, expect, beforeEach, vi } from "vitest";
import { PayrollService } from "./payroll.service";
import { PayrollRepository } from "../repositories/payroll.repository";
import { HrRepository } from "../repositories/phase2.repository";
import { ApprovalService } from "./approval.service";
import { AppError } from "../lib/app-error";

vi.mock("../repositories/payroll.repository");
vi.mock("../repositories/phase2.repository");
vi.mock("./approval.service");
vi.mock("./payslip-pdf.service");
vi.mock("../lib/storage");
vi.mock("../lib/audit");
vi.mock("../lib/payroll-lop", () => ({
  daysBetweenInclusive: (start: Date, end: Date) => {
    const ms = end.getTime() - start.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
  },
  prorateAmount: (amount: number, paid: number, working: number) =>
    working <= 0 ? 0 : Math.round((amount * paid) / working * 100) / 100,
  computeBatchEmployeeLop: vi.fn().mockImplementation(async ({ employeeIds }: { employeeIds: string[] }) => {
    const map = new Map<string, { workingDays: number; lopDays: number; paidDays: number }>();
    for (const id of employeeIds) {
      map.set(id, { workingDays: 31, lopDays: 0, paidDays: 31 });
    }
    return map;
  }),
}));
vi.mock("../lib/prisma", () => ({
  prisma: {
    payrollRunItem: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    payslip: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      findFirst: vi.fn(),
    },
    storedFile: { create: vi.fn() },
  },
}));

import { prisma } from "../lib/prisma";
import { createPresignedDownload, readStoredFile } from "../lib/storage";

describe("PayrollService", () => {
  let payrollService: PayrollService;
  let payrollRepo: PayrollRepository;
  let hrRepo: HrRepository;
  let approvalService: ApprovalService;

  beforeEach(() => {
    payrollService = new PayrollService();
    payrollRepo = (payrollService as any).payrollRepo;
    hrRepo = (payrollService as any).hrRepo;
    approvalService = (payrollService as any).approvalService;
  });

  describe("Salary structure calculation (versioned)", () => {
    const mockEmployee = { id: "emp-1", employeeCode: "EMP001" };

    it("computes gross, deductions, and net salary from components", async () => {
      vi.spyOn(hrRepo, "findEmployeeById").mockResolvedValue(mockEmployee as any);
      vi.spyOn(payrollRepo, "findActiveSalaryStructure").mockResolvedValue(null);
      vi.spyOn(payrollRepo, "createSalaryStructure").mockImplementation(async (data: any) => data as any);

      const result = await payrollService.createSalaryStructure(
        {
          employeeId: "emp-1",
          effectiveFrom: "2024-01-01",
          currency: "USD",
          basic: 5000,
          hra: 2000,
          conveyanceAllowance: 500,
          medicalAllowance: 300,
          specialAllowance: 200,
          otherAllowances: 0,
          providentFund: 600,
          professionalTax: 200,
          incomeTax: 800,
          otherDeductions: 0,
        },
        "actor-1",
      );

      // gross = 5000+2000+500+300+200+0 = 8000; deductions = 600+200+800+0 = 1600; net = 6400
      expect(result.grossSalary).toBe(8000);
      expect(result.totalDeductions).toBe(1600);
      expect(result.netSalary).toBe(6400);
      expect(result.status).toBe("ACTIVE");
    });

    it("rejects a structure whose deductions exceed earnings (negative net salary)", async () => {
      vi.spyOn(hrRepo, "findEmployeeById").mockResolvedValue(mockEmployee as any);
      vi.spyOn(payrollRepo, "findActiveSalaryStructure").mockResolvedValue(null);

      await expect(
        payrollService.createSalaryStructure(
          {
            employeeId: "emp-1",
            effectiveFrom: "2024-01-01",
            currency: "USD",
            basic: 1000,
            hra: 0,
            conveyanceAllowance: 0,
            medicalAllowance: 0,
            specialAllowance: 0,
            otherAllowances: 0,
            providentFund: 5000,
            professionalTax: 0,
            incomeTax: 0,
            otherDeductions: 0,
          },
          "actor-1",
        ),
      ).rejects.toThrow(AppError);
    });

    it("supersedes the previously active structure so historical payslips remain accurate", async () => {
      const existingActive = { id: "struct-1", effectiveFrom: new Date("2023-01-01") };
      vi.spyOn(hrRepo, "findEmployeeById").mockResolvedValue(mockEmployee as any);
      vi.spyOn(payrollRepo, "findActiveSalaryStructure").mockResolvedValue(existingActive as any);
      const supersedeSpy = vi.spyOn(payrollRepo, "supersedeSalaryStructure").mockResolvedValue({} as any);
      vi.spyOn(payrollRepo, "createSalaryStructure").mockImplementation(async (data: any) => data as any);

      await payrollService.createSalaryStructure(
        {
          employeeId: "emp-1",
          effectiveFrom: "2024-06-01",
          currency: "USD",
          basic: 6000,
          hra: 2000,
          conveyanceAllowance: 0,
          medicalAllowance: 0,
          specialAllowance: 0,
          otherAllowances: 0,
          providentFund: 0,
          professionalTax: 0,
          incomeTax: 0,
          otherDeductions: 0,
        },
        "actor-1",
      );

      expect(supersedeSpy).toHaveBeenCalledWith("struct-1", new Date("2024-05-31"));
    });

    it("rejects a new structure that is not effective after the current active one", async () => {
      const existingActive = { id: "struct-1", effectiveFrom: new Date("2024-06-01") };
      vi.spyOn(hrRepo, "findEmployeeById").mockResolvedValue(mockEmployee as any);
      vi.spyOn(payrollRepo, "findActiveSalaryStructure").mockResolvedValue(existingActive as any);

      await expect(
        payrollService.createSalaryStructure(
          {
            employeeId: "emp-1",
            effectiveFrom: "2024-01-01",
            currency: "USD",
            basic: 6000,
            hra: 0,
            conveyanceAllowance: 0,
            medicalAllowance: 0,
            specialAllowance: 0,
            otherAllowances: 0,
            providentFund: 0,
            professionalTax: 0,
            incomeTax: 0,
            otherDeductions: 0,
          },
          "actor-1",
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe("Payroll run calculation (batch pay cycle)", () => {
    it("includes only active employees with an active salary structure and sums totals", async () => {
      const run = {
        id: "run-1",
        status: "DRAFT",
        payPeriodStart: new Date("2024-01-01"),
        payPeriodEnd: new Date("2024-01-31"),
      };
      vi.spyOn(payrollRepo, "findPayrollRunById").mockResolvedValue(run as any);
      vi.spyOn(payrollRepo, "findActiveEmployeeIds").mockResolvedValue(["emp-1", "emp-2"]);
      vi.spyOn(payrollRepo, "findActiveSalaryStructure").mockImplementation(async (employeeId: string) => {
        if (employeeId === "emp-1") {
          return {
            id: "struct-1",
            effectiveFrom: new Date("2023-01-01"),
            grossSalary: 8000,
            totalDeductions: 1600,
            netSalary: 6400,
            basic: 5000,
            hra: 2000,
            conveyanceAllowance: 500,
            medicalAllowance: 300,
            specialAllowance: 200,
            otherAllowances: 0,
            providentFund: 600,
            professionalTax: 200,
            incomeTax: 800,
            otherDeductions: 0,
          } as any;
        }
        return null; // emp-2 has no active structure and should be skipped
      });
      const createManySpy = vi.spyOn(payrollRepo, "createManyPayrollRunItems").mockResolvedValue({ count: 1 } as any);
      vi.spyOn(payrollRepo, "updatePayrollRun").mockImplementation(async (_id, data: any) => ({ ...run, ...data }) as any);

      const { run: updated, skippedEmployeeIds } = await payrollService.calculatePayrollRun("run-1", "actor-1");

      expect(skippedEmployeeIds).toEqual(["emp-2"]);
      expect(updated.employeeCount).toBe(1);
      expect(updated.totalGross).toBe(8000);
      expect(updated.totalDeductions).toBe(1600);
      expect(updated.totalNet).toBe(6400);
      expect(createManySpy).toHaveBeenCalledTimes(1);
    });

    it("rejects calculating a run that is not in DRAFT status", async () => {
      vi.spyOn(payrollRepo, "findPayrollRunById").mockResolvedValue({ id: "run-1", status: "APPROVED" } as any);

      await expect(payrollService.calculatePayrollRun("run-1", "actor-1")).rejects.toThrow(AppError);
    });
  });

  describe("Payroll run approval workflow", () => {
    it("moves the run to APPROVED when the approval request is approved", async () => {
      const run = { id: "run-1", status: "PENDING_APPROVAL", approvalRequestId: "req-1" };
      vi.spyOn(payrollRepo, "findPayrollRunById").mockResolvedValue(run as any);
      vi.spyOn(approvalService, "approveRequest").mockResolvedValue({ status: "APPROVED" } as any);
      vi.spyOn(payrollRepo, "updatePayrollRun").mockImplementation(async (_id, data: any) => ({ ...run, ...data }) as any);

      const result = await payrollService.decidePayrollRunApproval("run-1", "APPROVE", "approver-1");
      expect(result.status).toBe("APPROVED");
    });

    it("sends the run back to DRAFT (not a REJECTED state) when rejected", async () => {
      const run = { id: "run-1", status: "PENDING_APPROVAL", approvalRequestId: "req-1" };
      vi.spyOn(payrollRepo, "findPayrollRunById").mockResolvedValue(run as any);
      vi.spyOn(approvalService, "rejectRequest").mockResolvedValue({ status: "REJECTED" } as any);
      vi.spyOn(payrollRepo, "updatePayrollRun").mockImplementation(async (_id, data: any) => ({ ...run, ...data }) as any);

      const result = await payrollService.decidePayrollRunApproval("run-1", "REJECT", "approver-1", "Numbers look off");
      expect(result.status).toBe("DRAFT");
    });
  });

  describe("Payroll run state guards", () => {
    it("prevents processing a run that has not been approved", async () => {
      vi.spyOn(payrollRepo, "findPayrollRunById").mockResolvedValue({ id: "run-1", status: "DRAFT" } as any);

      await expect(payrollService.processPayrollRun("run-1", "actor-1")).rejects.toThrow(AppError);
    });

    it("prevents marking a run paid before it has been processed", async () => {
      vi.spyOn(payrollRepo, "findPayrollRunById").mockResolvedValue({ id: "run-1", status: "APPROVED" } as any);

      await expect(payrollService.markPayrollRunPaid("run-1", "actor-1")).rejects.toThrow(AppError);
    });

    it("allows marking a processed run as paid, which publishes payslips", async () => {
      vi.spyOn(payrollRepo, "findPayrollRunById").mockResolvedValue({ id: "run-1", status: "PROCESSED" } as any);
      vi.spyOn(payrollRepo, "updatePayrollRun").mockResolvedValue({ id: "run-1", status: "PAID" } as any);

      const result = await payrollService.markPayrollRunPaid("run-1", "actor-1");
      expect(result.status).toBe("PAID");
    });
  });

  describe("Employee portal payslip ownership", () => {
    it("only returns published payslips scoped to the requesting employee", async () => {
      const findManySpy = vi.spyOn(payrollRepo, "findManyPayslips").mockResolvedValue([] as any);

      await payrollService.listMyPayslips("emp-1");

      expect(findManySpy).toHaveBeenCalledWith({ employeeId: "emp-1", status: "PUBLISHED" });
    });

    it("refuses to download a payslip that belongs to a different employee", async () => {
      vi.mocked(prisma.payslip.findFirst).mockResolvedValue({
        id: "payslip-1",
        employeeId: "emp-2", // belongs to someone else
        status: "PUBLISHED",
        file: { storageKey: "key", originalName: "payslip.pdf", mimeType: "application/pdf" },
      } as any);

      await expect(payrollService.getMyPayslipDownload("emp-1", "payslip-1")).rejects.toThrow(AppError);
    });

    it("refuses to download a payslip that has not been published yet", async () => {
      vi.mocked(prisma.payslip.findFirst).mockResolvedValue({
        id: "payslip-1",
        employeeId: "emp-1",
        status: "GENERATED", // not yet published
        file: { storageKey: "key", originalName: "payslip.pdf", mimeType: "application/pdf" },
      } as any);

      await expect(payrollService.getMyPayslipDownload("emp-1", "payslip-1")).rejects.toThrow(AppError);
    });

    it("allows an employee to download their own published payslip", async () => {
      vi.mocked(prisma.payslip.findFirst).mockResolvedValue({
        id: "payslip-1",
        employeeId: "emp-1",
        status: "PUBLISHED",
        file: { storageKey: "key", originalName: "payslip.pdf", mimeType: "application/pdf" },
      } as any);
      vi.mocked(createPresignedDownload).mockResolvedValue("https://signed.example.com/payslip.pdf" as any);

      const result = await payrollService.getMyPayslipDownload("emp-1", "payslip-1");

      expect(result.mode).toBe("redirect");
      if (result.mode === "redirect") {
        expect(result.url).toBe("https://signed.example.com/payslip.pdf");
      }
    });

    it("falls back to streaming the file when local storage has no presigned URL support", async () => {
      vi.mocked(prisma.payslip.findFirst).mockResolvedValue({
        id: "payslip-1",
        employeeId: "emp-1",
        status: "PUBLISHED",
        file: { storageKey: "key", originalName: "payslip.pdf", mimeType: "application/pdf" },
      } as any);
      vi.mocked(createPresignedDownload).mockResolvedValue(null);
      vi.mocked(readStoredFile).mockResolvedValue(Buffer.from("pdf-bytes"));

      const result = await payrollService.getMyPayslipDownload("emp-1", "payslip-1");

      expect(result.mode).toBe("stream");
      if (result.mode === "stream") {
        expect(result.buffer.toString()).toBe("pdf-bytes");
      }
    });
  });
});
