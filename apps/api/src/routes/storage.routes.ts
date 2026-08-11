import { Router } from "express";
import { StorageController } from "../controllers/storage.controller";
import { requireAuth } from "../middleware/auth";
import { requireStoragePurposePermission } from "../middleware/storage-rbac";
import { validate } from "../middleware/validate";
import { presignUploadSchema, confirmUploadSchema } from "../schemas/phase2.schema";

const router = Router();
const controller = new StorageController();

router.post(
  "/presign",
  requireAuth,
  validate(presignUploadSchema),
  requireStoragePurposePermission,
  controller.presignUpload,
);

router.post(
  "/confirm",
  requireAuth,
  validate(confirmUploadSchema),
  requireStoragePurposePermission,
  controller.confirmUpload,
);

export { router as storageRouter };
