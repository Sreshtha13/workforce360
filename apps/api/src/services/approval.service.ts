import { ApprovalRepository } from "../repositories/approval.repository";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { matchesAllConditions } from "../lib/approval-conditions";

export { matchesAllConditions, matchesCondition } from "../lib/approval-conditions";

export class ApprovalService {
  private approvalRepo = new ApprovalRepository();

  async createApprovalRequest(data: {
    entityType: string;
    entityId: string;
    requesterId: string;
    approverIds: string[];
    metadata?: Record<string, any>;
    workflowId?: string;
    dueAt?: Date | null;
  }, actorId: string) {
    if (data.approverIds.length === 0) {
      throw new AppError("APPROVER_REQUIRED", "At least one approver is required", 400);
    }

    const resolvedApprovers: Array<{
      approverId: string;
      delegatedFromId?: string | null;
      dueAt?: Date | null;
    }> = [];

    for (let i = 0; i < data.approverIds.length; i++) {
      const originalId = data.approverIds[i];
      const delegation = await this.approvalRepo.findActiveDelegation(originalId);
      const approverId = delegation?.delegateId ?? originalId;
      resolvedApprovers.push({
        approverId,
        delegatedFromId: delegation ? originalId : null,
      });
    }

    const request = await this.approvalRepo.createApprovalRequest({
      entityType: data.entityType,
      entityId: data.entityId,
      requesterId: data.requesterId,
      workflowId: data.workflowId,
      totalLevels: resolvedApprovers.length,
      currentLevel: 1,
      status: "PENDING",
      metadata: data.metadata ?? {},
      dueAt: data.dueAt ?? undefined,
      steps: {
        create: resolvedApprovers.map((step, index) => ({
          level: index + 1,
          approverId: step.approverId,
          delegatedFromId: step.delegatedFromId,
          status: "PENDING",
          dueAt: data.dueAt ?? undefined,
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

  /**
   * Pick matching ApprovalWorkflow by entityType + conditions on metadata,
   * resolve approverIds from levels, apply active delegations.
   */
  async createFromWorkflow(
    entityType: string,
    entityId: string,
    requesterId: string,
    metadata: Record<string, unknown> = {},
    actorId?: string,
  ) {
    const workflows = await this.approvalRepo.findActiveWorkflowsByEntityType(entityType);
    const matched = workflows.find((wf) =>
      matchesAllConditions(
        wf.conditions.map((c) => ({ field: c.field, operator: c.operator, value: c.value })),
        metadata,
      ),
    );

    if (!matched) {
      throw new AppError(
        "NO_MATCHING_WORKFLOW",
        `No active approval workflow matches entity type ${entityType}`,
        400,
      );
    }

    if (matched.levels.length === 0) {
      throw new AppError("WORKFLOW_HAS_NO_LEVELS", "Matched workflow has no levels", 400);
    }

    const approverIds: string[] = [];
    const stepDueAts: Array<Date | null> = [];

    for (const level of matched.levels) {
      let userId = level.approverUserId ?? null;
      if (!userId && level.approverRoleCode) {
        const user = await this.approvalRepo.findFirstUserWithRoleCode(level.approverRoleCode);
        userId = user?.id ?? null;
      }
      if (!userId) {
        throw new AppError(
          "APPROVER_UNRESOLVED",
          `Could not resolve approver for workflow level ${level.level}`,
          400,
        );
      }
      approverIds.push(userId);
      stepDueAts.push(
        level.escalateAfterHours
          ? new Date(Date.now() + level.escalateAfterHours * 3_600_000)
          : null,
      );
    }

    const overallDue = stepDueAts.find((d) => d != null) ?? null;

    // Create with manual step due dates after createApprovalRequest
    const request = await this.createApprovalRequest(
      {
        entityType,
        entityId,
        requesterId,
        approverIds,
        metadata,
        workflowId: matched.id,
        dueAt: overallDue,
      },
      actorId ?? requesterId,
    );

    // Patch per-step dueAt from workflow escalateAfterHours
    const steps = await this.approvalRepo.findApprovalStepsByRequestId(request.id);
    for (let i = 0; i < steps.length; i++) {
      if (stepDueAts[i]) {
        await this.approvalRepo.updateApprovalStep(steps[i].id, { dueAt: stepDueAts[i] });
      }
    }

    return this.approvalRepo.findApprovalRequestById(request.id);
  }

  async escalateOverdueSteps(actorId?: string) {
    const overdue = await this.approvalRepo.findOverduePendingSteps();
    let escalated = 0;

    for (const step of overdue) {
      const request = step.approvalRequest;
      if (!request || request.status !== "PENDING") continue;

      const nextLevel = request.steps.find((s) => s.level === step.level + 1);
      let newApproverId: string | null = nextLevel?.approverId ?? null;

      if (!newApproverId) {
        newApproverId = step.approver.managerId ?? null;
      }

      if (!newApproverId || newApproverId === step.approverId) {
        continue;
      }

      const delegation = await this.approvalRepo.findActiveDelegation(newApproverId);
      const finalApprover = delegation?.delegateId ?? newApproverId;

      await this.approvalRepo.updateApprovalStep(step.id, {
        approverId: finalApprover,
        delegatedFromId: delegation ? newApproverId : step.approverId,
        dueAt: new Date(Date.now() + 24 * 3_600_000),
        assignedAt: new Date(),
      });

      await this.approvalRepo.createApprovalAction({
        approvalRequestId: request.id,
        actorId: actorId ?? step.approverId,
        actionType: "ESCALATE",
        level: step.level,
        notes: `Escalated overdue step from ${step.approverId} to ${finalApprover}`,
      });

      escalated += 1;
    }

    return { processed: overdue.length, escalated };
  }

  async getHistory(requestId: string) {
    const request = await this.approvalRepo.findApprovalRequestById(requestId);
    if (!request) {
      throw new AppError("APPROVAL_REQUEST_NOT_FOUND", "Approval request not found", 404);
    }
    return this.approvalRepo.findApprovalActionsByRequestId(requestId);
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

  // ---- Workflow CRUD ----

  listWorkflows(entityType?: string) {
    return this.approvalRepo.listWorkflows(entityType);
  }

  async getWorkflow(id: string) {
    const wf = await this.approvalRepo.findWorkflowById(id);
    if (!wf) throw new AppError("WORKFLOW_NOT_FOUND", "Approval workflow not found", 404);
    return wf;
  }

  async createWorkflow(
    data: {
      name: string;
      code: string;
      entityType: string;
      description?: string;
      isActive?: boolean;
      levels?: Array<{
        level: number;
        approverRoleCode?: string | null;
        approverUserId?: string | null;
        escalateAfterHours?: number | null;
      }>;
      conditions?: Array<{ field: string; operator: string; value: string }>;
    },
    actorId: string,
  ) {
    const existing = await this.approvalRepo.findWorkflowByCode(data.code);
    if (existing) {
      throw new AppError("WORKFLOW_CODE_EXISTS", "Workflow code already exists", 400);
    }

    const wf = await this.approvalRepo.createWorkflow({
      name: data.name,
      code: data.code,
      entityType: data.entityType,
      description: data.description,
      isActive: data.isActive ?? true,
    });

    if (data.levels?.length) {
      await this.approvalRepo.replaceWorkflowLevels(wf.id, data.levels);
    }
    if (data.conditions?.length) {
      await this.approvalRepo.replaceWorkflowConditions(wf.id, data.conditions);
    }

    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "approval_workflow",
      entityId: wf.id,
      after: data,
    });

    return this.approvalRepo.findWorkflowById(wf.id);
  }

  async updateWorkflow(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      isActive: boolean;
      levels: Array<{
        level: number;
        approverRoleCode?: string | null;
        approverUserId?: string | null;
        escalateAfterHours?: number | null;
      }>;
      conditions: Array<{ field: string; operator: string; value: string }>;
    }>,
    actorId: string,
  ) {
    const existing = await this.approvalRepo.findWorkflowById(id);
    if (!existing) throw new AppError("WORKFLOW_NOT_FOUND", "Approval workflow not found", 404);

    await this.approvalRepo.updateWorkflow(id, {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
    });

    if (data.levels) {
      await this.approvalRepo.replaceWorkflowLevels(id, data.levels);
    }
    if (data.conditions) {
      await this.approvalRepo.replaceWorkflowConditions(id, data.conditions);
    }

    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "approval_workflow",
      entityId: id,
      before: existing,
      after: data,
    });

    return this.approvalRepo.findWorkflowById(id);
  }

  async deleteWorkflow(id: string, actorId: string) {
    const existing = await this.approvalRepo.findWorkflowById(id);
    if (!existing) throw new AppError("WORKFLOW_NOT_FOUND", "Approval workflow not found", 404);
    await this.approvalRepo.softDeleteWorkflow(id);
    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "approval_workflow",
      entityId: id,
      before: existing,
    });
    return { id, deleted: true };
  }

  // ---- Delegations ----

  listDelegations(filters?: { delegatorId?: string; delegateId?: string }) {
    return this.approvalRepo.listDelegations(filters);
  }

  async createDelegation(
    data: {
      delegatorId: string;
      delegateId: string;
      startsAt: string;
      endsAt: string;
      reason?: string;
    },
    actorId: string,
  ) {
    if (data.delegatorId === data.delegateId) {
      throw new AppError("INVALID_DELEGATION", "Cannot delegate to yourself", 400);
    }
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);
    if (endsAt <= startsAt) {
      throw new AppError("INVALID_DELEGATION_WINDOW", "endsAt must be after startsAt", 400);
    }

    const delegation = await this.approvalRepo.createDelegation({
      delegatorId: data.delegatorId,
      delegateId: data.delegateId,
      startsAt,
      endsAt,
      reason: data.reason,
      isActive: true,
    });

    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "approval_delegation",
      entityId: delegation.id,
      after: delegation,
    });

    return delegation;
  }

  async updateDelegation(
    id: string,
    data: Partial<{
      startsAt: string;
      endsAt: string;
      reason: string | null;
      isActive: boolean;
    }>,
    actorId: string,
  ) {
    const existing = await this.approvalRepo.findDelegationById(id);
    if (!existing) throw new AppError("DELEGATION_NOT_FOUND", "Delegation not found", 404);

    const updated = await this.approvalRepo.updateDelegation(id, {
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      reason: data.reason,
      isActive: data.isActive,
    });

    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "approval_delegation",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async deleteDelegation(id: string, actorId: string) {
    const existing = await this.approvalRepo.findDelegationById(id);
    if (!existing) throw new AppError("DELEGATION_NOT_FOUND", "Delegation not found", 404);
    await this.approvalRepo.softDeleteDelegation(id);
    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "approval_delegation",
      entityId: id,
      before: existing,
    });
    return { id, deleted: true };
  }
}
