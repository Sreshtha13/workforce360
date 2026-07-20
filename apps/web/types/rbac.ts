/**
 * Frontend mirror of RBAC API entities.
 * Backend (`apps/api`) remains the source of truth for shapes.
 */

export type Permission = {
  id: string;
  name: string;
  code: string;
  module: string;
  feature: string;
  resource: string;
  action: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type Role = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  _count?: {
    userRoles: number;
    rolePermissions: number;
  };
  rolePermissions?: RolePermission[];
};

export type RolePermission = {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt?: string;
  updatedAt?: string;
  permission?: Permission;
};

export type CreateRoleInput = {
  name: string;
  code?: string;
  description?: string;
};

export type UpdateRoleInput = Partial<CreateRoleInput>;

export type DuplicateRoleInput = {
  name?: string;
  code?: string;
};

export type CreatePermissionInput = {
  name: string;
  code: string;
  module: string;
  feature: string;
  resource: string;
  action: string;
  description?: string;
};

export type UpdatePermissionInput = Partial<CreatePermissionInput>;

export type AssignRoleInput = {
  roleId: string;
};

export type AssignPermissionInput = {
  permissionId: string;
};

export type SetRolePermissionsInput = {
  permissionIds: string[];
};

export type MessageResponse = {
  message: string;
};
