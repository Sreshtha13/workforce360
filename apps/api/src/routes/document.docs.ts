/**
 * Document Management OpenAPI documentation — Phase 9.
 */

/**
 * @swagger
 * /api/documents/categories:
 *   get:
 *     summary: List document categories
 *     tags: [Documents]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Category list
 *   post:
 *     summary: Create document category
 *     tags: [Documents]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Category created
 */

/**
 * @swagger
 * /api/documents/categories/{id}:
 *   patch:
 *     summary: Update document category
 *     tags: [Documents]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category updated
 *   delete:
 *     summary: Delete document category
 *     tags: [Documents]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted
 */

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List documents
 *     tags: [Documents]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Document list
 *   post:
 *     summary: Create document metadata (attach file via storage presign)
 *     tags: [Documents]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Document created
 */

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document detail
 *     tags: [Documents]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document detail
 *   delete:
 *     summary: Soft-delete document
 *     tags: [Documents]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document deleted
 */

/**
 * @swagger
 * /api/documents/{id}/versions:
 *   post:
 *     summary: Add new document version
 *     tags: [Documents]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Version added
 */

/**
 * @swagger
 * /api/documents/{id}/permissions:
 *   put:
 *     summary: Set document access permissions
 *     tags: [Documents]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Permissions updated
 */
