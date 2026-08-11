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
}
