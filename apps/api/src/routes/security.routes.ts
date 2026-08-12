import { Router } from "express";
import { SecurityController } from "../controllers/security.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { securityEventQuerySchema } from "../schemas/security.schema";

const securityRouter = Router();
const controller = new SecurityController();

securityRouter.get(
  "/",
  requireAuth,
  requirePermission("security.read"),
  validate(securityEventQuerySchema, "query"),
  controller.list,
);

export { securityRouter };
