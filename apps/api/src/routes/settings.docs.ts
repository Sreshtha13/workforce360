/**
 * Settings, templates, and admin OpenAPI documentation — Phase 11.
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: List system settings (secrets masked for non-super-admin)
 *     tags: [Settings]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Settings list
 *   put:
 *     summary: Upsert system settings
 *     tags: [Settings]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Settings updated
 */

/**
 * @swagger
 * /api/notification-templates:
 *   get:
 *     summary: List notification templates
 *     tags: [Notification Templates]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Template list
 *   post:
 *     summary: Create notification template
 *     tags: [Notification Templates]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Template created
 */

/**
 * @swagger
 * /api/notification-templates/{id}:
 *   patch:
 *     summary: Update notification template
 *     tags: [Notification Templates]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Template updated
 *   delete:
 *     summary: Delete notification template
 *     tags: [Notification Templates]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Template deleted
 */

/**
 * @swagger
 * /api/admin/master-data:
 *   get:
 *     summary: Master data counts summary (departments, roles, etc.)
 *     tags: [Admin]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Master data summary
 */

/**
 * @swagger
 * /api/admin/integrations:
 *   get:
 *     summary: List MVP and future integration status
 *     tags: [Admin]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Integration registry (env-driven status)
 */
