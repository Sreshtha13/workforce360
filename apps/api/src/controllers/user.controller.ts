import type { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { sendSuccess, sendError } from "../lib/response";

export class UserController {
  private userService: UserService;
  
  constructor() {
    this.userService = new UserService();
  }
  
  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { departmentId, status, search } = req.query;
      const users = await this.userService.getAllUsers({
        departmentId: departmentId as string,
        status: status as string,
        search: search as string,
      });
      sendSuccess(res, users);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_USERS_FAILED",
        message: error instanceof Error ? error.message : "Failed to get users",
      });
    }
  };
  
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      sendSuccess(res, user);
    } catch (error) {
      sendError(res, 404, {
        code: "USER_NOT_FOUND",
        message: error instanceof Error ? error.message : "User not found",
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
        message: error instanceof Error ? error.message : "Failed to create user",
      });
    }
  };
  
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.updateUser(id, req.body);
      sendSuccess(res, user);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_USER_FAILED",
        message: error instanceof Error ? error.message : "Failed to update user",
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
