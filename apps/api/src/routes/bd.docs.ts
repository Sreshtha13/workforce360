/**
 * Business Development OpenAPI documentation — Phase 5.
 */

/**
 * @swagger
 * /api/bd/contacts:
 *   get:
 *     summary: List BD contacts
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Contact list
 *   post:
 *     summary: Create contact
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Contact created
 */

/**
 * @swagger
 * /api/bd/contacts/{id}:
 *   get:
 *     summary: Get contact
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Contact detail
 *   patch:
 *     summary: Update contact
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Contact updated
 */

/**
 * @swagger
 * /api/bd/leads:
 *   get:
 *     summary: List leads
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lead list
 *   post:
 *     summary: Create lead
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Lead created
 */

/**
 * @swagger
 * /api/bd/leads/{id}:
 *   get:
 *     summary: Get lead
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lead detail
 *   patch:
 *     summary: Update lead
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lead updated
 */

/**
 * @swagger
 * /api/bd/bids:
 *   get:
 *     summary: List bids
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Bid list
 *   post:
 *     summary: Create bid
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Bid created
 */

/**
 * @swagger
 * /api/bd/bids/{id}:
 *   get:
 *     summary: Get bid
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bid detail
 *   patch:
 *     summary: Update bid
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bid updated
 */

/**
 * @swagger
 * /api/bd/proposals:
 *   get:
 *     summary: List proposals
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Proposal list
 *   post:
 *     summary: Create proposal
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Proposal created
 */

/**
 * @swagger
 * /api/bd/proposals/{id}:
 *   get:
 *     summary: Get proposal
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Proposal detail
 *   patch:
 *     summary: Update proposal
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Proposal updated
 */

/**
 * @swagger
 * /api/bd/communications:
 *   get:
 *     summary: List communications log
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Communication list
 *   post:
 *     summary: Log communication
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Communication logged
 */

/**
 * @swagger
 * /api/bd/portfolio:
 *   get:
 *     summary: List portfolio items
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Portfolio list
 *   post:
 *     summary: Create portfolio item
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Portfolio item created
 */

/**
 * @swagger
 * /api/bd/portfolio/{id}:
 *   get:
 *     summary: Get portfolio item
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Portfolio detail
 *   patch:
 *     summary: Update portfolio item
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Portfolio updated
 */

/**
 * @swagger
 * /api/bd/pipeline:
 *   get:
 *     summary: BD sales pipeline summary
 *     tags: [Business Development]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Pipeline data
 */
