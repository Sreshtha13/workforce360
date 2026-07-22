import type { Request, Response } from "express";
import { RoleService } from "../services/role.service";
import { sendSuccess, sendError } from "../lib/response";

export class RoleController {
  private roleService: RoleService;
  
  constructor() {
    this.roleService = new RoleService();
  }
  
  getRoles = async (_req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.roleService.getAllRoles();
      sendSuccess(res, roles);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_ROLES_FAILED",
        message: error instanceof Error ? error.message : "Failed to get roles",
      });
    }
  };
  
  getRoleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.roleService.getRoleById(id);
      sendSuccess(res, role);
    } catch (error) {
      sendError(res, 404, {
        code: "ROLE_NOT_FOUND",
        message: error instanceof Error ? error.message : "Role not found",
      });
    }
  };
  
  createRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const role = await this.roleService.createRole(req.body);
      sendSuccess(res, role, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_ROLE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create role",
      });
    }
  };
  
  updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.roleService.updateRole(id, req.body);
      sendSuccess(res, role);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_ROLE_FAILED",
        message: error instanceof Error ? error.message : "Failed to update role",
      });
    }
  };
  
  deleteRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.roleService.deleteRole(id);
      sendSuccess(res, { message: "Role deleted successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "DELETE_ROLE_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete role",
      });
    }
  };
  
  getPermissions = async (_req: Request, res: Response): Promise<void> => {
    try {
      const permissions = await this.roleService.getAllPermissions();
      sendSuccess(res, permissions);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_PERMISSIONS_FAILED",
        message: error instanceof Error ? error.message : "Failed to get permissions",
      });
    }
  };
  
  getPermissionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const permission = await this.roleService.getPermissionById(id);
      sendSuccess(res, permission);
    } catch (error) {
      sendError(res, 404, {
        code: "PERMISSION_NOT_FOUND",
        message: error instanceof Error ? error.message : "Permission not found",
      });
    }
  };
  
  createPermission = async (req: Request, res: Response): Promise<void> => {
    try {
      const permission = await this.roleService.createPermission(req.body);
      sendSuccess(res, permission, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_PERMISSION_FAILED",
        message: error instanceof Error ? error.message : "Failed to create permission",
      });
    }
  };
  
  updatePermission = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const permission = await this.roleService.updatePermission(id, req.body);
      sendSuccess(res, permission);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_PERMISSION_FAILED",
        message: error instanceof Error ? error.message : "Failed to update permission",
      });
    }
  };
  
  deletePermission = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.roleService.deletePermission(id);
      sendSuccess(res, { message: "Permission deleted successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "DELETE_PERMISSION_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete permission",
      });
    }
  };
  
  assignPermissionToRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { permissionId } = req.body;
      
      const rolePermission = await this.roleService.assignPermissionToRole(id, permissionId);
      sendSuccess(res, rolePermission, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "ASSIGN_PERMISSION_FAILED",
        message: error instanceof Error ? error.message : "Failed to assign permission",
      });
    }
  };
  
  removePermissionFromRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { permissionId } = req.body;
      
      await this.roleService.removePermissionFromRole(id, permissionId);
      sendSuccess(res, { message: "Permission removed successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "REMOVE_PERMISSION_FAILED",
        message: error instanceof Error ? error.message : "Failed to remove permission",
      });
    }
  };
  
  getRolePermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const permissions = await this.roleService.getRolePermissions(id);
      sendSuccess(res, permissions);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_ROLE_PERMISSIONS_FAILED",
        message: error instanceof Error ? error.message : "Failed to get role permissions",
      });
    }
  };
}
