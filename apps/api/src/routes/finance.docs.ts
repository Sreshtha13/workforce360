/**
 * Finance Module OpenAPI documentation.
 */

/**
 * @swagger
 * /api/finance/dashboard:
 *   get:
 *     summary: Finance dashboard (receivables, invoice/payment breakdowns, pending reimbursements)
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated finance metrics
 *       403:
 *         description: Requires finance.dashboard.read permission
 */

/**
 * @swagger
 * /api/finance/payment-config:
 *   get:
 *     summary: Client-safe payment gateway config (publishable keys only — never secrets)
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stripe publishable key + Razorpay key id (null if not configured)
 */

/**
 * @swagger
 * /api/finance/clients:
 *   get:
 *     summary: List clients
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of clients
 *       403:
 *         description: Requires client.read or client.manage permission
 *   post:
 *     summary: Create client
 *     tags: [Finance]
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
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client created
 *       403:
 *         description: Requires client.manage permission
 */

/**
 * @swagger
 * /api/finance/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Finance]
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
 *         description: Client details
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update client
 *     tags: [Finance]
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
 *         description: Client updated
 *   delete:
 *     summary: Delete client (soft delete)
 *     tags: [Finance]
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
 *         description: Client deleted
 */

/**
 * @swagger
 * /api/finance/invoices:
 *   get:
 *     summary: List invoices
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING_APPROVAL, APPROVED, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, REJECTED]
 *     responses:
 *       200:
 *         description: List of invoices with client, line items, and payment history
 *   post:
 *     summary: Create draft invoice
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, issueDate, dueDate, lineItems]
 *             properties:
 *               clientId:
 *                 type: string
 *               issueDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               currency:
 *                 type: string
 *                 example: USD
 *               taxAmount:
 *                 type: number
 *               discountAmount:
 *                 type: number
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [description, unitPrice]
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                       default: 1
 *                     unitPrice:
 *                       type: number
 *     responses:
 *       201:
 *         description: Invoice created in DRAFT status (invoice number auto-generated)
 */

/**
 * @swagger
 * /api/finance/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Finance]
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
 *         description: Invoice with line items, approval steps, and payments
 *   put:
 *     summary: Update invoice (DRAFT or REJECTED only — recomputes totals)
 *     tags: [Finance]
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
 *         description: Invoice updated
 */

/**
 * @swagger
 * /api/finance/invoices/{id}/submit:
 *   post:
 *     summary: Submit draft invoice for multi-level approval (reuses the Phase 3 approval engine)
 *     tags: [Finance]
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
 *         description: Invoice moved to PENDING_APPROVAL
 */

/**
 * @swagger
 * /api/finance/invoices/{id}/approve:
 *   post:
 *     summary: Approve invoice (current approval-step approver only)
 *     tags: [Finance]
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
 *         description: Invoice status set to APPROVED once all levels approve
 */

/**
 * @swagger
 * /api/finance/invoices/{id}/reject:
 *   post:
 *     summary: Reject invoice
 *     tags: [Finance]
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
 *         description: Invoice status set to REJECTED
 */

/**
 * @swagger
 * /api/finance/invoices/{id}/send:
 *   post:
 *     summary: Send invoice to client (DRAFT or APPROVED only)
 *     tags: [Finance]
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
 *         description: Invoice status set to SENT
 */

/**
 * @swagger
 * /api/finance/invoices/{id}/cancel:
 *   post:
 *     summary: Cancel invoice
 *     tags: [Finance]
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
 *         description: Invoice status set to CANCELLED
 */

/**
 * @swagger
 * /api/finance/invoices/mark-overdue:
 *   post:
 *     summary: Mark sent/approved/partially-paid invoices past their due date as OVERDUE (run periodically)
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Count of invoices updated
 */

/**
 * @swagger
 * /api/finance/payments:
 *   get:
 *     summary: List payments
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCEEDED, FAILED, REFUNDED]
 *     responses:
 *       200:
 *         description: List of payments
 */

/**
 * @swagger
 * /api/finance/payments/manual:
 *   post:
 *     summary: Record a manual (offline) payment against an invoice
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               invoiceId:
 *                 type: string
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 example: bank_transfer
 *     responses:
 *       201:
 *         description: Payment recorded and invoice balance updated
 */

/**
 * @swagger
 * /api/finance/payments/checkout-session:
 *   post:
 *     summary: Create a Stripe Checkout session or Razorpay order for an invoice
 *     description: >
 *       Secret keys never leave the backend. The response only contains a
 *       checkout URL / order id and the *publishable* key needed by the
 *       frontend SDK.
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceId, provider]
 *             properties:
 *               invoiceId:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [STRIPE, RAZORPAY]
 *     responses:
 *       201:
 *         description: Pending payment record + provider checkout session reference
 */

/**
 * @swagger
 * /api/finance/reimbursements:
 *   get:
 *     summary: List employee reimbursements
 *     tags: [Finance]
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
 *           enum: [PENDING, APPROVED, REJECTED, PAID]
 *     responses:
 *       200:
 *         description: List of reimbursement claims
 *   post:
 *     summary: Submit a reimbursement claim (employee self-service)
 *     tags: [Finance]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, description, amount, expenseDate]
 *             properties:
 *               category:
 *                 type: string
 *                 example: Travel
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               expenseDate:
 *                 type: string
 *                 format: date
 *               receiptFileId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reimbursement submitted with status PENDING
 */

/**
 * @swagger
 * /api/finance/reimbursements/{id}/review:
 *   post:
 *     summary: Approve or reject a reimbursement claim
 *     tags: [Finance]
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
 *     responses:
 *       200:
 *         description: Reimbursement reviewed
 */

/**
 * @swagger
 * /api/finance/reimbursements/{id}/mark-paid:
 *   post:
 *     summary: Mark an approved reimbursement as paid
 *     tags: [Finance]
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
 *         description: Reimbursement status set to PAID
 */

export {};
