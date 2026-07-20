/**
 * Organization — Employee Types OpenAPI docs.
 */

/**
 * @swagger
 * /api/organization/employee-types:
 *   get:
 *     summary: List employee types
 *     tags: [Organization - Employee Types]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full-Time, Part-Time, Contract, etc.
 *   post:
 *     summary: Create employee type
 *     tags: [Organization - Employee Types]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/organization/employee-types/{id}:
 *   get:
 *     summary: Get employee type by ID
 *     tags: [Organization - Employee Types]
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
 *         description: Employee type details
 *   put:
 *     summary: Update employee type
 *     tags: [Organization - Employee Types]
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
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Soft-delete employee type
 *     tags: [Organization - Employee Types]
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
