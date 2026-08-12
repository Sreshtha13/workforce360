/**
 * Leave Management Module OpenAPI documentation.
 */

/**
 * @swagger
 * /api/leave/types:
 *   get:
 *     summary: List all leave types
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of leave types
 *       403:
 *         description: Requires leave.read permission
 *   post:
 *     summary: Create leave type
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Annual Leave
 *               code:
 *                 type: string
 *                 example: AL
 *               description:
 *                 type: string
 *               defaultBalance:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 20
 *               carryForward:
 *                 type: boolean
 *                 default: false
 *               maxCarryForwardDays:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 5
 *               requiresApproval:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Leave type created
 *       403:
 *         description: Requires leave.manage permission
 */

/**
 * @swagger
 * /api/leave/types/{id}:
 *   get:
 *     summary: Get leave type by ID
 *     tags: [Leave Management]
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
 *         description: Leave type details
 *       404:
 *         description: Leave type not found
 *   put:
 *     summary: Update leave type
 *     tags: [Leave Management]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               defaultBalance:
 *                 type: number
 *               carryForward:
 *                 type: boolean
 *               maxCarryForwardDays:
 *                 type: number
 *               requiresApproval:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Leave type updated
 *       403:
 *         description: Requires leave.manage permission
 *   delete:
 *     summary: Delete leave type (soft delete)
 *     tags: [Leave Management]
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
 *         description: Leave type deleted
 *       403:
 *         description: Requires leave.manage permission
 */

/**
 * @swagger
 * /api/leave/balances:
 *   get:
 *     summary: List leave balances
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: leaveTypeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2024
 *     responses:
 *       200:
 *         description: List of leave balances (balance = allocated + carriedOver - used)
 *       403:
 *         description: Requires leave.read permission
 *   post:
 *     summary: Initialize leave balance
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, leaveTypeId, year, allocated]
 *             properties:
 *               employeeId:
 *                 type: string
 *               leaveTypeId:
 *                 type: string
 *               year:
 *                 type: integer
 *                 minimum: 2000
 *                 maximum: 2100
 *                 example: 2024
 *               allocated:
 *                 type: number
 *                 minimum: 0
 *                 example: 20
 *               carriedOver:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 5
 *     responses:
 *       201:
 *         description: Leave balance initialized
 *       403:
 *         description: Requires leave.manage permission
 */

/**
 * @swagger
 * /api/leave/balances/{id}:
 *   put:
 *     summary: Adjust leave balance
 *     tags: [Leave Management]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allocated:
 *                 type: number
 *                 minimum: 0
 *               used:
 *                 type: number
 *                 minimum: 0
 *               carriedOver:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Leave balance adjusted (balance recalculated automatically)
 *       400:
 *         description: Leave balance cannot be negative
 *       403:
 *         description: Requires leave.manage permission
 */

/**
 * @swagger
 * /api/leave/applications:
 *   get:
 *     summary: List leave applications
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: leaveTypeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of leave applications
 *       403:
 *         description: Requires leave.read or leave.approve permission
 *   post:
 *     summary: Apply for leave (employee self-service)
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leaveTypeId, startDate, endDate, reason]
 *             properties:
 *               leaveTypeId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: '2024-08-15'
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: '2024-08-17'
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: Family vacation
 *     responses:
 *       201:
 *         description: Leave application created (enters approval workflow if required)
 *       400:
 *         description: Insufficient balance, overlapping dates, or invalid date range
 */

/**
 * @swagger
 * /api/leave/applications/{id}:
 *   get:
 *     summary: Get leave application details
 *     tags: [Leave Management]
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
 *         description: Leave application with approval workflow details
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/leave/applications/{id}/review:
 *   post:
 *     summary: Review leave application
 *     tags: [Leave Management]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               reviewNotes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Leave reviewed (if approved, balance deducted automatically)
 *       400:
 *         description: Already reviewed
 *       403:
 *         description: Requires leave.approve permission
 */

/**
 * @swagger
 * /api/leave/applications/{id}/cancel:
 *   post:
 *     summary: Cancel leave application
 *     tags: [Leave Management]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Leave cancelled (if was approved, balance restored automatically)
 *       400:
 *         description: Already cancelled
 */

/**
 * @swagger
 * /api/leave/stats:
 *   get:
 *     summary: Get leave statistics
 *     tags: [Leave Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2024
 *     responses:
 *       200:
 *         description: Leave statistics (balances per type, totals)
 *       403:
 *         description: Requires leave.read permission
 */

export {};
