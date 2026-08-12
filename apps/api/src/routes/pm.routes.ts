import { Router } from "express";
import { PmController } from "../controllers/pm.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  listMilestonesQuerySchema,
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  createSprintSchema,
  updateSprintSchema,
  listSprintsQuerySchema,
  createTimeEntrySchema,
  updateTimeEntrySchema,
  listTimeEntriesQuerySchema,
  createTaskCommentSchema,
  allocateTeamMemberSchema,
  updateTeamAllocationSchema,
  listTeamAllocationsQuerySchema,
  createBudgetEntrySchema,
  updateBudgetEntrySchema,
} from "../schemas/pm.schema";

const router = Router();
const controller = new PmController();

router.get(
  "/projects",
  requireAuth,
  requirePermission("pm.project.read"),
  validate(listProjectsQuerySchema, "query"),
  controller.listProjects,
);
router.get(
  "/projects/:id",
  requireAuth,
  requirePermission("pm.project.read"),
  controller.getProject,
);
router.post(
  "/projects",
  requireAuth,
  requirePermission("pm.project.create"),
  validate(createProjectSchema),
  controller.createProject,
);
router.patch(
  "/projects/:id",
  requireAuth,
  requirePermission("pm.project.update"),
  validate(updateProjectSchema),
  controller.updateProject,
);

router.get(
  "/projects/:projectId/report",
  requireAuth,
  requirePermission("pm.project.read"),
  controller.getProjectReport,
);

router.get(
  "/milestones",
  requireAuth,
  requirePermission("pm.milestone.read"),
  validate(listMilestonesQuerySchema, "query"),
  controller.listMilestones,
);
router.get(
  "/milestones/:id",
  requireAuth,
  requirePermission("pm.milestone.read"),
  controller.getMilestone,
);
router.post(
  "/milestones",
  requireAuth,
  requirePermission("pm.milestone.create"),
  validate(createMilestoneSchema),
  controller.createMilestone,
);
router.patch(
  "/milestones/:id",
  requireAuth,
  requirePermission("pm.milestone.update"),
  validate(updateMilestoneSchema),
  controller.updateMilestone,
);

router.get(
  "/tasks",
  requireAuth,
  requirePermission("pm.task.read"),
  validate(listTasksQuerySchema, "query"),
  controller.listTasks,
);
router.get(
  "/tasks/:id",
  requireAuth,
  requirePermission("pm.task.read"),
  controller.getTask,
);
router.post(
  "/tasks",
  requireAuth,
  requirePermission("pm.task.create"),
  validate(createTaskSchema),
  controller.createTask,
);
router.patch(
  "/tasks/:id",
  requireAuth,
  requirePermission("pm.task.update"),
  validate(updateTaskSchema),
  controller.updateTask,
);

router.post(
  "/tasks/comments",
  requireAuth,
  requirePermission("pm.task.update"),
  validate(createTaskCommentSchema),
  controller.createComment,
);

router.get(
  "/sprints",
  requireAuth,
  requirePermission("pm.sprint.read"),
  validate(listSprintsQuerySchema, "query"),
  controller.listSprints,
);
router.get(
  "/sprints/:id",
  requireAuth,
  requirePermission("pm.sprint.read"),
  controller.getSprint,
);
router.post(
  "/sprints",
  requireAuth,
  requirePermission("pm.sprint.create"),
  validate(createSprintSchema),
  controller.createSprint,
);
router.patch(
  "/sprints/:id",
  requireAuth,
  requirePermission("pm.sprint.update"),
  validate(updateSprintSchema),
  controller.updateSprint,
);

router.get(
  "/time-entries",
  requireAuth,
  requirePermission("pm.time.read"),
  validate(listTimeEntriesQuerySchema, "query"),
  controller.listTimeEntries,
);
router.post(
  "/time-entries",
  requireAuth,
  requirePermission("pm.time.create"),
  validate(createTimeEntrySchema),
  controller.createTimeEntry,
);
router.patch(
  "/time-entries/:id",
  requireAuth,
  requirePermission("pm.time.update"),
  validate(updateTimeEntrySchema),
  controller.updateTimeEntry,
);

router.get(
  "/team-allocations",
  requireAuth,
  requirePermission("pm.team.read"),
  validate(listTeamAllocationsQuerySchema, "query"),
  controller.listTeamAllocations,
);
router.post(
  "/team-allocations",
  requireAuth,
  requirePermission("pm.team.create"),
  validate(allocateTeamMemberSchema),
  controller.allocateTeamMember,
);
router.patch(
  "/team-allocations/:id",
  requireAuth,
  requirePermission("pm.team.update"),
  validate(updateTeamAllocationSchema),
  controller.updateTeamAllocation,
);

router.get(
  "/projects/:projectId/budget",
  requireAuth,
  requirePermission("pm.budget.read"),
  controller.listBudgetEntries,
);
router.post(
  "/budget",
  requireAuth,
  requirePermission("pm.budget.create"),
  validate(createBudgetEntrySchema),
  controller.createBudgetEntry,
);
router.patch(
  "/budget/:id",
  requireAuth,
  requirePermission("pm.budget.update"),
  validate(updateBudgetEntrySchema),
  controller.updateBudgetEntry,
);

export default router;
