import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../lib/response";
import { engineeringService } from "../services/engineering.service";

function resolveUserFilter(value: string | undefined, userId: string): string | undefined {
  if (value === "me") return userId;
  return value;
}

export class EngineeringController {
  listReleases = async (req: Request, res: Response): Promise<void> => {
    try {
      const releases = await engineeringService.listReleases(req.query as never);
      sendSuccess(res, releases);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_RELEASES_FAILED",
        message: error instanceof Error ? error.message : "Failed to list releases",
      });
    }
  };

  getRelease = async (req: Request, res: Response): Promise<void> => {
    try {
      const release = await engineeringService.getRelease(req.params.id);
      if (!release) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Release not found" });
        return;
      }
      sendSuccess(res, release);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_RELEASE_FAILED",
        message: error instanceof Error ? error.message : "Failed to get release",
      });
    }
  };

  createRelease = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const release = await engineeringService.createRelease(req.body, userId);
      sendSuccess(res, release, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_RELEASE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create release",
      });
    }
  };

  updateRelease = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const release = await engineeringService.updateRelease(req.params.id, req.body, userId);
      sendSuccess(res, release);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_RELEASE_FAILED",
        message: error instanceof Error ? error.message : "Failed to update release",
      });
    }
  };

  deployRelease = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const release = await engineeringService.deployRelease(req.params.id, userId);
      sendSuccess(res, release);
    } catch (error) {
      sendError(res, 400, {
        code: "DEPLOY_RELEASE_FAILED",
        message: error instanceof Error ? error.message : "Failed to deploy release",
      });
    }
  };

  rollbackRelease = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const release = await engineeringService.rollbackRelease(req.params.id, userId);
      sendSuccess(res, release);
    } catch (error) {
      sendError(res, 400, {
        code: "ROLLBACK_RELEASE_FAILED",
        message: error instanceof Error ? error.message : "Failed to rollback release",
      });
    }
  };

  listTestCases = async (req: Request, res: Response): Promise<void> => {
    try {
      const testCases = await engineeringService.listTestCases(req.query as never);
      sendSuccess(res, testCases);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_TEST_CASES_FAILED",
        message: error instanceof Error ? error.message : "Failed to list test cases",
      });
    }
  };

  getTestCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const testCase = await engineeringService.getTestCase(req.params.id);
      if (!testCase) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Test case not found" });
        return;
      }
      sendSuccess(res, testCase);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_TEST_CASE_FAILED",
        message: error instanceof Error ? error.message : "Failed to get test case",
      });
    }
  };

  createTestCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const testCase = await engineeringService.createTestCase(req.body, userId);
      sendSuccess(res, testCase, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_TEST_CASE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create test case",
      });
    }
  };

  updateTestCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const testCase = await engineeringService.updateTestCase(req.params.id, req.body, userId);
      sendSuccess(res, testCase);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_TEST_CASE_FAILED",
        message: error instanceof Error ? error.message : "Failed to update test case",
      });
    }
  };

  executeTestCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const testCase = await engineeringService.executeTestCase(req.params.id, req.body, userId);
      sendSuccess(res, testCase);
    } catch (error) {
      sendError(res, 400, {
        code: "EXECUTE_TEST_CASE_FAILED",
        message: error instanceof Error ? error.message : "Failed to execute test case",
      });
    }
  };

  listDocs = async (req: Request, res: Response): Promise<void> => {
    try {
      const docs = await engineeringService.listDocs(req.query as never);
      sendSuccess(res, docs);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_DOCS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list documentation",
      });
    }
  };

  getDoc = async (req: Request, res: Response): Promise<void> => {
    try {
      const doc = await engineeringService.getDoc(req.params.id);
      if (!doc) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Documentation not found" });
        return;
      }
      sendSuccess(res, doc);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_DOC_FAILED",
        message: error instanceof Error ? error.message : "Failed to get documentation",
      });
    }
  };

  createDoc = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const doc = await engineeringService.createDoc(req.body, userId);
      sendSuccess(res, doc, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_DOC_FAILED",
        message: error instanceof Error ? error.message : "Failed to create documentation",
      });
    }
  };

  updateDoc = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const doc = await engineeringService.updateDoc(req.params.id, req.body, userId);
      sendSuccess(res, doc);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_DOC_FAILED",
        message: error instanceof Error ? error.message : "Failed to update documentation",
      });
    }
  };

  publishDoc = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const doc = await engineeringService.publishDoc(req.params.id, userId);
      sendSuccess(res, doc);
    } catch (error) {
      sendError(res, 400, {
        code: "PUBLISH_DOC_FAILED",
        message: error instanceof Error ? error.message : "Failed to publish documentation",
      });
    }
  };

  listTraining = async (req: Request, res: Response): Promise<void> => {
    try {
      const trainings = await engineeringService.listTraining(req.query as never);
      sendSuccess(res, trainings);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_TRAINING_FAILED",
        message: error instanceof Error ? error.message : "Failed to list training",
      });
    }
  };

  getTraining = async (req: Request, res: Response): Promise<void> => {
    try {
      const training = await engineeringService.getTraining(req.params.id);
      if (!training) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Training not found" });
        return;
      }
      sendSuccess(res, training);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_TRAINING_FAILED",
        message: error instanceof Error ? error.message : "Failed to get training",
      });
    }
  };

  createTraining = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const training = await engineeringService.createTraining(req.body, userId);
      sendSuccess(res, training, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_TRAINING_FAILED",
        message: error instanceof Error ? error.message : "Failed to create training",
      });
    }
  };

  updateTraining = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const training = await engineeringService.updateTraining(req.params.id, req.body, userId);
      sendSuccess(res, training);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_TRAINING_FAILED",
        message: error instanceof Error ? error.message : "Failed to update training",
      });
    }
  };

  myEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const enrollments = await engineeringService.myEnrollments(userId);
      sendSuccess(res, enrollments);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_ENROLLMENTS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list enrollments",
      });
    }
  };

  enrollTraining = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const enrollment = await engineeringService.enroll(req.body.trainingId, userId);
      sendSuccess(res, enrollment, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "ENROLL_TRAINING_FAILED",
        message: error instanceof Error ? error.message : "Failed to enroll in training",
      });
    }
  };

  updateEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const enrollment = await engineeringService.updateEnrollment(
        req.params.id,
        req.body,
        userId,
      );
      sendSuccess(res, enrollment);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_ENROLLMENT_FAILED",
        message: error instanceof Error ? error.message : "Failed to update enrollment",
      });
    }
  };

  listCodeReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId ?? "";
      const query = req.query as Record<string, string | undefined>;
      const reviews = await engineeringService.listCodeReviews({
        projectId: query.projectId,
        status: query.status,
        authorId: resolveUserFilter(query.authorId, userId),
        reviewerId: resolveUserFilter(query.reviewerId, userId),
      });
      sendSuccess(res, reviews);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_CODE_REVIEWS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list code reviews",
      });
    }
  };

  getCodeReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const review = await engineeringService.getCodeReview(req.params.id);
      if (!review) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Code review not found" });
        return;
      }
      sendSuccess(res, review);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_CODE_REVIEW_FAILED",
        message: error instanceof Error ? error.message : "Failed to get code review",
      });
    }
  };

  createCodeReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const review = await engineeringService.createCodeReview(req.body, userId);
      sendSuccess(res, review, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_CODE_REVIEW_FAILED",
        message: error instanceof Error ? error.message : "Failed to create code review",
      });
    }
  };

  updateCodeReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const review = await engineeringService.updateCodeReview(req.params.id, req.body, userId);
      sendSuccess(res, review);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_CODE_REVIEW_FAILED",
        message: error instanceof Error ? error.message : "Failed to update code review",
      });
    }
  };

  approveCodeReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const review = await engineeringService.approveCodeReview(req.params.id, userId);
      sendSuccess(res, review);
    } catch (error) {
      sendError(res, 400, {
        code: "APPROVE_CODE_REVIEW_FAILED",
        message: error instanceof Error ? error.message : "Failed to approve code review",
      });
    }
  };

  requestChanges = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const review = await engineeringService.requestChangesOnReview(
        req.params.id,
        userId,
        req.body.reviewNotes,
      );
      sendSuccess(res, review);
    } catch (error) {
      sendError(res, 400, {
        code: "REQUEST_CHANGES_FAILED",
        message: error instanceof Error ? error.message : "Failed to request changes",
      });
    }
  };

  mySprintDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const sprintId = (req.query as { sprintId?: string }).sprintId;
      const dashboard = await engineeringService.mySprintDashboard(userId, sprintId);
      sendSuccess(res, dashboard);
    } catch (error) {
      sendError(res, 500, {
        code: "SPRINT_DASHBOARD_FAILED",
        message: error instanceof Error ? error.message : "Failed to load sprint dashboard",
      });
    }
  };

  myMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "Not authenticated" });
        return;
      }
      const period = (req.query as { period?: string }).period;
      const metrics = await engineeringService.myMetrics(userId, period);
      sendSuccess(res, metrics);
    } catch (error) {
      sendError(res, 500, {
        code: "METRICS_FAILED",
        message: error instanceof Error ? error.message : "Failed to load metrics",
      });
    }
  };

  teamMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = (req.query as { projectId?: string }).projectId;
      const metrics = await engineeringService.teamMetrics(projectId);
      sendSuccess(res, metrics);
    } catch (error) {
      sendError(res, 500, {
        code: "TEAM_METRICS_FAILED",
        message: error instanceof Error ? error.message : "Failed to load team metrics",
      });
    }
  };
}

export const engineeringController = new EngineeringController();
