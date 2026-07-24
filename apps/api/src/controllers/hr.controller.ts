import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../lib/response";
import { hrService } from "../services/hr.service";
import { portalService } from "../services/hr.service";

export class HrController {
  getDashboard = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await hrService.getHrDashboard();
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 500, { code: "HR_DASHBOARD_FAILED", message: "Failed to load HR dashboard" });
    }
  };

  listEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
      const employees = await hrService.listEmployees(req.query as { lifecycleState?: string; search?: string });
      sendSuccess(res, employees);
    } catch (error) {
      sendError(res, 500, { code: "LIST_EMPLOYEES_FAILED", message: "Failed to list employees" });
    }
  };

  getEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const employee = await hrService.getEmployee(req.params.id);
      if (!employee) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Employee not found" });
        return;
      }
      sendSuccess(res, employee);
    } catch (error) {
      sendError(res, 500, { code: "GET_EMPLOYEE_FAILED", message: "Failed to get employee" });
    }
  };

  updateLifecycle = async (req: Request, res: Response): Promise<void> => {
    try {
      const employee = await hrService.updateLifecycleState(
        req.params.id,
        req.body.lifecycleState,
        req.user!.userId,
        req.body.notes,
      );
      sendSuccess(res, employee);
    } catch (error) {
      sendError(res, 400, {
        code: "LIFECYCLE_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Failed to update lifecycle",
      });
    }
  };

  listInterviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const interviews = await hrService.listInterviews(req.query as { from?: string; to?: string });
      sendSuccess(res, interviews);
    } catch (error) {
      sendError(res, 500, { code: "LIST_INTERVIEWS_FAILED", message: "Failed" });
    }
  };

  listOffers = async (req: Request, res: Response): Promise<void> => {
    try {
      const offers = await hrService.listOffers(req.query as { status?: string });
      sendSuccess(res, offers);
    } catch (error) {
      sendError(res, 500, { code: "LIST_OFFERS_FAILED", message: "Failed" });
    }
  };

  listPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
      const policies = await hrService.listPolicies(req.query as { status?: string });
      sendSuccess(res, policies);
    } catch (error) {
      sendError(res, 500, { code: "LIST_POLICIES_FAILED", message: "Failed" });
    }
  };

  createPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const policy = await hrService.createPolicy(req.body);
      sendSuccess(res, policy, 201);
    } catch (error) {
      sendError(res, 400, { code: "CREATE_POLICY_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  publishPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const policy = await hrService.publishPolicy(req.params.id, req.user!.userId);
      sendSuccess(res, policy);
    } catch (error) {
      sendError(res, 400, { code: "PUBLISH_POLICY_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  listAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      const assets = await hrService.listAssets(req.query as { status?: string; employeeId?: string });
      sendSuccess(res, assets);
    } catch (error) {
      sendError(res, 500, { code: "LIST_ASSETS_FAILED", message: "Failed" });
    }
  };

  createAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      const asset = await hrService.createAsset(req.body);
      sendSuccess(res, asset, 201);
    } catch (error) {
      sendError(res, 400, { code: "CREATE_ASSET_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  assignAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      const asset = await hrService.assignAsset(req.params.id, req.body.employeeId, req.user!.userId);
      sendSuccess(res, asset);
    } catch (error) {
      sendError(res, 400, { code: "ASSIGN_ASSET_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };
}

export class PortalController {
  getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await portalService.getDashboard(req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 500, { code: "PORTAL_DASHBOARD_FAILED", message: "Failed" });
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const profile = await portalService.getProfile(req.user!.userId);
      sendSuccess(res, profile);
    } catch (error) {
      sendError(res, 500, { code: "GET_PROFILE_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const profile = await portalService.updateOwnProfile(req.user!.userId, req.body);
      sendSuccess(res, profile);
    } catch (error) {
      sendError(res, 400, { code: "UPDATE_PROFILE_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  listNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const notifications = await portalService.listNotifications(req.user!.userId);
      sendSuccess(res, notifications);
    } catch (error) {
      sendError(res, 500, { code: "LIST_NOTIFICATIONS_FAILED", message: "Failed" });
    }
  };

  markNotificationRead = async (req: Request, res: Response): Promise<void> => {
    try {
      await portalService.markNotificationRead(req.user!.userId, req.params.id);
      sendSuccess(res, { ok: true });
    } catch (error) {
      sendError(res, 400, { code: "MARK_READ_FAILED", message: "Failed" });
    }
  };

  listTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const tickets = await portalService.listTickets(req.user!.userId);
      sendSuccess(res, tickets);
    } catch (error) {
      sendError(res, 500, { code: "LIST_TICKETS_FAILED", message: "Failed" });
    }
  };

  createTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket = await portalService.createTicket(req.user!.userId, req.body);
      sendSuccess(res, ticket, 201);
    } catch (error) {
      sendError(res, 400, { code: "CREATE_TICKET_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  listMyAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      const assets = await portalService.listMyAssets(req.user!.userId);
      sendSuccess(res, assets);
    } catch (error) {
      sendError(res, 500, { code: "LIST_MY_ASSETS_FAILED", message: "Failed" });
    }
  };

  listPolicies = async (_req: Request, res: Response): Promise<void> => {
    try {
      const policies = await portalService.listPublishedPolicies();
      sendSuccess(res, policies);
    } catch (error) {
      sendError(res, 500, { code: "LIST_POLICIES_FAILED", message: "Failed" });
    }
  };
}
