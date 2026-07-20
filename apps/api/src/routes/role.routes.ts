import { Router } from "express";
import { RoleController } from "../controllers/role.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import {
  createRoleSchema,
  updateRoleSchema,
  duplicateRoleSchema,
  createPermissionSchema,
  updatePermissionSchema,
  assignPermissionSchema,
  removePermissionSchema,
  setRolePermissionsSchema,
} from "../schemas/role.schema";

const router = Router();
const roleController = new RoleController();

const canReadRoles = requirePermission("role.read", "role.create", "role.update", "role.delete");
const canReadPermissions = requirePermission(
  "permission.read",
  "permission.create",
  "permission.update",
  "permission.delete",
  "role.update",
);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: List all roles
 *     tags: [Roles]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of roles with user counts
 *       401:
 *         description: Not authenticated
 */
router.get("/", requireAuth, canReadRoles, roleController.getRoles);

router.get("/permissions/all", requireAuth, canReadPermissions, roleController.getPermissions);

router.post(
  "/permissions",
  requireAuth,
  requirePermission("permission.create"),
  validate(createPermissionSchema),
  roleController.createPermission,
);

router.get("/permissions/:id", requireAuth, canReadPermissions, roleController.getPermissionById);

router.put(
  "/permissions/:id",
  requireAuth,
  requirePermission("permission.update"),
  validate(updatePermissionSchema),
  roleController.updatePermission,
);

router.delete(
  "/permissions/:id",
  requireAuth,
  requirePermission("permission.delete"),
  roleController.deletePermission,
);

router.get("/:id", requireAuth, canReadRoles, roleController.getRoleById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create new role
 *     tags: [Roles]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Project Manager
 *               code:
 *                 type: string
 *                 example: project_manager
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires role.create)
 */
router.post(
  "/",
  requireAuth,
  requirePermission("role.create"),
  validate(createRoleSchema),
  roleController.createRole,
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires role.update)
 */
router.put(
  "/:id",
  requireAuth,
  requirePermission("role.update"),
  validate(updateRoleSchema),
  roleController.updateRole,
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires role.delete)
 */
router.delete(
  "/:id",
  requireAuth,
  requirePermission("role.delete"),
  roleController.deleteRole,
);

router.post(
  "/:id/duplicate",
  requireAuth,
  requirePermission("role.create"),
  validate(duplicateRoleSchema),
  roleController.duplicateRole,
);

router.get(
  "/:id/permissions",
  requireAuth,
  canReadRoles,
  roleController.getRolePermissions,
);

router.put(
  "/:id/permissions/bulk",
  requireAuth,
  requirePermission("role.update"),
  validate(setRolePermissionsSchema),
  roleController.setRolePermissions,
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   post:
 *     summary: Assign permission to role
 *     tags: [Roles]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionId
 *             properties:
 *               permissionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permission assigned successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires role.update)
 */
router.post(
  "/:id/permissions",
  requireAuth,
  requirePermission("role.update"),
  validate(assignPermissionSchema),
  roleController.assignPermissionToRole,
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   delete:
 *     summary: Remove permission from role
 *     tags: [Roles]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionId
 *             properties:
 *               permissionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission removed successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires role.update)
 */
router.delete(
  "/:id/permissions",
  requireAuth,
  requirePermission("role.update"),
  validate(removePermissionSchema),
  roleController.removePermissionFromRole,
);

export { router as roleRouter };
