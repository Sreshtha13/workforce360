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
  listAssetsQuerySchema,
  createAssetSchema,
  assignAssetSchema,
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
router.post(
  "/policies",
  requireAuth,
  requirePermission("policy.create"),
  validate(createPolicySchema),
  controller.createPolicy,
);
router.post(
  "/policies/:id/publish",
  requireAuth,
  requirePermission("policy.update"),
  controller.publishPolicy,
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

export { router as hrRouter };
