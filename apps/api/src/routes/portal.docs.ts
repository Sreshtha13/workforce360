/**
 * Employee Portal OpenAPI documentation — Phase 2.
 */

/**
 * @swagger
 * /api/portal/dashboard:
 *   get:
 *     summary: Employee portal dashboard
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Portal dashboard widgets
 */

/**
 * @swagger
 * /api/portal/profile:
 *   get:
 *     summary: Get my profile
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile data
 *   patch:
 *     summary: Update my profile
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile updated
 */

/**
 * @swagger
 * /api/portal/notifications:
 *   get:
 *     summary: List my notifications
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notification list
 */

/**
 * @swagger
 * /api/portal/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Marked read
 */

/**
 * @swagger
 * /api/portal/tickets:
 *   get:
 *     summary: List my support tickets
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Ticket list
 *   post:
 *     summary: Create support ticket
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Ticket created
 */

/**
 * @swagger
 * /api/portal/tickets/{id}:
 *   get:
 *     summary: Get my ticket detail
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket detail
 */

/**
 * @swagger
 * /api/portal/tickets/{id}/replies:
 *   post:
 *     summary: Reply to my ticket
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Reply added
 */

/**
 * @swagger
 * /api/portal/assets:
 *   get:
 *     summary: List assets assigned to me
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: My assets
 */

/**
 * @swagger
 * /api/portal/policies:
 *   get:
 *     summary: List policies assigned to me
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Policy list
 */

/**
 * @swagger
 * /api/portal/policies/{id}/acknowledge:
 *   post:
 *     summary: Acknowledge a policy
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Policy acknowledged
 */

/**
 * @swagger
 * /api/portal/payslips:
 *   get:
 *     summary: List my published payslips
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Payslip list
 */

/**
 * @swagger
 * /api/portal/payslips/{id}/download:
 *   get:
 *     summary: Download payslip PDF (proxied via backend)
 *     tags: [Employee Portal]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payslip file stream
 */
