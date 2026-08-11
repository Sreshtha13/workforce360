import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

const payrollRunInclude = {
  approvalRequest: { include: { steps: true } },
  items: {
    include: {
      employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      salaryStructure: true,
      payslip: true,
    },
  },
};

export class PayrollRepository {
  // -- Salary Structures (versioned) -------------------------------------------

  async createSalaryStructure(data: Prisma.SalaryStructureUncheckedCreateInput) {
    return prisma.salaryStructure.create({ data });
  }

  async findActiveSalaryStructure(employeeId: string) {
    return prisma.salaryStructure.findFirst({
      where: { employeeId, status: "ACTIVE", deletedAt: null },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  async findSalaryStructureById(id: string) {
    return prisma.salaryStructure.findFirst({ where: { id, deletedAt: null } });
  }

  async findManySalaryStructures(where?: Prisma.SalaryStructureWhereInput) {
    return prisma.salaryStructure.findMany({
      where: { ...where, deletedAt: null },
      include: {
        employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
      orderBy: [{ employeeId: "asc" }, { effectiveFrom: "desc" }],
    });
  }

  async supersedeSalaryStructure(id: string, effectiveTo: Date) {
    return prisma.salaryStructure.update({
      where: { id },
      data: { status: "SUPERSEDED", effectiveTo },
    });
  }

  // -- Salary Revisions ---------------------------------------------------------

  async createSalaryRevision(data: Prisma.SalaryRevisionUncheckedCreateInput) {
    return prisma.salaryRevision.create({ data });
  }

  async findSalaryRevisionById(id: string) {
    return prisma.salaryRevision.findFirst({
      where: { id, deletedAt: null },
      include: {
        currentSalaryStructure: true,
        resultingSalaryStructure: true,
        approvalRequest: { include: { steps: true } },
        employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
  }

  async findManySalaryRevisions(where?: Prisma.SalaryRevisionWhereInput) {
    return prisma.salaryRevision.findMany({
      where: { ...where, deletedAt: null },
      include: {
        currentSalaryStructure: true,
        resultingSalaryStructure: true,
        employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateSalaryRevision(id: string, data: Prisma.SalaryRevisionUncheckedUpdateInput) {
    return prisma.salaryRevision.update({ where: { id }, data });
  }

  // -- Payroll Runs ---------------------------------------------------------------

  async createPayrollRun(data: Prisma.PayrollRunUncheckedCreateInput) {
    return prisma.payrollRun.create({ data, include: payrollRunInclude });
  }

  async findPayrollRunByPeriod(month: number, year: number) {
    return prisma.payrollRun.findFirst({ where: { month, year, deletedAt: null } });
  }

  async findPayrollRunById(id: string) {
    return prisma.payrollRun.findFirst({
      where: { id, deletedAt: null },
      include: payrollRunInclude,
    });
  }

  async findManyPayrollRuns(where?: Prisma.PayrollRunWhereInput) {
    return prisma.payrollRun.findMany({
      where: { ...where, deletedAt: null },
      include: payrollRunInclude,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
  }

  async updatePayrollRun(id: string, data: Prisma.PayrollRunUncheckedUpdateInput) {
    return prisma.payrollRun.update({ where: { id }, data, include: payrollRunInclude });
  }

  async createManyPayrollRunItems(items: Prisma.PayrollRunItemUncheckedCreateInput[]) {
    return prisma.payrollRunItem.createMany({ data: items });
  }

  async findPayrollRunItems(payrollRunId: string) {
    return prisma.payrollRunItem.findMany({
      where: { payrollRunId },
      include: {
        employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        salaryStructure: true,
        payslip: true,
      },
    });
  }

  async findPayrollRunItemById(id: string) {
    return prisma.payrollRunItem.findFirst({
      where: { id },
      include: { employee: true, salaryStructure: true, payrollRun: true },
    });
  }

  // -- Payslips ---------------------------------------------------------------

  async createPayslip(data: Prisma.PayslipUncheckedCreateInput) {
    return prisma.payslip.create({ data });
  }

  async updatePayslip(id: string, data: Prisma.PayslipUncheckedUpdateInput) {
    return prisma.payslip.update({ where: { id }, data });
  }

  async findPayslipById(id: string) {
    return prisma.payslip.findFirst({
      where: { id, deletedAt: null },
      include: { file: true, payrollRunItem: true },
    });
  }

  async findManyPayslips(where?: Prisma.PayslipWhereInput) {
    return prisma.payslip.findMany({
      where: { ...where, deletedAt: null },
      include: { file: true, payrollRunItem: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
  }

  // -- Employees (for payroll batch processing) --------------------------------

  async findActiveEmployeeIds(): Promise<string[]> {
    const rows = await prisma.employee.findMany({
      where: { lifecycleState: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
}
