/**
 * Storage OpenAPI documentation — Phase 2/13.
 */

/**
 * @swagger
 * /api/storage/presign:
 *   post:
 *     summary: Request presigned upload URL (backend-mediated — no storage secrets in frontend)
 *     tags: [Storage]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [purpose, mimeType, sizeBytes]
 *             properties:
 *               purpose:
 *                 type: string
 *                 example: document
 *               mimeType:
 *                 type: string
 *                 example: application/pdf
 *               sizeBytes:
 *                 type: integer
 *               originalName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presign token and upload URL
 */

/**
 * @swagger
 * /api/storage/confirm:
 *   post:
 *     summary: Confirm upload and register file record
 *     tags: [Storage]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uploadToken]
 *             properties:
 *               uploadToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: File record created
 */

/**
 * @swagger
 * /api/storage/upload/{uploadToken}:
 *   put:
 *     summary: Local dev upload endpoint (raw body; not used for S3)
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: uploadToken
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/octet-stream:
 *           schema:
 *             type: string
 *             format: binary
 *     responses:
 *       200:
 *         description: File stored locally
 */
