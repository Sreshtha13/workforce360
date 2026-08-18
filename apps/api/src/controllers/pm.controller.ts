import type { Request, Response } from "express";
import type { ProjectStatus, SprintStatus, TaskStatus } from "@prisma/client";
import { sendSuccess, sendError } from "../lib/response";
import { pmService } from "../services/pm.service";

export class PmController {
  listProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const projects = await pmService.listProjects(
        req.query as { status?: ProjectStatus; managerId?: string; search?: string },
      );
      sendSuccess(res, projects);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_PROJECTS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list projects",
      });
    }
  };

  getProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const project = await pmService.getProject(req.params.id);
      if (!project) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Project not found" });
        return;
      }
      sendSuccess(res, project);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_PROJECT_FAILED",
        message: error instanceof Error ? error.message : "Failed to get project",
      });
    }
  };

  createProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const project = await pmService.createProject(req.body);
      sendSuccess(res, project, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_PROJECT_FAILED",
        message: error instanceof Error ? error.message : "Failed to create project",
      });
    }
  };

  updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "User not authenticated" });
        return;
      }
      const project = await pmService.updateProject(req.params.id, req.body, userId);
      sendSuccess(res, project);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_PROJECT_FAILED",
        message: error instanceof Error ? error.message : "Failed to update project",
      });
    }
  };

  listMilestones = async (req: Request, res: Response): Promise<void> => {
    try {
      const milestones = await pmService.listMilestones(req.query as { projectId?: string });
      sendSuccess(res, milestones);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_MILESTONES_FAILED",
        message: error instanceof Error ? error.message : "Failed to list milestones",
      });
    }
  };

  getMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const milestone = await pmService.getMilestone(req.params.id);
      if (!milestone) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Milestone not found" });
        return;
      }
      sendSuccess(res, milestone);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_MILESTONE_FAILED",
        message: error instanceof Error ? error.message : "Failed to get milestone",
      });
    }
  };

  createMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const milestone = await pmService.createMilestone(req.body);
      sendSuccess(res, milestone, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_MILESTONE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create milestone",
      });
    }
  };

  updateMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const milestone = await pmService.updateMilestone(req.params.id, req.body);
      sendSuccess(res, milestone);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_MILESTONE_FAILED",
        message: error instanceof Error ? error.message : "Failed to update milestone",
      });
    }
  };

  listTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const tasks = await pmService.listTasks(
        req.query as {
          projectId?: string;
          milestoneId?: string;
          sprintId?: string;
          assigneeId?: string;
          status?: TaskStatus;
          search?: string;
        },
      );
      sendSuccess(res, tasks);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_TASKS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list tasks",
      });
    }
  };

  getTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await pmService.getTask(req.params.id);
      if (!task) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Task not found" });
        return;
      }
      sendSuccess(res, task);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_TASK_FAILED",
        message: error instanceof Error ? error.message : "Failed to get task",
      });
    }
  };

  createTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await pmService.createTask(req.body);
      sendSuccess(res, task, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_TASK_FAILED",
        message: error instanceof Error ? error.message : "Failed to create task",
      });
    }
  };

  updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "User not authenticated" });
        return;
      }
      const task = await pmService.updateTask(req.params.id, req.body, userId);
      sendSuccess(res, task);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_TASK_FAILED",
        message: error instanceof Error ? error.message : "Failed to update task",
      });
    }
  };

  listSprints = async (req: Request, res: Response): Promise<void> => {
    try {
      const sprints = await pmService.listSprints(
        req.query as { projectId?: string; status?: SprintStatus },
      );
      sendSuccess(res, sprints);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_SPRINTS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list sprints",
      });
    }
  };

  getSprint = async (req: Request, res: Response): Promise<void> => {
    try {
      const sprint = await pmService.getSprint(req.params.id);
      if (!sprint) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Sprint not found" });
        return;
      }
      sendSuccess(res, sprint);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_SPRINT_FAILED",
        message: error instanceof Error ? error.message : "Failed to get sprint",
      });
    }
  };

  createSprint = async (req: Request, res: Response): Promise<void> => {
    try {
      const sprint = await pmService.createSprint(req.body);
      sendSuccess(res, sprint, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_SPRINT_FAILED",
        message: error instanceof Error ? error.message : "Failed to create sprint",
      });
    }
  };

  updateSprint = async (req: Request, res: Response): Promise<void> => {
    try {
      const sprint = await pmService.updateSprint(req.params.id, req.body);
      sendSuccess(res, sprint);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_SPRINT_FAILED",
        message: error instanceof Error ? error.message : "Failed to update sprint",
      });
    }
  };

  listTimeEntries = async (req: Request, res: Response): Promise<void> => {
    try {
      const entries = await pmService.listTimeEntries(
        req.query as { taskId?: string; userId?: string; startDate?: string; endDate?: string },
      );
      sendSuccess(res, entries);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_TIME_ENTRIES_FAILED",
        message: error instanceof Error ? error.message : "Failed to list time entries",
      });
    }
  };

  createTimeEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const entry = await pmService.createTimeEntry(req.body);
      sendSuccess(res, entry, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_TIME_ENTRY_FAILED",
        message: error instanceof Error ? error.message : "Failed to create time entry",
      });
    }
  };

  updateTimeEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const entry = await pmService.updateTimeEntry(req.params.id, req.body);
      sendSuccess(res, entry);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_TIME_ENTRY_FAILED",
        message: error instanceof Error ? error.message : "Failed to update time entry",
      });
    }
  };

  createComment = async (req: Request, res: Response): Promise<void> => {
    try {
      const comment = await pmService.createComment(req.body);
      sendSuccess(res, comment, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_COMMENT_FAILED",
        message: error instanceof Error ? error.message : "Failed to create comment",
      });
    }
  };

  listTeamAllocations = async (req: Request, res: Response): Promise<void> => {
    try {
      const allocations = await pmService.listTeamAllocations(
        req.query as { projectId?: string; userId?: string },
      );
      sendSuccess(res, allocations);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_TEAM_ALLOCATIONS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list team allocations",
      });
    }
  };

  allocateTeamMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const allocation = await pmService.allocateTeamMember(req.body);
      sendSuccess(res, allocation, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "ALLOCATE_TEAM_MEMBER_FAILED",
        message: error instanceof Error ? error.message : "Failed to allocate team member",
      });
    }
  };

  updateTeamAllocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const allocation = await pmService.updateTeamAllocation(req.params.id, req.body);
      sendSuccess(res, allocation);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_TEAM_ALLOCATION_FAILED",
        message: error instanceof Error ? error.message : "Failed to update team allocation",
      });
    }
  };

  listBudgetEntries = async (req: Request, res: Response): Promise<void> => {
    try {
      const entries = await pmService.listBudgetEntries(req.params.projectId);
      sendSuccess(res, entries);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_BUDGET_ENTRIES_FAILED",
        message: error instanceof Error ? error.message : "Failed to list budget entries",
      });
    }
  };

  createBudgetEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const entry = await pmService.createBudgetEntry(req.body);
      sendSuccess(res, entry, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_BUDGET_ENTRY_FAILED",
        message: error instanceof Error ? error.message : "Failed to create budget entry",
      });
    }
  };

  updateBudgetEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const entry = await pmService.updateBudgetEntry(req.params.id, req.body);
      sendSuccess(res, entry);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_BUDGET_ENTRY_FAILED",
        message: error instanceof Error ? error.message : "Failed to update budget entry",
      });
    }
  };

  getProjectReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await pmService.getProjectReport(req.params.projectId);
      sendSuccess(res, report);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_PROJECT_REPORT_FAILED",
        message: error instanceof Error ? error.message : "Failed to get project report",
      });
    }
  };
}
