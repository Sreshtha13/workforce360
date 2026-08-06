import type { StoredFilePurpose, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export class StorageRepository {
  createFileRecord(data: {
    storageKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    purpose: StoredFilePurpose;
    uploadedById?: string;
    entityType?: string;
    entityId?: string;
  }) {
    return prisma.storedFile.create({ data });
  }

  findByStorageKey(storageKey: string) {
    return prisma.storedFile.findFirst({
      where: { storageKey, deletedAt: null },
    });
  }

  findById(id: string) {
    return prisma.storedFile.findFirst({
      where: { id, deletedAt: null },
    });
  }

  linkToEntity(id: string, entityType: string, entityId: string) {
    return prisma.storedFile.update({
      where: { id },
      data: { entityType, entityId },
    });
  }
}

export class RecruitmentRepository {
  listPublishedJobs() {
    return prisma.jobPosting.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
      },
      orderBy: { publishedAt: "desc" },
    });
  }

  findJobBySlug(slug: string) {
    return prisma.jobPosting.findFirst({
      where: { slug, deletedAt: null },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
      },
    });
  }

  listJobs(filters?: { status?: string; search?: string }) {
    const where: Prisma.JobPostingWhereInput = { deletedAt: null };
    if (filters?.status) where.status = filters.status as Prisma.EnumJobPostingStatusFilter["equals"];
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { slug: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return prisma.jobPosting.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  createJob(data: Prisma.JobPostingCreateInput) {
    return prisma.jobPosting.create({ data });
  }

  updateJob(id: string, data: Prisma.JobPostingUpdateInput) {
    return prisma.jobPosting.update({ where: { id }, data });
  }

  findCandidateByEmail(email: string) {
    return prisma.candidate.findFirst({
      where: { email, deletedAt: null },
      include: { user: true },
    });
  }

  findCandidateByUserId(userId: string) {
    return prisma.candidate.findFirst({
      where: { userId, deletedAt: null },
      include: {
        resumeFile: true,
        applications: {
          where: { deletedAt: null },
          include: {
            jobPosting: { select: { id: true, title: true, slug: true } },
            interviews: { where: { deletedAt: null }, orderBy: { scheduledAt: "asc" } },
            assessments: { where: { deletedAt: null } },
            offerLetters: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
            checklistItems: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });
  }

  findCandidateById(id: string) {
    return prisma.candidate.findFirst({
      where: { id, deletedAt: null },
      include: {
        resumeFile: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        applications: {
          where: { deletedAt: null },
          include: {
            jobPosting: true,
            interviews: { where: { deletedAt: null } },
            assessments: { where: { deletedAt: null } },
            offerLetters: { where: { deletedAt: null } },
            checklistItems: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
          },
        },
        employee: true,
      },
    });
  }

  listCandidates(filters?: { status?: string; search?: string }) {
    const where: Prisma.CandidateWhereInput = { deletedAt: null };
    if (filters?.status) {
      where.pipelineStatus = filters.status as Prisma.EnumCandidatePipelineStatusFilter["equals"];
    }
    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: "insensitive" } },
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return prisma.candidate.findMany({
      where,
      include: {
        resumeFile: true,
        applications: {
          where: { deletedAt: null },
          include: { jobPosting: { select: { id: true, title: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  createCandidate(data: Prisma.CandidateCreateInput) {
    return prisma.candidate.create({ data });
  }

  updateCandidate(id: string, data: Prisma.CandidateUpdateInput) {
    return prisma.candidate.update({ where: { id }, data });
  }

  findApplicationById(id: string) {
    return prisma.jobApplication.findFirst({
      where: { id, deletedAt: null },
      include: {
        candidate: { include: { employee: true } },
        jobPosting: true,
        interviews: { where: { deletedAt: null } },
        assessments: { where: { deletedAt: null } },
        offerLetters: { where: { deletedAt: null } },
        checklistItems: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      },
    });
  }

  listApplications(filters?: { status?: string; jobPostingId?: string; statuses?: string[] }) {
    const where: Prisma.JobApplicationWhereInput = { deletedAt: null };
    if (filters?.statuses?.length) {
      where.status = {
        in: filters.statuses as import("@prisma/client").CandidatePipelineStatus[],
      };
    } else if (filters?.status) {
      where.status = filters.status as import("@prisma/client").CandidatePipelineStatus;
    }
    if (filters?.jobPostingId) where.jobPostingId = filters.jobPostingId;
    return prisma.jobApplication.findMany({
      where,
      include: {
        candidate: { include: { resumeFile: true } },
        jobPosting: { select: { id: true, title: true, slug: true } },
        checklistItems: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        interviews: {
          where: { deletedAt: null },
          orderBy: { scheduledAt: "desc" },
          take: 1,
          include: {
            interviewer: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });
  }

  createApplication(data: Prisma.JobApplicationCreateInput) {
    return prisma.jobApplication.create({
      data,
      include: {
        jobPosting: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  updateApplication(id: string, data: Prisma.JobApplicationUpdateInput) {
    return prisma.jobApplication.update({
      where: { id },
      data,
      include: {
        candidate: true,
        jobPosting: true,
      },
    });
  }

  createInterview(data: Prisma.InterviewCreateInput) {
    return prisma.interview.create({ data });
  }

  createAssessment(data: Prisma.AssessmentCreateInput) {
    return prisma.assessment.create({ data });
  }

  createOfferLetter(data: Prisma.OfferLetterCreateInput) {
    return prisma.offerLetter.create({ data });
  }

  createChecklistItems(items: Prisma.PreOnboardingChecklistItemCreateManyInput[]) {
    return prisma.preOnboardingChecklistItem.createMany({ data: items });
  }

  updateChecklistItem(id: string, data: Prisma.PreOnboardingChecklistItemUpdateInput) {
    return prisma.preOnboardingChecklistItem.update({ where: { id }, data });
  }

  getPipelineSummary() {
    return prisma.jobApplication.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    });
  }
}

export class HrRepository {
  listEmployees(filters?: { lifecycleState?: string; search?: string }) {
    const where: Prisma.EmployeeWhereInput = { deletedAt: null };
    if (filters?.lifecycleState) {
      where.lifecycleState = filters.lifecycleState as Prisma.EnumEmployeeLifecycleStateFilter["equals"];
    }
    if (filters?.search) {
      where.OR = [
        { employeeCode: { contains: filters.search, mode: "insensitive" } },
        { user: { firstName: { contains: filters.search, mode: "insensitive" } } },
        { user: { lastName: { contains: filters.search, mode: "insensitive" } } },
        { user: { email: { contains: filters.search, mode: "insensitive" } } },
      ];
    }
    return prisma.employee.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            employeeId: true,
            dateOfJoining: true,
            dateOfBirth: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
            office: { select: { id: true, name: true } },
          },
        },
        candidate: { select: { id: true, email: true } },
      },
      orderBy: { hiredAt: "desc" },
    });
  }

  findEmployeeById(id: string) {
    return prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          include: {
            department: true,
            designation: true,
            office: true,
            employeeType: true,
            employmentStatus: true,
          },
        },
        candidate: true,
        lifecycleEvents: { orderBy: { timestamp: "desc" }, take: 20 },
        assignedAssets: { where: { deletedAt: null } },
      },
    });
  }

  findEmployeeByUserId(userId: string) {
    return prisma.employee.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: {
          include: {
            department: true,
            designation: true,
            office: true,
            employeeType: true,
            employmentStatus: true,
            manager: { select: { id: true, firstName: true, lastName: true, email: true } },
            teamMemberships: {
              where: { deletedAt: null, leftAt: null },
              select: { team: { select: { id: true, name: true } } },
            },
          },
        },
        assignedAssets: { where: { deletedAt: null } },
        lifecycleEvents: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
  }

  createEmployee(data: Prisma.EmployeeCreateInput) {
    return prisma.employee.create({
      data,
      include: { user: true, candidate: true },
    });
  }

  updateEmployee(id: string, data: Prisma.EmployeeUpdateInput) {
    return prisma.employee.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  createLifecycleEvent(data: Prisma.EmployeeLifecycleEventCreateInput) {
    return prisma.employeeLifecycleEvent.create({ data });
  }

  listPolicies(filters?: { status?: string }) {
    const where: Prisma.CompanyPolicyWhereInput = { deletedAt: null };
    if (filters?.status) where.status = filters.status as Prisma.EnumPolicyStatusFilter["equals"];
    return prisma.companyPolicy.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        version: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        file: {
          select: { id: true, originalName: true, mimeType: true, sizeBytes: true },
        },
        publishedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  createPolicy(data: Prisma.CompanyPolicyCreateInput) {
    return prisma.companyPolicy.create({ data, include: { file: true } });
  }

  updatePolicy(id: string, data: Prisma.CompanyPolicyUpdateInput) {
    return prisma.companyPolicy.update({ where: { id }, data, include: { file: true } });
  }

  listAssets(filters?: { status?: string; employeeId?: string }) {
    const where: Prisma.AssetWhereInput = { deletedAt: null };
    if (filters?.status) where.status = filters.status as Prisma.EnumAssetStatusFilter["equals"];
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    return prisma.asset.findMany({
      where,
      include: {
        employee: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  createAsset(data: Prisma.AssetCreateInput) {
    return prisma.asset.create({ data });
  }

  updateAsset(id: string, data: Prisma.AssetUpdateInput) {
    return prisma.asset.update({ where: { id }, data });
  }

  listInterviews(filters?: { from?: Date; to?: Date }) {
    const where: Prisma.InterviewWhereInput = { deletedAt: null };
    if (filters?.from || filters?.to) {
      where.scheduledAt = {};
      if (filters.from) where.scheduledAt.gte = filters.from;
      if (filters.to) where.scheduledAt.lte = filters.to;
    }
    return prisma.interview.findMany({
      where,
      include: {
        application: {
          include: {
            candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
            jobPosting: { select: { id: true, title: true } },
          },
        },
        interviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  listOffers(filters?: { status?: string }) {
    const where: Prisma.OfferLetterWhereInput = { deletedAt: null };
    if (filters?.status) where.status = filters.status as Prisma.EnumOfferLetterStatusFilter["equals"];
    return prisma.offerLetter.findMany({
      where,
      include: {
        application: {
          include: {
            candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
            jobPosting: { select: { id: true, title: true } },
          },
        },
        file: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export class PortalRepository {
  listNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  createNotification(data: Prisma.NotificationCreateInput) {
    return prisma.notification.create({ data });
  }

  markNotificationRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  listTickets(userId: string) {
    return prisma.supportTicket.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  createTicket(data: Prisma.SupportTicketCreateInput) {
    return prisma.supportTicket.create({ data });
  }
}
