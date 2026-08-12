import { Router } from "express";
import { AuditController } from "../controllers/audit.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { auditLogQuerySchema } from "../schemas/audit.schema";

const auditRouter = Router();
const controller = new AuditController();

auditRouter.get(
  "/",
  requireAuth,
  requirePermission("audit.read"),
  validate(auditLogQuerySchema, "query"),
  controller.list,
);

export { auditRouter };
