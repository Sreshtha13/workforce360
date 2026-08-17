/**
 * Engineering module — supplemental OpenAPI documentation.
 */

/**
 * @swagger
 * /api/engineering/releases:
 *   get:
 *     summary: List engineering releases
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Release list
 *   post:
 *     summary: Create release
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Release created
 */

/**
 * @swagger
 * /api/engineering/releases/{id}:
 *   get:
 *     summary: Get release by ID
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Release detail
 */

/**
 * @swagger
 * /api/engineering/releases/{id}/deploy:
 *   post:
 *     summary: Deploy a release
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Release deployed
 */

/**
 * @swagger
 * /api/engineering/releases/{id}/rollback:
 *   post:
 *     summary: Roll back a release
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Release rolled back
 */

/**
 * @swagger
 * /api/engineering/test-cases:
 *   get:
 *     summary: List test cases
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Test case list
 *   post:
 *     summary: Create test case
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Test case created
 */

/**
 * @swagger
 * /api/engineering/test-cases/{id}/execute:
 *   post:
 *     summary: Execute a test case
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Execution recorded
 */

/**
 * @swagger
 * /api/engineering/docs:
 *   get:
 *     summary: List technical documentation
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Documentation list
 *   post:
 *     summary: Create technical document
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Document created
 */

/**
 * @swagger
 * /api/engineering/docs/{id}/publish:
 *   post:
 *     summary: Publish technical document
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document published
 */

/**
 * @swagger
 * /api/engineering/training:
 *   get:
 *     summary: List training programs
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Training list
 *   post:
 *     summary: Create training program
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Training created
 */

/**
 * @swagger
 * /api/engineering/training/my-enrollments:
 *   get:
 *     summary: My training enrollments
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Enrollment list
 */

/**
 * @swagger
 * /api/engineering/training/enroll:
 *   post:
 *     summary: Enroll in training
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Enrolled
 */

/**
 * @swagger
 * /api/engineering/code-reviews:
 *   get:
 *     summary: List code reviews
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Code review list
 *   post:
 *     summary: Create code review request
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Code review created
 */

/**
 * @swagger
 * /api/engineering/code-reviews/{id}/approve:
 *   post:
 *     summary: Approve code review
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Approved
 */

/**
 * @swagger
 * /api/engineering/code-reviews/{id}/request-changes:
 *   post:
 *     summary: Request changes on code review
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Changes requested
 */

/**
 * @swagger
 * /api/engineering/dashboard/my-sprint:
 *   get:
 *     summary: My sprint dashboard
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Sprint dashboard data
 */

/**
 * @swagger
 * /api/engineering/dashboard/my-metrics:
 *   get:
 *     summary: My engineering metrics
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Personal metrics
 */

/**
 * @swagger
 * /api/engineering/dashboard/team-metrics:
 *   get:
 *     summary: Team engineering metrics
 *     tags: [Engineering]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Team metrics
 */
