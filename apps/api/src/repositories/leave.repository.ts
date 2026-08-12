import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export class LeaveRepository {
  async createLeaveType(data: Prisma.LeaveTypeUncheckedCreateInput) {
    return prisma.leaveType.create({ data });
  }

  async findLeaveTypeById(id: string) {
    return prisma.leaveType.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findLeaveTypeByCode(code: string) {
    return prisma.leaveType.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async findLeaveTypeByName(name: string) {
    return prisma.leaveType.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async findManyLeaveTypes(where?: Prisma.LeaveTypeWhereInput) {
    return prisma.leaveType.findMany({
      where: { ...where, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async updateLeaveType(id: string, data: Prisma.LeaveTypeUncheckedUpdateInput) {
    return prisma.leaveType.update({
      where: { id },
      data,
    });
  }

  async softDeleteLeaveType(id: string) {
    return prisma.leaveType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createLeaveBalance(data: Prisma.LeaveBalanceUncheckedCreateInput) {
    return prisma.leaveBalance.create({ data });
  }

  async findLeaveBalance(employeeId: string, leaveTypeId: string, year: number) {
    return prisma.leaveBalance.findFirst({
      where: {
        employeeId,
        leaveTypeId,
        year,
        deletedAt: null,
      },
      include: { leaveType: true },
    });
  }

  async findLeaveBalanceById(id: string) {
    return prisma.leaveBalance.findFirst({
      where: { id, deletedAt: null },
      include: { leaveType: true },
    });
  }

  async findManyLeaveBalances(where?: Prisma.LeaveBalanceWhereInput) {
    return prisma.leaveBalance.findMany({
      where: { ...where, deletedAt: null },
      include: { leaveType: true },
      orderBy: [{ year: "desc" }, { leaveType: { name: "asc" } }],
    });
  }

  async updateLeaveBalance(id: string, data: Prisma.LeaveBalanceUncheckedUpdateInput) {
    return prisma.leaveBalance.update({
      where: { id },
      data,
    });
  }

  async upsertLeaveBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    data: Prisma.LeaveBalanceUncheckedCreateInput,
    updateData: Prisma.LeaveBalanceUncheckedUpdateInput
  ) {
    return prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year,
        },
      },
      create: data,
      update: updateData,
    });
  }

  async createLeaveApplication(data: Prisma.LeaveApplicationUncheckedCreateInput) {
    return prisma.leaveApplication.create({ data });
  }

  async findLeaveApplicationById(id: string) {
    return prisma.leaveApplication.findFirst({
      where: { id, deletedAt: null },
      include: {
        leaveType: true,
        approvalRequest: {
          include: {
            steps: true,
            actions: true,
          },
        },
      },
    });
  }

  async findManyLeaveApplications(where?: Prisma.LeaveApplicationWhereInput) {
    return prisma.leaveApplication.findMany({
      where: { ...where, deletedAt: null },
      include: {
        leaveType: true,
        approvalRequest: {
          include: {
            steps: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });
  }

  async updateLeaveApplication(id: string, data: Prisma.LeaveApplicationUncheckedUpdateInput) {
    return prisma.leaveApplication.update({
      where: { id },
      data,
    });
  }

  async findOverlappingLeaves(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string
  ) {
    return prisma.leaveApplication.findMany({
      where: {
        employeeId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
        deletedAt: null,
      },
    });
  }

  async sumApprovedLeaveDays(employeeId: string, leaveTypeId: string, year: number) {
    const result = await prisma.leaveApplication.aggregate({
      where: {
        employeeId,
        leaveTypeId,
        status: "APPROVED",
        startDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
        deletedAt: null,
      },
      _sum: {
        dayCount: true,
      },
    });
    return result._sum.dayCount || 0;
  }
}
