import { ApprovalRepository } from "../repositories/approval.repository";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";

export class ApprovalService {
  private approvalRepo = new ApprovalRepository();

  async createApprovalRequest(data: {
    entityType: string;
    entityId: string;
    requesterId: string;
    approverIds: string[];
    metadata?: Record<string, any>;
  }, actorId: string) {
    if (data.approverIds.length === 0) {
      throw new AppError("APPROVER_REQUIRED", "At least one approver is required", 400);
    }

    const request = await this.approvalRepo.createApprovalRequest({
      entityType: data.entityType,
      entityId: data.entityId,
      requesterId: data.requesterId,
      totalLevels: data.approverIds.length,
      currentLevel: 1,
      status: "PENDING",
      metadata: data.metadata ?? {},
      steps: {
        create: data.approverIds.map((approverId, index) => ({
          level: index + 1,
          approverId,
          status: "PENDING",
        })),
      },
    });

    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "approval_request",
      entityId: request.id,
      after: request,
    });

    return request;
  }

  async approveRequest(
    requestId: string,
    approverId: string,
    notes?: string,
    actorId?: string
  ) {
    const request = await this.approvalRepo.findApprovalRequestById(requestId);
    if (!request) {
      throw new AppError("APPROVAL_REQUEST_NOT_FOUND", "Approval request not found", 404);
    }

    if (request.status !== "PENDING") {
      throw new AppError("APPROVAL_NOT_PENDING", "Approval request is not pending", 400);
    }

    const pendingStep = await this.approvalRepo.findPendingStepForApprover(requestId, approverId);
    if (!pendingStep) {
      throw new AppError("NO_PENDING_STEP", "No pending approval step found for this approver", 404);
    }

    if (pendingStep.level !== request.currentLevel) {
      throw new AppError("APPROVAL_ORDER_VIOLATION", "Approval must follow sequential order", 400);
    }

    await this.approvalRepo.updateApprovalStep(pendingStep.id, {
      status: "APPROVED",
      respondedAt: new Date(),
      notes,
    });

    await this.approvalRepo.createApprovalAction({
      approvalRequestId: requestId,
      actorId: approverId,
      actionType: "APPROVE",
      level: pendingStep.level,
      notes,
    });

    let newStatus: "PENDING" | "APPROVED" = "PENDING";
    let newLevel = request.currentLevel;

    if (request.currentLevel >= request.totalLevels) {
      newStatus = "APPROVED";
      await this.approvalRepo.updateApprovalRequest(requestId, {
        status: "APPROVED",
        completedAt: new Date(),
      });
    } else {
      newLevel = request.currentLevel + 1;
      await this.approvalRepo.updateApprovalRequest(requestId, {
        currentLevel: newLevel,
      });
    }

    await writeAuditLog({
      userId: actorId || approverId,
      action: "approve",
      entity: "approval_request",
      entityId: requestId,
      after: { level: pendingStep.level, status: newStatus },
    });

    return this.approvalRepo.findApprovalRequestById(requestId);
  }

  async rejectRequest(
    requestId: string,
    approverId: string,
    notes: string,
    actorId?: string
  ) {
    const request = await this.approvalRepo.findApprovalRequestById(requestId);
    if (!request) {
      throw new AppError("APPROVAL_REQUEST_NOT_FOUND", "Approval request not found", 404);
    }

    if (request.status !== "PENDING") {
      throw new AppError("APPROVAL_NOT_PENDING", "Approval request is not pending", 400);
    }

    const pendingStep = await this.approvalRepo.findPendingStepForApprover(requestId, approverId);
    if (!pendingStep) {
      throw new AppError("NO_PENDING_STEP", "No pending approval step found for this approver", 404);
    }

    if (pendingStep.level !== request.currentLevel) {
      throw new AppError("APPROVAL_ORDER_VIOLATION", "Only the current level approver can reject", 400);
    }

    await this.approvalRepo.updateApprovalStep(pendingStep.id, {
      status: "REJECTED",
      respondedAt: new Date(),
      notes,
    });

    await this.approvalRepo.createApprovalAction({
      approvalRequestId: requestId,
      actorId: approverId,
      actionType: "REJECT",
      level: pendingStep.level,
      notes,
    });

    await this.approvalRepo.updateApprovalRequest(requestId, {
      status: "REJECTED",
      completedAt: new Date(),
    });

    await writeAuditLog({
      userId: actorId || approverId,
      action: "reject",
      entity: "approval_request",
      entityId: requestId,
      after: { level: pendingStep.level, status: "REJECTED" },
    });

    return this.approvalRepo.findApprovalRequestById(requestId);
  }

  async cancelApprovalRequest(requestId: string, actorId: string, reason?: string) {
    const request = await this.approvalRepo.findApprovalRequestById(requestId);
    if (!request) {
      throw new AppError("APPROVAL_REQUEST_NOT_FOUND", "Approval request not found", 404);
    }

    if (request.status !== "PENDING") {
      throw new AppError("APPROVAL_NOT_PENDING", "Only pending approval requests can be cancelled", 400);
    }

    if (request.requesterId !== actorId) {
      throw new AppError("NOT_REQUESTER", "Only the requester can cancel the approval request", 403);
    }

    await this.approvalRepo.createApprovalAction({
      approvalRequestId: requestId,
      actorId,
      actionType: "CANCEL",
      level: request.currentLevel,
      notes: reason,
    });

    await this.approvalRepo.updateApprovalRequest(requestId, {
      status: "CANCELLED",
      completedAt: new Date(),
    });

    await writeAuditLog({
      userId: actorId,
      action: "cancel",
      entity: "approval_request",
      entityId: requestId,
      after: { status: "CANCELLED", reason },
    });

    return this.approvalRepo.findApprovalRequestById(requestId);
  }

  async getApprovalRequestById(id: string) {
    const request = await this.approvalRepo.findApprovalRequestById(id);
    if (!request) {
      throw new AppError("APPROVAL_REQUEST_NOT_FOUND", "Approval request not found", 404);
    }
    return request;
  }

  async listApprovalRequests(filters: {
    entityType?: string;
    requesterId?: string;
    approverId?: string;
    status?: string;
  }) {
    const where: any = {};
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.requesterId) where.requesterId = filters.requesterId;
    if (filters.status) where.status = filters.status;
    
    if (filters.approverId) {
      where.steps = {
        some: {
          approverId: filters.approverId,
        },
      };
    }

    return this.approvalRepo.findManyApprovalRequests(where);
  }

  async getPendingApprovalsForUser(userId: string) {
    return this.approvalRepo.findPendingRequestsForApprover(userId);
  }

  async getApprovalStats(userId: string) {
    const pending = await this.approvalRepo.countPendingRequestsForApprover(userId);
    return {
      pendingCount: pending,
    };
  }
}
