import { Router } from "express";
import { RecruitmentController } from "../controllers/recruitment.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createJobSchema,
  updateJobSchema,
  listJobsQuerySchema,
  listCandidatesQuerySchema,
  listApplicationsQuerySchema,
  attachResumeSchema,
  updateApplicationStatusSchema,
  scheduleInterviewSchema,
  assignAssessmentSchema,
  createOfferSchema,
  updateChecklistSchema,
} from "../schemas/phase2.schema";

const router = Router();
const controller = new RecruitmentController();

router.get(
  "/jobs",
  requireAuth,
  requirePermission("job.read"),
  validate(listJobsQuerySchema, "query"),
  controller.listJobs,
);
router.post(
  "/jobs",
  requireAuth,
  requirePermission("job.create"),
  validate(createJobSchema),
  controller.createJob,
);
router.patch(
  "/jobs/:id",
  requireAuth,
  requirePermission("job.update"),
  validate(updateJobSchema),
  controller.updateJob,
);

router.get(
  "/candidates",
  requireAuth,
  requirePermission("candidate.read"),
  validate(listCandidatesQuerySchema, "query"),
  controller.listCandidates,
);
router.get(
  "/candidates/me",
  requireAuth,
  controller.getMyCandidateProfile,
);
router.post(
  "/candidates/me/resume",
  requireAuth,
  validate(attachResumeSchema),
  controller.attachResume,
);
router.get(
  "/candidates/:id",
  requireAuth,
  requirePermission("candidate.read"),
  controller.getCandidate,
);

router.get(
  "/applications",
  requireAuth,
  requirePermission("application.read"),
  validate(listApplicationsQuerySchema, "query"),
  controller.listApplications,
);
router.get(
  "/applications/:id",
  requireAuth,
  requirePermission("application.read"),
  controller.getApplication,
);
router.patch(
  "/applications/:id/status",
  requireAuth,
  requirePermission("application.update"),
  validate(updateApplicationStatusSchema),
  controller.updateApplicationStatus,
);

router.get(
  "/pipeline",
  requireAuth,
  requirePermission("application.read"),
  controller.getPipeline,
);

router.post(
  "/interviews",
  requireAuth,
  requirePermission("interview.create"),
  validate(scheduleInterviewSchema),
  controller.scheduleInterview,
);
router.post(
  "/assessments",
  requireAuth,
  requirePermission("assessment.create"),
  validate(assignAssessmentSchema),
  controller.assignAssessment,
);
router.post(
  "/offers",
  requireAuth,
  requirePermission("offer.create"),
  validate(createOfferSchema),
  controller.createOffer,
);
router.post(
  "/offers/:id/send",
  requireAuth,
  requirePermission("offer.update"),
  controller.sendOffer,
);
router.patch(
  "/checklist/:id",
  requireAuth,
  requirePermission("application.update"),
  validate(updateChecklistSchema),
  controller.updateChecklist,
);

export { router as recruitmentRouter };
