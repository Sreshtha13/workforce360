/**
 * Payroll Module OpenAPI documentation.
 */

/**
 * @swagger
 * /api/payroll/salary-structures:
 *   get:
 *     summary: List salary structures (all versions)
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of salary structure versions, newest first per employee
 *   post:
 *     summary: Create a new (versioned) salary structure for an employee
 *     description: >
 *       Automatically supersedes the employee's current active structure
 *       (effectiveTo = new effectiveFrom − 1 day) so historical payslips
 *       remain accurate after a raise.
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, effectiveFrom, basic]
 *             properties:
 *               employeeId:
 *                 type: string
 *               effectiveFrom:
 *                 type: string
 *                 format: date
 *               basic:
 *                 type: number
 *               hra:
 *                 type: number
 *               conveyanceAllowance:
 *                 type: number
 *               medicalAllowance:
 *                 type: number
 *               specialAllowance:
 *                 type: number
 *               otherAllowances:
 *                 type: number
 *               providentFund:
 *                 type: number
 *               professionalTax:
 *                 type: number
 *               incomeTax:
 *                 type: number
 *               otherDeductions:
 *                 type: number
 *     responses:
 *       201:
 *         description: Salary structure created and marked ACTIVE
 */

/**
 * @swagger
 * /api/payroll/salary-structures/active/{employeeId}:
 *   get:
 *     summary: Get an employee's currently active salary structure
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active salary structure
 *       404:
 *         description: No active salary structure found
 */

/**
 * @swagger
 * /api/payroll/salary-revisions:
 *   get:
 *     summary: List salary revision requests
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: List of salary revisions
 *   post:
 *     summary: Request a salary revision (routed through the Phase 3 approval engine)
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, proposedBasic, effectiveFrom, reason, approverIds]
 *             properties:
 *               employeeId:
 *                 type: string
 *               proposedBasic:
 *                 type: number
 *               effectiveFrom:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *               approverIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Salary revision created with status PENDING
 */

/**
 * @swagger
 * /api/payroll/salary-revisions/{id}/approve:
 *   post:
 *     summary: Approve a salary revision — creates a new versioned salary structure on final approval
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Revision approved
 */

/**
 * @swagger
 * /api/payroll/salary-revisions/{id}/reject:
 *   post:
 *     summary: Reject a salary revision
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Revision rejected
 */

/**
 * @swagger
 * /api/payroll/runs:
 *   get:
 *     summary: List payroll runs
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING_APPROVAL, APPROVED, PROCESSED, PAID, CANCELLED]
 *     responses:
 *       200:
 *         description: List of payroll runs
 *   post:
 *     summary: Create a payroll run for a pay period
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [month, year, payPeriodStart, payPeriodEnd]
 *             properties:
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               year:
 *                 type: integer
 *               payPeriodStart:
 *                 type: string
 *                 format: date
 *               payPeriodEnd:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Payroll run created in DRAFT status
 */

/**
 * @swagger
 * /api/payroll/runs/{id}:
 *   get:
 *     summary: Get payroll run details (with line items)
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payroll run with per-employee line items
 */

/**
 * @swagger
 * /api/payroll/runs/{id}/calculate:
 *   post:
 *     summary: Calculate/recalculate payroll line items for every active employee's current salary structure
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Run totals recomputed; employees without an active salary structure are skipped
 */

/**
 * @swagger
 * /api/payroll/runs/{id}/submit:
 *   post:
 *     summary: Submit a calculated payroll run for approval
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approverIds]
 *             properties:
 *               approverIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Run moved to PENDING_APPROVAL
 */

/**
 * @swagger
 * /api/payroll/runs/{id}/approve:
 *   post:
 *     summary: Approve a payroll run
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Run moved to APPROVED once all levels approve
 */

/**
 * @swagger
 * /api/payroll/runs/{id}/reject:
 *   post:
 *     summary: Reject a payroll run (returns it to DRAFT for revision)
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Run reverted to DRAFT
 */

/**
 * @swagger
 * /api/payroll/runs/{id}/process:
 *   post:
 *     summary: Process an approved payroll run — generates a PDF payslip per employee (backend-only)
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Run moved to PROCESSED; payslips generated with status GENERATED (not yet visible to employees)
 */

/**
 * @swagger
 * /api/payroll/runs/{id}/mark-paid:
 *   post:
 *     summary: Mark a processed payroll run as paid — publishes payslips to the Employee Portal
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Run moved to PAID; payslips set to PUBLISHED and now visible in the portal
 */

/**
 * @swagger
 * /api/payroll/runs/{id}/cancel:
 *   post:
 *     summary: Cancel a draft or pending-approval payroll run
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Run moved to CANCELLED
 */

/**
 * @swagger
 * /api/payroll/payslips:
 *   get:
 *     summary: List payslips (admin/payroll visibility — all statuses)
 *     tags: [Payroll]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of payslips
 */

export {};
