import { prisma } from "../lib/prisma";
import { linkedUserFilter } from "../lib/organization-metrics";
import type { Role, Permission, RolePermission } from "@prisma/client";

export type CreateRoleInput = {
  name: string;
  code?: string;
  description?: string;
  isSystem?: boolean;
};

export type CreatePermissionInput = {
  name: string;
  code: string;
  module: string;
  feature?: string;
  resource: string;
  action: string;
  description?: string;
};

export class RoleRepository {
  async findAllRoles() {
    return prisma.role.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            userRoles: {
              where: {
                deletedAt: null,
                user: linkedUserFilter,
              },
            },
            rolePermissions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }
  
  async findRoleById(id: string) {
    return prisma.role.findUnique({
      where: { id, deletedAt: null },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }
  
  async createRole(data: CreateRoleInput): Promise<Role> {
    return prisma.role.create({ data });
  }
  
  async updateRole(id: string, data: Partial<CreateRoleInput>): Promise<Role> {
    return prisma.role.update({ where: { id }, data });
  }
  
  async deleteRole(id: string): Promise<Role> {
    return prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  
  async findAllPermissions() {
    return prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: [{ module: "asc" }, { feature: "asc" }, { action: "asc" }],
    });
  }
  
  async findPermissionById(id: string) {
    return prisma.permission.findUnique({
      where: { id, deletedAt: null },
    });
  }
  
  async createPermission(data: CreatePermissionInput): Promise<Permission> {
    return prisma.permission.create({ data });
  }
  
  async updatePermission(id: string, data: Partial<CreatePermissionInput>): Promise<Permission> {
    return prisma.permission.update({ where: { id }, data });
  }
  
  async deletePermission(id: string): Promise<Permission> {
    return prisma.permission.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    return prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
  }
  
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
  }
  
  async getRolePermissions(roleId: string) {
    return prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
          skipDuplicates: true,
        });
      }
    });
  }
}
