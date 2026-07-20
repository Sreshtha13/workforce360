/**
 * Organization — Employment Statuses OpenAPI docs.
 */

/**
 * @swagger
 * /api/organization/employment-statuses:
 *   get:
 *     summary: List employment statuses
 *     tags: [Organization - Employment Statuses]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active, On Leave, etc.
 *   post:
 *     summary: Create employment status
 *     tags: [Organization - Employment Statuses]
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
 * /api/organization/employment-statuses/{id}:
 *   get:
 *     summary: Get employment status by ID
 *     tags: [Organization - Employment Statuses]
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
 *         description: Status details
 *   put:
 *     summary: Update employment status
 *     tags: [Organization - Employment Statuses]
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
 *     summary: Soft-delete employment status
 *     tags: [Organization - Employment Statuses]
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
