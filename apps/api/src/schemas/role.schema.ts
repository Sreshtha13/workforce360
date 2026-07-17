import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  isSystem: z.boolean().optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const createPermissionSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(255),
  resource: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
  description: z.string().optional(),
});

export const updatePermissionSchema = createPermissionSchema.partial();

export const assignPermissionSchema = z.object({
  permissionId: z.string().min(1, "Permission ID is required"),
});

export const removePermissionSchema = z.object({
  permissionId: z.string().min(1, "Permission ID is required"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>;
export type RemovePermissionInput = z.infer<typeof removePermissionSchema>;
