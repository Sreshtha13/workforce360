import type { Prisma, ProjectStatus, TaskStatus, TaskPriority, SprintStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

export class PmRepository {
  listProjects(filters?: { status?: ProjectStatus; managerId?: string; search?: string }) {
    const where: Prisma.ProjectWhereInput = { deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.managerId) where.managerId = filters.managerId;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
        { clientName: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return prisma.project.findMany({
      where,
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        clientContact: { select: { id: true, firstName: true, lastName: true, email: true } },
        lead: { select: { id: true, title: true, status: true } },
        _count: { select: { tasks: true, milestones: true, sprints: true, teamAllocations: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findProjectById(id: string) {
    return prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        clientContact: true,
        lead: true,
        milestones: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        tasks: {
          where: { deletedAt: null },
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        sprints: {
          where: { deletedAt: null },
          orderBy: { startDate: "desc" },
        },
        teamAllocations: {
          where: { deletedAt: null, leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                designation: { select: { name: true } },
              },
            },
          },
        },
        budgetTracking: {
          where: { deletedAt: null },
          orderBy: { date: "desc" },
        },
      },
    });
  }

  createProject(data: Prisma.ProjectCreateInput) {
    return prisma.project.create({
      data,
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        clientContact: true,
      },
    });
  }

  updateProject(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({
      where: { id },
      data,
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        clientContact: true,
      },
    });
  }

  listMilestones(filters?: { projectId?: string }) {
    const where: Prisma.MilestoneWhereInput = { deletedAt: null };
    if (filters?.projectId) where.projectId = filters.projectId;
    return prisma.milestone.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  findMilestoneById(id: string) {
    return prisma.milestone.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        tasks: {
          where: { deletedAt: null },
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  }

  createMilestone(data: Prisma.MilestoneCreateInput) {
    return prisma.milestone.create({ data });
  }

  updateMilestone(id: string, data: Prisma.MilestoneUpdateInput) {
    return prisma.milestone.update({ where: { id }, data });
  }

  listTasks(filters?: {
    projectId?: string;
    milestoneId?: string;
    sprintId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    search?: string;
  }) {
    const where: Prisma.TaskWhereInput = { deletedAt: null };
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.milestoneId) where.milestoneId = filters.milestoneId;
    if (filters?.sprintId) where.sprintId = filters.sprintId;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        milestone: { select: { id: true, title: true } },
        sprint: { select: { id: true, name: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { timeEntries: true, comments: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  findTaskById(id: string) {
    return prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        milestone: { select: { id: true, title: true } },
        sprint: { select: { id: true, name: true, status: true } },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        timeEntries: {
          where: { deletedAt: null },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { date: "desc" },
        },
        comments: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  createTask(data: Prisma.TaskCreateInput) {
    return prisma.task.create({
      data,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  updateTask(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  listSprints(filters?: { projectId?: string; status?: SprintStatus }) {
    const where: Prisma.SprintWhereInput = { deletedAt: null };
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    return prisma.sprint.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { startDate: "desc" },
    });
  }

  findSprintById(id: string) {
    return prisma.sprint.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, code: true } },
        tasks: {
          where: { deletedAt: null },
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: [{ status: "asc" }, { sortOrder: "asc" }],
        },
      },
    });
  }

  createSprint(data: Prisma.SprintCreateInput) {
    return prisma.sprint.create({ data });
  }

  updateSprint(id: string, data: Prisma.SprintUpdateInput) {
    return prisma.sprint.update({ where: { id }, data });
  }

  listTimeEntries(filters?: { taskId?: string; userId?: string; startDate?: Date; endDate?: Date }) {
    const where: Prisma.TaskTimeEntryWhereInput = { deletedAt: null };
    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }
    return prisma.taskTimeEntry.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true, code: true } },
          },
        },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { date: "desc" },
    });
  }

  createTimeEntry(data: Prisma.TaskTimeEntryCreateInput) {
    return prisma.taskTimeEntry.create({
      data,
      include: {
        task: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  updateTimeEntry(id: string, data: Prisma.TaskTimeEntryUpdateInput) {
    return prisma.taskTimeEntry.update({
      where: { id },
      data,
      include: {
        task: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  createComment(data: Prisma.TaskCommentCreateInput) {
    return prisma.taskComment.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  listTeamAllocations(filters?: { projectId?: string; userId?: string }) {
    const where: Prisma.ProjectTeamAllocationWhereInput = { deletedAt: null };
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.userId) where.userId = filters.userId;
    return prisma.projectTeamAllocation.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            designation: { select: { name: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
  }

  createTeamAllocation(data: Prisma.ProjectTeamAllocationCreateInput) {
    return prisma.projectTeamAllocation.create({
      data,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  updateTeamAllocation(id: string, data: Prisma.ProjectTeamAllocationUpdateInput) {
    return prisma.projectTeamAllocation.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  listBudgetEntries(projectId: string) {
    return prisma.projectBudgetTracking.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { date: "desc" },
    });
  }

  createBudgetEntry(data: Prisma.ProjectBudgetTrackingCreateInput) {
    return prisma.projectBudgetTracking.create({ data });
  }

  updateBudgetEntry(id: string, data: Prisma.ProjectBudgetTrackingUpdateInput) {
    return prisma.projectBudgetTracking.update({ where: { id }, data });
  }
}
