/**
 * Organization — Departments OpenAPI docs.
 */

/**
 * @swagger
 * /api/organization/departments:
 *   get:
 *     summary: List all departments
 *     tags: [Organization - Departments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter by company ID
 *     responses:
 *       200:
 *         description: List of departments
 *       401:
 *         description: Not authenticated
 *   post:
 *     summary: Create department
 *     tags: [Organization - Departments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyId, name]
 *             properties:
 *               companyId: { type: string, example: default-company }
 *               name: { type: string, example: Engineering }
 *               code: { type: string, example: ENG }
 *               description: { type: string }
 *               managerId: { type: string }
 *               parentId: { type: string }
 *     responses:
 *       201:
 *         description: Department created
 *       403:
 *         description: Requires department.create
 */

/**
 * @swagger
 * /api/organization/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Organization - Departments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department details
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update department
 *     tags: [Organization - Departments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               description: { type: string }
 *               managerId: { type: string }
 *               parentId: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *       403:
 *         description: Requires department.update
 *   delete:
 *     summary: Soft-delete department
 *     tags: [Organization - Departments]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Soft-deleted
 *       403:
 *         description: Requires department.delete
 */

export {};
