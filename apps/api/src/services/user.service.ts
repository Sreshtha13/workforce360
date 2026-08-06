import { UserRepository } from "../repositories/user.repository";
import { departmentManagerService } from "./department-manager.service";
import { authService } from "./auth.service";
import { hashPassword } from "../lib/password";
import { getNextEmployeeId } from "../lib/employee-id";
import { userIsSuperAdmin } from "../lib/super-admin";
import { prisma } from "../lib/prisma";
import type { CreateUserInput, UpdateUserInput } from "../repositories/user.repository";

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

    return this.userRepo.findAllUsers(filters);
  }
  
  async getUserById(id: string) {
    const user = await this.userRepo.findUserById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async getNextEmployeeId(): Promise<string> {
    const latest = await this.userRepo.findLatestEmployeeId();
    return getNextEmployeeId(latest);
  }
  
  async createUser(data: CreateUserInput & { password?: string }) {
    const { password, managerId: _ignoredManagerId, ...userData } = data;

    if (!userData.employeeId) {
      userData.employeeId = await this.getNextEmployeeId();
    }
    
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }
    
    const created = await this.userRepo.createUser({
      ...userData,
      passwordHash,
    });

    if (userData.departmentId) {
      const derivedManagerId = await departmentManagerService.resolveManagerForDepartmentAssignment(
        created.id,
        userData.departmentId,
      );
      if (derivedManagerId) {
        return this.userRepo.updateUser(created.id, { managerId: derivedManagerId });
      }
    }

    return created;
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

    const updated = await this.userRepo.updateUser(id, {
      ...userData,
      ...(passwordHash && { passwordHash }),
    });

    if (passwordHash) {
      await authService.invalidateUserSessions(id);
    }

    return updated;
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
        throw new Error(
          "HR department not found. Create a department named HR before assigning the HR role.",
        );
      }

      const currentUser = await this.userRepo.findUserById(userId);
      if (currentUser && !currentUser.departmentId) {
        await this.userRepo.updateUser(userId, { departmentId: hrDepartment.id });
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
