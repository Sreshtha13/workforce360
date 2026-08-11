import type { PolicyAssignmentTarget, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

const policyInclude = {
  file: {
    select: { id: true, originalName: true, mimeType: true, sizeBytes: true },
  },
  publishedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

export type CreatePolicyData = {
  title: string;
  description?: string;
  version?: string;
  fileId?: string;
};

export type UpdatePolicyData = {
  title?: string;
  description?: string;
  version?: string;
  fileId?: string | null;
};

export type AssignPolicyData = {
  familyId: string;
  targetType: PolicyAssignmentTarget;
  userId?: string;
  departmentId?: string;
  teamId?: string;
  assignedById?: string;
};

export class PolicyRepository {
  listPolicies(filters?: { status?: string; familyId?: string }) {
    const where: Prisma.CompanyPolicyWhereInput = { deletedAt: null };
    if (filters?.status) {
      where.status = filters.status as Prisma.EnumPolicyStatusFilter["equals"];
    }
    if (filters?.familyId) {
      where.familyId = filters.familyId;
    }

    return prisma.companyPolicy.findMany({
      where,
      select: {
        id: true,
        familyId: true,
        previousVersionId: true,
        title: true,
        description: true,
        version: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        file: policyInclude.file,
        publishedBy: policyInclude.publishedBy,
        _count: {
          select: {
            acknowledgements: true,
          },
        },
      },
      orderBy: [{ familyId: "asc" }, { updatedAt: "desc" }],
    });
  }

  findPolicyById(id: string) {
    return prisma.companyPolicy.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...policyInclude,
        _count: { select: { acknowledgements: true } },
      },
    });
  }

  findLatestPublishedInFamily(familyId: string) {
    return prisma.companyPolicy.findFirst({
      where: { familyId, status: "PUBLISHED", deletedAt: null },
      orderBy: { publishedAt: "desc" },
      include: policyInclude,
    });
  }

  findDraftInFamily(familyId: string) {
    return prisma.companyPolicy.findFirst({
      where: { familyId, status: "DRAFT", deletedAt: null },
    });
  }

  async createPolicy(data: CreatePolicyData) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.companyPolicy.create({
        data: {
          title: data.title,
          description: data.description,
          version: data.version ?? "1.0",
          familyId: "pending",
          file: data.fileId ? { connect: { id: data.fileId } } : undefined,
        },
        include: policyInclude,
      });

      return tx.companyPolicy.update({
        where: { id: created.id },
        data: { familyId: created.id },
        include: policyInclude,
      });
    });
  }

  updatePolicy(id: string, data: UpdatePolicyData) {
    return prisma.companyPolicy.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        version: data.version,
        file:
          data.fileId === null
            ? { disconnect: true }
            : data.fileId
              ? { connect: { id: data.fileId } }
              : undefined,
      },
      include: policyInclude,
    });
  }

  archivePublishedInFamily(familyId: string, exceptId: string, tx: Prisma.TransactionClient) {
    return tx.companyPolicy.updateMany({
      where: {
        familyId,
        status: "PUBLISHED",
        deletedAt: null,
        id: { not: exceptId },
      },
      data: { status: "ARCHIVED" },
    });
  }

  publishPolicy(id: string, publisherId: string) {
    return prisma.$transaction(async (tx) => {
      const policy = await tx.companyPolicy.findFirst({
        where: { id, deletedAt: null },
      });
      if (!policy) return null;

      await this.archivePublishedInFamily(policy.familyId, id, tx);

      return tx.companyPolicy.update({
        where: { id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          publishedBy: { connect: { id: publisherId } },
        },
        include: policyInclude,
      });
    });
  }

  createPolicyVersion(source: {
    familyId: string;
    previousVersionId: string;
    title: string;
    description: string | null;
    version: string;
    fileId: string | null;
  }) {
    return prisma.companyPolicy.create({
      data: {
        familyId: source.familyId,
        previousVersionId: source.previousVersionId,
        title: source.title,
        description: source.description,
        version: source.version,
        status: "DRAFT",
        file: source.fileId ? { connect: { id: source.fileId } } : undefined,
      },
      include: policyInclude,
    });
  }

  listAssignments(familyId: string) {
    return prisma.policyAssignment.findMany({
      where: { familyId, deletedAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  createAssignment(data: AssignPolicyData) {
    return prisma.policyAssignment.create({
      data: {
        familyId: data.familyId,
        targetType: data.targetType,
        userId: data.userId,
        departmentId: data.departmentId,
        teamId: data.teamId,
        assignedById: data.assignedById,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
  }

  softDeleteAssignment(id: string) {
    return prisma.policyAssignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  listActiveAssignments() {
    return prisma.policyAssignment.findMany({
      where: { deletedAt: null },
    });
  }

  findAcknowledgement(policyId: string, userId: string) {
    return prisma.policyAcknowledgement.findUnique({
      where: { policyId_userId: { policyId, userId } },
    });
  }

  createAcknowledgement(policyId: string, userId: string) {
    return prisma.policyAcknowledgement.create({
      data: { policyId, userId },
    });
  }

  listAcknowledgementsForPolicy(policyId: string) {
    return prisma.policyAcknowledgement.findMany({
      where: { policyId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, departmentId: true },
        },
      },
      orderBy: { acknowledgedAt: "desc" },
    });
  }

  async getUserAssignmentContext(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        departmentId: true,
        teamMemberships: {
          where: { deletedAt: null, leftAt: null },
          select: { teamId: true },
        },
      },
    });
    return user;
  }
}
