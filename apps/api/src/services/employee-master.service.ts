import type { EmployeeLifecycleState } from "@prisma/client";
import { AppError, mapPrismaError } from "../lib/app-error";
import { prisma } from "../lib/prisma";

export type EnsureEmployeeRecordInput = {
  employeeCode?: string;
  candidateId?: string;
  lifecycleState?: EmployeeLifecycleState;
  hiredAt?: Date;
};

export class EmployeeMasterService {
  /**
   * Ensures a canonical Employee row exists for a user with an assigned employee ID.
   * Keeps employee_code in sync with users.employee_id when they diverge.
   */
  async ensureEmployeeRecord(
    userId: string,
    input: EnsureEmployeeRecordInput = {},
  ) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        employeeId: true,
        dateOfJoining: true,
      },
    });

    if (!user) {
      throw new AppError("USER_NOT_FOUND", "User not found", 404);
    }

    const employeeCode = input.employeeCode ?? user.employeeId;
    if (!employeeCode) {
      throw new AppError(
        "EMPLOYEE_ID_REQUIRED",
        "User must have an employee ID before creating an employee record",
        400,
      );
    }

    const existing = await prisma.employee.findFirst({
      where: { userId, deletedAt: null },
    });

    if (existing) {
      if (existing.employeeCode !== employeeCode) {
        try {
          return await prisma.employee.update({
            where: { id: existing.id },
            data: { employeeCode },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  employeeId: true,
                  dateOfJoining: true,
                  dateOfBirth: true,
                  department: { select: { id: true, name: true } },
                  designation: { select: { id: true, name: true } },
                  office: { select: { id: true, name: true } },
                  employeeType: { select: { id: true, name: true, code: true } },
                  employmentStatus: { select: { id: true, name: true } },
                },
              },
            },
          });
        } catch (error) {
          const mapped = mapPrismaError(error);
          if (mapped) throw mapped;
          throw error;
        }
      }
      return existing;
    }

    try {
      return await prisma.employee.create({
        data: {
          userId,
          employeeCode,
          candidateId: input.candidateId,
          lifecycleState: input.lifecycleState ?? "ACTIVE",
          hiredAt: input.hiredAt ?? user.dateOfJoining ?? new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              employeeId: true,
              dateOfJoining: true,
              dateOfBirth: true,
              department: { select: { id: true, name: true } },
              designation: { select: { id: true, name: true } },
              office: { select: { id: true, name: true } },
              employeeType: { select: { id: true, name: true, code: true } },
              employmentStatus: { select: { id: true, name: true } },
            },
          },
        },
      });
    } catch (error) {
      const mapped = mapPrismaError(error);
      if (mapped) throw mapped;
      throw error;
    }
  }

  /** Soft-delete employee master when the linked user account is removed. */
  async softDeleteForUser(userId: string): Promise<void> {
    await prisma.employee.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Creates missing Employee rows for users that already have employee_id assigned.
   * Safe to call idempotently (e.g. after deploy before migration runs in all envs).
   */
  async backfillMissingEmployeeRecords(): Promise<number> {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        employeeId: { not: null },
      },
      select: {
        id: true,
        employeeId: true,
        dateOfJoining: true,
        employeeMaster: { select: { id: true, deletedAt: true } },
      },
    });

    let created = 0;
    for (const user of users) {
      if (!user.employeeId) continue;
      if (user.employeeMaster && user.employeeMaster.deletedAt === null) continue;

      await this.ensureEmployeeRecord(user.id, {
        employeeCode: user.employeeId,
        lifecycleState: "ACTIVE",
        hiredAt: user.dateOfJoining ?? undefined,
      });
      created += 1;
    }

    return created;
  }
}

export const employeeMasterService = new EmployeeMasterService();
