import type { Request, Response, NextFunction } from "express";
import { sendError } from "../lib/response";

export function requireSelfOrPermission(permission: string, paramName = "id") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const targetId = req.params[paramName];
    const requesterId = req.user?.userId;
    const permissions = req.user?.permissions ?? [];

    if (requesterId === targetId || permissions.includes(permission)) {
      next();
      return;
    }

    sendError(res, 403, {
      code: "FORBIDDEN",
      message: "You do not have permission to access this resource",
    });
  };
}

export function requireAnyPermission(...permissionList: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const permissions = req.user?.permissions ?? [];
    if (permissionList.some((p) => permissions.includes(p))) {
      next();
      return;
    }

    sendError(res, 403, {
      code: "FORBIDDEN",
      message: "Insufficient permissions",
    });
  };
}
