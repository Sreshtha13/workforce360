/**
 * Asset Management Module OpenAPI documentation.
 */

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: List all assets
 *     tags: [Asset Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, ASSIGNED, MAINTENANCE, RETIRED]
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of assets with employee details
 *       403:
 *         description: Requires asset.read permission
 *   post:
 *     summary: Create asset
 *     tags: [Asset Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, tag]
 *             properties:
 *               name:
 *                 type: string
 *                 example: MacBook Pro 16"
 *               tag:
 *                 type: string
 *                 example: LAPTOP-001
 *               category:
 *                 type: string
 *                 example: Laptop
 *               serialNumber:
 *                 type: string
 *                 example: C02XJ0V7JG5J
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Asset created (status AVAILABLE, history entry created)
 *       400:
 *         description: Asset tag already exists
 *       403:
 *         description: Requires asset.create permission
 */

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     tags: [Asset Management]
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
 *         description: Asset details with employee info
 *       404:
 *         description: Asset not found
 *   put:
 *     summary: Update asset
 *     tags: [Asset Management]
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
 *               category:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset updated
 *       403:
 *         description: Requires asset.update permission
 *   delete:
 *     summary: Delete asset (soft delete)
 *     tags: [Asset Management]
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
 *         description: Asset deleted
 *       400:
 *         description: Cannot delete assigned asset
 *       403:
 *         description: Requires asset.delete permission
 */

/**
 * @swagger
 * /api/assets/{id}/assign:
 *   post:
 *     summary: Assign asset to employee
 *     tags: [Asset Management]
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
 *             required: [employeeId]
 *             properties:
 *               employeeId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset assigned (status → ASSIGNED, history entry created)
 *       400:
 *         description: Asset not available
 *       403:
 *         description: Requires asset.manage permission
 */

/**
 * @swagger
 * /api/assets/{id}/return:
 *   post:
 *     summary: Return asset from employee
 *     tags: [Asset Management]
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
 *     responses:
 *       200:
 *         description: Asset returned (status → AVAILABLE, history entry created)
 *       400:
 *         description: Asset not currently assigned
 *       403:
 *         description: Requires asset.manage permission
 */

/**
 * @swagger
 * /api/assets/{id}/status:
 *   patch:
 *     summary: Update asset status
 *     tags: [Asset Management]
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
 *                 enum: [AVAILABLE, ASSIGNED, MAINTENANCE, RETIRED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated (history entry created)
 *       400:
 *         description: Cannot set ASSIGNED without employee
 *       403:
 *         description: Requires asset.manage permission
 */

/**
 * @swagger
 * /api/assets/{id}/history:
 *   get:
 *     summary: Get asset history
 *     tags: [Asset Management]
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
 *         description: Complete audit trail (assignments, returns, status changes)
 *       404:
 *         description: Asset not found
 *       403:
 *         description: Requires asset.read permission
 */

/**
 * @swagger
 * /api/assets/history/all:
 *   get:
 *     summary: Get all asset history entries
 *     tags: [Asset Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetId
 *         schema:
 *           type: string
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [ASSIGNED, RETURNED, STATUS_CHANGED, DAMAGED, LOST, MAINTENANCE, RETIRED]
 *     responses:
 *       200:
 *         description: Filtered asset history entries
 *       403:
 *         description: Requires asset.read permission
 */

/**
 * @swagger
 * /api/assets/employee/{employeeId}:
 *   get:
 *     summary: Get assets assigned to employee
 *     tags: [Asset Management]
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
 *         description: List of assets currently assigned to employee
 *       403:
 *         description: Requires asset.read permission
 */

/**
 * @swagger
 * /api/assets/stats/summary:
 *   get:
 *     summary: Get asset statistics
 *     tags: [Asset Management]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asset counts by status (available/assigned/maintenance/retired/total)
 *       403:
 *         description: Requires asset.read permission
 */

export {};
