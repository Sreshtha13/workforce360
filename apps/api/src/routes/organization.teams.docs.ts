/**
 * Organization — Teams OpenAPI docs.
 */

/**
 * @swagger
 * /api/organization/teams:
 *   get:
 *     summary: List all teams
 *     tags: [Organization - Teams]
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
 *       401:
 *         description: Not authenticated
 *   post:
 *     summary: Create team
 *     description: |
 *       Creates a team under a department. When `leadId` is provided, the backend
 *       validates that the user is active and belongs to the same department.
 *     tags: [Organization - Teams]
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
 *               departmentId:
 *                 type: string
 *                 description: Department the team belongs to
 *               name:
 *                 type: string
 *                 example: Platform Engineering
 *               code:
 *                 type: string
 *                 description: Optional unique code within the department
 *               description:
 *                 type: string
 *               leadId:
 *                 type: string
 *                 description: Optional team lead; must be an active employee in the same department
 *     responses:
 *       201:
 *         description: Team created
 *       400:
 *         description: Validation failed, duplicate code, or team lead not in department
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       enum:
 *                         - VALIDATION_ERROR
 *                         - INVALID_TEAM_LEAD
 *                         - DUPLICATE_TEAM_CODE
 *                         - INVALID_TEAM_REFERENCE
 *                         - CREATE_TEAM_FAILED
 *                     message:
 *                       type: string
 *                       example: Team lead must belong to the selected department
 *       403:
 *         description: Requires team.create
 *       404:
 *         description: Department not found
 */

/**
 * @swagger
 * /api/organization/teams/{id}:
 *   get:
 *     summary: Get team by ID
 *     tags: [Organization - Teams]
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
 *     description: |
 *       Updates team details. When `departmentId` or `leadId` changes, the backend
 *       re-validates that the team lead belongs to the target department.
 *       Pass `leadId` as `null` to remove the current team lead.
 *     tags: [Organization - Teams]
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
 *               departmentId:
 *                 type: string
 *                 description: Move team to another department
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               leadId:
 *                 type: string
 *                 nullable: true
 *                 description: Team lead user ID, or null to clear
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Validation failed, duplicate code, or team lead not in department
 *       403:
 *         description: Requires team.update
 *       404:
 *         description: Team or department not found
 *   delete:
 *     summary: Soft-delete team
 *     tags: [Organization - Teams]
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
