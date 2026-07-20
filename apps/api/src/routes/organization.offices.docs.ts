/**
 * Organization — Offices OpenAPI docs.
 */

/**
 * @swagger
 * /api/organization/offices:
 *   get:
 *     summary: List all offices / branches
 *     tags: [Organization - Offices]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of offices
 *   post:
 *     summary: Create office
 *     tags: [Organization - Offices]
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
 *               name: { type: string, example: HQ }
 *               code: { type: string }
 *               type: { type: string, example: headquarters }
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               postalCode: { type: string }
 *               phone: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       201:
 *         description: Office created
 */

/**
 * @swagger
 * /api/organization/offices/{id}:
 *   get:
 *     summary: Get office by ID
 *     tags: [Organization - Offices]
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
 *         description: Office details
 *   put:
 *     summary: Update office
 *     tags: [Organization - Offices]
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
 *               city: { type: string }
 *               country: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Soft-delete office
 *     tags: [Organization - Offices]
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
