import type {
  Prisma,
  ReleaseStatus,
  TestCaseStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
} as const;

const projectSelect = {
  id: true,
  name: true,
  code: true,
} as const;

export class EngineeringRepository {
  listReleases(filters?: { projectId?: string; status?: ReleaseStatus }) {
    const where: Prisma.ReleaseWhereInput = { deletedAt: null };
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    return prisma.release.findMany({
      where,
      include: {
        project: { select: projectSelect },
        deployedBy: { select: userSelect },
        _count: { select: { tasks: true, testCases: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findReleaseById(id: string) {
    return prisma.release.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: projectSelect },
        deployedBy: { select: userSelect },
        tasks: {
          where: { deletedAt: null },
          select: { id: true, title: true, status: true },
        },
        testCases: {
          where: { deletedAt: null },
          select: { id: true, title: true, status: true },
        },
      },
    });
  }

  createRelease(data: Prisma.ReleaseCreateInput) {
    return prisma.release.create({
      data,
      include: {
        project: { select: projectSelect },
        deployedBy: { select: userSelect },
      },
    });
  }

  updateRelease(id: string, data: Prisma.ReleaseUpdateInput) {
    return prisma.release.update({
      where: { id },
      data,
      include: {
        project: { select: projectSelect },
        deployedBy: { select: userSelect },
      },
    });
  }

  listTestCases(filters?: {
    projectId?: string;
    releaseId?: string;
    status?: TestCaseStatus;
    assignedToId?: string;
  }) {
    const where: Prisma.TestCaseWhereInput = { deletedAt: null };
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.releaseId) where.releaseId = filters.releaseId;
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    return prisma.testCase.findMany({
      where,
      include: {
        project: { select: projectSelect },
        release: { select: { id: true, version: true, name: true } },
        assignedTo: { select: userSelect },
        createdBy: { select: userSelect },
        executedBy: { select: userSelect },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findTestCaseById(id: string) {
    return prisma.testCase.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: projectSelect },
        release: { select: { id: true, version: true, name: true } },
        assignedTo: { select: userSelect },
        createdBy: { select: userSelect },
        executedBy: { select: userSelect },
      },
    });
  }

  createTestCase(data: Prisma.TestCaseCreateInput) {
    return prisma.testCase.create({
      data,
      include: {
        project: { select: projectSelect },
        assignedTo: { select: userSelect },
        createdBy: { select: userSelect },
      },
    });
  }

  updateTestCase(id: string, data: Prisma.TestCaseUpdateInput) {
    return prisma.testCase.update({
      where: { id },
      data,
      include: {
        project: { select: projectSelect },
        assignedTo: { select: userSelect },
        executedBy: { select: userSelect },
      },
    });
  }

  listDocumentations(filters?: { projectId?: string; category?: string; search?: string }) {
    const where: Prisma.DocumentationWhereInput = { deletedAt: null };
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.category) where.category = filters.category;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return prisma.documentation.findMany({
      where,
      include: {
        project: { select: projectSelect },
        createdBy: { select: userSelect },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  findDocumentationById(id: string) {
    return prisma.documentation.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: projectSelect },
        createdBy: { select: userSelect },
      },
    });
  }

  createDocumentation(data: Prisma.DocumentationCreateInput) {
    return prisma.documentation.create({
      data,
      include: {
        project: { select: projectSelect },
        createdBy: { select: userSelect },
      },
    });
  }

  updateDocumentation(id: string, data: Prisma.DocumentationUpdateInput) {
    return prisma.documentation.update({
      where: { id },
      data,
      include: {
        project: { select: projectSelect },
        createdBy: { select: userSelect },
      },
    });
  }

  listTrainings(filters?: { category?: string; isRequired?: boolean }) {
    const where: Prisma.TechTrainingWhereInput = { deletedAt: null, isActive: true };
    if (filters?.category) where.category = filters.category;
    if (filters?.isRequired !== undefined) where.isRequired = filters.isRequired;
    return prisma.techTraining.findMany({
      where,
      include: {
        createdBy: { select: userSelect },
        _count: { select: { enrollments: true } },
      },
      orderBy: { title: "asc" },
    });
  }

