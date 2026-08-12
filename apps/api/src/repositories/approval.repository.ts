import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export class ApprovalRepository {
  async createApprovalRequest(data: Prisma.ApprovalRequestUncheckedCreateInput) {
    return prisma.approvalRequest.create({
      data,
      include: {
        steps: true,
        actions: true,
      },
    });
  }

  async findApprovalRequestById(id: string) {
    return prisma.approvalRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        steps: {
          orderBy: { level: "asc" },
        },
        actions: {
          orderBy: { timestamp: "asc" },
        },
        workflow: {
          include: { levels: { orderBy: { level: "asc" } } },
        },
      },
    });
  }

  async findApprovalRequestByEntity(entityType: string, entityId: string) {
    return prisma.approvalRequest.findFirst({
      where: {
        entityType,
        entityId,
        deletedAt: null,
      },
      include: {
        steps: {
          orderBy: { level: "asc" },
        },
        actions: {
          orderBy: { timestamp: "asc" },
        },
      },
    });
  }

  async findManyApprovalRequests(where?: Prisma.ApprovalRequestWhereInput) {
    return prisma.approvalRequest.findMany({
      where: { ...where, deletedAt: null },
      include: {
        steps: {
          orderBy: { level: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateApprovalRequest(id: string, data: Prisma.ApprovalRequestUncheckedUpdateInput) {
    return prisma.approvalRequest.update({
      where: { id },
      data,
    });
  }

  async createApprovalStep(data: Prisma.ApprovalStepUncheckedCreateInput) {
    return prisma.approvalStep.create({ data });
  }

  async findApprovalStepById(id: string) {
    return prisma.approvalStep.findUnique({
      where: { id },
    });
  }

  async findApprovalStepsByRequestId(approvalRequestId: string) {
    return prisma.approvalStep.findMany({
      where: { approvalRequestId },
      orderBy: { level: "asc" },
    });
  }

  async findPendingStepForApprover(approvalRequestId: string, approverId: string) {
    return prisma.approvalStep.findFirst({
      where: {
        approvalRequestId,
        approverId,
        status: "PENDING",
      },
    });
  }

  async updateApprovalStep(id: string, data: Prisma.ApprovalStepUncheckedUpdateInput) {
    return prisma.approvalStep.update({
      where: { id },
      data,
    });
  }

  async createApprovalAction(data: Prisma.ApprovalActionUncheckedCreateInput) {
    return prisma.approvalAction.create({ data });
  }

  async findApprovalActionsByRequestId(approvalRequestId: string) {
    return prisma.approvalAction.findMany({
      where: { approvalRequestId },
      orderBy: { timestamp: "asc" },
      include: {
        actor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findPendingRequestsForApprover(approverId: string) {
    return prisma.approvalRequest.findMany({
      where: {
        status: "PENDING",
        steps: {
          some: {
            approverId,
            status: "PENDING",
          },
        },
        deletedAt: null,
      },
      include: {
        steps: {
          where: { approverId, status: "PENDING" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async countPendingRequestsForApprover(approverId: string) {
    return prisma.approvalRequest.count({
      where: {
        status: "PENDING",
        steps: {
          some: {
            approverId,
            status: "PENDING",
          },
        },
        deletedAt: null,
      },
    });
  }

  findActiveWorkflowsByEntityType(entityType: string) {
    return prisma.approvalWorkflow.findMany({
      where: { entityType, isActive: true, deletedAt: null },
      include: {
        levels: { orderBy: { level: "asc" } },
        conditions: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  findWorkflowById(id: string) {
    return prisma.approvalWorkflow.findFirst({
      where: { id, deletedAt: null },
      include: {
        levels: { orderBy: { level: "asc" } },
        conditions: true,
      },
    });
  }

  findWorkflowByCode(code: string) {
    return prisma.approvalWorkflow.findFirst({
      where: { code, deletedAt: null },
    });
  }

  createWorkflow(data: Prisma.ApprovalWorkflowUncheckedCreateInput) {
    return prisma.approvalWorkflow.create({ data });
  }

  updateWorkflow(id: string, data: Prisma.ApprovalWorkflowUncheckedUpdateInput) {
    return prisma.approvalWorkflow.update({ where: { id }, data });
  }

  softDeleteWorkflow(id: string) {
    return prisma.approvalWorkflow.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  replaceWorkflowLevels(
    workflowId: string,
    levels: Array<{
      level: number;
      approverRoleCode?: string | null;
      approverUserId?: string | null;
      escalateAfterHours?: number | null;
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.approvalWorkflowLevel.deleteMany({ where: { workflowId } });
      if (levels.length === 0) return [];
      await tx.approvalWorkflowLevel.createMany({
        data: levels.map((l) => ({
          workflowId,
          level: l.level,
          approverRoleCode: l.approverRoleCode,
          approverUserId: l.approverUserId,
          escalateAfterHours: l.escalateAfterHours,
        })),
      });
      return tx.approvalWorkflowLevel.findMany({
        where: { workflowId },
        orderBy: { level: "asc" },
      });
    });
  }

  replaceWorkflowConditions(
    workflowId: string,
    conditions: Array<{ field: string; operator: string; value: string }>,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.approvalWorkflowCondition.deleteMany({ where: { workflowId } });
      if (conditions.length === 0) return [];
      await tx.approvalWorkflowCondition.createMany({
        data: conditions.map((c) => ({
          workflowId,
          field: c.field,
          operator: c.operator,
          value: c.value,
        })),
      });
      return tx.approvalWorkflowCondition.findMany({ where: { workflowId } });
    });
  }

  listWorkflows(entityType?: string) {
    return prisma.approvalWorkflow.findMany({
      where: {
        deletedAt: null,
        ...(entityType ? { entityType } : {}),
      },
      include: {
        levels: { orderBy: { level: "asc" } },
        conditions: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findActiveDelegation(delegatorId: string, at = new Date()) {
    return prisma.approvalDelegation.findFirst({
      where: {
        delegatorId,
        isActive: true,
        deletedAt: null,
        startsAt: { lte: at },
        endsAt: { gte: at },
      },
    });
  }

  createDelegation(data: Prisma.ApprovalDelegationUncheckedCreateInput) {
    return prisma.approvalDelegation.create({ data });
  }

  updateDelegation(id: string, data: Prisma.ApprovalDelegationUncheckedUpdateInput) {
    return prisma.approvalDelegation.update({ where: { id }, data });
  }

  findDelegationById(id: string) {
    return prisma.approvalDelegation.findFirst({
      where: { id, deletedAt: null },
    });
  }

  listDelegations(filters?: { delegatorId?: string; delegateId?: string }) {
    return prisma.approvalDelegation.findMany({
      where: {
        deletedAt: null,
        ...(filters?.delegatorId ? { delegatorId: filters.delegatorId } : {}),
        ...(filters?.delegateId ? { delegateId: filters.delegateId } : {}),
      },
      orderBy: { startsAt: "desc" },
    });
  }

  softDeleteDelegation(id: string) {
    return prisma.approvalDelegation.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  findOverduePendingSteps(now = new Date()) {
    return prisma.approvalStep.findMany({
      where: {
        status: "PENDING",
        dueAt: { lt: now },
        approvalRequest: { status: "PENDING", deletedAt: null },
      },
      include: {
        approvalRequest: {
          include: {
            steps: { orderBy: { level: "asc" } },
            workflow: { include: { levels: { orderBy: { level: "asc" } } } },
          },
        },
        approver: { select: { id: true, managerId: true } },
      },
    });
  }

  findFirstUserWithRoleCode(roleCode: string) {
    return prisma.user.findFirst({
      where: {
        deletedAt: null,
        userRoles: {
          some: {
            deletedAt: null,
            role: { code: roleCode, deletedAt: null },
          },
        },
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
  }
}
