import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";
import { sendSuccess, sendError } from "../lib/response";

export class DashboardController {
  getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const data = await dashboardService.getAdminDashboard(search);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 500, {
        code: "DASHBOARD_FAILED",
        message: error instanceof Error ? error.message : "Failed to load dashboard",
      });
    }
  };

  listActiveEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const data = await dashboardService.listActiveEmployeesPreview(search);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 500, {
        code: "EMPLOYEES_PREVIEW_FAILED",
        message: error instanceof Error ? error.message : "Failed to load employees",
      });
    }
  };

  search = async (req: Request, res: Response): Promise<void> => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      if (!q) {
        sendSuccess(res, { employees: [], departments: [] });
        return;
      }
      const data = await dashboardService.search(q);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 500, {
        code: "DASHBOARD_SEARCH_FAILED",
        message: error instanceof Error ? error.message : "Search failed",
      });
    }
  };
}

export const dashboardController = new DashboardController();
