import { z } from "zod";

export const createProjectSchema = z.object({
  leadId: z.string().optional(),
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  budget: z.number().positive().optional(),
  currency: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  managerId: z.string().optional(),
  clientName: z.string().optional(),
  clientContactId: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  budget: z.number().positive().nullable().optional(),
  currency: z.string().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  managerId: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  clientContactId: z.string().nullable().optional(),
});

export const listProjectsQuerySchema = z.object({
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  managerId: z.string().optional(),
  search: z.string().optional(),
});

export const createMilestoneSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const listMilestonesQuerySchema = z.object({
  projectId: z.string().optional(),
});

export const createTaskSchema = z.object({
  projectId: z.string(),
  milestoneId: z.string().optional(),
  sprintId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().optional(),
  reporterId: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
  milestoneId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  estimatedHours: z.number().positive().nullable().optional(),
  actualHours: z.number().positive().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const listTasksQuerySchema = z.object({
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  sprintId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional(),
  search: z.string().optional(),
});

export const createSprintSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  goal: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateSprintSchema = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().nullable().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

export const listSprintsQuerySchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export const createTimeEntrySchema = z.object({
  taskId: z.string(),
  userId: z.string(),
  hours: z.number().positive(),
  date: z.string().datetime(),
  description: z.string().optional(),
});

export const updateTimeEntrySchema = z.object({
  hours: z.number().positive().optional(),
  date: z.string().datetime().optional(),
  description: z.string().nullable().optional(),
});

export const listTimeEntriesQuerySchema = z.object({
  taskId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const createTaskCommentSchema = z.object({
  taskId: z.string(),
  userId: z.string(),
  content: z.string().min(1),
});

export const allocateTeamMemberSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  role: z.string().optional(),
  allocatedHours: z.number().positive().optional(),
});

export const updateTeamAllocationSchema = z.object({
  role: z.string().nullable().optional(),
  allocatedHours: z.number().positive().nullable().optional(),
  leftAt: z.string().datetime().nullable().optional(),
});

export const listTeamAllocationsQuerySchema = z.object({
  projectId: z.string().optional(),
  userId: z.string().optional(),
});

export const createBudgetEntrySchema = z.object({
  projectId: z.string(),
  category: z.string().min(1),
  amount: z.number(),
  description: z.string().optional(),
  date: z.string().datetime(),
});

export const updateBudgetEntrySchema = z.object({
  category: z.string().min(1).optional(),
  amount: z.number().optional(),
  description: z.string().nullable().optional(),
  date: z.string().datetime().optional(),
});
