import { Router } from "express";
import { IntegrationController } from "../controllers/integration.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";

const router = Router();
const controller = new IntegrationController();

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),
});

router.get(
  "/webhooks",
  requireAuth,
  requirePermission("settings.manage"),
  controller.listWebhookSubscriptions,
);

router.post(
  "/webhooks",
  requireAuth,
  requirePermission("settings.manage"),
  validate(createWebhookSchema),
  controller.createWebhookSubscription,
);

router.delete(
  "/webhooks/:id",
  requireAuth,
  requirePermission("settings.manage"),
  controller.deleteWebhookSubscription,
);

export { router as integrationRouter };
