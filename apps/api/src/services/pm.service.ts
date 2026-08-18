import type { Prisma, ProjectStatus, TaskStatus, TaskPriority, SprintStatus } from "@prisma/client";
import { PmRepository } from "../repositories/pm.repository";
import { writeAuditLog } from "../lib/audit";

export class PmService {
  private repo = new PmRepository();

  listProjects(filters?: { status?: ProjectStatus; managerId?: string; search?: string }) {
    return this.repo.listProjects(filters);
  }

  getProject(id: string) {
    return this.repo.findProjectById(id);
  }

  async createProject(input: {
    leadId?: string;
    name: string;
    code?: string;
    description?: string;
    status?: ProjectStatus;
    budget?: number;
    currency?: string;
    startDate?: string;
    endDate?: string;
    managerId?: string;
    clientName?: string;
    clientContactId?: string;
  }) {
    const data: Prisma.ProjectCreateInput = {
      name: input.name,
      code: input.code,
      description: input.description,
      status: input.status ?? "PLANNING",
      budget: input.budget,
      currency: input.currency ?? "USD",
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      clientName: input.clientName,
    };

    if (input.leadId) {
      data.lead = { connect: { id: input.leadId } };
    }
    if (input.managerId) {
      data.manager = { connect: { id: input.managerId } };
    }
    if (input.clientContactId) {
      data.clientContact = { connect: { id: input.clientContactId } };
    }

    return this.repo.createProject(data);
  }

  async updateProject(
    id: string,
    input: Partial<{
      name: string;
      code: string | null;
      description: string | null;
      status: ProjectStatus;
      budget: number | null;
      currency: string;
      startDate: string | null;
      endDate: string | null;
      managerId: string | null;
      clientName: string | null;
      clientContactId: string | null;
    }>,
    actorId: string,
  ) {
    const project = await this.repo.findProjectById(id);
    if (!project) throw new Error("Project not found");

    const data = { ...input } as Prisma.ProjectUpdateInput;
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate) data.endDate = new Date(input.endDate);

    const updated = await this.repo.updateProject(id, data);

    await writeAuditLog({
      userId: actorId,
      action: "update_project",
      entity: "project",
      entityId: id,
      before: { status: project.status },
      after: { status: input.status },
    });

