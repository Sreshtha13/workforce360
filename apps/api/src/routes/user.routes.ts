import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import {
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
  removeRoleSchema,
} from "../schemas/user.schema";

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, blocked, deleted]
 *         description: Filter by user status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or employee ID
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires user.read)
 */
router.get("/", requireAuth, requirePermission("user.read"), userController.getUsers);

/**
 * @swagger
 * /api/users/next-employee-id:
 *   get:
 *     summary: Get the next auto-generated employee ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Next employee ID (e.g. EMP002)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires user.create)
 */
router.get(
  "/next-employee-id",
  requireAuth,
  requirePermission("user.create"),
  userController.getNextEmployeeId,
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User details
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires user.read)
 *       404:
 *         description: User not found
 */
router.get("/:id", requireAuth, requirePermission("user.read"), userController.getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               departmentId:
 *                 type: string
 *               designationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires user.create)
 */
router.post(
  "/",
  requireAuth,
  requirePermission("user.create"),
  validate(createUserSchema),
  userController.createUser,
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires user.update)
 *       404:
 *         description: User not found
 */
router.put(
  "/:id",
  requireAuth,
  requirePermission("user.update"),
  validate(updateUserSchema),
  userController.updateUser,
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (soft delete)
 *     tags: [Users]
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
 *         description: User deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires user.delete)
 *       404:
 *         description: User not found
 */
router.delete(
  "/:id",
  requireAuth,
  requirePermission("user.delete"),
  userController.deleteUser,
);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   get:
 *     summary: Get user's roles
 *     tags: [Users]
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
 *         description: List of user's roles
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires user.read)
 */
router.get(
  "/:id/roles",
  requireAuth,
  requirePermission("user.read"),
  userController.getUserRoles,
);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   post:
 *     summary: Assign role to user
 *     tags: [Users]
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
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *       400:
 *         description: User already has this role
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires user.assign_role)
 */
router.post(
  "/:id/roles",
  requireAuth,
  requirePermission("user.assign_role"),
  validate(assignRoleSchema),
  userController.assignRole,
);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   delete:
 *     summary: Remove role from user
 *     tags: [Users]
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
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role removed successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (requires user.assign_role)
 */
router.delete(
  "/:id/roles",
  requireAuth,
  requirePermission("user.assign_role"),
  validate(removeRoleSchema),
  userController.removeRole,
);

export { router as userRouter };
