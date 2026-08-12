/**
 * Dashboard OpenAPI documentation.
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Admin dashboard overview widgets
 *     tags: [Dashboard]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard data
 */

/**
 * @swagger
 * /api/dashboard/employees:
 *   get:
 *     summary: List active employees for dashboard pickers
 *     tags: [Dashboard]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Active employee list
 */

/**
 * @swagger
 * /api/dashboard/search:
 *   get:
 *     summary: Global search across entities
 *     tags: [Dashboard]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Search results
 */
