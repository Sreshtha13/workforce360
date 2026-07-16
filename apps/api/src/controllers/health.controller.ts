import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../lib/response";
import { healthService } from "../services/health.service";

export class HealthController {
  async getHealth(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await healthService.getHealth();
      // Always 200 with status in payload so the typed client can render
      // "degraded" without treating the smoke-test as a transport failure.
      sendSuccess(res, data, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const healthController = new HealthController();
