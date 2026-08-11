import type { Request, Response, NextFunction } from "express";
import { sendError } from "../lib/response";

/**
 * Maps upload purpose → permissions that may create that file type.
 * Any one matching permission is enough (OR).
 */
export const STORAGE_PURPOSE_PERMISSIONS: Record<string, string[]> = {
  RESUME: ["portal.read", "portal.update", "candidate.update", "application.update"],
  POLICY: ["policy.create", "policy.update"],
  OFFER_LETTER: ["offer.create", "offer.update"],
  DOCUMENT: ["portal.read", "portal.update", "employee.update", "user.update"],
  OTHER: [
    "portal.read",
    "ticket.create",
    "ticket.manage",
    "policy.create",
    "asset.create",
    "application.update",
  ],
};

/**
 * Enforces purpose-scoped RBAC on storage upload endpoints.
 * Must run after requireAuth + Zod validation (body.purpose present).
 */
export function requireStoragePurposePermission(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    sendError(res, 401, {
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
    return;
  }

  const purpose = (req.body as { purpose?: string } | undefined)?.purpose;
  if (!purpose) {
    sendError(res, 400, {
      code: "PURPOSE_REQUIRED",
      message: "Upload purpose is required",
    });
    return;
  }

  const required = STORAGE_PURPOSE_PERMISSIONS[purpose];
  if (!required) {
    sendError(res, 400, {
      code: "INVALID_PURPOSE",
      message: `Unsupported upload purpose: ${purpose}`,
    });
    return;
  }

  const actual = req.user.permissions ?? [];
  if (!required.some((code) => actual.includes(code))) {
    sendError(res, 403, {
      code: "FORBIDDEN",
      message: "Insufficient permissions for this upload purpose",
      details: { required, purpose, actual },
    });
    return;
  }

  next();
}