  findTrainingById(id: string) {
    return prisma.techTraining.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: userSelect },
        enrollments: {
          include: { user: { select: userSelect } },
        },
      },
    });
  }

  createTraining(data: Prisma.TechTrainingCreateInput) {
    return prisma.techTraining.create({
      data,
      include: { createdBy: { select: userSelect } },
    });
  }

  updateTraining(id: string, data: Prisma.TechTrainingUpdateInput) {
    return prisma.techTraining.update({
      where: { id },
      data,
      include: { createdBy: { select: userSelect } },
    });
  }

  listEnrollmentsForUser(userId: string) {
    return prisma.trainingEnrollment.findMany({
      where: { userId },
      include: {
        training: true,
        user: { select: userSelect },
      },
      orderBy: { enrolledAt: "desc" },
    });
  }

  findEnrollment(id: string) {
    return prisma.trainingEnrollment.findUnique({
      where: { id },
      include: {
        training: true,
        user: { select: userSelect },
      },
    });
  }

  createEnrollment(data: Prisma.TrainingEnrollmentCreateInput) {
    return prisma.trainingEnrollment.create({
      data,
      include: {
        training: true,
        user: { select: userSelect },
      },
    });
  }

  updateEnrollment(id: string, data: Prisma.TrainingEnrollmentUpdateInput) {
    return prisma.trainingEnrollment.update({
      where: { id },
      data,
      include: {
        training: true,
        user: { select: userSelect },
      },
    });
  }

  listCodeReviews(filters?: {
    projectId?: string;
    authorId?: string;
    reviewerId?: string;
    status?: string;
  }) {
    const where: Prisma.CodeReviewWhereInput = { deletedAt: null };
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.authorId) where.authorId = filters.authorId;
    if (filters?.reviewerId) where.reviewerId = filters.reviewerId;
    if (filters?.status) where.status = filters.status;
    return prisma.codeReview.findMany({
      where,
      include: {
        project: { select: projectSelect },
        task: { select: { id: true, title: true } },
        author: { select: userSelect },
        reviewer: { select: userSelect },
      },
      orderBy: { requestedAt: "desc" },
    });
  }

  findCodeReviewById(id: string) {
    return prisma.codeReview.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: { select: projectSelect },
        task: { select: { id: true, title: true } },
        author: { select: userSelect },
        reviewer: { select: userSelect },
      },
    });
  }

  createCodeReview(data: Prisma.CodeReviewCreateInput) {
    return prisma.codeReview.create({
      data,
      include: {
        project: { select: projectSelect },
        task: { select: { id: true, title: true } },
        author: { select: userSelect },
        reviewer: { select: userSelect },
      },
    });
  }

  updateCodeReview(id: string, data: Prisma.CodeReviewUpdateInput) {
    return prisma.codeReview.update({
      where: { id },
      data,
      include: {
        project: { select: projectSelect },
        task: { select: { id: true, title: true } },
        author: { select: userSelect },
        reviewer: { select: userSelect },
      },
    });
  }

  findActiveSprintForUser(userId: string, sprintId?: string) {
    if (sprintId) {
      return prisma.sprint.findFirst({
        where: { id: sprintId, deletedAt: null },
        include: { project: { select: projectSelect } },
      });
    }
    return prisma.sprint.findFirst({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        project: {
          deletedAt: null,
          OR: [
            { managerId: userId },
            {
              teamAllocations: {
                some: { userId, deletedAt: null, leftAt: null },
              },
            },
          ],
        },
      },
      include: { project: { select: projectSelect } },
      orderBy: { startDate: "desc" },
    });
  }

  countTasksByStatus(sprintId: string) {
    return prisma.task.groupBy({
      by: ["status"],
      where: { sprintId, deletedAt: null },
      _count: { _all: true },
    });
  }

  listSprintTasks(sprintId: string, assigneeId?: string) {
    return prisma.task.findMany({
      where: {
        sprintId,
        deletedAt: null,
        ...(assigneeId ? { assigneeId } : {}),
      },
      include: {
        assignee: { select: userSelect },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  countCompletedTasks(userId: string, since: Date) {
    return prisma.task.count({
      where: {
        assigneeId: userId,
        status: "DONE",
        completedAt: { gte: since },
        deletedAt: null,
      },
    });
  }

  countCodeReviewsCompleted(userId: string, since: Date) {
    return prisma.codeReview.count({
      where: {
        reviewerId: userId,
        status: "APPROVED",
        reviewedAt: { gte: since },
        deletedAt: null,
      },
    });
  }

  countTestCasesExecuted(userId: string, since: Date) {
    return prisma.testCase.count({
      where: {
        executedById: userId,
        executedAt: { gte: since },
        deletedAt: null,
        status: { in: ["PASSED", "FAILED", "BLOCKED", "SKIPPED"] },
      },
    });
  }

  countTrainingsCompleted(userId: string, since: Date) {
    return prisma.trainingEnrollment.count({
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { gte: since },
      },
    });
  }
}

export const engineeringRepository = new EngineeringRepository();
