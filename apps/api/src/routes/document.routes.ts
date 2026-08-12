import { Router } from "express";
import { DocumentController } from "../controllers/document.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  addDocumentVersionSchema,
  createDocumentCategorySchema,
  createDocumentSchema,
  listDocumentsQuerySchema,
  setDocumentPermissionsSchema,
  updateDocumentCategorySchema,
} from "../schemas/document.schema";

const documentRouter = Router();
const controller = new DocumentController();

documentRouter.get(
  "/categories",
  requireAuth,
  requirePermission("document.read"),
  controller.listCategories,
);

documentRouter.post(
  "/categories",
  requireAuth,
  requirePermission("document.manage"),
  validate(createDocumentCategorySchema),
  controller.createCategory,
);

documentRouter.patch(
  "/categories/:id",
  requireAuth,
  requirePermission("document.manage"),
  validate(updateDocumentCategorySchema),
  controller.updateCategory,
);

documentRouter.delete(
  "/categories/:id",
  requireAuth,
  requirePermission("document.manage"),
  controller.deleteCategory,
);

documentRouter.get(
  "/",
  requireAuth,
  requirePermission("document.read"),
  validate(listDocumentsQuerySchema, "query"),
  controller.list,
);

documentRouter.post(
  "/",
  requireAuth,
  requirePermission("document.create"),
  validate(createDocumentSchema),
  controller.create,
);

documentRouter.get(
  "/:id",
  requireAuth,
  requirePermission("document.read"),
  controller.getById,
);

documentRouter.post(
  "/:id/versions",
  requireAuth,
  requirePermission("document.update"),
  validate(addDocumentVersionSchema),
  controller.addVersion,
);

documentRouter.put(
  "/:id/permissions",
  requireAuth,
  requirePermission("document.manage"),
  validate(setDocumentPermissionsSchema),
  controller.setPermissions,
);

documentRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("document.delete"),
  controller.delete,
);

export { documentRouter };
