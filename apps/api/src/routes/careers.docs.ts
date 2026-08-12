/**
 * Careers (public) OpenAPI documentation — Phase 2.
 */

/**
 * @swagger
 * /api/careers/jobs:
 *   get:
 *     summary: List published job openings (public)
 *     tags: [Careers]
 *     responses:
 *       200:
 *         description: Published jobs
 */

/**
 * @swagger
 * /api/careers/jobs/{slug}:
 *   get:
 *     summary: Get job details by slug (public)
 *     tags: [Careers]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job detail
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /api/careers/register:
 *   post:
 *     summary: Register candidate account (public)
 *     tags: [Careers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201:
 *         description: Candidate registered
 */

/**
 * @swagger
 * /api/careers/apply:
 *   post:
 *     summary: Apply to a job (public or authenticated candidate)
 *     tags: [Careers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobId]
 *             properties:
 *               jobId: { type: string }
 *               coverLetter: { type: string }
 *     responses:
 *       201:
 *         description: Application submitted
 */
