/**
 * Security events OpenAPI documentation — Phase 12.
 */

/**
 * @swagger
 * /api/security-events:
 *   get:
 *     summary: List security events (paginated)
 *     tags: [Security]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PageSizeParam'
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: eventType
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated security events
 *       403:
 *         description: Requires security.read
 */
