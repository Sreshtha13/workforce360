import { Router } from "express";
import { StorageController } from "../controllers/storage.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { presignUploadSchema, confirmUploadSchema } from "../schemas/phase2.schema";

const router = Router();
const controller = new StorageController();

router.post(
  "/presign",
  requireAuth,
  validate(presignUploadSchema),
  controller.presignUpload,
);

router.post(
  "/confirm",
  requireAuth,
  validate(confirmUploadSchema),
  controller.confirmUpload,
);

export { router as storageRouter };
