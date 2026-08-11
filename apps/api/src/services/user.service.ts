import { UserRepository } from "../repositories/user.repository";
import { departmentManagerService } from "./department-manager.service";
import { authService } from "./auth.service";
import { hashPassword } from "../lib/password";
import { AppError, toClientError } from "../lib/app-error";
import { userIsSuperAdmin } from "../lib/super-admin";
import {
  assertCanViewUser,
  resolveEmployeeVisibilityScope,
} from "../lib/employee-scope";
import { prisma } from "../lib/prisma";
import {
  allocateNextEmployeeId,
  isEmployeeIdConflict,
  previewNextEmployeeId,
} from "./employee-id.service";
import { employeeMasterService } from "./employee-master.service";
import type { CreateUserInput, UpdateUserInput } from "../repositories/user.repository";

const CREATE_USER_MAX_RETRIES = 3;

export class UserService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async getAllUsers(
    filters?: {
      departmentId?: string;
      officeId?: string;
      employeeTypeId?: string;
      employmentStatusId?: string;
      status?: string;
      search?: string;
      includeDeleted?: boolean;
    },
    requesterId?: string,
  ) {
    if (filters?.includeDeleted) {
      if (!requesterId || !(await userIsSuperAdmin(requesterId))) {
        throw new Error("Only Super Administrators can view deleted users");
      }
    }

    let ids: string[] | undefined;
    if (requesterId) {
      const scope = await resolveEmployeeVisibilityScope(requesterId);
      if (scope.type === "userIds") {
        ids = scope.userIds;
      }
    }

    return this.userRepo.findAllUsers({ ...filters, ids });
  }

  async getUserById(id: string, requesterId?: string) {
    const user = await this.userRepo.findUserById(id);
    if (!user) {
      throw new Error("User not found");
    }

    if (requesterId) {
      await assertCanViewUser(requesterId, id);
    }

    return user;
  }

  async getNextEmployeeId(): Promise<string> {
    return previewNextEmployeeId();
  }

  async createUser(data: CreateUserInput & { password?: string }) {
    const { password, managerId: _ignoredManagerId, ...userData } = data;

    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    let lastError: unknown;

    for (let attempt = 0; attempt < CREATE_USER_MAX_RETRIES; attempt++) {
      try {
        const payload = { ...userData };
        if (!payload.employeeId) {
          payload.employeeId = await allocateNextEmployeeId();
        }

        const created = await this.userRepo.createUser({
          ...payload,
          passwordHash,
        });

        await employeeMasterService.ensureEmployeeRecord(created.id, {
          employeeCode: created.employeeId ?? payload.employeeId,
          lifecycleState: "ACTIVE",
          hiredAt: created.dateOfJoining ?? undefined,
        });

        if (payload.departmentId) {
          const derivedManagerId = await departmentManagerService.resolveManagerForDepartmentAssignment(
            created.id,
            payload.departmentId,
          );
          if (derivedManagerId) {
            return this.userRepo.updateUser(created.id, { managerId: derivedManagerId });
          }
        }

        return created;
      } catch (error) {
        lastError = error;
        if (isEmployeeIdConflict(error) && attempt < CREATE_USER_MAX_RETRIES - 1) {
          userData.employeeId = undefined;
          continue;
        }
        throw toClientError(error);
      }
    }

    throw toClientError(lastError);
  }

  async updateUser(id: string, data: UpdateUserInput & { password?: string }) {
    const { password, ...userData } = data;

    const existing = await this.userRepo.findUserById(id);
    if (!existing) {
      throw new Error("User not found");
    }

    if (userData.departmentId !== undefined) {
      const nextDepartmentId = userData.departmentId ?? null;
      const previousDepartmentId = existing.departmentId ?? null;

      if (nextDepartmentId !== previousDepartmentId) {
        if (previousDepartmentId) {
          const clearedManagerId = await departmentManagerService.resolveManagerAfterDepartmentRemoval(
            id,
            previousDepartmentId,
            existing.managerId ?? null,
          );
          if (clearedManagerId === null) {
            userData.managerId = null;
          }
        }

        if (nextDepartmentId) {
          const derivedManagerId = await departmentManagerService.resolveManagerForDepartmentAssignment(
            id,
            nextDepartmentId,
          );
          if (derivedManagerId) {
            userData.managerId = derivedManagerId;
          }
        }
      }
    }

    if (userData.managerId) {
      await departmentManagerService.validateManagerUser(userData.managerId);
      await departmentManagerService.validateNoReportingCycle(id, userData.managerId);
    }

    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    try {
      const updated = await this.userRepo.updateUser(id, {
        ...userData,
        ...(passwordHash && { passwordHash }),
      });

      if (updated.employeeId) {
        await employeeMasterService.ensureEmployeeRecord(updated.id, {
          employeeCode: updated.employeeId,
          lifecycleState: "ACTIVE",
          hiredAt: updated.dateOfJoining ?? undefined,
        });
      }

      if (passwordHash) {
        await authService.invalidateUserSessions(id);
      }

      return updated;
    } catch (error) {
      throw toClientError(error);
    }
  }

  async revokeUserSessions(userId: string) {
    const existing = await this.userRepo.findUserById(userId);
    if (!existing) {
      throw new Error("User not found");
    }

    await authService.invalidateUserSessions(userId);
  }

  async deleteUser(id: string) {
    const existing = await this.userRepo.findUserById(id);
    if (!existing) {
      throw new Error("User not found");
    }

    await departmentManagerService.assertUserCanBeDeleted(id);
    await this.userRepo.clearUserAssignments(id);
    await employeeMasterService.softDeleteForUser(id);
    const deleted = await this.userRepo.deleteUser(id);
    await authService.invalidateUserSessions(id);
    return deleted;
  }

  async assignRole(userId: string, roleId: string, assignedBy?: string) {
    const user = await this.userRepo.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const role = await prisma.role.findFirst({
      where: { id: roleId, deletedAt: null },
      select: { id: true, code: true },
    });
    if (!role) {
      throw new Error("Role not found");
    }

    if (role.code === "super_admin" && assignedBy) {
      const requesterIsSuperAdmin = await userIsSuperAdmin(assignedBy);
      if (!requesterIsSuperAdmin) {
        throw new Error("Only Super Administrators can assign the Super Admin role");
      }
    }

    const existingRoles = await this.userRepo.getUserRoles(userId);
    const hasRole = existingRoles.some((ur) => ur.roleId === roleId);

    if (hasRole) {
      throw new Error("User already has this role");
    }

    const assignment = await this.userRepo.assignRole(userId, roleId, assignedBy);

    if (role.code === "hr") {
      const hrDepartment = await prisma.department.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { code: { equals: "hr", mode: "insensitive" } },
            { name: { equals: "HR", mode: "insensitive" } },
            { name: { contains: "Human Resources", mode: "insensitive" } },
          ],
        },
      });

      if (!hrDepartment) {
        throw new AppError(
          "HR_DEPARTMENT_NOT_FOUND",
          "HR department not found. Create a department named HR before assigning the HR role.",
          400,
        );
      }

      const currentUser = await this.userRepo.findUserById(userId);
      if (currentUser && !currentUser.departmentId) {
        const updated = await this.userRepo.updateUser(userId, { departmentId: hrDepartment.id });
        if (updated.employeeId) {
          await employeeMasterService.ensureEmployeeRecord(updated.id, {
            employeeCode: updated.employeeId,
            lifecycleState: "ACTIVE",
          });
        }
      }
    }

    return assignment;
  }

  async removeRole(userId: string, roleId: string) {
    const user = await this.userRepo.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return this.userRepo.removeRole(userId, roleId);
  }

  async getUserRoles(userId: string) {
    return this.userRepo.getUserRoles(userId);
  }
}
