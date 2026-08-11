import type { Request, Response } from "express";
import { RoleService } from "../services/role.service";
import { sendSuccess, sendError } from "../lib/response";
import { toClientError } from "../lib/app-error";

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
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode >= 500 ? 500 : clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "GET_ROLES_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  getRoleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.roleService.getRoleById(id);
      sendSuccess(res, role);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode === 404 ? 404 : clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "ROLE_NOT_FOUND" : clientError.code,
        message: clientError.message,
      });
    }
  };

  createRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const role = await this.roleService.createRole(req.body);
      sendSuccess(res, role, 201);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "CREATE_ROLE_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.roleService.updateRole(id, req.body);
      sendSuccess(res, role);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "UPDATE_ROLE_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  deleteRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.roleService.deleteRole(id);
      sendSuccess(res, { message: "Role deleted successfully" });
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "DELETE_ROLE_FAILED" : clientError.code,
        message: clientError.message,
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
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode === 404 ? 404 : clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "PERMISSION_NOT_FOUND" : clientError.code,
        message: clientError.message,
      });
    }
  };

  createPermission = async (req: Request, res: Response): Promise<void> => {
    try {
      const permission = await this.roleService.createPermission(req.body);
      sendSuccess(res, permission, 201);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "CREATE_PERMISSION_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  updatePermission = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const permission = await this.roleService.updatePermission(id, req.body);
      sendSuccess(res, permission);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "UPDATE_PERMISSION_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  deletePermission = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.roleService.deletePermission(id);
      sendSuccess(res, { message: "Permission deleted successfully" });
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "DELETE_PERMISSION_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  assignPermissionToRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { permissionId } = req.body;

      const rolePermission = await this.roleService.assignPermissionToRole(
        id,
        permissionId,
        req.user?.userId,
      );
      sendSuccess(res, rolePermission, 201);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "ASSIGN_PERMISSION_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  removePermissionFromRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { permissionId } = req.body;

      await this.roleService.removePermissionFromRole(id, permissionId, req.user?.userId);
      sendSuccess(res, { message: "Permission removed successfully" });
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "REMOVE_PERMISSION_FAILED" : clientError.code,
        message: clientError.message,
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

  setRolePermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body as { permissionIds: string[] };
      const permissions = await this.roleService.setRolePermissions(
        id,
        permissionIds,
        req.user?.userId,
      );
      sendSuccess(res, permissions);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code:
          clientError.code === "OPERATION_FAILED"
            ? "SET_ROLE_PERMISSIONS_FAILED"
            : clientError.code,
        message: clientError.message,
      });
    }
  };

  duplicateRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const role = await this.roleService.duplicateRole(id, req.body);
      sendSuccess(res, role, 201);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "DUPLICATE_ROLE_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };
}
