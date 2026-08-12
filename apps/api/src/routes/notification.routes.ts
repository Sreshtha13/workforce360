import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createAnnouncementSchema,
  listNotificationsQuerySchema,
  updateAnnouncementSchema,
  updatePreferenceSchema,
} from "../schemas/notification.schema";

const notificationRouter = Router();
const controller = new NotificationController();

notificationRouter.get(
  "/",
  requireAuth,
  validate(listNotificationsQuerySchema, "query"),
  controller.list,
);

notificationRouter.get("/unread-count", requireAuth, controller.unreadCount);

notificationRouter.post("/read-all", requireAuth, controller.markAllRead);

notificationRouter.get("/preferences", requireAuth, controller.getPreferences);

notificationRouter.put(
  "/preferences",
  requireAuth,
  validate(updatePreferenceSchema),
  controller.updatePreference,
);

notificationRouter.get("/announcements", requireAuth, controller.listAnnouncements);

notificationRouter.post(
  "/announcements",
  requireAuth,
  requirePermission("announcement.manage"),
  validate(createAnnouncementSchema),
  controller.createAnnouncement,
);

notificationRouter.patch(
  "/announcements/:id",
  requireAuth,
  requirePermission("announcement.manage"),
  validate(updateAnnouncementSchema),
  controller.updateAnnouncement,
);

notificationRouter.post(
  "/announcements/:id/publish",
  requireAuth,
  requirePermission("announcement.manage"),
  controller.publishAnnouncement,
);

notificationRouter.delete(
  "/announcements/:id",
  requireAuth,
  requirePermission("announcement.manage"),
  controller.deleteAnnouncement,
);

notificationRouter.post("/:id/read", requireAuth, controller.markRead);

export { notificationRouter };
