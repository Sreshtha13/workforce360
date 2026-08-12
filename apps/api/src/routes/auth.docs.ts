/**
 * Authentication supplemental OpenAPI documentation — MFA, Google OAuth, devices.
 */

/**
 * @swagger
 * /api/auth/google/url:
 *   get:
 *     summary: Get Google OAuth authorization URL
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: enabled flag and redirect URL when configured
 */

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback (sets session cookies, redirects to frontend)
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema: { type: string }
 *     responses:
 *       302:
 *         description: Redirect to dashboard or MFA login
 */

/**
 * @swagger
 * /api/auth/mfa/verify:
 *   post:
 *     summary: Verify MFA code after login challenge
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mfaToken, code]
 *             properties:
 *               mfaToken: { type: string }
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Session established
 */

/**
 * @swagger
 * /api/auth/mfa/setup-challenge:
 *   post:
 *     summary: Begin MFA setup during login challenge
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: QR code data URL for authenticator app
 */

/**
 * @swagger
 * /api/auth/mfa/enable-challenge:
 *   post:
 *     summary: Enable MFA during login challenge
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: MFA enabled with backup codes
 */

/**
 * @swagger
 * /api/auth/mfa/setup:
 *   post:
 *     summary: Begin MFA setup (authenticated)
 *     tags: [Authentication]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: QR code for setup
 */

/**
 * @swagger
 * /api/auth/mfa/enable:
 *   post:
 *     summary: Enable MFA (authenticated)
 *     tags: [Authentication]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: MFA enabled
 */

/**
 * @swagger
 * /api/auth/mfa/disable:
 *   post:
 *     summary: Disable MFA (authenticated)
 *     tags: [Authentication]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: MFA disabled
 */

/**
 * @swagger
 * /api/auth/mfa/status:
 *   get:
 *     summary: Get MFA status for current user
 *     tags: [Authentication]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: MFA enabled/required state
 */

/**
 * @swagger
 * /api/auth/devices:
 *   get:
 *     summary: List trusted devices
 *     tags: [Authentication]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Device list
 */

/**
 * @swagger
 * /api/auth/devices/{id}:
 *   delete:
 *     summary: Revoke trusted device
 *     tags: [Authentication]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device revoked
 */
