/**
 * Reports OpenAPI documentation — Phase 10.
 */

/**
 * @swagger
 * /api/reports/kpis/{scope}:
 *   get:
 *     summary: Get KPI metrics for a dashboard scope (hr, finance, pm, etc.)
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *           example: hr
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: KPI data
 */

/**
 * @swagger
 * /api/reports/schedules:
 *   get:
 *     summary: List report schedules
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Schedule list
 *   post:
 *     summary: Create report schedule
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Schedule created
 */

/**
 * @swagger
 * /api/reports/schedules/{id}:
 *   patch:
 *     summary: Update report schedule
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Schedule updated
 *   delete:
 *     summary: Delete report schedule
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Schedule deleted
 */

/**
 * @swagger
 * /api/reports/schedules/run-due:
 *   post:
 *     summary: Run all due scheduled reports (cron/manual trigger)
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Due schedules processed
 */

/**
 * @swagger
 * /api/reports/{type}:
 *   get:
 *     summary: Get report data by type
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           example: attendance
 *     responses:
 *       200:
 *         description: Report data
 */

/**
 * @swagger
 * /api/reports/{type}/export:
 *   get:
 *     summary: Export report as CSV or PDF
 *     tags: [Reports]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *     responses:
 *       200:
 *         description: File download
 */
