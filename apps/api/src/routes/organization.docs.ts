/**
 * Organization structure OpenAPI docs.
 * Kept separate so route files stay readable; swagger-jsdoc still picks these up.
 */

/**
 * @swagger
 * /api/organization/departments:
 *   get:
 *     summary: List all departments
 *     tags: [Organization]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter by company ID
 *     responses:
 *       200:
 *         description: List of departments
 *       401:
 *         description: Not authenticated
 *   post:
 *     summary: Create department
 *     tags: [Organization]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyId, name]
 *             properties:
 *               companyId: { type: string, example: default-company }
 *               name: { type: string, example: Engineering }
 *               code: { type: string, example: ENG }
 *               description: { type: string }
 *               managerId: { type: string }
 *               parentId: { type: string }
 *     responses:
 *       201:
 *         description: Department created
 *       403:
 *         description: Requires department.create
 */

/**
 * @swagger
 * /api/organization/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Organization]
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
 *         description: Department details
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update department
 *     tags: [Organization]
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
 *               name: { type: string }
 *               code: { type: string }
 *               description: { type: string }
 *               managerId: { type: string }
 *               parentId: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *       403:
 *         description: Requires department.update
 *   delete:
 *     summary: Soft-delete department
 *     tags: [Organization]
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
 *         description: Soft-deleted
 *       403:
 *         description: Requires department.delete
 */

/**
 * @swagger
 * /api/organization/teams:
 *   get:
 *     summary: List all teams
 *     tags: [Organization]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of teams
 *   post:
 *     summary: Create team
 *     tags: [Organization]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [departmentId, name]
 *             properties:
 *               departmentId: { type: string }
 *               name: { type: string }
 *               code: { type: string }
 *               description: { type: string }
 *               leadId: { type: string }
 *     responses:
 *       201:
 *         description: Team created
 *       403:
 *         description: Requires team.create
 */

/**
 * @swagger
 * /api/organization/teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Organization]
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
 *         description: Team details
 *   put:
 *     summary: Update team
 *     tags: [Organization]
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
 *               name: { type: string }
 *               code: { type: string }
 *               description: { type: string }
 *               leadId: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Soft-delete team
 *     tags: [Organization]
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
 *         description: Soft-deleted
 */

/**
 * @swagger
 * /api/organization/designations:
 *   get:
 *     summary: List all designations
 *     tags: [Organization]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of designations
 *   post:
 *     summary: Create designation
 *     tags: [Organization]
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
 *               name: { type: string, example: Software Engineer }
 *               code: { type: string, example: SE }
 *               level: { type: integer, example: 3 }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Designation created
 */

/**
 * @swagger
 * /api/organization/designations/{id}:
 *   get:
 *     summary: Get designation by ID
 *     tags: [Organization]
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
 *         description: Designation details
 *   put:
 *     summary: Update designation
 *     tags: [Organization]
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
 *               name: { type: string }
 *               code: { type: string }
 *               level: { type: integer }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Soft-delete designation
 *     tags: [Organization]
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
 *         description: Soft-deleted
 */

/**
 * @swagger
 * /api/organization/offices:
 *   get:
 *     summary: List all offices / branches
 *     tags: [Organization]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of offices
 *   post:
 *     summary: Create office
 *     tags: [Organization]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyId, name]
 *             properties:
 *               companyId: { type: string, example: default-company }
 *               name: { type: string, example: HQ }
 *               code: { type: string }
 *               type: { type: string, example: headquarters }
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               postalCode: { type: string }
 *               phone: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       201:
 *         description: Office created
 */

/**
 * @swagger
 * /api/organization/offices/{id}:
 *   get:
 *     summary: Get office by ID
 *     tags: [Organization]
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
 *         description: Office details
 *   put:
 *     summary: Update office
 *     tags: [Organization]
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
 *               name: { type: string }
 *               code: { type: string }
 *               city: { type: string }
 *               country: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Soft-delete office
 *     tags: [Organization]
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
 *         description: Soft-deleted
 */

/**
 * @swagger
 * /api/organization/employee-types:
 *   get:
 *     summary: List employee types
 *     tags: [Organization]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full-Time, Part-Time, Contract, etc.
 *   post:
 *     summary: Create employee type
 *     tags: [Organization]
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
 *               name: { type: string }
 *               code: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/organization/employee-types/{id}:
 *   get:
 *     summary: Get employee type by ID
 *     tags: [Organization]
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
 *         description: Employee type details
 *   put:
 *     summary: Update employee type
 *     tags: [Organization]
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
 *               name: { type: string }
 *               code: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Soft-delete employee type
 *     tags: [Organization]
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
 *         description: Soft-deleted
 */

/**
 * @swagger
 * /api/organization/employment-statuses:
 *   get:
 *     summary: List employment statuses
 *     tags: [Organization]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active, On Leave, etc.
 *   post:
 *     summary: Create employment status
 *     tags: [Organization]
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
 *               name: { type: string }
 *               code: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /api/organization/employment-statuses/{id}:
 *   get:
 *     summary: Get employment status by ID
 *     tags: [Organization]
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
 *         description: Status details
 *   put:
 *     summary: Update employment status
 *     tags: [Organization]
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
 *               name: { type: string }
 *               code: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Soft-delete employment status
 *     tags: [Organization]
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
 *         description: Soft-deleted
 */

export {};
