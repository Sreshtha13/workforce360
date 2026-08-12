import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../lib/response";
import { auditService } from "../services/audit.service";
import type { AuditLogQueryInput } from "../schemas/audit.schema";

export class AuditController {
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query as unknown as AuditLogQueryInput;
      const result = await auditService.list(query);
      sendSuccess(res, result.items, 200, result.meta);
    } catch (error) {
      sendError(res, 500, {
        code: "AUDIT_LIST_FAILED",
        message: error instanceof Error ? error.message : "Failed to list audit logs",
      });
    }
  };
}
