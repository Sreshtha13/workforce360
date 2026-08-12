import { LeaveRepository } from "../repositories/leave.repository";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { ApprovalService } from "./approval.service";

export class LeaveService {
  private leaveRepo = new LeaveRepository();
  private approvalService = new ApprovalService();

  async createLeaveType(data: {
    name: string;
    code?: string;
    description?: string;
    defaultBalance?: number;
    carryForward?: boolean;
    maxCarryForwardDays?: number;
    requiresApproval?: boolean;
  }, actorId: string) {
    const existing = await this.leaveRepo.findLeaveTypeByName(data.name);
    if (existing) {
      throw new AppError("DUPLICATE_LEAVE_TYPE_NAME", "Leave type with this name already exists", 400);
    }

    if (data.code) {
      const existingCode = await this.leaveRepo.findLeaveTypeByCode(data.code);
      if (existingCode) {
        throw new AppError("DUPLICATE_LEAVE_TYPE_CODE", "Leave type code already exists", 400);
      }
    }

    const leaveType = await this.leaveRepo.createLeaveType({
      name: data.name,
      code: data.code,
      description: data.description,
      defaultBalance: data.defaultBalance ?? 0,
      carryForward: data.carryForward ?? false,
      maxCarryForwardDays: data.maxCarryForwardDays ?? 0,
      requiresApproval: data.requiresApproval ?? true,
    });

    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "leave_type",
      entityId: leaveType.id,
      after: leaveType,
    });

    return leaveType;
  }

  async updateLeaveType(id: string, data: Partial<{
    name: string;
    code?: string;
    description?: string;
    defaultBalance?: number;
    carryForward?: boolean;
    maxCarryForwardDays?: number;
    requiresApproval?: boolean;
    isActive?: boolean;
  }>, actorId: string) {
    const existing = await this.leaveRepo.findLeaveTypeById(id);
    if (!existing) {
      throw new AppError("LEAVE_TYPE_NOT_FOUND", "Leave type not found", 404);
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await this.leaveRepo.findLeaveTypeByName(data.name);
      if (duplicate) {
        throw new AppError("DUPLICATE_LEAVE_TYPE_NAME", "Leave type with this name already exists", 400);
      }
    }

    if (data.code && data.code !== existing.code) {
      const duplicateCode = await this.leaveRepo.findLeaveTypeByCode(data.code);
      if (duplicateCode) {
        throw new AppError("DUPLICATE_LEAVE_TYPE_CODE", "Leave type code already exists", 400);
      }
    }

    const updated = await this.leaveRepo.updateLeaveType(id, data);

    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "leave_type",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async deleteLeaveType(id: string, actorId: string) {
    const existing = await this.leaveRepo.findLeaveTypeById(id);
    if (!existing) {
      throw new AppError("LEAVE_TYPE_NOT_FOUND", "Leave type not found", 404);
    }

    await this.leaveRepo.softDeleteLeaveType(id);

    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "leave_type",
      entityId: id,
      before: existing,
    });
  }

  async listLeaveTypes(filters: { isActive?: boolean }) {
    const where: any = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    return this.leaveRepo.findManyLeaveTypes(where);
  }

  async getLeaveTypeById(id: string) {
    const leaveType = await this.leaveRepo.findLeaveTypeById(id);
    if (!leaveType) {
      throw new AppError("LEAVE_TYPE_NOT_FOUND", "Leave type not found", 404);
    }
    return leaveType;
  }

  async initializeLeaveBalance(data: {
    employeeId: string;
    leaveTypeId: string;
    year: number;
    allocated: number;
    carriedOver?: number;
  }, actorId: string) {
    const leaveType = await this.leaveRepo.findLeaveTypeById(data.leaveTypeId);
    if (!leaveType) {
      throw new AppError("LEAVE_TYPE_NOT_FOUND", "Leave type not found", 404);
    }

    const existing = await this.leaveRepo.findLeaveBalance(
      data.employeeId,
      data.leaveTypeId,
      data.year
    );

    if (existing) {
      throw new AppError("DUPLICATE_LEAVE_BALANCE", "Leave balance already exists for this employee, leave type, and year", 400);
    }

    const carriedOver = data.carriedOver ?? 0;
    const allocated = data.allocated;
    const balance = allocated + carriedOver;

    const leaveBalance = await this.leaveRepo.createLeaveBalance({
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      year: data.year,
      allocated,
      carriedOver,
      balance,
      used: 0,
    });

    await writeAuditLog({
      userId: actorId,
      action: "initialize",
      entity: "leave_balance",
      entityId: leaveBalance.id,
      after: leaveBalance,
    });

    return leaveBalance;
  }

  async adjustLeaveBalance(id: string, data: {
    allocated?: number;
    used?: number;
    carriedOver?: number;
  }, actorId: string) {
    const existing = await this.leaveRepo.findLeaveBalanceById(id);
    if (!existing) {
      throw new AppError("LEAVE_BALANCE_NOT_FOUND", "Leave balance not found", 404);
    }

    const allocated = data.allocated ?? existing.allocated;
    const used = data.used ?? existing.used;
    const carriedOver = data.carriedOver ?? existing.carriedOver;
    const balance = allocated + carriedOver - used;

    if (balance < 0) {
      throw new AppError("INVALID_LEAVE_BALANCE", "Leave balance cannot be negative", 400);
    }

    const updated = await this.leaveRepo.updateLeaveBalance(id, {
      allocated,
      used,
      carriedOver,
      balance,
    });

    await writeAuditLog({
      userId: actorId,
      action: "adjust",
      entity: "leave_balance",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async getLeaveBalance(employeeId: string, leaveTypeId: string, year: number) {
    const balance = await this.leaveRepo.findLeaveBalance(employeeId, leaveTypeId, year);
    if (!balance) {
      throw new AppError("LEAVE_BALANCE_NOT_FOUND", "Leave balance not found", 404);
    }
    return balance;
  }

  async listLeaveBalances(filters: {
    employeeId?: string;
    leaveTypeId?: string;
    year?: number;
  }) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.leaveTypeId) where.leaveTypeId = filters.leaveTypeId;
    if (filters.year) where.year = filters.year;
    return this.leaveRepo.findManyLeaveBalances(where);
  }

  private calculateDayCount(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  async applyLeave(
    employeeId: string,
    data: {
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      reason: string;
      approverIds?: string[];
    },
    actorId: string
  ) {
    const leaveType = await this.leaveRepo.findLeaveTypeById(data.leaveTypeId);
    if (!leaveType) {
      throw new AppError("LEAVE_TYPE_NOT_FOUND", "Leave type not found", 404);
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate > endDate) {
      throw new AppError("INVALID_LEAVE_DATE_RANGE", "Start date must be before or equal to end date", 400);
    }

    const overlapping = await this.leaveRepo.findOverlappingLeaves(
      employeeId,
      startDate,
      endDate
    );

    if (overlapping.length > 0) {
      throw new AppError("LEAVE_OVERLAP", "Leave dates overlap with existing leave application", 400);
    }

    const dayCount = this.calculateDayCount(startDate, endDate);
    const year = startDate.getFullYear();

    const balance = await this.leaveRepo.findLeaveBalance(employeeId, data.leaveTypeId, year);
    if (balance && balance.balance < dayCount) {
      throw new AppError("INSUFFICIENT_LEAVE_BALANCE", "Insufficient leave balance", 400);
    }

    let application = await this.leaveRepo.createLeaveApplication({
      employeeId,
      leaveTypeId: data.leaveTypeId,
      startDate,
      endDate,
      dayCount,
      reason: data.reason,
      status: leaveType.requiresApproval ? "PENDING" : "APPROVED",
    });

    if (
      leaveType.requiresApproval &&
      data.approverIds &&
      data.approverIds.length > 0
    ) {
      const approval = await this.approvalService.createApprovalRequest(
        {
          entityType: "leave_application",
          entityId: application.id,
          requesterId: actorId,
          approverIds: data.approverIds,
          metadata: {
            leaveTypeId: data.leaveTypeId,
            dayCount,
            startDate: data.startDate,
            endDate: data.endDate,
          },
        },
        actorId,
      );
      application = await this.leaveRepo.updateLeaveApplication(application.id, {
        approvalRequestId: approval.id,
      });
    }

    if (!leaveType.requiresApproval && balance) {
      await this.deductLeaveBalance(employeeId, data.leaveTypeId, year, dayCount);
    }

    await writeAuditLog({
      userId: actorId,
      action: "apply",
      entity: "leave_application",
      entityId: application.id,
      after: application,
    });

    return application;
  }

  private async deductLeaveBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    dayCount: number
  ) {
    const balance = await this.leaveRepo.findLeaveBalance(employeeId, leaveTypeId, year);
    if (!balance) {
      return;
    }

    const newUsed = balance.used + dayCount;
    const newBalance = balance.allocated + balance.carriedOver - newUsed;

    await this.leaveRepo.updateLeaveBalance(balance.id, {
      used: newUsed,
      balance: newBalance,
    });
  }

  async reviewLeaveApplication(
    id: string,
    data: { status: "APPROVED" | "REJECTED"; reviewNotes?: string },
    actorId: string
  ) {
    const application = await this.leaveRepo.findLeaveApplicationById(id);
    if (!application) {
      throw new AppError("LEAVE_APPLICATION_NOT_FOUND", "Leave application not found", 404);
    }

    if (application.status !== "PENDING") {
      throw new AppError("LEAVE_ALREADY_REVIEWED", "Leave application already reviewed", 400);
    }

    const updated = await this.leaveRepo.updateLeaveApplication(id, {
      status: data.status,
      reviewedById: actorId,
      reviewedAt: new Date(),
      reviewNotes: data.reviewNotes,
    });

    if (data.status === "APPROVED") {
      const year = application.startDate.getFullYear();
      await this.deductLeaveBalance(
        application.employeeId,
        application.leaveTypeId,
        year,
        application.dayCount
      );
    }

    await writeAuditLog({
      userId: actorId,
      action: "review",
      entity: "leave_application",
      entityId: id,
      before: application,
      after: updated,
    });

    return updated;
  }

  async cancelLeaveApplication(id: string, actorId: string, reason?: string) {
    const application = await this.leaveRepo.findLeaveApplicationById(id);
    if (!application) {
      throw new AppError("LEAVE_APPLICATION_NOT_FOUND", "Leave application not found", 404);
    }

    if (application.status === "CANCELLED") {
      throw new AppError("LEAVE_ALREADY_CANCELLED", "Leave application already cancelled", 400);
    }

    if (application.status === "APPROVED") {
      const year = application.startDate.getFullYear();
      const balance = await this.leaveRepo.findLeaveBalance(
        application.employeeId,
        application.leaveTypeId,
        year
      );

      if (balance) {
        const newUsed = Math.max(0, balance.used - application.dayCount);
        const newBalance = balance.allocated + balance.carriedOver - newUsed;

        await this.leaveRepo.updateLeaveBalance(balance.id, {
          used: newUsed,
          balance: newBalance,
        });
      }
    }

    const updated = await this.leaveRepo.updateLeaveApplication(id, {
      status: "CANCELLED",
      reviewNotes: reason,
    });

    await writeAuditLog({
      userId: actorId,
      action: "cancel",
      entity: "leave_application",
      entityId: id,
      before: application,
      after: updated,
    });

    return updated;
  }

  async listLeaveApplications(filters: {
    employeeId?: string;
    leaveTypeId?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    const where: any = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.leaveTypeId) where.leaveTypeId = filters.leaveTypeId;
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.startDate = {};
      if (filters.from) where.startDate.gte = new Date(filters.from);
      if (filters.to) where.startDate.lte = new Date(filters.to);
    }
    return this.leaveRepo.findManyLeaveApplications(where);
  }

  async getLeaveApplicationById(id: string) {
    const application = await this.leaveRepo.findLeaveApplicationById(id);
    if (!application) {
      throw new AppError("LEAVE_APPLICATION_NOT_FOUND", "Leave application not found", 404);
    }
    return application;
  }

  async getLeaveStats(employeeId: string, year: number) {
    const balances = await this.leaveRepo.findManyLeaveBalances({
      employeeId,
      year,
    });

    const totals = balances.reduce(
      (acc, balance) => {
        acc.totalAllocated += balance.allocated;
        acc.totalUsed += balance.used;
        acc.totalBalance += balance.balance;
        acc.totalCarriedOver += balance.carriedOver;
        return acc;
      },
      {
        totalAllocated: 0,
        totalUsed: 0,
        totalBalance: 0,
        totalCarriedOver: 0,
      }
    );

    return {
      year,
      balances,
      totals,
    };
  }
}
