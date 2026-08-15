import type {
  ReleaseStatus,
  ReleaseType,
  TestCaseStatus,
  TestCasePriority,
  TrainingStatus,
} from "@prisma/client";
import { engineeringRepository } from "../repositories/engineering.repository";
import { writeAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";

function periodStart(period?: string): Date {
  const now = new Date();
  if (period === "week") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (period === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export class EngineeringService {
  private repo = engineeringRepository;

  listReleases(filters?: { projectId?: string; status?: ReleaseStatus }) {
    return this.repo.listReleases(filters);
  }

  getRelease(id: string) {
    return this.repo.findReleaseById(id);
  }

  createRelease(
    input: {
      projectId: string;
      version: string;
      name: string;
      type?: ReleaseType;
      description?: string;
      releaseDate?: string;
      releaseNotes?: string;
      tagName?: string;
      commitHash?: string;
      buildNumber?: string;
    },
    actorId: string,
  ) {
    return this.repo.createRelease({
      version: input.version,
      name: input.name,
      type: input.type ?? "MINOR",
      description: input.description,
      releaseNotes: input.releaseNotes,
      tagName: input.tagName,
      commitHash: input.commitHash,
      buildNumber: input.buildNumber,
      releaseDate: input.releaseDate ? new Date(input.releaseDate) : undefined,
      project: { connect: { id: input.projectId } },
    }).then(async (release) => {
      await writeAuditLog({
        userId: actorId,
        action: "CREATE",
        entity: "Release",
        entityId: release.id,
        after: release,
      });
      return release;
    });
  }

  async updateRelease(
    id: string,
    input: Partial<{
      name: string;
      status: ReleaseStatus;
      description: string | null;
      releaseDate: string | null;
      releaseNotes: string | null;
      tagName: string | null;
      commitHash: string | null;
      buildNumber: string | null;
    }>,
    actorId: string,
  ) {
    const before = await this.repo.findReleaseById(id);
    if (!before) throw new Error("Release not found");
    const data: Record<string, unknown> = { ...input };
    if (input.releaseDate !== undefined) {
      data.releaseDate = input.releaseDate ? new Date(input.releaseDate) : null;
    }
    const release = await this.repo.updateRelease(id, data);
    await writeAuditLog({
      userId: actorId,
      action: "UPDATE",
      entity: "Release",
      entityId: id,
      before,
      after: release,
    });
    return release;
  }

  async deployRelease(id: string, actorId: string) {
    const release = await this.repo.updateRelease(id, {
      status: "RELEASED",
      deployedAt: new Date(),
      deployedBy: { connect: { id: actorId } },
    });
    await writeAuditLog({
      userId: actorId,
      action: "DEPLOY",
      entity: "Release",
      entityId: id,
      after: release,
    });
    return release;
  }

  async rollbackRelease(id: string, actorId: string) {
    const release = await this.repo.updateRelease(id, {
      status: "ROLLED_BACK",
    });
    await writeAuditLog({
      userId: actorId,
      action: "ROLLBACK",
      entity: "Release",
      entityId: id,
      after: release,
    });
    return release;
  }

  listTestCases(filters?: {
    projectId?: string;
    releaseId?: string;
    status?: TestCaseStatus;
    assignedToId?: string;
  }) {
    return this.repo.listTestCases(filters);
  }

  getTestCase(id: string) {
    return this.repo.findTestCaseById(id);
  }

  createTestCase(
    input: {
      projectId: string;
      releaseId?: string;
      title: string;
      description?: string;
      steps?: string;
      expectedResult?: string;
      priority?: TestCasePriority;
      assignedToId?: string;
    },
    actorId: string,
  ) {
    const data: Record<string, unknown> = {
      title: input.title,
      description: input.description,
      steps: input.steps,
      expectedResult: input.expectedResult,
      priority: input.priority ?? "MEDIUM",
      project: { connect: { id: input.projectId } },
      createdBy: { connect: { id: actorId } },
    };
    if (input.releaseId) data.release = { connect: { id: input.releaseId } };
    if (input.assignedToId) data.assignedTo = { connect: { id: input.assignedToId } };
    return this.repo.createTestCase(data as never).then(async (tc) => {
      await writeAuditLog({
        userId: actorId,
        action: "CREATE",
        entity: "TestCase",
        entityId: tc.id,
        after: tc,
      });
      return tc;
    });
  }

  updateTestCase(id: string, input: Record<string, unknown>, actorId: string) {
    const data = { ...input };
    if (input.assignedToId === null) data.assignedTo = { disconnect: true };
    else if (input.assignedToId) data.assignedTo = { connect: { id: input.assignedToId } };
    delete data.assignedToId;
    return this.repo.updateTestCase(id, data as never).then(async (tc) => {
      await writeAuditLog({
        userId: actorId,
        action: "UPDATE",
        entity: "TestCase",
        entityId: id,
        after: tc,
      });
      return tc;
    });
  }

  executeTestCase(
    id: string,
    input: { status: TestCaseStatus; actualResult?: string; notes?: string },
    actorId: string,
  ) {
    return this.repo.updateTestCase(id, {
      status: input.status,
      actualResult: input.actualResult,
      notes: input.notes,
      executedAt: new Date(),
      executedBy: { connect: { id: actorId } },
    }).then(async (tc) => {
      await writeAuditLog({
        userId: actorId,
        action: "EXECUTE",
        entity: "TestCase",
        entityId: id,
        after: tc,
      });
      return tc;
    });
  }

  listDocs(filters?: { projectId?: string; category?: string; search?: string }) {
    return this.repo.listDocumentations(filters);
  }

  getDoc(id: string) {
    return this.repo.findDocumentationById(id);
  }

  createDoc(
    input: {
      projectId?: string;
      title: string;
      description?: string;
      category?: string;
      url?: string;
      content?: string;
      version?: string;
    },
    actorId: string,
  ) {
    const data: Record<string, unknown> = {
      title: input.title,
      description: input.description,
      category: input.category,
      url: input.url,
      content: input.content,
      version: input.version,
      createdBy: { connect: { id: actorId } },
    };
    if (input.projectId) data.project = { connect: { id: input.projectId } };
    return this.repo.createDocumentation(data as never).then(async (doc) => {
      await writeAuditLog({
        userId: actorId,
        action: "CREATE",
        entity: "Documentation",
        entityId: doc.id,
        after: doc,
      });
      return doc;
    });
  }

  updateDoc(id: string, input: Record<string, unknown>, actorId: string) {
    return this.repo.updateDocumentation(id, input as never).then(async (doc) => {
      await writeAuditLog({
        userId: actorId,
        action: "UPDATE",
        entity: "Documentation",
        entityId: id,
        after: doc,
      });
      return doc;
    });
  }

  publishDoc(id: string, actorId: string) {
    return this.repo.updateDocumentation(id, {
      isPublished: true,
      publishedAt: new Date(),
    }).then(async (doc) => {
      await writeAuditLog({
        userId: actorId,
        action: "PUBLISH",
        entity: "Documentation",
        entityId: id,
        after: doc,
      });
      return doc;
    });
  }

  listTraining(filters?: { category?: string; isRequired?: boolean }) {
    return this.repo.listTrainings(filters);
  }

  getTraining(id: string) {
    return this.repo.findTrainingById(id);
  }

  createTraining(
    input: {
      title: string;
      description?: string;
      category?: string;
      content?: string;
      url?: string;
      duration?: number;
      isRequired?: boolean;
    },
    actorId: string,
  ) {
    return this.repo.createTraining({
      ...input,
      createdBy: { connect: { id: actorId } },
    }).then(async (training) => {
      await writeAuditLog({
        userId: actorId,
        action: "CREATE",
        entity: "TechTraining",
        entityId: training.id,
        after: training,
      });
      return training;
    });
  }

  updateTraining(id: string, input: Record<string, unknown>, actorId: string) {
    return this.repo.updateTraining(id, input as never).then(async (training) => {
      await writeAuditLog({
        userId: actorId,
        action: "UPDATE",
        entity: "TechTraining",
        entityId: id,
        after: training,
      });
      return training;
    });
  }

  myEnrollments(userId: string) {
    return this.repo.listEnrollmentsForUser(userId);
  }

  async enroll(trainingId: string, userId: string) {
    const existing = await prisma.trainingEnrollment.findUnique({
      where: { trainingId_userId: { trainingId, userId } },
    });
    if (existing) return this.repo.findEnrollment(existing.id);
    return this.repo.createEnrollment({
      training: { connect: { id: trainingId } },
      user: { connect: { id: userId } },
      status: "NOT_STARTED",
    });
  }

  updateEnrollment(
    id: string,
    input: {
      status?: TrainingStatus;
      startedAt?: string | null;
      completedAt?: string | null;
      score?: number | null;
      notes?: string | null;
    },
    actorId: string,
  ) {
    const data: Record<string, unknown> = { ...input };
    if (input.startedAt) data.startedAt = new Date(input.startedAt);
    if (input.completedAt) data.completedAt = new Date(input.completedAt);
    if (input.status === "IN_PROGRESS" && !input.startedAt) {
      data.startedAt = new Date();
    }
    if (input.status === "COMPLETED" && !input.completedAt) {
      data.completedAt = new Date();
    }
    return this.repo.updateEnrollment(id, data as never).then(async (enrollment) => {
      await writeAuditLog({
        userId: actorId,
        action: "UPDATE",
        entity: "TrainingEnrollment",
        entityId: id,
        after: enrollment,
      });
      return enrollment;
    });
  }

  listCodeReviews(filters?: {
    projectId?: string;
    authorId?: string;
    reviewerId?: string;
    status?: string;
  }) {
    return this.repo.listCodeReviews(filters);
  }

  getCodeReview(id: string) {
    return this.repo.findCodeReviewById(id);
  }

  createCodeReview(
    input: {
      projectId: string;
      taskId?: string;
      title: string;
      description?: string;
      pullRequestUrl?: string;
      reviewerId?: string;
    },
    actorId: string,
  ) {
    const data: Record<string, unknown> = {
      title: input.title,
      description: input.description,
      pullRequestUrl: input.pullRequestUrl,
      status: "PENDING",
      project: { connect: { id: input.projectId } },
      author: { connect: { id: actorId } },
    };
    if (input.taskId) data.task = { connect: { id: input.taskId } };
    if (input.reviewerId) data.reviewer = { connect: { id: input.reviewerId } };
    return this.repo.createCodeReview(data as never).then(async (review) => {
      await writeAuditLog({
        userId: actorId,
        action: "CREATE",
        entity: "CodeReview",
        entityId: review.id,
        after: review,
      });
      return review;
    });
  }

  updateCodeReview(id: string, input: Record<string, unknown>, actorId: string) {
    const data = { ...input };
    if (input.reviewerId === null) data.reviewer = { disconnect: true };
    else if (input.reviewerId) data.reviewer = { connect: { id: input.reviewerId } };
    delete data.reviewerId;
    return this.repo.updateCodeReview(id, data as never).then(async (review) => {
      await writeAuditLog({
        userId: actorId,
        action: "UPDATE",
        entity: "CodeReview",
        entityId: id,
        after: review,
      });
      return review;
    });
  }

  approveCodeReview(id: string, actorId: string) {
    return this.repo.updateCodeReview(id, {
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewer: { connect: { id: actorId } },
    }).then(async (review) => {
      await writeAuditLog({
        userId: actorId,
        action: "APPROVE",
        entity: "CodeReview",
        entityId: id,
        after: review,
      });
      return review;
    });
  }

  requestChangesOnReview(id: string, actorId: string, reviewNotes?: string) {
    return this.repo.updateCodeReview(id, {
      status: "CHANGES_REQUESTED",
      reviewedAt: new Date(),
      reviewNotes,
      reviewer: { connect: { id: actorId } },
    }).then(async (review) => {
      await writeAuditLog({
        userId: actorId,
        action: "REQUEST_CHANGES",
        entity: "CodeReview",
        entityId: id,
        after: review,
      });
      return review;
    });
  }

  async mySprintDashboard(userId: string, sprintId?: string) {
    const sprint = await this.repo.findActiveSprintForUser(userId, sprintId);
    if (!sprint) {
      return null;
    }
    const statusCounts = await this.repo.countTasksByStatus(sprint.id);
    const tasks = await this.repo.listSprintTasks(sprint.id, userId);
    let todo = 0;
    let inProgress = 0;
    let done = 0;
    for (const row of statusCounts) {
      if (row.status === "TODO") todo = row._count._all;
      else if (row.status === "IN_PROGRESS" || row.status === "IN_REVIEW") {
        inProgress += row._count._all;
      } else if (row.status === "DONE") done = row._count._all;
    }
    const total = todo + inProgress + done;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
      sprint: {
        id: sprint.id,
        name: sprint.name,
        goal: sprint.goal,
        status: sprint.status,
        startDate: sprint.startDate?.toISOString(),
        endDate: sprint.endDate?.toISOString(),
      },
      tasks: { todo, inProgress, done, total },
      team: [],
      progress,
      myTasks: tasks,
    };
  }

  async myMetrics(userId: string, period?: string) {
    const since = periodStart(period);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true },
    });
    const [tasksCompleted, codeReviewsCompleted, testCasesExecuted, trainingsCompleted] =
      await Promise.all([
        this.repo.countCompletedTasks(userId, since),
        this.repo.countCodeReviewsCompleted(userId, since),
        this.repo.countTestCasesExecuted(userId, since),
        this.repo.countTrainingsCompleted(userId, since),
      ]);
    return {
      userId,
      userName: user ? `${user.firstName} ${user.lastName}` : "",
      period: period ?? "month",
      tasksCompleted,
      codeReviewsCompleted,
      testCasesExecuted,
      trainingsCompleted,
      avgTaskCompletionTime: 0,
    };
  }

  async teamMetrics(projectId?: string) {
    const projects = projectId
      ? await prisma.project.findMany({ where: { id: projectId, deletedAt: null } })
      : await prisma.project.findMany({ where: { deletedAt: null }, take: 10 });
    const results = [];
    for (const project of projects) {
      const tasks = await prisma.task.groupBy({
        by: ["status"],
        where: { projectId: project.id, deletedAt: null },
        _count: { _all: true },
      });
      const total = tasks.reduce((sum, t) => sum + t._count._all, 0);
      const done = tasks.find((t) => t.status === "DONE")?._count._all ?? 0;
      results.push({
        projectId: project.id,
        projectName: project.name,
        totalTasks: total,
        completedTasks: done,
        completionPercentage: total > 0 ? Math.round((done / total) * 100) : 0,
      });
    }
    return results;
  }
}

export const engineeringService = new EngineeringService();
