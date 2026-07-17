import type { Request, Response, NextFunction } from "express";
import { sendError } from "../lib/response";

export function requirePermission(
  ...permissions: string[]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }
    
    const hasPermission = permissions.some((permission) =>
      req.user!.permissions.includes(permission),
    );
    
    if (!hasPermission) {
      sendError(res, 403, {
        code: "FORBIDDEN",
        message: "Insufficient permissions",
        details: {
          required: permissions,
          actual: req.user.permissions,
        },
      });
      return;
    }
    
    next();
  };
}

export function requireAllPermissions(
  ...permissions: string[]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }
    
    const hasAllPermissions = permissions.every((permission) =>
      req.user!.permissions.includes(permission),
    );
    
    if (!hasAllPermissions) {
      sendError(res, 403, {
        code: "FORBIDDEN",
        message: "Insufficient permissions",
        details: {
          required: permissions,
          actual: req.user.permissions,
        },
      });
      return;
    }
    
    next();
  };
}
