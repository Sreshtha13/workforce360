import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createTemplateSchema,
  updateTemplateSchema,
  upsertSettingsSchema,
} from "../schemas/settings.schema";

const settingsRouter = Router();
const templateRouter = Router();
const adminExtrasRouter = Router();
const controller = new SettingsController();

settingsRouter.get(
  "/",
  requireAuth,
  requirePermission("settings.manage"),
  controller.listSettings,
);

settingsRouter.put(
  "/",
  requireAuth,
  requirePermission("settings.manage"),
  validate(upsertSettingsSchema),
  controller.upsertSettings,
);

templateRouter.get(
  "/",
  requireAuth,
  requirePermission("template.manage"),
  controller.listTemplates,
);

templateRouter.post(
  "/",
  requireAuth,
  requirePermission("template.manage"),
  validate(createTemplateSchema),
  controller.createTemplate,
);

templateRouter.patch(
  "/:id",
  requireAuth,
  requirePermission("template.manage"),
  validate(updateTemplateSchema),
  controller.updateTemplate,
);

templateRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("template.manage"),
  controller.deleteTemplate,
);

adminExtrasRouter.get(
  "/master-data",
  requireAuth,
  requirePermission("settings.manage", "dashboard.read"),
  controller.masterDataSummary,
);

adminExtrasRouter.get(
  "/integrations",
  requireAuth,
  requirePermission("settings.manage", "dashboard.read"),
  controller.listIntegrations,
);

export { settingsRouter, templateRouter, adminExtrasRouter };
