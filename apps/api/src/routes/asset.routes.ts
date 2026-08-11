import { Router } from "express";
import { AssetController } from "../controllers/asset.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createAssetSchema,
  updateAssetSchema,
  assignAssetToEmployeeSchema,
  returnAssetSchema,
  updateAssetStatusSchema,
  listAssetHistoryQuerySchema,
} from "../schemas/phase3.schema";
import { listAssetsQuerySchema } from "../schemas/phase2.schema";

const assetRouter = Router();
const controller = new AssetController();

assetRouter.post(
  "/",
  requireAuth,
  requirePermission("asset.create"),
  validate(createAssetSchema),
  controller.createAsset
);

assetRouter.put(
  "/:id",
  requireAuth,
  requirePermission("asset.update"),
  validate(updateAssetSchema),
  controller.updateAsset
);

assetRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("asset.delete"),
  controller.deleteAsset
);

assetRouter.post(
  "/:id/assign",
  requireAuth,
  requirePermission("asset.manage"),
  validate(assignAssetToEmployeeSchema),
  controller.assignAsset
);

assetRouter.post(
  "/:id/return",
  requireAuth,
  requirePermission("asset.manage"),
  validate(returnAssetSchema),
  controller.returnAsset
);

assetRouter.patch(
  "/:id/status",
  requireAuth,
  requirePermission("asset.manage"),
  validate(updateAssetStatusSchema),
  controller.updateAssetStatus
);

assetRouter.get(
  "/:id",
  requireAuth,
  requirePermission("asset.read"),
  controller.getAsset
);

assetRouter.get(
  "/",
  requireAuth,
  requirePermission("asset.read"),
  validate(listAssetsQuerySchema, "query"),
  controller.listAssets
);

assetRouter.get(
  "/:id/history",
  requireAuth,
  requirePermission("asset.read"),
  controller.getAssetHistory
);

assetRouter.get(
  "/history/all",
  requireAuth,
  requirePermission("asset.read"),
  validate(listAssetHistoryQuerySchema, "query"),
  controller.listAssetHistory
);

assetRouter.get(
  "/employee/:employeeId",
  requireAuth,
  requirePermission("asset.read"),
  controller.getEmployeeAssets
);

assetRouter.get(
  "/stats/summary",
  requireAuth,
  requirePermission("asset.read"),
  controller.getAssetStats
);

export { assetRouter };