    return updated;
  }

  listMilestones(filters?: { projectId?: string }) {
    return this.repo.listMilestones(filters);
  }

  getMilestone(id: string) {
    return this.repo.findMilestoneById(id);
  }

  async createMilestone(input: {
    projectId: string;
    title: string;
    description?: string;
    dueDate?: string;
    sortOrder?: number;
  }) {
    const data: Prisma.MilestoneCreateInput = {
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      sortOrder: input.sortOrder ?? 0,
      project: { connect: { id: input.projectId } },
    };

    return this.repo.createMilestone(data);
  }

  async updateMilestone(
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      dueDate: string | null;
      completedAt: string | null;
      sortOrder: number;
    }>,
  ) {
    const data = { ...input } as Prisma.MilestoneUpdateInput;
    if (input.dueDate) data.dueDate = new Date(input.dueDate);
    if (input.completedAt) data.completedAt = new Date(input.completedAt);
    return this.repo.updateMilestone(id, data);
  }

  listTasks(filters?: {
    projectId?: string;
    milestoneId?: string;
    sprintId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    search?: string;
  }) {
    return this.repo.listTasks(filters);
  }

  getTask(id: string) {
    return this.repo.findTaskById(id);
  }

  async createTask(input: {
    projectId: string;
    milestoneId?: string;
    sprintId?: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    reporterId?: string;
    estimatedHours?: number;
    dueDate?: string;
    sortOrder?: number;
  }) {
    const data: Prisma.TaskCreateInput = {
      title: input.title,
      description: input.description,
      status: input.status ?? "TODO",
      priority: input.priority ?? "MEDIUM",
      estimatedHours: input.estimatedHours,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      sortOrder: input.sortOrder ?? 0,
      project: { connect: { id: input.projectId } },
    };

    if (input.milestoneId) {
      data.milestone = { connect: { id: input.milestoneId } };
    }
    if (input.sprintId) {
      data.sprint = { connect: { id: input.sprintId } };
    }
    if (input.assigneeId) {
      data.assignee = { connect: { id: input.assigneeId } };
    }
    if (input.reporterId) {
      data.reporter = { connect: { id: input.reporterId } };
    }

    return this.repo.createTask(data);
  }

  async updateTask(
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      status: TaskStatus;
      priority: TaskPriority;
      assigneeId: string | null;
      milestoneId: string | null;
      sprintId: string | null;
      estimatedHours: number | null;
      actualHours: number | null;
      dueDate: string | null;
      completedAt: string | null;
      sortOrder: number;
    }>,
    actorId: string,
  ) {
    const task = await this.repo.findTaskById(id);
    if (!task) throw new Error("Task not found");

    const data = { ...input } as Prisma.TaskUpdateInput;
    if (input.dueDate) data.dueDate = new Date(input.dueDate);
    if (input.completedAt) data.completedAt = new Date(input.completedAt);

    if (input.status === "DONE" && task.status !== "DONE") {
      data.completedAt = new Date();
    }

    const updated = await this.repo.updateTask(id, data);

    await writeAuditLog({
      userId: actorId,
      action: "update_task",
      entity: "task",
      entityId: id,
      before: { status: task.status },
      after: { status: input.status },
    });

    return updated;
  }

  listSprints(filters?: { projectId?: string; status?: SprintStatus }) {
    return this.repo.listSprints(filters);
  }

  getSprint(id: string) {
    return this.repo.findSprintById(id);
  }

  async createSprint(input: {
    projectId: string;
    name: string;
    goal?: string;
    status?: SprintStatus;
    startDate?: string;
    endDate?: string;
  }) {
    const data: Prisma.SprintCreateInput = {
      name: input.name,
      goal: input.goal,
      status: input.status ?? "PLANNING",
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      project: { connect: { id: input.projectId } },
    };

    return this.repo.createSprint(data);
  }

  async updateSprint(
    id: string,
    input: Partial<{
      name: string;
      goal: string | null;
      status: SprintStatus;
      startDate: string | null;
      endDate: string | null;
      completedAt: string | null;
    }>,
  ) {
    const data = { ...input } as Prisma.SprintUpdateInput;
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate) data.endDate = new Date(input.endDate);
    if (input.completedAt) data.completedAt = new Date(input.completedAt);
    return this.repo.updateSprint(id, data);
  }

  listTimeEntries(filters?: { taskId?: string; userId?: string; startDate?: string; endDate?: string }) {
    const parsedFilters: { taskId?: string; userId?: string; startDate?: Date; endDate?: Date } = {
      taskId: filters?.taskId,
      userId: filters?.userId,
    };
    if (filters?.startDate) parsedFilters.startDate = new Date(filters.startDate);
    if (filters?.endDate) parsedFilters.endDate = new Date(filters.endDate);
    return this.repo.listTimeEntries(parsedFilters);
  }

  async createTimeEntry(input: {
    taskId: string;
    userId: string;
    hours: number;
    date: string;
    description?: string;
  }) {
    const data: Prisma.TaskTimeEntryCreateInput = {
      hours: input.hours,
      date: new Date(input.date),
      description: input.description,
      task: { connect: { id: input.taskId } },
      user: { connect: { id: input.userId } },
    };

    const timeEntry = await this.repo.createTimeEntry(data);

    const task = await this.repo.findTaskById(input.taskId);
    if (task) {
      const totalHours = task.timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
      await this.repo.updateTask(input.taskId, { actualHours: totalHours });
    }

    return timeEntry;
  }

  async updateTimeEntry(
    id: string,
    input: Partial<{
      hours: number;
      date: string;
      description: string | null;
    }>,
  ) {
    const data = { ...input } as Prisma.TaskTimeEntryUpdateInput;
    if (input.date) data.date = new Date(input.date);
    return this.repo.updateTimeEntry(id, data);
  }

  async createComment(input: { taskId: string; userId: string; content: string }) {
    const data: Prisma.TaskCommentCreateInput = {
      content: input.content,
      task: { connect: { id: input.taskId } },
      user: { connect: { id: input.userId } },
    };

    return this.repo.createComment(data);
  }

  listTeamAllocations(filters?: { projectId?: string; userId?: string }) {
    return this.repo.listTeamAllocations(filters);
  }

  async allocateTeamMember(input: {
    projectId: string;
    userId: string;
    role?: string;
    allocatedHours?: number;
  }) {
    const data: Prisma.ProjectTeamAllocationCreateInput = {
      role: input.role,
      allocatedHours: input.allocatedHours,
      project: { connect: { id: input.projectId } },
      user: { connect: { id: input.userId } },
    };

    return this.repo.createTeamAllocation(data);
  }

  async updateTeamAllocation(
    id: string,
    input: Partial<{
      role: string | null;
      allocatedHours: number | null;
      leftAt: string | null;
    }>,
  ) {
    const data = { ...input } as Prisma.ProjectTeamAllocationUpdateInput;
    if (input.leftAt) data.leftAt = new Date(input.leftAt);
    return this.repo.updateTeamAllocation(id, data);
  }

  listBudgetEntries(projectId: string) {
    return this.repo.listBudgetEntries(projectId);
  }

  async createBudgetEntry(input: {
    projectId: string;
    category: string;
    amount: number;
    description?: string;
    date: string;
  }) {
    const data: Prisma.ProjectBudgetTrackingCreateInput = {
      category: input.category,
      amount: input.amount,
      description: input.description,
      date: new Date(input.date),
      project: { connect: { id: input.projectId } },
    };

    return this.repo.createBudgetEntry(data);
  }

  async updateBudgetEntry(
    id: string,
    input: Partial<{
      category: string;
      amount: number;
      description: string | null;
      date: string;
    }>,
  ) {
    const data = { ...input } as Prisma.ProjectBudgetTrackingUpdateInput;
    if (input.date) data.date = new Date(input.date);
    return this.repo.updateBudgetEntry(id, data);
  }

  async getProjectReport(projectId: string) {
    const project = await this.repo.findProjectById(projectId);
    if (!project) throw new Error("Project not found");

    const tasks = await this.repo.listTasks({ projectId });
    const budgetEntries = await this.repo.listBudgetEntries(projectId);

    const tasksByStatus = tasks.reduce((acc: Record<string, number>, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const totalEstimatedHours = tasks.reduce((sum, task) => sum + Number(task.estimatedHours || 0), 0);
    const totalActualHours = tasks.reduce((sum, task) => sum + Number(task.actualHours || 0), 0);
    const totalBudgetSpent = budgetEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

    return {
      project,
      summary: {
        totalTasks: tasks.length,
        tasksByStatus,
        totalEstimatedHours,
        totalActualHours,
        totalBudgetSpent,
        budgetRemaining: project.budget ? Number(project.budget) - totalBudgetSpent : null,
        completionPercentage:
          tasks.length > 0 ? Math.round((tasksByStatus.DONE || 0) / tasks.length * 100) : 0,
      },
    };
  }
}

export const pmService = new PmService();
