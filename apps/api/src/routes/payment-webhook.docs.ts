/**
 * Payment webhook OpenAPI documentation — Phase 4/13.
 * These endpoints use provider signature verification (raw body).
 */

/**
 * @swagger
 * /api/payment-webhooks/stripe:
 *   post:
 *     summary: Stripe webhook handler (checkout.session.completed, etc.)
 *     tags: [Payment Webhooks]
 *     description: Requires Stripe-Signature header. Registered in Stripe dashboard.
 *     parameters:
 *       - in: header
 *         name: Stripe-Signature
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event processed
 *       400:
 *         description: Invalid signature
 */

/**
 * @swagger
 * /api/payment-webhooks/razorpay:
 *   post:
 *     summary: Razorpay webhook handler
 *     tags: [Payment Webhooks]
 *     description: Requires X-Razorpay-Signature header (HMAC-SHA256).
 *     parameters:
 *       - in: header
 *         name: X-Razorpay-Signature
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event processed
 *       400:
 *         description: Invalid signature
 */
