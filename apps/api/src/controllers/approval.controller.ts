import { Request, Response, NextFunction } from "express";
import { ApprovalService } from "../services/approval.service";
import { sendSuccess } from "../lib/response";

export class ApprovalController {
  private approvalService = new ApprovalService();

  createApprovalRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await this.approvalService.createApprovalRequest(req.body, req.user!.userId);
      return sendSuccess(res, request, 201);
    } catch (error) {
      next(error);
    }
  };

  createFromWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await this.approvalService.createFromWorkflow(
        req.body.entityType,
        req.body.entityId,
        req.body.requesterId ?? req.user!.userId,
        req.body.metadata ?? {},
        req.user!.userId,
      );
      return sendSuccess(res, request, 201);
    } catch (error) {
      next(error);
    }
  };

  approveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await this.approvalService.approveRequest(
        req.params.id,
        req.user!.userId,
        req.body.notes,
        req.user!.userId
      );
      return sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await this.approvalService.rejectRequest(
        req.params.id,
        req.user!.userId,
        req.body.notes,
        req.user!.userId
      );
      return sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  cancelApprovalRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await this.approvalService.cancelApprovalRequest(
        req.params.id,
        req.user!.userId,
        req.body.reason
      );
      return sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  getApprovalRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await this.approvalService.getApprovalRequestById(req.params.id);
      return sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actions = await this.approvalService.getHistory(req.params.id);
      return sendSuccess(res, actions);
    } catch (error) {
      next(error);
    }
  };

  listApprovalRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, requesterId, approverId, status } = req.query;
      const requests = await this.approvalService.listApprovalRequests({
        entityType: entityType as string,
        requesterId: requesterId as string,
        approverId: approverId as string,
        status: status as string,
      });
      return sendSuccess(res, requests);
    } catch (error) {
      next(error);
    }
  };

  getPendingApprovals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requests = await this.approvalService.getPendingApprovalsForUser(req.user!.userId);
      return sendSuccess(res, requests);
    } catch (error) {
      next(error);
    }
  };

  getApprovalStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.approvalService.getApprovalStats(req.user!.userId);
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };

  processEscalations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.approvalService.escalateOverdueSteps(req.user!.userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  listWorkflows = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.approvalService.listWorkflows(req.query.entityType as string | undefined);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.approvalService.getWorkflow(req.params.id);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  createWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.approvalService.createWorkflow(req.body, req.user!.userId);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  };

  updateWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.approvalService.updateWorkflow(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  deleteWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.approvalService.deleteWorkflow(req.params.id, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  listDelegations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.approvalService.listDelegations({
        delegatorId: req.query.delegatorId as string | undefined,
        delegateId: req.query.delegateId as string | undefined,
      });
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  createDelegation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.approvalService.createDelegation(req.body, req.user!.userId);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  };

  updateDelegation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.approvalService.updateDelegation(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  deleteDelegation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.approvalService.deleteDelegation(req.params.id, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}
