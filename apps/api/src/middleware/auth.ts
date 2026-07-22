import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { sendError } from "../lib/response";
import { prisma } from "../lib/prisma";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = req.cookies?.accessToken || authHeader?.replace("Bearer ", "");
    
    if (!token) {
      sendError(res, 401, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
      return;
    }
    
    const payload = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        status: true,
        deletedAt: true,
        sessionVersion: true,
        userRoles: {
          where: { deletedAt: null },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!user || user.deletedAt || user.status !== "active") {
      sendError(res, 401, {
        code: "UNAUTHORIZED",
        message: "Invalid user or account inactive",
      });
      return;
    }

    if ((payload.sessionVersion ?? 0) !== user.sessionVersion) {
      sendError(res, 401, {
        code: "SESSION_EXPIRED",
        message: "Session expired. Please sign in again.",
      });
      return;
    }
    
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions
        .filter((rp) => rp.permission.isActive)
        .map((rp) => rp.permission.code),
    );
    
    req.user = {
      ...payload,
      permissions: Array.from(new Set(permissions)),
    };
    
    next();
  } catch (error) {
    sendError(res, 401, {
      code: "UNAUTHORIZED",
      message: error instanceof Error ? error.message : "Authentication failed",
    });
  }
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = req.cookies?.accessToken || authHeader?.replace("Bearer ", "");
  
  if (!token) {
    next();
    return;
  }
  
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      ...payload,
      permissions: [],
    };
  } catch (error) {
  }
  
  next();
}
