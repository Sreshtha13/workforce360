/**
 * Organization — Designations OpenAPI docs.
 */

/**
 * @swagger
 * /api/organization/designations:
 *   get:
 *     summary: List all designations
 *     tags: [Organization - Designations]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *     responses:
 *       200:
 *         description: List of designations
 *   post:
 *     summary: Create designation
 *     tags: [Organization - Designations]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [departmentId, name, level]
 *             properties:
 *               departmentId: { type: string, example: dept_engineering }
 *               name: { type: string, example: Software Engineer }
 *               code: { type: string, example: SE }
 *               level: { type: integer, minimum: 1, maximum: 5, example: 1, description: "Hierarchy level (1=L1 … 5=L5)" }
 *               headcount: { type: integer, minimum: 1, example: 1, description: "Approved position capacity" }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Designation created
 */

/**
 * @swagger
 * /api/organization/designations/{id}:
 *   get:
 *     summary: Get designation by ID
 *     tags: [Organization - Designations]
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
 *         description: Designation details
 *   put:
 *     summary: Update designation
 *     tags: [Organization - Designations]
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
 *               departmentId: { type: string }
 *               name: { type: string }
 *               code: { type: string }
 *               level: { type: integer, minimum: 1, maximum: 5 }
 *               headcount: { type: integer, minimum: 1 }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Soft-delete designation
 *     tags: [Organization - Designations]
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
 */

export {};
