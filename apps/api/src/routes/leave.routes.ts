import { Router } from "express";
import { LeaveController } from "../controllers/leave.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  initializeLeaveBalanceSchema,
  adjustLeaveBalanceSchema,
  applyLeaveSchema,
  reviewLeaveApplicationSchema,
  cancelLeaveApplicationSchema,
  listLeaveApplicationsQuerySchema,
  listLeaveBalancesQuerySchema,
} from "../schemas/phase3.schema";

const leaveRouter = Router();
const controller = new LeaveController();

leaveRouter.post(
  "/types",
  requireAuth,
  requirePermission("leave.manage"),
  validate(createLeaveTypeSchema),
  controller.createLeaveType
);

leaveRouter.put(
  "/types/:id",
  requireAuth,
  requirePermission("leave.manage"),
  validate(updateLeaveTypeSchema),
  controller.updateLeaveType
);

leaveRouter.delete(
  "/types/:id",
  requireAuth,
  requirePermission("leave.manage"),
  controller.deleteLeaveType
);

leaveRouter.get(
  "/types",
  requireAuth,
  requirePermission("leave.read"),
  controller.listLeaveTypes
);

leaveRouter.get(
  "/types/:id",
  requireAuth,
  requirePermission("leave.read"),
  controller.getLeaveType
);

leaveRouter.post(
  "/balances",
  requireAuth,
  requirePermission("leave.manage"),
  validate(initializeLeaveBalanceSchema),
  controller.initializeLeaveBalance
);

leaveRouter.put(
  "/balances/:id",
  requireAuth,
  requirePermission("leave.manage"),
  validate(adjustLeaveBalanceSchema),
  controller.adjustLeaveBalance
);

leaveRouter.get(
  "/balances",
  requireAuth,
  requirePermission("leave.read"),
  validate(listLeaveBalancesQuerySchema, "query"),
  controller.listLeaveBalances
);

leaveRouter.post(
  "/applications",
  requireAuth,
  validate(applyLeaveSchema),
  controller.applyLeave
);

leaveRouter.post(
  "/applications/:id/review",
  requireAuth,
  requirePermission("leave.approve"),
  validate(reviewLeaveApplicationSchema),
  controller.reviewLeaveApplication
);

leaveRouter.post(
  "/applications/:id/cancel",
  requireAuth,
  validate(cancelLeaveApplicationSchema),
  controller.cancelLeaveApplication
);

leaveRouter.get(
  "/applications",
  requireAuth,
  requirePermission("leave.read", "leave.approve"),
  validate(listLeaveApplicationsQuerySchema, "query"),
  controller.listLeaveApplications
);

leaveRouter.get(
  "/applications/:id",
  requireAuth,
  requirePermission("leave.read", "leave.approve"),
  controller.getLeaveApplication
);

leaveRouter.get(
  "/stats",
  requireAuth,
  requirePermission("leave.read"),
  controller.getLeaveStats
);

export { leaveRouter };
