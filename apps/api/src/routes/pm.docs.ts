/**
 * Project Management OpenAPI documentation — Phase 6.
 */

/**
 * @swagger
 * /api/pm/projects:
 *   get:
 *     summary: List projects
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Project list
 *   post:
 *     summary: Create project
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Project created
 */

/**
 * @swagger
 * /api/pm/projects/{id}:
 *   get:
 *     summary: Get project detail
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project detail
 *   patch:
 *     summary: Update project
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project updated
 */

/**
 * @swagger
 * /api/pm/projects/{projectId}/report:
 *   get:
 *     summary: Project status report
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project report
 */

/**
 * @swagger
 * /api/pm/projects/{projectId}/budget:
 *   get:
 *     summary: List project budget entries
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Budget entries
 */

/**
 * @swagger
 * /api/pm/milestones:
 *   get:
 *     summary: List milestones
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Milestone list
 *   post:
 *     summary: Create milestone
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Milestone created
 */

/**
 * @swagger
 * /api/pm/milestones/{id}:
 *   get:
 *     summary: Get milestone
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Milestone detail
 *   patch:
 *     summary: Update milestone
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Milestone updated
 */

/**
 * @swagger
 * /api/pm/tasks:
 *   get:
 *     summary: List tasks
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Task list
 *   post:
 *     summary: Create task
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Task created
 */

/**
 * @swagger
 * /api/pm/tasks/{id}:
 *   get:
 *     summary: Get task
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task detail
 *   patch:
 *     summary: Update task
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task updated
 */

/**
 * @swagger
 * /api/pm/tasks/comments:
 *   post:
 *     summary: Add comment to task
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Comment created
 */

/**
 * @swagger
 * /api/pm/sprints:
 *   get:
 *     summary: List sprints
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Sprint list
 *   post:
 *     summary: Create sprint
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Sprint created
 */

/**
 * @swagger
 * /api/pm/sprints/{id}:
 *   get:
 *     summary: Get sprint
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sprint detail
 *   patch:
 *     summary: Update sprint
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sprint updated
 */

/**
 * @swagger
 * /api/pm/time-entries:
 *   get:
 *     summary: List time entries (timesheets)
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Time entry list
 *   post:
 *     summary: Log time entry
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Time entry created
 */

/**
 * @swagger
 * /api/pm/time-entries/{id}:
 *   patch:
 *     summary: Update time entry
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Time entry updated
 */

/**
 * @swagger
 * /api/pm/team-allocations:
 *   get:
 *     summary: List team allocations
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Allocation list
 *   post:
 *     summary: Allocate team member to project
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Allocation created
 */

/**
 * @swagger
 * /api/pm/team-allocations/{id}:
 *   patch:
 *     summary: Update team allocation
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Allocation updated
 */

/**
 * @swagger
 * /api/pm/budget:
 *   post:
 *     summary: Create budget entry
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Budget entry created
 */

/**
 * @swagger
 * /api/pm/budget/{id}:
 *   patch:
 *     summary: Update budget entry
 *     tags: [Project Management]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Budget entry updated
 */
