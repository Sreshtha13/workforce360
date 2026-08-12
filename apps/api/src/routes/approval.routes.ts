import { Router } from "express";
import { ApprovalController } from "../controllers/approval.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  approveRequestSchema,
  cancelApprovalRequestSchema,
  createApprovalRequestSchema,
  createDelegationSchema,
  createFromWorkflowSchema,
  createWorkflowSchema,
  listApprovalRequestsQuerySchema,
  rejectRequestSchema,
  updateDelegationSchema,
  updateWorkflowSchema,
} from "../schemas/approval.schema";

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
  "/from-workflow",
  requireAuth,
  requirePermission("approval.create"),
  validate(createFromWorkflowSchema),
  controller.createFromWorkflow
);

approvalRouter.post(
  "/process-escalations",
  requireAuth,
  requirePermission("approval.manage"),
  controller.processEscalations
);

approvalRouter.get(
  "/workflows",
  requireAuth,
  requirePermission("approval.read"),
  controller.listWorkflows
);

approvalRouter.post(
  "/workflows",
  requireAuth,
  requirePermission("approval.manage"),
  validate(createWorkflowSchema),
  controller.createWorkflow
);

approvalRouter.get(
  "/workflows/:id",
  requireAuth,
  requirePermission("approval.read"),
  controller.getWorkflow
);

approvalRouter.patch(
  "/workflows/:id",
  requireAuth,
  requirePermission("approval.manage"),
  validate(updateWorkflowSchema),
  controller.updateWorkflow
);

approvalRouter.delete(
  "/workflows/:id",
  requireAuth,
  requirePermission("approval.manage"),
  controller.deleteWorkflow
);

approvalRouter.get(
  "/delegations",
  requireAuth,
  requirePermission("approval.delegate"),
  controller.listDelegations
);

approvalRouter.post(
  "/delegations",
  requireAuth,
  requirePermission("approval.delegate"),
  validate(createDelegationSchema),
  controller.createDelegation
);

approvalRouter.patch(
  "/delegations/:id",
  requireAuth,
  requirePermission("approval.delegate"),
  validate(updateDelegationSchema),
  controller.updateDelegation
);

approvalRouter.delete(
  "/delegations/:id",
  requireAuth,
  requirePermission("approval.delegate"),
  controller.deleteDelegation
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
  "/:id/history",
  requireAuth,
  controller.getHistory
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

export { approvalRouter };
