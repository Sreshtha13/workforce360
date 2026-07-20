import { RoleRepository } from "../repositories/role.repository";
import type { CreateRoleInput, CreatePermissionInput } from "../repositories/role.repository";

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
      throw new Error("Role not found");
    }
    return role;
  }
  
  async createRole(data: CreateRoleInput) {
    return this.roleRepo.createRole(data);
  }
  
  async updateRole(id: string, data: Partial<CreateRoleInput>) {
    const existing = await this.roleRepo.findRoleById(id);
    if (!existing) {
      throw new Error("Role not found");
    }
    
    if (existing.isSystem) {
      throw new Error("Cannot update system role");
    }
    
    return this.roleRepo.updateRole(id, data);
  }
  
  async deleteRole(id: string) {
    const existing = await this.roleRepo.findRoleById(id);
    if (!existing) {
      throw new Error("Role not found");
    }
    
    if (existing.isSystem) {
      throw new Error("Cannot delete system role");
    }
    
    return this.roleRepo.deleteRole(id);
  }
  
  async getAllPermissions() {
    return this.roleRepo.findAllPermissions();
  }
  
  async getPermissionById(id: string) {
    const permission = await this.roleRepo.findPermissionById(id);
    if (!permission) {
      throw new Error("Permission not found");
    }
    return permission;
  }
  
  async createPermission(data: CreatePermissionInput) {
    return this.roleRepo.createPermission(data);
  }
  
  async updatePermission(id: string, data: Partial<CreatePermissionInput>) {
    const existing = await this.roleRepo.findPermissionById(id);
    if (!existing) {
      throw new Error("Permission not found");
    }
    return this.roleRepo.updatePermission(id, data);
  }
  
  async deletePermission(id: string) {
    const existing = await this.roleRepo.findPermissionById(id);
    if (!existing) {
      throw new Error("Permission not found");
    }
    return this.roleRepo.deletePermission(id);
  }
  
  async assignPermissionToRole(roleId: string, permissionId: string) {
    const role = await this.roleRepo.findRoleById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }
    
    const permission = await this.roleRepo.findPermissionById(permissionId);
    if (!permission) {
      throw new Error("Permission not found");
    }
    
    const existingPermissions = await this.roleRepo.getRolePermissions(roleId);
    const hasPermission = existingPermissions.some((rp) => rp.permissionId === permissionId);
    
    if (hasPermission) {
      throw new Error("Role already has this permission");
    }
    
    return this.roleRepo.assignPermissionToRole(roleId, permissionId);
  }
  
  async removePermissionFromRole(roleId: string, permissionId: string) {
    const role = await this.roleRepo.findRoleById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }
    
    return this.roleRepo.removePermissionFromRole(roleId, permissionId);
  }
  
  async getRolePermissions(roleId: string) {
    return this.roleRepo.getRolePermissions(roleId);
  }

  async setRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.roleRepo.findRoleById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystem) {
      throw new Error("Cannot modify permissions on system role");
    }

    if (permissionIds.length > 0) {
      const all = await this.roleRepo.findAllPermissions();
      const validIds = new Set(all.map((p) => p.id));
      for (const id of permissionIds) {
        if (!validIds.has(id)) {
          throw new Error(`Invalid permission ID: ${id}`);
        }
      }
    }

    await this.roleRepo.setRolePermissions(roleId, permissionIds);
    return this.roleRepo.getRolePermissions(roleId);
  }

  async duplicateRole(id: string, data?: { name?: string; code?: string }) {
    const source = await this.roleRepo.findRoleById(id);
    if (!source) {
      throw new Error("Role not found");
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
