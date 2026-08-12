/**
 * HR module OpenAPI documentation — Phase 2.
 */

/**
 * @swagger
 * /api/hr/dashboard:
 *   get:
 *     summary: HR dashboard metrics
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: HR dashboard data
 */

/**
 * @swagger
 * /api/hr/employees:
 *   get:
 *     summary: List employees (employee master)
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Employee list
 */

/**
 * @swagger
 * /api/hr/employees/{id}:
 *   get:
 *     summary: Get employee detail
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Employee detail
 */

/**
 * @swagger
 * /api/hr/employees/{id}/lifecycle:
 *   patch:
 *     summary: Update employee lifecycle (join, transfer, exit)
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lifecycle updated
 */

/**
 * @swagger
 * /api/hr/interviews:
 *   get:
 *     summary: List scheduled interviews
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Interview list
 */

/**
 * @swagger
 * /api/hr/offers:
 *   get:
 *     summary: List job offers
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Offer list
 */

/**
 * @swagger
 * /api/hr/policies:
 *   get:
 *     summary: List HR policies
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Policy list
 *   post:
 *     summary: Create policy
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Policy created
 */

/**
 * @swagger
 * /api/hr/policies/{id}:
 *   get:
 *     summary: Get policy detail
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Policy detail
 *   put:
 *     summary: Update policy
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Policy updated
 */

/**
 * @swagger
 * /api/hr/policies/{id}/publish:
 *   post:
 *     summary: Publish policy version
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Policy published
 */

/**
 * @swagger
 * /api/hr/policies/{id}/versions:
 *   post:
 *     summary: Create new policy version
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Version created
 */

/**
 * @swagger
 * /api/hr/policies/{id}/acknowledgements:
 *   get:
 *     summary: List policy acknowledgements
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Acknowledgement list
 */

/**
 * @swagger
 * /api/hr/policy-families/{familyId}/assignments:
 *   get:
 *     summary: List policy assignments for a family
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: familyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Assignment list
 */

/**
 * @swagger
 * /api/hr/policy-assignments:
 *   post:
 *     summary: Assign policy to audience
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Policy assigned
 */

/**
 * @swagger
 * /api/hr/policy-assignments/{assignmentId}:
 *   delete:
 *     summary: Remove policy assignment
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Assignment removed
 */

/**
 * @swagger
 * /api/hr/assets:
 *   get:
 *     summary: List HR-managed assets
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Asset list
 *   post:
 *     summary: Create asset record
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Asset created
 */

/**
 * @swagger
 * /api/hr/assets/{id}/assign:
 *   post:
 *     summary: Assign asset to employee
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Asset assigned
 */

/**
 * @swagger
 * /api/hr/tickets:
 *   get:
 *     summary: List HR support tickets
 *     tags: [HR]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Ticket list
 */

/**
 * @swagger
 * /api/hr/tickets/{id}:
 *   get:
 *     summary: Get HR ticket detail
 *     tags: [HR]
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
 * /api/hr/tickets/{id}/assign:
 *   post:
 *     summary: Assign HR ticket
 *     tags: [HR]
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
 * /api/hr/tickets/{id}/status:
 *   patch:
 *     summary: Update HR ticket status
 *     tags: [HR]
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
 * /api/hr/tickets/{id}/replies:
 *   post:
 *     summary: Reply to HR ticket
 *     tags: [HR]
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
