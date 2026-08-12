/**
 * Attendance Module OpenAPI documentation.
 */

/**
 * @swagger
 * /api/attendance/shifts:
 *   get:
 *     summary: List all shifts
 *     tags: [Attendance]
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
 *         description: List of shifts
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires attendance.read permission
 *   post:
 *     summary: Create a new shift
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startTime, endTime]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Morning Shift
 *               code:
 *                 type: string
 *                 example: MS
 *               startTime:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 example: '09:00'
 *               endTime:
 *                 type: string
 *                 pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *                 example: '18:00'
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shift created successfully
 *       403:
 *         description: Requires attendance.manage permission
 */

/**
 * @swagger
 * /api/attendance/shifts/{id}:
 *   get:
 *     summary: Get shift by ID
 *     tags: [Attendance]
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
 *         description: Shift details
 *       404:
 *         description: Shift not found
 *   put:
 *     summary: Update shift
 *     tags: [Attendance]
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
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Shift updated
 *       403:
 *         description: Requires attendance.manage permission
 *   delete:
 *     summary: Delete shift (soft delete)
 *     tags: [Attendance]
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
 *         description: Shift deleted
 *       403:
 *         description: Requires attendance.manage permission
 */

/**
 * @swagger
 * /api/attendance/holidays:
 *   get:
 *     summary: List holidays
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of holidays
 *       403:
 *         description: Requires attendance.read permission
 *   post:
 *     summary: Create holiday
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, date]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Independence Day
 *               date:
 *                 type: string
 *                 format: date
 *                 example: '2024-08-15'
 *               description:
 *                 type: string
 *               isOptional:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Holiday created
 *       403:
 *         description: Requires attendance.manage permission
 */

/**
 * @swagger
 * /api/attendance/holidays/{id}:
 *   put:
 *     summary: Update holiday
 *     tags: [Attendance]
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
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               isOptional:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Holiday updated
 *       403:
 *         description: Requires attendance.manage permission
 *   delete:
 *     summary: Delete holiday (soft delete)
 *     tags: [Attendance]
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
 *         description: Holiday deleted
 *       403:
 *         description: Requires attendance.manage permission
 */

/**
 * @swagger
 * /api/attendance/clock-in:
 *   post:
 *     summary: Clock in (employee self-service)
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Defaults to today
 *               shiftId:
 *                 type: string
 *               checkInTime:
 *                 type: string
 *                 format: date-time
 *                 description: Defaults to now
 *     responses:
 *       201:
 *         description: Clocked in successfully
 *       400:
 *         description: Already clocked in for this date
 */

/**
 * @swagger
 * /api/attendance/clock-out:
 *   post:
 *     summary: Clock out (employee self-service)
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Defaults to today
 *               checkOutTime:
 *                 type: string
 *                 format: date-time
 *                 description: Defaults to now
 *     responses:
 *       200:
 *         description: Clocked out successfully, work hours calculated
 *       400:
 *         description: Must clock in before clocking out
 */

/**
 * @swagger
 * /api/attendance/records:
 *   get:
 *     summary: List attendance records
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY, WEEKEND]
 *     responses:
 *       200:
 *         description: List of attendance records
 *       403:
 *         description: Requires attendance.read permission
 *   post:
 *     summary: Mark attendance (HR/Manager)
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, date, status]
 *             properties:
 *               employeeId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY, WEEKEND]
 *               shiftId:
 *                 type: string
 *               checkInTime:
 *                 type: string
 *                 format: date-time
 *               checkOutTime:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance marked
 *       403:
 *         description: Requires attendance.manage permission
 */

/**
 * @swagger
 * /api/attendance/corrections:
 *   get:
 *     summary: List attendance correction requests
 *     tags: [Attendance]
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
 *         description: List of correction requests
 *   post:
 *     summary: Request attendance correction
 *     tags: [Attendance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, requestedStatus, reason]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               requestedStatus:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, HALF_DAY, LEAVE, HOLIDAY, WEEKEND]
 *               requestedCheckIn:
 *                 type: string
 *                 format: date-time
 *               requestedCheckOut:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Correction request created
 */

/**
 * @swagger
 * /api/attendance/corrections/{id}/review:
 *   post:
 *     summary: Review attendance correction request
 *     tags: [Attendance]
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
 *         description: Correction reviewed (if approved, attendance record updated)
 *       403:
 *         description: Requires attendance.approve permission
 */

/**
 * @swagger
 * /api/attendance/stats:
 *   get:
 *     summary: Get attendance statistics
 *     tags: [Attendance]
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
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Attendance statistics (present/absent/half-day/leave counts)
 *       403:
 *         description: Requires attendance.read permission
 */

export {};
