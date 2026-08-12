/**
 * Recruitment OpenAPI documentation — Phase 2.
 */

/**
 * @swagger
 * /api/recruitment/jobs:
 *   get:
 *     summary: List recruitment jobs
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Job list
 *       403:
 *         description: Requires job.read
 *   post:
 *     summary: Create job posting
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Job created
 */

/**
 * @swagger
 * /api/recruitment/jobs/{id}:
 *   patch:
 *     summary: Update job posting
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Job updated
 */

/**
 * @swagger
 * /api/recruitment/candidates:
 *   get:
 *     summary: List candidates
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Candidate list
 */

/**
 * @swagger
 * /api/recruitment/candidates/me:
 *   get:
 *     summary: Get my candidate profile
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Candidate profile
 */

/**
 * @swagger
 * /api/recruitment/candidates/me/resume:
 *   post:
 *     summary: Attach resume file to my profile
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Resume attached
 */

/**
 * @swagger
 * /api/recruitment/candidates/{id}:
 *   get:
 *     summary: Get candidate by ID
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Candidate detail
 */

/**
 * @swagger
 * /api/recruitment/applications:
 *   get:
 *     summary: List job applications
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Application list
 */

/**
 * @swagger
 * /api/recruitment/applications/{id}:
 *   get:
 *     summary: Get application detail
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Application detail
 */

/**
 * @swagger
 * /api/recruitment/applications/{id}/status:
 *   patch:
 *     summary: Update application pipeline status
 *     tags: [Recruitment]
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
 * /api/recruitment/pipeline:
 *   get:
 *     summary: Recruitment pipeline board data
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Pipeline stages and counts
 */

/**
 * @swagger
 * /api/recruitment/interviews:
 *   post:
 *     summary: Schedule interview
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Interview scheduled
 */

/**
 * @swagger
 * /api/recruitment/assessments:
 *   post:
 *     summary: Assign assessment to candidate
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Assessment assigned
 */

/**
 * @swagger
 * /api/recruitment/offers:
 *   post:
 *     summary: Create job offer
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Offer created
 */

/**
 * @swagger
 * /api/recruitment/offers/{id}/send:
 *   post:
 *     summary: Send offer to candidate
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Offer sent
 */

/**
 * @swagger
 * /api/recruitment/checklist/{id}:
 *   patch:
 *     summary: Update onboarding checklist item
 *     tags: [Recruitment]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Checklist updated
 */
