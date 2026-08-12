import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../lib/response";
import {
  listWebhookSubscriptions,
  createWebhookSubscription,
  deleteWebhookSubscription,
} from "../lib/webhook-dispatcher";
import { AppError } from "../lib/app-error";

export class IntegrationController {
  listWebhookSubscriptions = async (_req: Request, res: Response): Promise<void> => {
    try {
      const subs = await listWebhookSubscriptions();
      sendSuccess(res, subs);
    } catch (error) {
      sendError(res, 500, {
        code: "WEBHOOK_LIST_FAILED",
        message: error instanceof Error ? error.message : "Failed to list webhook subscriptions",
      });
    }
  };

  createWebhookSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { url, events } = req.body as { url: string; events: string[] };
      const sub = await createWebhookSubscription({ url, events });
      sendSuccess(res, sub, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "WEBHOOK_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create webhook subscription",
      });
    }
  };

  deleteWebhookSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await deleteWebhookSubscription(req.params.id);
      if (!deleted) {
        throw new AppError("WEBHOOK_NOT_FOUND", "Webhook subscription not found", 404);
      }
      sendSuccess(res, { id: req.params.id, deleted: true });
    } catch (error) {
      const status = error instanceof AppError ? error.statusCode : 500;
      sendError(res, status, {
        code: error instanceof AppError ? error.code : "WEBHOOK_DELETE_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete webhook subscription",
      });
    }
  };
}
