/**
 * Roles supplemental OpenAPI documentation.
 */

/**
 * @swagger
 * /api/roles/permissions/all:
 *   get:
 *     summary: List all permissions
 *     tags: [Roles]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Permission list
 */

/**
 * @swagger
 * /api/roles/permissions:
 *   post:
 *     summary: Create permission
 *     tags: [Roles]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Permission created
 */

/**
 * @swagger
 * /api/roles/permissions/{id}:
 *   get:
 *     summary: Get permission by ID
 *     tags: [Roles]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permission detail
 *   put:
 *     summary: Update permission
 *     tags: [Roles]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permission updated
 *   delete:
 *     summary: Delete permission
 *     tags: [Roles]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permission deleted
 */

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Role detail
 */

/**
 * @swagger
 * /api/roles/{id}/duplicate:
 *   post:
 *     summary: Duplicate role with permissions
 *     tags: [Roles]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Role duplicated
 */

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   get:
 *     summary: List permissions assigned to role
 *     tags: [Roles]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Role permissions
 */

/**
 * @swagger
 * /api/roles/{id}/permissions/bulk:
 *   put:
 *     summary: Replace all permissions on a role
 *     tags: [Roles]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permissions updated
 */
