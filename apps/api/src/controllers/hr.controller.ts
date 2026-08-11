import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../lib/response";
import { toClientError } from "../lib/app-error";
import { hrService } from "../services/hr.service";
import { portalService } from "../services/hr.service";

export class HrController {
  getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const data = await hrService.getHrDashboard(userId);
      sendSuccess(res, data);
    } catch (error) {
      sendError(res, 500, { code: "HR_DASHBOARD_FAILED", message: "Failed to load HR dashboard" });
    }
  };

  listEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
      const employees = await hrService.listEmployees(
        req.query as { lifecycleState?: string; search?: string },
        req.user?.userId,
      );
      sendSuccess(res, employees);
    } catch (error) {
      sendError(res, 500, { code: "LIST_EMPLOYEES_FAILED", message: "Failed to list employees" });
    }
  };

  getEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const employee = await hrService.getEmployee(req.params.id, req.user?.userId);
      if (!employee) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Employee not found" });
        return;
      }
      sendSuccess(res, employee);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "GET_EMPLOYEE_FAILED" : clientError.code,
        message: clientError.message,
      });
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
      const policies = await hrService.listPolicies(
        req.query as { status?: string; familyId?: string },
      );
      sendSuccess(res, policies);
    } catch (error) {
      sendError(res, 500, { code: "LIST_POLICIES_FAILED", message: "Failed" });
    }
  };

  getPolicyById = async (req: Request, res: Response): Promise<void> => {
    try {
      const policy = await hrService.getPolicyById(req.params.id);
      sendSuccess(res, policy);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "POLICY_NOT_FOUND" : clientError.code,
        message: clientError.message,
      });
    }
  };

  createPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const policy = await hrService.createPolicy(req.body, req.user?.userId);
      sendSuccess(res, policy, 201);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "CREATE_POLICY_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  updatePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const policy = await hrService.updatePolicy(req.params.id, req.body, req.user?.userId);
      sendSuccess(res, policy);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "UPDATE_POLICY_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  publishPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const policy = await hrService.publishPolicy(req.params.id, req.user!.userId);
      sendSuccess(res, policy);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "PUBLISH_POLICY_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  createPolicyVersion = async (req: Request, res: Response): Promise<void> => {
    try {
      const policy = await hrService.createPolicyVersion(req.params.id, req.user?.userId);
      sendSuccess(res, policy, 201);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code:
          clientError.code === "OPERATION_FAILED" ? "CREATE_POLICY_VERSION_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  listPolicyAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
      const assignments = await hrService.listPolicyAssignments(req.params.familyId);
      sendSuccess(res, assignments);
    } catch (error) {
      sendError(res, 500, { code: "LIST_POLICY_ASSIGNMENTS_FAILED", message: "Failed" });
    }
  };

  assignPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const assignment = await hrService.assignPolicy(req.body, req.user?.userId);
      sendSuccess(res, assignment, 201);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "ASSIGN_POLICY_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  removePolicyAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      await hrService.removePolicyAssignment(req.params.assignmentId, req.user?.userId);
      sendSuccess(res, { message: "Assignment removed" });
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code:
          clientError.code === "OPERATION_FAILED" ? "REMOVE_POLICY_ASSIGNMENT_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  getPolicyAcknowledgements = async (req: Request, res: Response): Promise<void> => {
    try {
      const report = await hrService.getPolicyAcknowledgementReport(req.params.id);
      sendSuccess(res, report);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code:
          clientError.code === "OPERATION_FAILED"
            ? "POLICY_ACKNOWLEDGEMENTS_FAILED"
            : clientError.code,
        message: clientError.message,
      });
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

  listTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const tickets = await hrService.listTickets(
        req.query as { status?: string; assignedToId?: string; search?: string },
      );
      sendSuccess(res, tickets);
    } catch (error) {
      sendError(res, 500, { code: "LIST_TICKETS_FAILED", message: "Failed to list tickets" });
    }
  };

  getTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket = await hrService.getTicket(req.params.id);
      sendSuccess(res, ticket);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "TICKET_NOT_FOUND" : clientError.code,
        message: clientError.message,
      });
    }
  };

  assignTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket = await hrService.assignTicket(
        req.params.id,
        req.body.assignedToId ?? null,
        req.user!.userId,
      );
      sendSuccess(res, ticket);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "ASSIGN_TICKET_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket = await hrService.updateTicketStatus(
        req.params.id,
        req.body.status,
        req.user!.userId,
      );
      sendSuccess(res, ticket);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code:
          clientError.code === "OPERATION_FAILED" ? "UPDATE_TICKET_STATUS_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  replyToTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket = await hrService.addTicketReply(req.params.id, req.user!.userId, req.body.body, {
        attachmentFileId: req.body.attachmentFileId,
        setWaiting: req.body.setWaiting,
      });
      sendSuccess(res, ticket);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "TICKET_REPLY_FAILED" : clientError.code,
        message: clientError.message,
      });
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

  getTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket = await portalService.getTicket(req.params.id, req.user!.userId);
      sendSuccess(res, ticket);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "TICKET_NOT_FOUND" : clientError.code,
        message: clientError.message,
      });
    }
  };

  createTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket = await portalService.createTicket(req.user!.userId, req.body);
      sendSuccess(res, ticket, 201);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "CREATE_TICKET_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  replyToTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket = await portalService.replyToTicket(
        req.params.id,
        req.user!.userId,
        req.body.body,
        req.body.attachmentFileId,
      );
      sendSuccess(res, ticket);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "TICKET_REPLY_FAILED" : clientError.code,
        message: clientError.message,
      });
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

  listPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
      const policies = await portalService.listPortalPolicies(req.user!.userId);
      sendSuccess(res, policies);
    } catch (error) {
      sendError(res, 500, { code: "LIST_POLICIES_FAILED", message: "Failed" });
    }
  };

  listMyPayslips = async (req: Request, res: Response): Promise<void> => {
    try {
      const payslips = await portalService.listMyPayslips(req.user!.userId);
      sendSuccess(res, payslips);
    } catch (error) {
      sendError(res, 500, { code: "LIST_PAYSLIPS_FAILED", message: "Failed" });
    }
  };

  downloadMyPayslip = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await portalService.getMyPayslipDownload(req.user!.userId, req.params.id);
      if (result.mode === "redirect") {
        sendSuccess(res, { url: result.url, fileName: result.fileName });
        return;
      }
      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
      res.send(result.buffer);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code: clientError.code === "OPERATION_FAILED" ? "PAYSLIP_DOWNLOAD_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };

  acknowledgePolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const ack = await portalService.acknowledgePolicy(req.params.id, req.user!.userId);
      sendSuccess(res, ack, 201);
    } catch (error) {
      const clientError = toClientError(error);
      sendError(res, clientError.statusCode, {
        code:
          clientError.code === "OPERATION_FAILED" ? "ACKNOWLEDGE_POLICY_FAILED" : clientError.code,
        message: clientError.message,
      });
    }
  };
}
