import { prisma } from "../lib/prisma";
import type { User, UserRole } from "@prisma/client";
import { findHighestEmployeeId } from "../lib/employee-id";
import {
  activeUserSummarySelect,
  sanitizeUserReference,
} from "../lib/organization-metrics";

export type CreateUserInput = {
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId?: string;
  status?: string;
  dateOfBirth?: Date;
  dateOfJoining?: Date;
  departmentId?: string;
  designationId?: string;
  officeId?: string;
  employeeTypeId?: string;
  employmentStatusId?: string | null;
  managerId?: string;
};

export type UpdateUserInput = Partial<CreateUserInput> & {
  status?: string;
};

export class UserRepository {
  async findAllUsers(filters?: {
    departmentId?: string;
    officeId?: string;
    employeeTypeId?: string;
    employmentStatusId?: string;
    status?: string;
    search?: string;
    includeDeleted?: boolean;
  }) {
    const rows = await prisma.user.findMany({
      where: {
        ...(filters?.includeDeleted ? {} : { deletedAt: null }),
        ...(filters?.departmentId && { departmentId: filters.departmentId }),
        ...(filters?.officeId && { officeId: filters.officeId }),
        ...(filters?.employeeTypeId && { employeeTypeId: filters.employeeTypeId }),
        ...(filters?.employmentStatusId && { employmentStatusId: filters.employmentStatusId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.search && {
          OR: [
            { email: { contains: filters.search, mode: "insensitive" } },
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName: { contains: filters.search, mode: "insensitive" } },
            { employeeId: { contains: filters.search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        status: true,
        employeeId: true,
        dateOfJoining: true,
        deletedAt: true,
        department: { select: { id: true, name: true, managerId: true } },
        designation: { select: { id: true, name: true } },
        office: { select: { id: true, name: true } },
        employeeType: { select: { id: true, name: true, code: true } },
        employmentStatus: { select: { id: true, name: true } },
        manager: { select: activeUserSummarySelect },
        managedDepartments: {
          where: { deletedAt: null },
          select: { id: true, name: true },
        },
        userRoles: {
          where: { deletedAt: null },
          include: { role: { select: { id: true, name: true } } },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
    });

    return rows.map((row) => ({
      ...row,
      manager: sanitizeUserReference(row.manager),
    }));
  }
  
  async findUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: true,
        designation: true,
        office: true,
        employeeType: true,
        employmentStatus: true,
        manager: { select: activeUserSummarySelect },
        teamMemberships: {
          where: { deletedAt: null, leftAt: null },
          select: { team: { select: { id: true, name: true } } },
        },
        managedDepartments: {
          where: { deletedAt: null },
          select: { id: true, name: true },
        },
        userRoles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      manager: sanitizeUserReference(user.manager),
    };
  }
  
  async createUser(data: CreateUserInput): Promise<User> {
    return prisma.user.create({ data });
  }
  
  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    return prisma.user.update({
      where: { id, deletedAt: null },
      data,
    });
  }
  
  async deleteUser(id: string): Promise<User> {
    return prisma.user.update({
      where: { id, deletedAt: null },
      data: {
        deletedAt: new Date(),
        status: "deleted",
      },
    });
  }

  async clearUserAssignments(id: string): Promise<void> {
    await prisma.$transaction([
      prisma.department.updateMany({
        where: { managerId: id, deletedAt: null },
        data: { managerId: null },
      }),
      prisma.team.updateMany({
        where: { leadId: id, deletedAt: null },
        data: { leadId: null },
      }),
      prisma.user.updateMany({
        where: { managerId: id, deletedAt: null },
        data: { managerId: null },
      }),
    ]);
  }
  
  async assignRole(userId: string, roleId: string, assignedBy?: string): Promise<UserRole> {
    return prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
      },
    });
  }
  
  async removeRole(userId: string, roleId: string): Promise<UserRole> {
    const userRole = await prisma.userRole.findFirst({
      where: { userId, roleId, deletedAt: null },
    });
    
    if (!userRole) {
      throw new Error("User role not found");
    }
    
    return prisma.userRole.update({
      where: { id: userRole.id },
      data: { deletedAt: new Date() },
    });
  }
  
  async getUserRoles(userId: string) {
    return prisma.userRole.findMany({
      where: { userId, deletedAt: null },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  /** Returns the highest existing EMP### employee id, or null if none exist */
  async findLatestEmployeeId(): Promise<string | null> {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        employeeId: { not: null },
      },
      select: { employeeId: true },
    });

    return findHighestEmployeeId(users.map((u) => u.employeeId));
  }
}
