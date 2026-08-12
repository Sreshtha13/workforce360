import { Router } from "express";
import { HelpdeskController } from "../controllers/helpdesk.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createKbArticleSchema,
  helpdeskAssignSchema,
  helpdeskEscalateSchema,
  helpdeskReplySchema,
  helpdeskStatusSchema,
  updateKbArticleSchema,
  upsertSlaPolicySchema,
} from "../schemas/helpdesk.schema";

const helpdeskRouter = Router();
const controller = new HelpdeskController();

helpdeskRouter.get(
  "/tickets",
  requireAuth,
  requirePermission("ticket.manage"),
  controller.listTickets,
);

helpdeskRouter.get(
  "/tickets/:id",
  requireAuth,
  requirePermission("ticket.manage"),
  controller.getTicket,
);

helpdeskRouter.post(
  "/tickets/:id/assign",
  requireAuth,
  requirePermission("ticket.manage"),
  validate(helpdeskAssignSchema),
  controller.assignTicket,
);

helpdeskRouter.post(
  "/tickets/:id/status",
  requireAuth,
  requirePermission("ticket.manage"),
  validate(helpdeskStatusSchema),
  controller.updateStatus,
);

helpdeskRouter.post(
  "/tickets/:id/reply",
  requireAuth,
  requirePermission("ticket.manage"),
  validate(helpdeskReplySchema),
  controller.reply,
);

helpdeskRouter.post(
  "/tickets/:id/escalate",
  requireAuth,
  requirePermission("ticket.manage"),
  validate(helpdeskEscalateSchema),
  controller.escalate,
);

helpdeskRouter.get(
  "/sla",
  requireAuth,
  requirePermission("ticket.manage"),
  controller.listSla,
);

helpdeskRouter.put(
  "/sla",
  requireAuth,
  requirePermission("ticket.manage"),
  validate(upsertSlaPolicySchema),
  controller.upsertSla,
);

helpdeskRouter.get("/kb", requireAuth, controller.listKb);
helpdeskRouter.get("/kb/:id", requireAuth, controller.getKb);

helpdeskRouter.post(
  "/kb",
  requireAuth,
  requirePermission("ticket.manage"),
  validate(createKbArticleSchema),
  controller.createKb,
);

helpdeskRouter.patch(
  "/kb/:id",
  requireAuth,
  requirePermission("ticket.manage"),
  validate(updateKbArticleSchema),
  controller.updateKb,
);

helpdeskRouter.delete(
  "/kb/:id",
  requireAuth,
  requirePermission("ticket.manage"),
  controller.deleteKb,
);

export { helpdeskRouter };
