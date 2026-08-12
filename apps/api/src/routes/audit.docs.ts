/**
 * Audit logs OpenAPI documentation — Phase 11.
 */

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: List audit log entries (paginated)
 *     tags: [Audit Logs]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/PageSizeParam'
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: entity
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Paginated audit logs
 *       403:
 *         description: Requires audit.read
 */
