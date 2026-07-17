import { Router } from "express";
import { RoleController } from "../controllers/role.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  updatePermissionSchema,
  assignPermissionSchema,
  removePermissionSchema,
} from "../schemas/role.schema";

const router = Router();
const roleController = new RoleController();

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
router.get("/", requireAuth, roleController.getRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
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
 *         description: Role details with permissions
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Role not found
 */
router.get("/:id", requireAuth, roleController.getRoleById);

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

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   get:
 *     summary: Get role's permissions
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
 *         description: List of role's permissions
 *       401:
 *         description: Not authenticated
 */
router.get(
  "/:id/permissions",
  requireAuth,
  roleController.getRolePermissions,
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

/**
 * @swagger
 * /api/roles/permissions/all:
 *   get:
 *     summary: List all permissions
 *     tags: [Roles]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all available permissions
 *       401:
 *         description: Not authenticated
 */
router.get("/permissions/all", requireAuth, roleController.getPermissions);

/**
 * @swagger
 * /api/roles/permissions/{id}:
 *   get:
 *     summary: Get permission by ID
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
 *         description: Permission details
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Permission not found
 */
router.get("/permissions/:id", requireAuth, roleController.getPermissionById);

/**
 * @swagger
 * /api/roles/permissions:
 *   post:
 *     summary: Create new permission
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
 *               - code
 *               - resource
 *               - action
 *             properties:
 *               name:
 *                 type: string
 *                 example: Read Projects
 *               code:
 *                 type: string
 *                 example: project.read
 *               resource:
 *                 type: string
 *                 example: project
 *               action:
 *                 type: string
 *                 example: read
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires permission.create)
 */
router.post(
  "/permissions",
  requireAuth,
  requirePermission("permission.create"),
  validate(createPermissionSchema),
  roleController.createPermission,
);

/**
 * @swagger
 * /api/roles/permissions/{id}:
 *   put:
 *     summary: Update permission
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
 *         description: Permission updated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires permission.update)
 */
router.put(
  "/permissions/:id",
  requireAuth,
  requirePermission("permission.update"),
  validate(updatePermissionSchema),
  roleController.updatePermission,
);

/**
 * @swagger
 * /api/roles/permissions/{id}:
 *   delete:
 *     summary: Delete permission
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
 *         description: Permission deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires permission.delete)
 */
router.delete(
  "/permissions/:id",
  requireAuth,
  requirePermission("permission.delete"),
  roleController.deletePermission,
);

export { router as roleRouter };
