import { prisma } from "../lib/prisma";
import type { User, UserRole } from "@prisma/client";
import { findHighestEmployeeId } from "../lib/employee-id";

export type CreateUserInput = {
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId?: string;
  dateOfBirth?: Date;
  dateOfJoining?: Date;
  departmentId?: string;
  designationId?: string;
  officeId?: string;
  employeeTypeId?: string;
  employmentStatusId?: string;
  managerId?: string;
};

export type UpdateUserInput = Partial<CreateUserInput> & {
  status?: string;
};

export class UserRepository {
  async findAllUsers(filters?: {
    departmentId?: string;
    status?: string;
    search?: string;
  }) {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(filters?.departmentId && { departmentId: filters.departmentId }),
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
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        office: { select: { id: true, name: true } },
        employeeType: { select: { id: true, name: true } },
        employmentStatus: { select: { id: true, name: true } },
        userRoles: {
          where: { deletedAt: null },
          include: { role: { select: { id: true, name: true } } },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
  
  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: true,
        designation: true,
        office: true,
        employeeType: true,
        employmentStatus: true,
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        userRoles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });
  }
  
  async createUser(data: CreateUserInput): Promise<User> {
    return prisma.user.create({ data });
  }
  
  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }
  
  async deleteUser(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
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
