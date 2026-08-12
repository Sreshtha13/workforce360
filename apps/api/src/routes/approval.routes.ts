import { Router } from "express";
import { ApprovalController } from "../controllers/approval.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createApprovalRequestSchema,
  approveRequestSchema,
  rejectRequestSchema,
  cancelApprovalRequestSchema,
  listApprovalRequestsQuerySchema,
} from "../schemas/phase3.schema";

const approvalRouter = Router();
const controller = new ApprovalController();

approvalRouter.post(
  "/",
  requireAuth,
  requirePermission("approval.create"),
  validate(createApprovalRequestSchema),
  controller.createApprovalRequest
);

approvalRouter.post(
  "/:id/approve",
  requireAuth,
  validate(approveRequestSchema),
  controller.approveRequest
);

approvalRouter.post(
  "/:id/reject",
  requireAuth,
  validate(rejectRequestSchema),
  controller.rejectRequest
);

approvalRouter.post(
  "/:id/cancel",
  requireAuth,
  validate(cancelApprovalRequestSchema),
  controller.cancelApprovalRequest
);

approvalRouter.get(
  "/:id",
  requireAuth,
  controller.getApprovalRequest
);

approvalRouter.get(
  "/",
  requireAuth,
  validate(listApprovalRequestsQuerySchema, "query"),
  controller.listApprovalRequests
);

approvalRouter.get(
  "/pending/my",
  requireAuth,
  controller.getPendingApprovals
);

approvalRouter.get(
  "/stats/my",
  requireAuth,
  controller.getApprovalStats
);

export { approvalRouter };
