import { z } from "zod";

const releaseStatus = z.enum([
  "PLANNING",
  "IN_PROGRESS",
  "TESTING",
  "STAGING",
  "RELEASED",
  "ROLLED_BACK",
]);
const releaseType = z.enum(["MAJOR", "MINOR", "PATCH", "HOTFIX"]);
const testCaseStatus = z.enum(["DRAFT", "READY", "PASSED", "FAILED", "BLOCKED", "SKIPPED"]);
const testCasePriority = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const trainingStatus = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "EXPIRED"]);

export const listReleasesQuerySchema = z.object({
  projectId: z.string().optional(),
  status: releaseStatus.optional(),
});

export const createReleaseSchema = z.object({
  projectId: z.string(),
  version: z.string().min(1),
  name: z.string().min(1),
  type: releaseType.optional(),
  description: z.string().optional(),
  releaseDate: z.string().optional(),
  releaseNotes: z.string().optional(),
  tagName: z.string().optional(),
  commitHash: z.string().optional(),
  buildNumber: z.string().optional(),
});

export const updateReleaseSchema = z.object({
  name: z.string().min(1).optional(),
  status: releaseStatus.optional(),
  description: z.string().nullable().optional(),
  releaseDate: z.string().nullable().optional(),
  releaseNotes: z.string().nullable().optional(),
  tagName: z.string().nullable().optional(),
  commitHash: z.string().nullable().optional(),
  buildNumber: z.string().nullable().optional(),
});

export const listTestCasesQuerySchema = z.object({
  projectId: z.string().optional(),
  releaseId: z.string().optional(),
  status: testCaseStatus.optional(),
  assignedToId: z.string().optional(),
});

export const createTestCaseSchema = z.object({
  projectId: z.string(),
  releaseId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  steps: z.string().optional(),
  expectedResult: z.string().optional(),
  priority: testCasePriority.optional(),
  assignedToId: z.string().optional(),
});

export const updateTestCaseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  steps: z.string().nullable().optional(),
  expectedResult: z.string().nullable().optional(),
  status: testCaseStatus.optional(),
  priority: testCasePriority.optional(),
  assignedToId: z.string().nullable().optional(),
});

export const executeTestCaseSchema = z.object({
  status: testCaseStatus,
  actualResult: z.string().optional(),
  notes: z.string().optional(),
});

export const listDocsQuerySchema = z.object({
  projectId: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const createDocSchema = z.object({
  projectId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  url: z.string().optional(),
  content: z.string().optional(),
  version: z.string().optional(),
});

export const updateDocSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
});

export const listTrainingQuerySchema = z.object({
  category: z.string().optional(),
  isRequired: z.coerce.boolean().optional(),
});

export const createTrainingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  content: z.string().optional(),
  url: z.string().optional(),
  duration: z.number().int().positive().optional(),
  isRequired: z.boolean().optional(),
});

export const updateTrainingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const enrollTrainingSchema = z.object({
  trainingId: z.string(),
});

export const updateEnrollmentSchema = z.object({
  status: trainingStatus.optional(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const listCodeReviewsQuerySchema = z.object({
  projectId: z.string().optional(),
  authorId: z.string().optional(),
  reviewerId: z.string().optional(),
  status: z.string().optional(),
});

export const createCodeReviewSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  pullRequestUrl: z.string().optional(),
  reviewerId: z.string().optional(),
});

export const updateCodeReviewSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  pullRequestUrl: z.string().nullable().optional(),
  reviewerId: z.string().nullable().optional(),
  status: z.string().optional(),
  reviewNotes: z.string().nullable().optional(),
});

export const requestChangesSchema = z.object({
  reviewNotes: z.string().optional(),
});

export const sprintDashboardQuerySchema = z.object({
  sprintId: z.string().optional(),
});

export const metricsQuerySchema = z.object({
  period: z.string().optional(),
});

export const teamMetricsQuerySchema = z.object({
  projectId: z.string().optional(),
});
