import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../lib/response";
import { securityService } from "../services/security.service";
import type { SecurityEventQueryInput } from "../schemas/security.schema";

export class SecurityController {
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query as unknown as SecurityEventQueryInput;
      const result = await securityService.list(query);
      sendSuccess(res, result.items, 200, result.meta);
    } catch (error) {
      sendError(res, 500, {
        code: "SECURITY_EVENTS_LIST_FAILED",
        message: error instanceof Error ? error.message : "Failed to list security events",
      });
    }
  };
}
