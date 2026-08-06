import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(255),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  isSystem: z.boolean().optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const duplicateRoleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().max(50).optional(),
});

export const createPermissionSchema = z.object({
  name: z.string().min(1, "Permission name is required").max(255),
  code: z.string().min(1, "Permission code is required").max(255),
  module: z.string().min(1, "Module is required").max(100),
  feature: z.string().min(1, "Feature is required").max(100),
  resource: z.string().min(1, "Resource is required").max(100),
  action: z.string().min(1, "Action is required").max(100),
  description: z.string().optional(),
});

export const updatePermissionSchema = createPermissionSchema.partial();

export const assignPermissionSchema = z.object({
  permissionId: z.string().min(1, "Permission ID is required"),
});

export const removePermissionSchema = z.object({
  permissionId: z.string().min(1, "Permission ID is required"),
});

export const setRolePermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().min(1))
    .min(1, "At least one permission must be selected"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type DuplicateRoleInput = z.infer<typeof duplicateRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>;
export type RemovePermissionInput = z.infer<typeof removePermissionSchema>;
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;
