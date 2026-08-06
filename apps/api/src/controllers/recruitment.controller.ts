import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../lib/response";
import { recruitmentService } from "../services/recruitment.service";
import { authService } from "../services/auth.service";
import { authCookieOptions } from "../lib/cookies";
import { getAccessTokenMaxAgeMs, getRefreshTokenMaxAgeMs } from "../lib/token-expiry";

export class CareersController {
  listJobs = async (_req: Request, res: Response): Promise<void> => {
    try {
      const jobs = await recruitmentService.listPublicJobs();
      sendSuccess(res, jobs);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_JOBS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list jobs",
      });
    }
  };

  getJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await recruitmentService.getPublicJob(req.params.slug);
      if (!job || job.status !== "PUBLISHED") {
        sendError(res, 404, { code: "NOT_FOUND", message: "Job not found" });
        return;
      }
      sendSuccess(res, job);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_JOB_FAILED",
        message: error instanceof Error ? error.message : "Failed to get job",
      });
    }
  };

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user } = await recruitmentService.registerCandidate(req.body);
      const tokens = await authService.issueTokensForUser(user.id);
      res.cookie("accessToken", tokens.accessToken, authCookieOptions(getAccessTokenMaxAgeMs()));
      res.cookie("refreshToken", tokens.refreshToken, authCookieOptions(getRefreshTokenMaxAgeMs()));
      sendSuccess(res, { user: tokens.user }, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "REGISTER_FAILED",
        message: error instanceof Error ? error.message : "Registration failed",
      });
    }
  };

  apply = async (req: Request, res: Response): Promise<void> => {
    try {
      const application = await recruitmentService.applyToJob({
        ...req.body,
        userId: req.user?.userId,
      });
      sendSuccess(res, application, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "APPLY_FAILED",
        message: error instanceof Error ? error.message : "Application failed",
      });
    }
  };
}

export class RecruitmentController {
  listJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const jobs = await recruitmentService.listJobs(req.query as { status?: string; search?: string });
      sendSuccess(res, jobs);
    } catch (error) {
      sendError(res, 500, { code: "LIST_JOBS_FAILED", message: "Failed to list jobs" });
    }
  };

  createJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await recruitmentService.createJob(req.body);
      sendSuccess(res, job, 201);
    } catch (error) {
      sendError(res, 400, { code: "CREATE_JOB_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  updateJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await recruitmentService.updateJob(req.params.id, req.body);
      sendSuccess(res, job);
    } catch (error) {
      sendError(res, 400, { code: "UPDATE_JOB_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  listCandidates = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidates = await recruitmentService.listCandidates(req.query as { status?: string; search?: string });
      sendSuccess(res, candidates);
    } catch (error) {
      sendError(res, 500, { code: "LIST_CANDIDATES_FAILED", message: "Failed to list candidates" });
    }
  };

  getCandidate = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidate = await recruitmentService.getCandidate(req.params.id);
      if (!candidate) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Candidate not found" });
        return;
      }
      sendSuccess(res, candidate);
    } catch (error) {
      sendError(res, 500, { code: "GET_CANDIDATE_FAILED", message: "Failed to get candidate" });
    }
  };

  getMyCandidateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidate = await recruitmentService.getCandidateByUserId(req.user!.userId);
      if (!candidate) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Candidate profile not found" });
        return;
      }
      sendSuccess(res, candidate);
    } catch (error) {
      sendError(res, 500, { code: "GET_PROFILE_FAILED", message: "Failed to get profile" });
    }
  };

  attachResume = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidate = await recruitmentService.getCandidateByUserId(req.user!.userId);
      if (!candidate) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Candidate profile not found" });
        return;
      }
      const updated = await recruitmentService.attachResume(candidate.id, req.body.fileId);
      sendSuccess(res, updated);
    } catch (error) {
      sendError(res, 400, { code: "ATTACH_RESUME_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  listApplications = async (req: Request, res: Response): Promise<void> => {
    try {
      const applications = await recruitmentService.listApplications(
        req.query as { status?: string; statuses?: string[]; jobPostingId?: string },
      );
      sendSuccess(res, applications);
    } catch (error) {
      sendError(res, 500, { code: "LIST_APPLICATIONS_FAILED", message: "Failed" });
    }
  };

  getApplication = async (req: Request, res: Response): Promise<void> => {
    try {
      const application = await recruitmentService.getApplication(req.params.id);
      if (!application) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Application not found" });
        return;
      }
      sendSuccess(res, application);
    } catch (error) {
      sendError(res, 500, { code: "GET_APPLICATION_FAILED", message: "Failed" });
    }
  };

  updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await recruitmentService.updateApplicationStatus(
        req.params.id,
        req.body.status,
        req.user!.userId,
        req.body.statusNotes,
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_STATUS_FAILED",
        message: error instanceof Error ? error.message : "Failed to update status",
      });
    }
  };

  scheduleInterview = async (req: Request, res: Response): Promise<void> => {
    try {
      const interview = await recruitmentService.scheduleInterview(req.body);
      sendSuccess(res, interview, 201);
    } catch (error) {
      sendError(res, 400, { code: "SCHEDULE_INTERVIEW_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  assignAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const assessment = await recruitmentService.assignAssessment(req.body);
      sendSuccess(res, assessment, 201);
    } catch (error) {
      sendError(res, 400, { code: "ASSIGN_ASSESSMENT_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  createOffer = async (req: Request, res: Response): Promise<void> => {
    try {
      const offer = await recruitmentService.createOfferLetter(req.body);
      sendSuccess(res, offer, 201);
    } catch (error) {
      sendError(res, 400, { code: "CREATE_OFFER_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  sendOffer = async (req: Request, res: Response): Promise<void> => {
    try {
      const offer = await recruitmentService.sendOfferLetter(req.params.id, req.user!.userId);
      sendSuccess(res, offer);
    } catch (error) {
      sendError(res, 400, { code: "SEND_OFFER_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };

  getPipeline = async (_req: Request, res: Response): Promise<void> => {
    try {
      const [summary, applications] = await Promise.all([
        recruitmentService.getPipelineSummary(),
        recruitmentService.listApplications(),
      ]);
      sendSuccess(res, { summary, applications });
    } catch (error) {
      sendError(res, 500, { code: "PIPELINE_FAILED", message: "Failed to load pipeline" });
    }
  };

  updateChecklist = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await recruitmentService.updateChecklistItem(req.params.id, req.body.isCompleted);
      sendSuccess(res, item);
    } catch (error) {
      sendError(res, 400, { code: "UPDATE_CHECKLIST_FAILED", message: error instanceof Error ? error.message : "Failed" });
    }
  };
}
