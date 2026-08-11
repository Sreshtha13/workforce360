import { RoleRepository } from "../repositories/role.repository";
import type { CreateRoleInput, CreatePermissionInput } from "../repositories/role.repository";
import { AppError } from "../lib/app-error";
import { userIsSuperAdmin } from "../lib/super-admin";
import { writeAuditLog } from "../lib/audit";

/**
 * System role policy (enforced here — UI must mirror, not replace):
 *
 * 1. System roles (`isSystem = true`) cannot be renamed, recoded, or deleted by anyone.
 * 2. System role **permissions** may only be changed by a Super Administrator.
 * 3. Custom (non-system) role permissions may be changed by any actor with `role.update`.
 * 4. API rejects unauthorized system-role permission changes even if the UI hides the button.
 */
export class RoleService {
  private roleRepo: RoleRepository;

  constructor() {
    this.roleRepo = new RoleRepository();
  }

  async getAllRoles() {
    return this.roleRepo.findAllRoles();
  }

  async getRoleById(id: string) {
    const role = await this.roleRepo.findRoleById(id);
    if (!role) {
      throw new AppError("ROLE_NOT_FOUND", "Role not found", 404);
    }
    return role;
  }

  async createRole(data: CreateRoleInput) {
    return this.roleRepo.createRole({ ...data, isSystem: false });
  }

  async updateRole(id: string, data: Partial<CreateRoleInput>) {
    const existing = await this.roleRepo.findRoleById(id);
    if (!existing) {
      throw new AppError("ROLE_NOT_FOUND", "Role not found", 404);
    }

    if (existing.isSystem) {
      throw new AppError(
        "SYSTEM_ROLE_LOCKED",
        "System roles cannot be renamed or edited. Duplicate the role to create a custom copy, or ask a Super Admin to adjust permissions only.",
        403,
      );
    }

    return this.roleRepo.updateRole(id, data);
  }

  async deleteRole(id: string) {
    const existing = await this.roleRepo.findRoleById(id);
    if (!existing) {
      throw new AppError("ROLE_NOT_FOUND", "Role not found", 404);
    }

    if (existing.isSystem) {
      throw new AppError("SYSTEM_ROLE_LOCKED", "System roles cannot be deleted.", 403);
    }

    return this.roleRepo.deleteRole(id);
  }

  async getAllPermissions() {
    return this.roleRepo.findAllPermissions();
  }

  async getPermissionById(id: string) {
    const permission = await this.roleRepo.findPermissionById(id);
    if (!permission) {
      throw new AppError("PERMISSION_NOT_FOUND", "Permission not found", 404);
    }
    return permission;
  }

  async createPermission(data: CreatePermissionInput) {
    return this.roleRepo.createPermission(data);
  }

  async updatePermission(id: string, data: Partial<CreatePermissionInput>) {
    const existing = await this.roleRepo.findPermissionById(id);
    if (!existing) {
      throw new AppError("PERMISSION_NOT_FOUND", "Permission not found", 404);
    }
    return this.roleRepo.updatePermission(id, data);
  }

  async deletePermission(id: string) {
    const existing = await this.roleRepo.findPermissionById(id);
    if (!existing) {
      throw new AppError("PERMISSION_NOT_FOUND", "Permission not found", 404);
    }
    return this.roleRepo.deletePermission(id);
  }

  /**
   * System roles → Super Admin only.
   * Custom roles → caller already passed `role.update` route middleware.
   */
  private async assertCanEditRolePermissions(
    role: { id: string; name: string; isSystem: boolean },
    actorId?: string,
  ): Promise<void> {
    if (!role.isSystem) return;

    if (!actorId || !(await userIsSuperAdmin(actorId))) {
      throw new AppError(
        "SYSTEM_ROLE_PERMISSIONS_FORBIDDEN",
        `Only Super Administrators can edit permissions on the system role "${role.name}".`,
        403,
      );
    }
  }

  async assignPermissionToRole(roleId: string, permissionId: string, actorId?: string) {
    const role = await this.roleRepo.findRoleById(roleId);
    if (!role) {
      throw new AppError("ROLE_NOT_FOUND", "Role not found", 404);
    }

    await this.assertCanEditRolePermissions(role, actorId);

    const permission = await this.roleRepo.findPermissionById(permissionId);
    if (!permission) {
      throw new AppError("PERMISSION_NOT_FOUND", "Permission not found", 404);
    }

    const existingPermissions = await this.roleRepo.getRolePermissions(roleId);
    const hasPermission = existingPermissions.some((rp) => rp.permissionId === permissionId);

    if (hasPermission) {
      throw new AppError(
        "PERMISSION_ALREADY_ASSIGNED",
        "Role already has this permission",
        400,
      );
    }

    return this.roleRepo.assignPermissionToRole(roleId, permissionId);
  }

  async removePermissionFromRole(roleId: string, permissionId: string, actorId?: string) {
    const role = await this.roleRepo.findRoleById(roleId);
    if (!role) {
      throw new AppError("ROLE_NOT_FOUND", "Role not found", 404);
    }

    await this.assertCanEditRolePermissions(role, actorId);

    return this.roleRepo.removePermissionFromRole(roleId, permissionId);
  }

  async getRolePermissions(roleId: string) {
    return this.roleRepo.getRolePermissions(roleId);
  }

  async setRolePermissions(roleId: string, permissionIds: string[], actorId?: string) {
    const role = await this.roleRepo.findRoleById(roleId);
    if (!role) {
      throw new AppError("ROLE_NOT_FOUND", "Role not found", 404);
    }

    await this.assertCanEditRolePermissions(role, actorId);

    if (permissionIds.length === 0) {
      throw new AppError(
        "PERMISSIONS_REQUIRED",
        "At least one permission must be assigned to a role",
        400,
      );
    }

    const all = await this.roleRepo.findAllPermissions();
    const validIds = new Set(all.map((p) => p.id));
    for (const id of permissionIds) {
      if (!validIds.has(id)) {
        throw new AppError("INVALID_PERMISSION", `Invalid permission ID: ${id}`, 400);
      }
    }

    const before = await this.roleRepo.getRolePermissions(roleId);
    await this.roleRepo.setRolePermissions(roleId, permissionIds);
    const after = await this.roleRepo.getRolePermissions(roleId);

    if (actorId) {
      await writeAuditLog({
        userId: actorId,
        action: "set_role_permissions",
        entity: "role",
        entityId: roleId,
        before: {
          permissionIds: before.map((rp) => rp.permissionId),
          isSystem: role.isSystem,
        },
        after: {
          permissionIds: after.map((rp) => rp.permissionId),
          isSystem: role.isSystem,
        },
      });
    }

    return after;
  }

  async duplicateRole(id: string, data?: { name?: string; code?: string }) {
    const source = await this.roleRepo.findRoleById(id);
    if (!source) {
      throw new AppError("ROLE_NOT_FOUND", "Role not found", 404);
    }

    const baseName = data?.name ?? `${source.name} (Copy)`;
    const baseCode = data?.code ?? (source.code ? `${source.code}_copy` : undefined);

    const newRole = await this.roleRepo.createRole({
      name: baseName,
      code: baseCode,
      description: source.description ?? undefined,
      isSystem: false,
    });

    const permissionIds = source.rolePermissions.map((rp) => rp.permissionId);
    if (permissionIds.length > 0) {
      await this.roleRepo.setRolePermissions(newRole.id, permissionIds);
    }

    return this.roleRepo.findRoleById(newRole.id);
  }
}
