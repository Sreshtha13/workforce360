/**
 * Integrations OpenAPI documentation — Phase 13.
 */

/**
 * @swagger
 * /api/integrations/webhooks:
 *   get:
 *     summary: List outbound webhook subscriptions
 *     tags: [Integrations]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Webhook subscription list (secrets not exposed)
 *   post:
 *     summary: Create outbound webhook subscription
 *     tags: [Integrations]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url, events]
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               events:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["payment.succeeded"]
 *     responses:
 *       201:
 *         description: Subscription created
 */

/**
 * @swagger
 * /api/integrations/webhooks/{id}:
 *   delete:
 *     summary: Delete webhook subscription
 *     tags: [Integrations]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Subscription deleted
 */
