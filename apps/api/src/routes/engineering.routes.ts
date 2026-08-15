import { Router } from "express";
import { engineeringController } from "../controllers/engineering.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  listReleasesQuerySchema,
  createReleaseSchema,
  updateReleaseSchema,
  listTestCasesQuerySchema,
  createTestCaseSchema,
  updateTestCaseSchema,
  executeTestCaseSchema,
  listDocsQuerySchema,
  createDocSchema,
  updateDocSchema,
  listTrainingQuerySchema,
  createTrainingSchema,
  updateTrainingSchema,
  enrollTrainingSchema,
  updateEnrollmentSchema,
  listCodeReviewsQuerySchema,
  createCodeReviewSchema,
  updateCodeReviewSchema,
  requestChangesSchema,
  sprintDashboardQuerySchema,
  metricsQuerySchema,
  teamMetricsQuerySchema,
} from "../schemas/engineering.schema";

const router = Router();
const c = engineeringController;

// Releases
router.get(
  "/releases",
  requireAuth,
  requirePermission("engineering.release.read"),
  validate(listReleasesQuerySchema, "query"),
  c.listReleases,
);
router.get(
  "/releases/:id",
  requireAuth,
  requirePermission("engineering.release.read"),
  c.getRelease,
);
router.post(
  "/releases",
  requireAuth,
  requirePermission("engineering.release.create"),
  validate(createReleaseSchema),
  c.createRelease,
);
router.patch(
  "/releases/:id",
  requireAuth,
  requirePermission("engineering.release.update"),
  validate(updateReleaseSchema),
  c.updateRelease,
);
router.post(
  "/releases/:id/deploy",
  requireAuth,
  requirePermission("engineering.release.deploy"),
  c.deployRelease,
);
router.post(
  "/releases/:id/rollback",
  requireAuth,
  requirePermission("engineering.release.deploy"),
  c.rollbackRelease,
);

// Test cases
router.get(
  "/test-cases",
  requireAuth,
  requirePermission("engineering.testcase.read"),
  validate(listTestCasesQuerySchema, "query"),
  c.listTestCases,
);
router.get(
  "/test-cases/:id",
  requireAuth,
  requirePermission("engineering.testcase.read"),
  c.getTestCase,
);
router.post(
  "/test-cases",
  requireAuth,
  requirePermission("engineering.testcase.create"),
  validate(createTestCaseSchema),
  c.createTestCase,
);
router.patch(
  "/test-cases/:id",
  requireAuth,
  requirePermission("engineering.testcase.create"),
  validate(updateTestCaseSchema),
  c.updateTestCase,
);
router.post(
  "/test-cases/:id/execute",
  requireAuth,
  requirePermission("engineering.testcase.execute"),
  validate(executeTestCaseSchema),
  c.executeTestCase,
);

// Documentation
router.get(
  "/docs",
  requireAuth,
  requirePermission("engineering.doc.read"),
  validate(listDocsQuerySchema, "query"),
  c.listDocs,
);
router.get(
  "/docs/:id",
  requireAuth,
  requirePermission("engineering.doc.read"),
  c.getDoc,
);
router.post(
  "/docs",
  requireAuth,
  requirePermission("engineering.doc.create"),
  validate(createDocSchema),
  c.createDoc,
);
router.patch(
  "/docs/:id",
  requireAuth,
  requirePermission("engineering.doc.create"),
  validate(updateDocSchema),
  c.updateDoc,
);
router.post(
  "/docs/:id/publish",
  requireAuth,
  requirePermission("engineering.doc.publish"),
  c.publishDoc,
);

// Training
router.get(
  "/training",
  requireAuth,
  requirePermission("engineering.training.read"),
  validate(listTrainingQuerySchema, "query"),
  c.listTraining,
);
router.get(
  "/training/my-enrollments",
  requireAuth,
  requirePermission("engineering.training.read"),
  c.myEnrollments,
);
router.get(
  "/training/:id",
  requireAuth,
  requirePermission("engineering.training.read"),
  c.getTraining,
);
router.post(
  "/training",
  requireAuth,
  requirePermission("engineering.training.create"),
  validate(createTrainingSchema),
  c.createTraining,
);
router.patch(
  "/training/:id",
  requireAuth,
  requirePermission("engineering.training.create"),
  validate(updateTrainingSchema),
  c.updateTraining,
);
router.post(
  "/training/enroll",
  requireAuth,
  requirePermission("engineering.training.enroll"),
  validate(enrollTrainingSchema),
  c.enrollTraining,
);
router.patch(
  "/training/enrollments/:id",
  requireAuth,
  requirePermission("engineering.training.enroll"),
  validate(updateEnrollmentSchema),
  c.updateEnrollment,
);

// Code reviews
router.get(
  "/code-reviews",
  requireAuth,
  requirePermission("engineering.codereview.read"),
  validate(listCodeReviewsQuerySchema, "query"),
  c.listCodeReviews,
);
router.get(
  "/code-reviews/:id",
  requireAuth,
  requirePermission("engineering.codereview.read"),
  c.getCodeReview,
);
router.post(
  "/code-reviews",
  requireAuth,
  requirePermission("engineering.codereview.create"),
  validate(createCodeReviewSchema),
  c.createCodeReview,
);
router.patch(
  "/code-reviews/:id",
  requireAuth,
  requirePermission("engineering.codereview.create"),
  validate(updateCodeReviewSchema),
  c.updateCodeReview,
);
router.post(
  "/code-reviews/:id/approve",
  requireAuth,
  requirePermission("engineering.codereview.approve"),
  c.approveCodeReview,
);
router.post(
  "/code-reviews/:id/request-changes",
  requireAuth,
  requirePermission("engineering.codereview.approve"),
  validate(requestChangesSchema),
  c.requestChanges,
);

// Dashboard
router.get(
  "/dashboard/my-sprint",
  requireAuth,
  requirePermission("engineering.release.read"),
  validate(sprintDashboardQuerySchema, "query"),
  c.mySprintDashboard,
);
router.get(
  "/dashboard/my-metrics",
  requireAuth,
  requirePermission("engineering.release.read"),
  validate(metricsQuerySchema, "query"),
  c.myMetrics,
);
router.get(
  "/dashboard/team-metrics",
  requireAuth,
  requirePermission("engineering.release.read"),
  validate(teamMetricsQuerySchema, "query"),
  c.teamMetrics,
);

export default router;
