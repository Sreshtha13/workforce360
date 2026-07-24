import { z } from "zod";

export const presignUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  purpose: z.enum(["RESUME", "POLICY", "OFFER_LETTER", "DOCUMENT", "OTHER"]),
});

export const confirmUploadSchema = z.object({
  storageKey: z.string().min(1),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  sizeBytes: z.number().int().positive(),
  purpose: z.enum(["RESUME", "POLICY", "OFFER_LETTER", "DOCUMENT", "OTHER"]),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  requirements: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const candidateRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  linkedInUrl: z.string().url().optional().or(z.literal("")),
});

export const applyJobSchema = z.object({
  jobPostingId: z.string().min(1),
  coverLetter: z.string().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const attachResumeSchema = z.object({
  fileId: z.string().min(1),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]),
  statusNotes: z.string().optional(),
});

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().optional(),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
  interviewerId: z.string().optional(),
  notes: z.string().optional(),
});

export const assignAssessmentSchema = z.object({
  applicationId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueAt: z.string().datetime().optional(),
});

export const createOfferSchema = z.object({
  applicationId: z.string().min(1),
  salary: z.number().positive().optional(),
  currency: z.string().optional(),
  startDate: z.string().datetime().optional(),
  content: z.string().min(1),
  fileId: z.string().optional(),
});

export const updateChecklistSchema = z.object({
  isCompleted: z.boolean(),
});

export const listJobsQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});

export const listCandidatesQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});

export const listApplicationsQuerySchema = z.object({
  status: z.string().optional(),
  jobPostingId: z.string().optional(),
});

export const lifecycleUpdateSchema = z.object({
  lifecycleState: z.enum(["PRE_ONBOARDING", "ONBOARDING", "ACTIVE", "OFFBOARDING", "TERMINATED"]),
  notes: z.string().optional(),
});

export const createPolicySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  version: z.string().optional(),
  fileId: z.string().optional(),
});

export const createAssetSchema = z.object({
  name: z.string().min(1),
  tag: z.string().min(1),
  category: z.string().optional(),
  serialNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const assignAssetSchema = z.object({
  employeeId: z.string().min(1),
});

export const updatePortalProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export const listEmployeesQuerySchema = z.object({
  lifecycleState: z.string().optional(),
  search: z.string().optional(),
});

export const listInterviewsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const listOffersQuerySchema = z.object({
  status: z.string().optional(),
});

export const listPoliciesQuerySchema = z.object({
  status: z.string().optional(),
});

export const listAssetsQuerySchema = z.object({
  status: z.string().optional(),
  employeeId: z.string().optional(),
});
