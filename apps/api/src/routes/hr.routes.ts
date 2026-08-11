import { Router } from "express";
import { HrController } from "../controllers/hr.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  listEmployeesQuerySchema,
  lifecycleUpdateSchema,
  listInterviewsQuerySchema,
  listOffersQuerySchema,
  listPoliciesQuerySchema,
  createPolicySchema,
  updatePolicySchema,
  assignPolicySchema,
  listAssetsQuerySchema,
  createAssetSchema,
  assignAssetSchema,
  listTicketsQuerySchema,
  assignTicketSchema,
  updateTicketStatusSchema,
  ticketReplySchema,
} from "../schemas/phase2.schema";

const router = Router();
const controller = new HrController();

router.get(
  "/dashboard",
  requireAuth,
  requirePermission("hr.dashboard.read"),
  controller.getDashboard,
);

router.get(
  "/employees",
  requireAuth,
  requirePermission("employee.read"),
  validate(listEmployeesQuerySchema, "query"),
  controller.listEmployees,
);
router.get(
  "/employees/:id",
  requireAuth,
  requirePermission("employee.read"),
  controller.getEmployee,
);
router.patch(
  "/employees/:id/lifecycle",
  requireAuth,
  requirePermission("employee.update"),
  validate(lifecycleUpdateSchema),
  controller.updateLifecycle,
);

router.get(
  "/interviews",
  requireAuth,
  requirePermission("interview.read"),
  validate(listInterviewsQuerySchema, "query"),
  controller.listInterviews,
);
router.get(
  "/offers",
  requireAuth,
  requirePermission("offer.read"),
  validate(listOffersQuerySchema, "query"),
  controller.listOffers,
);

router.get(
  "/policies",
  requireAuth,
  requirePermission("policy.read"),
  validate(listPoliciesQuerySchema, "query"),
  controller.listPolicies,
);
router.get(
  "/policies/:id",
  requireAuth,
  requirePermission("policy.read"),
  controller.getPolicyById,
);
router.post(
  "/policies",
  requireAuth,
  requirePermission("policy.create"),
  validate(createPolicySchema),
  controller.createPolicy,
);
router.put(
  "/policies/:id",
  requireAuth,
  requirePermission("policy.update"),
  validate(updatePolicySchema),
  controller.updatePolicy,
);
router.post(
  "/policies/:id/publish",
  requireAuth,
  requirePermission("policy.update"),
  controller.publishPolicy,
);
router.post(
  "/policies/:id/versions",
  requireAuth,
  requirePermission("policy.create"),
  controller.createPolicyVersion,
);
router.get(
  "/policies/:id/acknowledgements",
  requireAuth,
  requirePermission("policy.read"),
  controller.getPolicyAcknowledgements,
);
router.get(
  "/policy-families/:familyId/assignments",
  requireAuth,
  requirePermission("policy.read"),
  controller.listPolicyAssignments,
);
router.post(
  "/policy-assignments",
  requireAuth,
  requirePermission("policy.update"),
  validate(assignPolicySchema),
  controller.assignPolicy,
);
router.delete(
  "/policy-assignments/:assignmentId",
  requireAuth,
  requirePermission("policy.update"),
  controller.removePolicyAssignment,
);

router.get(
  "/assets",
  requireAuth,
  requirePermission("asset.read"),
  validate(listAssetsQuerySchema, "query"),
  controller.listAssets,
);
router.post(
  "/assets",
  requireAuth,
  requirePermission("asset.create"),
  validate(createAssetSchema),
  controller.createAsset,
);
router.post(
  "/assets/:id/assign",
  requireAuth,
  requirePermission("asset.update"),
  validate(assignAssetSchema),
  controller.assignAsset,
);

router.get(
  "/tickets",
  requireAuth,
  requirePermission("ticket.read"),
  validate(listTicketsQuerySchema, "query"),
  controller.listTickets,
);
router.get(
  "/tickets/:id",
  requireAuth,
  requirePermission("ticket.read"),
  controller.getTicket,
);
router.post(
  "/tickets/:id/assign",
  requireAuth,
  requirePermission("ticket.manage"),
  validate(assignTicketSchema),
  controller.assignTicket,
);
router.patch(
  "/tickets/:id/status",
  requireAuth,
  requirePermission("ticket.manage"),
  validate(updateTicketStatusSchema),
  controller.updateTicketStatus,
);
router.post(
  "/tickets/:id/replies",
  requireAuth,
  requirePermission("ticket.manage"),
  validate(ticketReplySchema),
  controller.replyToTicket,
);

export { router as hrRouter };
