import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

router.get(
  "/",
  requireAuth,
  requirePermission("user.read"),
  dashboardController.getAdminDashboard,
);

router.get(
  "/employees",
  requireAuth,
  requirePermission("user.read"),
  dashboardController.listActiveEmployees,
);

router.get(
  "/search",
  requireAuth,
  requirePermission("user.read"),
  dashboardController.search,
);

export { router as dashboardRouter };
