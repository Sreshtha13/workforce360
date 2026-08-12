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
}
