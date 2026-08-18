import type { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { sendSuccess, sendError } from "../lib/response";
import { toClientError } from "../lib/app-error";
import { paginationMeta, resolveOptionalPagination } from "../lib/pagination";

export class UserController {
  private userService: UserService;
  
  constructor() {
    this.userService = new UserService();
  }
  
  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        departmentId,
        officeId,
        employeeTypeId,
        employmentStatusId,
        status,
        search,
        includeDeleted,
        page,
        pageSize,
      } = req.query as {
        departmentId?: string;
        officeId?: string;
        employeeTypeId?: string;
        employmentStatusId?: string;
        status?: string;
        search?: string;
        includeDeleted?: boolean;
        page?: number;
        pageSize?: number;
      };
      const pagination = resolveOptionalPagination({ page, pageSize });
      const result = await this.userService.getAllUsers(
        {
          departmentId,
          officeId,
          employeeTypeId,
          employmentStatusId,
          status,
          search,
          includeDeleted,
          pagination: pagination ?? undefined,
        },
        req.user?.userId,
      );
      sendSuccess(
        res,
        result.rows,
        200,
        pagination ? paginationMeta(pagination, result.total) : null,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get users";
      const statusCode = message.includes("Super Administrators") ? 403 : 500;
      sendError(res, statusCode, {
        code: statusCode === 403 ? "FORBIDDEN" : "GET_USERS_FAILED",
        message,
      });
    }
  };
  
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id, req.user?.userId);
      sendSuccess(res, user);
    } catch (error) {
      const clientError = toClientError(error);
      const message = error instanceof Error ? error.message : "User not found";
      const statusCode =
        clientError.code === "EMPLOYEE_SCOPE_FORBIDDEN"
          ? 403
          : message === "User not found"
            ? 404
            : clientError.statusCode;
      sendError(res, statusCode, {
        code:
          clientError.code !== "OPERATION_FAILED"
            ? clientError.code
            : statusCode === 404
              ? "USER_NOT_FOUND"
              : "GET_USER_FAILED",
        message: clientError.message !== "Operation failed" ? clientError.message : message,
      });
    }
  };

  getNextEmployeeId = async (_req: Request, res: Response): Promise<void> => {
    try {
      const employeeId = await this.userService.getNextEmployeeId();
      sendSuccess(res, { employeeId });
    } catch (error) {
      sendError(res, 500, {
        code: "NEXT_EMPLOYEE_ID_FAILED",
        message: error instanceof Error ? error.message : "Failed to generate employee ID",
      });
    }
  };
  
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.userService.createUser(req.body);
      sendSuccess(res, user, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_USER_FAILED",
        message: toClientError(error).message,
      });
    }
  };
  
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.updateUser(id, req.body);
      sendSuccess(res, user);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "UPDATE_USER_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };
  
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);
      sendSuccess(res, { message: "User deleted successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "DELETE_USER_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete user",
      });
    }
  };
  
  assignRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { roleId } = req.body;
      const assignedBy = req.user?.userId;
      
      const userRole = await this.userService.assignRole(id, roleId, assignedBy);
      sendSuccess(res, userRole, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "ASSIGN_ROLE_FAILED",
        message: error instanceof Error ? error.message : "Failed to assign role",
      });
    }
  };
  
  removeRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { roleId } = req.body;
      
      await this.userService.removeRole(id, roleId);
      sendSuccess(res, { message: "Role removed successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "REMOVE_ROLE_FAILED",
        message: error instanceof Error ? error.message : "Failed to remove role",
      });
    }
  };
  
  getUserRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const roles = await this.userService.getUserRoles(id);
      sendSuccess(res, roles);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_USER_ROLES_FAILED",
        message: error instanceof Error ? error.message : "Failed to get user roles",
      });
    }
  };

  revokeSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.userService.revokeUserSessions(id);
      sendSuccess(res, { message: "All user sessions revoked" });
    } catch (error) {
      sendError(res, 404, {
        code: "REVOKE_SESSIONS_FAILED",
        message: error instanceof Error ? error.message : "Failed to revoke sessions",
      });
    }
  };
}
