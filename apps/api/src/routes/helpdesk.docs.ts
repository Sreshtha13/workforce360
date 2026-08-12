/**
 * Helpdesk OpenAPI documentation — Phase 8.
 */

/**
 * @swagger
 * /api/helpdesk/tickets:
 *   get:
 *     summary: List helpdesk tickets (agent view)
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Ticket list
 */

/**
 * @swagger
 * /api/helpdesk/tickets/{id}:
 *   get:
 *     summary: Get ticket detail
 *     tags: [Helpdesk]
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
 * /api/helpdesk/tickets/{id}/assign:
 *   post:
 *     summary: Assign ticket to agent
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket assigned
 */

/**
 * @swagger
 * /api/helpdesk/tickets/{id}/status:
 *   post:
 *     summary: Update ticket status
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */

/**
 * @swagger
 * /api/helpdesk/tickets/{id}/reply:
 *   post:
 *     summary: Reply to ticket (agent)
 *     tags: [Helpdesk]
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
 * /api/helpdesk/tickets/{id}/escalate:
 *   post:
 *     summary: Escalate ticket
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket escalated
 */

/**
 * @swagger
 * /api/helpdesk/sla:
 *   get:
 *     summary: List SLA policies
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: SLA policies
 *   put:
 *     summary: Upsert SLA policy
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: SLA policy saved
 */

/**
 * @swagger
 * /api/helpdesk/kb:
 *   get:
 *     summary: List knowledge base articles
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: KB article list
 *   post:
 *     summary: Create KB article
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Article created
 */

/**
 * @swagger
 * /api/helpdesk/kb/{id}:
 *   get:
 *     summary: Get KB article
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Article detail
 *   patch:
 *     summary: Update KB article
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Article updated
 *   delete:
 *     summary: Delete KB article
 *     tags: [Helpdesk]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Article deleted
 */
