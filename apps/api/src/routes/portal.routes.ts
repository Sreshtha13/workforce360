import { Router } from "express";
import { PortalController } from "../controllers/hr.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { updatePortalProfileSchema, createTicketSchema } from "../schemas/phase2.schema";

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
  requirePermission("portal.read"),
  controller.listTickets,
);
router.post(
  "/tickets",
  requireAuth,
  requirePermission("portal.read"),
  validate(createTicketSchema),
  controller.createTicket,
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

export { router as portalRouter };
