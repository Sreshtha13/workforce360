import type { CandidatePipelineStatus, JobPostingStatus } from "@prisma/client";
import { RecruitmentRepository } from "../repositories/phase2.repository";
import { hashPassword } from "../lib/password";
import { writeAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";
import { hrService } from "./hr.service";
import { userIsSuperAdmin } from "../lib/super-admin";

const PIPELINE_STAGE_ORDER: CandidatePipelineStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
];

const DEFAULT_CHECKLIST = [
  "Submit signed offer letter",
  "Complete background check authorization",
  "Provide government ID copy",
  "Set up direct deposit details",
  "Review employee handbook",
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export class RecruitmentService {
  private repo = new RecruitmentRepository();

  private async actorCanOverridePipeline(actorId: string): Promise<boolean> {
    if (await userIsSuperAdmin(actorId)) return true;

    const assignment = await prisma.userRole.findFirst({
      where: {
        userId: actorId,
        deletedAt: null,
        role: {
          deletedAt: null,
          rolePermissions: {
            some: {
              deletedAt: null,
              permission: { code: "application.override_stage", isActive: true },
            },
          },
        },
      },
      select: { id: true },
    });

    return assignment !== null;
  }

  listPublicJobs() {
    return this.repo.listPublishedJobs();
  }

  getPublicJob(slug: string) {
    return this.repo.findJobBySlug(slug);
  }

  listJobs(filters?: { status?: string; search?: string }) {
    return this.repo.listJobs(filters);
  }

  async createJob(input: {
    title: string;
    description: string;
    requirements?: string;
    departmentId?: string;
    designationId?: string;
    location?: string;
    employmentType?: string;
    status?: JobPostingStatus;
  }) {
    let slug = slugify(input.title);
    const existing = await prisma.jobPosting.findFirst({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    return this.repo.createJob({
      title: input.title,
      slug,
      description: input.description,
      requirements: input.requirements,
      department: input.departmentId ? { connect: { id: input.departmentId } } : undefined,
      designation: input.designationId ? { connect: { id: input.designationId } } : undefined,
      location: input.location,
      employmentType: input.employmentType,
      status: input.status ?? "DRAFT",
      publishedAt: input.status === "PUBLISHED" ? new Date() : undefined,
    });
  }

  async updateJob(
    id: string,
    input: Partial<{
      title: string;
      description: string;
      requirements: string;
      departmentId: string | null;
      designationId: string | null;
      location: string;
      employmentType: string;
      status: JobPostingStatus;
    }>,
  ) {
    const data: Record<string, unknown> = { ...input };
    if (input.status === "PUBLISHED") data.publishedAt = new Date();
    if (input.status === "CLOSED") data.closedAt = new Date();
    return this.repo.updateJob(id, data);
  }

  listCandidates(filters?: { status?: string; search?: string }) {
    return this.repo.listCandidates(filters);
  }

  getCandidate(id: string) {
    return this.repo.findCandidateById(id);
  }

  getCandidateByUserId(userId: string) {
    return this.repo.findCandidateByUserId(userId);
  }

  async registerCandidate(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    linkedInUrl?: string;
  }) {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) throw new Error("An account with this email already exists");

    const candidateRole = await prisma.role.findUnique({ where: { code: "candidate" } });
    if (!candidateRole) throw new Error("Candidate role is not configured");

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        status: "active",
        userRoles: {
          create: { roleId: candidateRole.id },
        },
      },
    });

    const candidate = await this.repo.createCandidate({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      linkedInUrl: input.linkedInUrl,
      user: { connect: { id: user.id } },
    });

    return { user, candidate };
  }

  async applyToJob(input: {
    candidateId?: string;
    userId?: string;
    jobPostingId: string;
    coverLetter?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }) {
    const job = await prisma.jobPosting.findFirst({
      where: { id: input.jobPostingId, status: "PUBLISHED", deletedAt: null },
    });
    if (!job) throw new Error("Job posting not found or not open");

    let candidateId = input.candidateId;

    if (!candidateId && input.userId) {
      const linked = await this.repo.findCandidateByUserId(input.userId);
      if (!linked) throw new Error("Candidate profile not found");
      candidateId = linked.id;
    }

    if (!candidateId) {
      if (!input.email || !input.firstName || !input.lastName) {
        throw new Error("Candidate details are required");
      }
      let candidate = await this.repo.findCandidateByEmail(input.email);
      if (!candidate) {
        candidate = await this.repo.createCandidate({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
        });
      }
      candidateId = candidate.id;
    }

    const existingApp = await prisma.jobApplication.findFirst({
      where: { candidateId, jobPostingId: input.jobPostingId, deletedAt: null },
    });
    if (existingApp) throw new Error("You have already applied to this job");

    const application = await this.repo.createApplication({
      candidate: { connect: { id: candidateId } },
      jobPosting: { connect: { id: input.jobPostingId } },
      coverLetter: input.coverLetter,
      status: "APPLIED",
    });

    await this.repo.createChecklistItems(
      DEFAULT_CHECKLIST.map((title, index) => ({
        applicationId: application.id,
        title,
        sortOrder: index,
      })),
    );

    return application;
  }

  listApplications(filters?: { status?: string; jobPostingId?: string; statuses?: string[] }) {
    return this.repo.listApplications(filters);
  }

  getApplication(id: string) {
    return this.repo.findApplicationById(id);
  }

  async updateApplicationStatus(
    applicationId: string,
    status: CandidatePipelineStatus,
    actorId: string,
    statusNotes?: string,
  ) {
    const application = await this.repo.findApplicationById(applicationId);
    if (!application) throw new Error("Application not found");

    if (status !== "REJECTED" && status !== application.status) {
      const fromIdx = PIPELINE_STAGE_ORDER.indexOf(application.status);
      const toIdx = PIPELINE_STAGE_ORDER.indexOf(status);
      if (fromIdx >= 0 && toIdx >= 0 && toIdx < fromIdx) {
        const canOverride = await this.actorCanOverridePipeline(actorId);
        if (!canOverride) {
          throw new Error(
            "Cannot move candidate to an earlier pipeline stage without override permission",
          );
        }
      }
    }

    const updated = await this.repo.updateApplication(applicationId, {
      status,
      statusNotes,
    });

    await this.repo.updateCandidate(application.candidateId, {
      pipelineStatus: status,
    });

    await writeAuditLog({
      userId: actorId,
      action: "update_status",
      entity: "job_application",
      entityId: applicationId,
      before: { status: application.status },
      after: { status, statusNotes },
    });

    if (status === "HIRED") {
      const employee = await hrService.hireCandidate({
        applicationId,
        actorId,
        departmentId: application.jobPosting.departmentId ?? undefined,
        designationId: application.jobPosting.designationId ?? undefined,
      });
      return { application: updated, employee };
    }

    return { application: updated };
  }

  async attachResume(candidateId: string, fileId: string) {
    return this.repo.updateCandidate(candidateId, {
      resumeFile: { connect: { id: fileId } },
    });
  }

  async scheduleInterview(input: {
    applicationId: string;
    scheduledAt: string;
    durationMinutes?: number;
    location?: string;
    meetingLink?: string;
    interviewerId?: string;
    notes?: string;
  }) {
    return this.repo.createInterview({
      application: { connect: { id: input.applicationId } },
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes ?? 60,
      location: input.location,
      meetingLink: input.meetingLink,
      interviewer: input.interviewerId ? { connect: { id: input.interviewerId } } : undefined,
      notes: input.notes,
    });
  }

  async assignAssessment(input: {
    applicationId: string;
    title: string;
    description?: string;
    dueAt?: string;
  }) {
    return this.repo.createAssessment({
      application: { connect: { id: input.applicationId } },
      title: input.title,
      description: input.description,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
    });
  }

  async createOfferLetter(input: {
    applicationId: string;
    salary?: number;
    currency?: string;
    startDate?: string;
    content: string;
    fileId?: string;
  }) {
    return this.repo.createOfferLetter({
      application: { connect: { id: input.applicationId } },
      salary: input.salary,
      currency: input.currency ?? "USD",
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      content: input.content,
      status: "DRAFT",
      file: input.fileId ? { connect: { id: input.fileId } } : undefined,
    });
  }

  async sendOfferLetter(offerId: string, actorId: string) {
    const offer = await prisma.offerLetter.update({
      where: { id: offerId },
      data: { status: "SENT", sentAt: new Date() },
    });
    await writeAuditLog({
      userId: actorId,
      action: "send_offer",
      entity: "offer_letter",
      entityId: offerId,
    });
    return offer;
  }

  getPipelineSummary() {
    return this.repo.getPipelineSummary();
  }

  updateChecklistItem(id: string, isCompleted: boolean) {
    return this.repo.updateChecklistItem(id, {
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    });
  }
}

export const recruitmentService = new RecruitmentService();
