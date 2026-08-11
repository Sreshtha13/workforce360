import { Router } from "express";
import { PortalController } from "../controllers/hr.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { updatePortalProfileSchema, createTicketSchema, ticketReplySchema } from "../schemas/phase2.schema";

const router = Router();
const controller = new PortalController();

router.get(
  "/dashboard",
  requireAuth,
  requirePermission("portal.read"),
  controller.getDashboard,
);
router.get(
  "/profile",
  requireAuth,
  requirePermission("portal.read"),
  controller.getProfile,
);
router.patch(
  "/profile",
  requireAuth,
  requirePermission("portal.update"),
  validate(updatePortalProfileSchema),
  controller.updateProfile,
);

router.get(
  "/notifications",
  requireAuth,
  requirePermission("portal.read"),
  controller.listNotifications,
);
router.post(
  "/notifications/:id/read",
  requireAuth,
  requirePermission("portal.read"),
  controller.markNotificationRead,
);

router.get(
  "/tickets",
  requireAuth,
  requirePermission("ticket.create", "portal.read"),
  controller.listTickets,
);
router.get(
  "/tickets/:id",
  requireAuth,
  requirePermission("ticket.create", "portal.read"),
  controller.getTicket,
);
router.post(
  "/tickets",
  requireAuth,
  requirePermission("ticket.create", "portal.read"),
  validate(createTicketSchema),
  controller.createTicket,
);
router.post(
  "/tickets/:id/replies",
  requireAuth,
  requirePermission("ticket.create", "portal.read"),
  validate(ticketReplySchema),
  controller.replyToTicket,
);

router.get(
  "/assets",
  requireAuth,
  requirePermission("portal.read"),
  controller.listMyAssets,
);
router.get(
  "/policies",
  requireAuth,
  requirePermission("portal.read"),
  controller.listPolicies,
);
router.post(
  "/policies/:id/acknowledge",
  requireAuth,
  requirePermission("portal.read"),
  controller.acknowledgePolicy,
);

export { router as portalRouter };
