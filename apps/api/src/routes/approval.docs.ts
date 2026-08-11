/**
 * Generic Approval Workflow Engine OpenAPI documentation.
 */

/**
 * @swagger
 * /api/approvals:
 *   get:
 *     summary: List approval requests
 *     tags: [Approvals]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g., leave_application, payroll_run)
 *       - in: query
 *         name: requesterId
 *         schema:
 *           type: string
 *         description: Filter by requester
 *       - in: query
 *         name: approverId
 *         schema:
 *           type: string
 *         description: Filter by approver
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of approval requests with steps
 *   post:
 *     summary: Create multi-level approval request
 *     description: |
 *       Creates a generic approval workflow for any entity. Approvals are sequential 
 *       (level 1 → level 2 → ... → final). Commonly used for leave applications, 
 *       payroll runs, invoices, expenses, etc.
 *     tags: [Approvals]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entityType, entityId, requesterId, approverIds]
 *             properties:
 *               entityType:
 *                 type: string
 *                 example: leave_application
 *               entityId:
 *                 type: string
 *                 example: leave-app-123
 *               requesterId:
 *                 type: string
 *               approverIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 example: ['manager-id', 'hr-id']
 *                 description: Sequential approval levels (manager first, then HR, etc.)
 *               metadata:
 *                 type: object
 *                 description: Optional entity-specific data
 *     responses:
 *       201:
 *         description: Approval request created (status PENDING, level 1)
 *       400:
 *         description: At least one approver required
 *       403:
 *         description: Requires approval.create permission
 */

/**
 * @swagger
 * /api/approvals/{id}:
 *   get:
 *     summary: Get approval request details
 *     tags: [Approvals]
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
 *         description: Approval request with all steps and action history
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/approvals/{id}/approve:
 *   post:
 *     summary: Approve at current level
 *     description: |
 *       Approves the request if the authenticated user is the approver at the current 
 *       level. If this is the final level, the request is marked APPROVED. Otherwise, 
 *       it advances to the next level.
 *     tags: [Approvals]
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
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Approved (advances to next level or marks as APPROVED)
 *       400:
 *         description: Not pending, or out of order
 *       404:
 *         description: No pending step for this approver
 */

/**
 * @swagger
 * /api/approvals/{id}/reject:
 *   post:
 *     summary: Reject approval request
 *     description: Rejects the entire request immediately (no further approvals)
 *     tags: [Approvals]
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
 *             required: [notes]
 *             properties:
 *               notes:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Request rejected (status → REJECTED)
 *       400:
 *         description: Not pending, or only current level approver can reject
 */

/**
 * @swagger
 * /api/approvals/{id}/cancel:
 *   post:
 *     summary: Cancel approval request
 *     description: Only the requester can cancel a pending approval request
 *     tags: [Approvals]
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
 *         description: Request cancelled (status → CANCELLED)
 *       400:
 *         description: Only pending requests can be cancelled
 *       403:
 *         description: Only requester can cancel
 */

/**
 * @swagger
 * /api/approvals/pending/my:
 *   get:
 *     summary: Get my pending approvals
 *     description: Returns all pending approval requests where the authenticated user is an approver
 *     tags: [Approvals]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending approvals assigned to current user
 */

/**
 * @swagger
 * /api/approvals/stats/my:
 *   get:
 *     summary: Get my approval statistics
 *     tags: [Approvals]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Approval statistics (pending count, etc.)
 */

export {};
