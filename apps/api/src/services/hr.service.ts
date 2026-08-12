import type { EmployeeLifecycleState, SupportTicketStatus } from "@prisma/client";
import { HrRepository, PortalRepository, RecruitmentRepository } from "../repositories/phase2.repository";
import { UserRepository } from "../repositories/user.repository";
import { toClientError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";
import { allocateNextEmployeeId } from "./employee-id.service";
import { employeeMasterService } from "./employee-master.service";
import { policyService } from "./policy.service";
import { OPEN_TICKET_STATUSES, ticketService } from "./ticket.service";
import { payrollService } from "./payroll.service";
import { AppError } from "../lib/app-error";
import {
  assertCanViewUser,
  resolveEmployeeVisibilityScope,
} from "../lib/employee-scope";

export class HrService {
  private hrRepo = new HrRepository();
  private recruitmentRepo = new RecruitmentRepository();
  private portalRepo = new PortalRepository();

  async listEmployees(
    filters?: { lifecycleState?: string; search?: string },
    requesterId?: string,
  ) {
    await employeeMasterService.backfillMissingEmployeeRecords();

    let userIds: string[] | undefined;
    if (requesterId) {
      const scope = await resolveEmployeeVisibilityScope(requesterId);
      if (scope.type === "userIds") {
        userIds = scope.userIds;
      }
    }

    return this.hrRepo.listEmployees({ ...filters, userIds });
  }

  async getEmployee(id: string, requesterId?: string) {
    const employee = await this.hrRepo.findEmployeeById(id);
    if (!employee) return null;

    if (requesterId && employee.userId) {
      await assertCanViewUser(requesterId, employee.userId);
    }

    return employee;
  }

  getEmployeeByUserId(userId: string) {
    return this.hrRepo.findEmployeeByUserId(userId);
  }

  async hireCandidate(input: {
    applicationId: string;
    actorId: string;
    departmentId?: string;
    designationId?: string;
    temporaryPassword?: string;
  }) {
    const application = await this.recruitmentRepo.findApplicationById(input.applicationId);
    if (!application) throw new Error("Application not found");
    if (application.status !== "HIRED") {
      throw new Error("Application must be in HIRED status");
    }

    const candidate = application.candidate;
    if (candidate.employee) {
      return candidate.employee;
    }

    let userId = candidate.userId;
    if (!userId) {
      throw new Error("Candidate must have a user account before hiring");
    }

    const employeeRole = await prisma.role.findUnique({ where: { code: "employee" } });
    if (!employeeRole) throw new Error("Employee role is not configured");

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true, dateOfJoining: true },
    });

    let employeeCode = existingUser?.employeeId ?? null;
    if (!employeeCode) {
      employeeCode = await allocateNextEmployeeId();
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(existingUser?.employeeId ? {} : { employeeId: employeeCode }),
          departmentId: input.departmentId ?? undefined,
          designationId: input.designationId ?? undefined,
          dateOfJoining: existingUser?.dateOfJoining ?? new Date(),
          userRoles: {
            upsert: {
              where: { userId_roleId: { userId, roleId: employeeRole.id } },
              create: { roleId: employeeRole.id, assignedBy: input.actorId },
              update: { deletedAt: null },
            },
          },
        },
      });

      const employee = await employeeMasterService.ensureEmployeeRecord(userId, {
        employeeCode,
        candidateId: candidate.id,
        lifecycleState: "PRE_ONBOARDING",
        hiredAt: new Date(),
      });

      await this.hrRepo.createLifecycleEvent({
        employee: { connect: { id: employee.id } },
        toState: "PRE_ONBOARDING",
        notes: "Created from recruitment hire",
        changedById: input.actorId,
      });

      await this.portalRepo.createNotification({
        user: { connect: { id: userId } },
        title: "Welcome to Workforce 360",
        message: "Your employee account is ready. Complete onboarding in the Employee Portal.",
        link: "/portal/dashboard",
      });

      await writeAuditLog({
        userId: input.actorId,
        action: "hire_candidate",
        entity: "employee",
        entityId: employee.id,
        after: { candidateId: candidate.id, employeeCode },
      });

      return employee;
    } catch (error) {
      throw toClientError(error);
    }
  }

  async updateLifecycleState(
    employeeId: string,
    toState: EmployeeLifecycleState,
    actorId: string,
    notes?: string,
  ) {
    const employee = await this.hrRepo.findEmployeeById(employeeId);
    if (!employee) throw new Error("Employee not found");

    const updated = await this.hrRepo.updateEmployee(employeeId, {
      lifecycleState: toState,
      terminatedAt: toState === "TERMINATED" ? new Date() : undefined,
    });

    await this.hrRepo.createLifecycleEvent({
      employee: { connect: { id: employeeId } },
      fromState: employee.lifecycleState,
      toState,
      notes,
      changedById: actorId,
    });

    await writeAuditLog({
      userId: actorId,
      action: "lifecycle_change",
      entity: "employee",
      entityId: employeeId,
      before: { lifecycleState: employee.lifecycleState },
      after: { lifecycleState: toState, notes },
    });

    return updated;
  }

  async updateEmployeeProfile(
    employeeId: string,
    data: {
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    },
  ) {
    return this.hrRepo.updateEmployee(employeeId, data);
  }

  listPolicies(filters?: { status?: string; familyId?: string }) {
    return policyService.listPolicies(filters);
  }

  getPolicyById(id: string) {
    return policyService.getPolicyById(id);
  }

  createPolicy(
    input: { title: string; description?: string; version?: string; fileId?: string },
    actorId?: string,
  ) {
    return policyService.createPolicy(input, actorId);
  }

  updatePolicy(
    id: string,
    input: { title?: string; description?: string; version?: string; fileId?: string | null },
    actorId?: string,
  ) {
    return policyService.updatePolicy(id, input, actorId);
  }

  publishPolicy(id: string, publisherId: string) {
    return policyService.publishPolicy(id, publisherId);
  }

  createPolicyVersion(id: string, actorId?: string) {
    return policyService.createPolicyVersion(id, actorId);
  }

  listPolicyAssignments(familyId: string) {
    return policyService.listAssignments(familyId);
  }

  assignPolicy(
    input: {
      familyId: string;
      targetType: "ALL" | "USER" | "DEPARTMENT" | "TEAM";
      userId?: string;
      departmentId?: string;
      teamId?: string;
    },
    actorId?: string,
  ) {
    return policyService.assignPolicy(input, actorId);
  }

  removePolicyAssignment(assignmentId: string, actorId?: string) {
    return policyService.removeAssignment(assignmentId, actorId);
  }

  getPolicyAcknowledgementReport(policyId: string) {
    return policyService.getAcknowledgementReport(policyId);
  }

  listTickets(filters?: { status?: string; assignedToId?: string; search?: string }) {
    return ticketService.listStaffTickets(filters);
  }

  getTicket(id: string) {
    return ticketService.getStaffTicket(id);
  }

  assignTicket(ticketId: string, assigneeId: string | null, actorId: string) {
    return ticketService.assignTicket(ticketId, assigneeId, actorId);
  }

  updateTicketStatus(ticketId: string, status: SupportTicketStatus, actorId: string) {
    return ticketService.updateStatus(ticketId, status, actorId);
  }

  addTicketReply(
    ticketId: string,
    staffUserId: string,
    body: string,
    options?: { attachmentFileId?: string; setWaiting?: boolean },
  ) {
    return ticketService.addStaffReply(ticketId, staffUserId, body, options);
  }

  listAssets(filters?: { status?: string; employeeId?: string }) {
    return this.hrRepo.listAssets(filters);
  }

  createAsset(input: {
    name: string;
    tag: string;
    category?: string;
    serialNumber?: string;
    notes?: string;
  }) {
    return this.hrRepo.createAsset(input);
  }

  assignAsset(assetId: string, employeeId: string, actorId: string) {
    return this.hrRepo.updateAsset(assetId, {
      employee: { connect: { id: employeeId } },
      status: "ASSIGNED",
      assignedAt: new Date(),
    }).then(async (asset) => {
      await writeAuditLog({
        userId: actorId,
        action: "assign_asset",
        entity: "asset",
        entityId: assetId,
        after: { employeeId },
      });
      return asset;
    });
  }

  listInterviews(filters?: { from?: string; to?: string }) {
    return this.hrRepo.listInterviews({
      from: filters?.from ? new Date(filters.from) : undefined,
      to: filters?.to ? new Date(filters.to) : undefined,
    });
  }

  listOffers(filters?: { status?: string }) {
    return this.hrRepo.listOffers(filters);
  }

  getHrDashboard(userId: string) {
    return Promise.all([
      this.hrRepo.listEmployees(),
      this.recruitmentRepo.getPipelineSummary(),
      this.hrRepo.listInterviews({
        from: new Date(),
        to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      }),
      this.hrRepo.listOffers({ status: "DRAFT" }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, name: true } },
          userRoles: {
            where: { deletedAt: null },
            select: { role: { select: { id: true, name: true, code: true } } },
          },
        },
      }),
      prisma.employee.count({
        where: {
          deletedAt: null,
          lifecycleState: { in: ["PRE_ONBOARDING", "ONBOARDING"] },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.jobPosting.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    ]).then(
      ([
        employees,
        pipeline,
        upcomingInterviews,
        draftOffers,
        profile,
        onboardingCount,
        recentActivity,
        openJobs,
      ]) => {
        const today = new Date();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();

        const joiningToday = employees.filter((e) => {
          const doj = e.user?.dateOfJoining;
          if (!doj) return false;
          const d = new Date(doj);
          return d.getMonth() === todayMonth && d.getDate() === todayDay;
        }).length;

        const birthdays = employees.filter((e) => {
          const dob = e.user?.dateOfBirth;
          if (!dob) return false;
          const d = new Date(dob);
          return d.getMonth() === todayMonth && d.getDate() === todayDay;
        }).length;

        // Probation ≈ ACTIVE employees hired within the last 90 days (no PROBATION enum in schema).
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const probation = employees.filter((e) => {
          if (e.lifecycleState !== "ACTIVE") return false;
          const hired = e.hiredAt ? new Date(e.hiredAt) : e.user?.dateOfJoining ? new Date(e.user.dateOfJoining) : null;
          return hired != null && hired >= ninetyDaysAgo;
        }).length;

        const pendingBreakdown: { label: string; count: number; href: string }[] = [
          ...(onboardingCount > 0
            ? [{ label: "Onboarding in progress", count: onboardingCount, href: "/hr/onboarding" }]
            : []),
          ...(draftOffers.length > 0
            ? [{ label: "Draft offers awaiting send", count: draftOffers.length, href: "/hr/offers" }]
            : []),
        ];

        const pipelinePending = pipeline
          .filter((row) => !["HIRED", "REJECTED"].includes(row.status))
          .reduce((sum, row) => sum + row._count._all, 0);

        if (pipelinePending > 0) {
          pendingBreakdown.push({
            label: "Pipeline applications",
            count: pipelinePending,
            href: "/hr/pipeline",
          });
        }

        return {
          profile,
          employeeCount: employees.length,
          activeEmployees: employees.filter((e) => e.lifecycleState === "ACTIVE").length,
          onboardingEmployees: employees.filter((e) =>
            ["PRE_ONBOARDING", "ONBOARDING"].includes(e.lifecycleState),
          ).length,
          joiningToday,
          birthdays,
          probation,
          expiringDocuments: 0,
          openJobs,
          pendingApprovals: {
            total: pendingBreakdown.reduce((sum, item) => sum + item.count, 0),
            breakdown: pendingBreakdown,
          },
          pipeline,
          upcomingInterviews: upcomingInterviews.slice(0, 10),
          recentActivity: recentActivity.map((entry) => ({
            id: entry.id,
            action: entry.action,
            entity: entry.entity,
            createdAt: entry.createdAt.toISOString(),
            actor: entry.user
              ? `${entry.user.firstName} ${entry.user.lastName}`
              : "System",
          })),
          attendance: {
            available: false as const,
            message: "Attendance tracking is not yet enabled.",
          },
        };
      },
    );
  }
}

export class PortalService {
  private hrRepo = new HrRepository();
  private portalRepo = new PortalRepository();
  private userRepo = new UserRepository();

  async getDashboard(userId: string) {
    const [employee, notifications, tickets] = await Promise.all([
      this.hrRepo.findEmployeeByUserId(userId),
      this.portalRepo.listNotifications(userId),
      this.portalRepo.listTickets(userId),
    ]);

    return {
      employee,
      unreadNotifications: notifications.filter((n) => !n.isRead).length,
      openTickets: tickets.filter((t) => OPEN_TICKET_STATUSES.includes(t.status)).length,
      comingSoon: {
        attendance: true,
        leave: true,
        timesheets: true,
        payslips: true,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findUserById(userId);
    if (!user) throw new Error("User not found");
    const employee = await this.hrRepo.findEmployeeByUserId(userId);
    return { user, employee };
  }

  async updateOwnProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    },
  ) {
    const { emergencyContactName, emergencyContactPhone, ...userData } = data;

    await this.userRepo.updateUser(userId, userData);

    const employee = await this.hrRepo.findEmployeeByUserId(userId);
    if (employee && (emergencyContactName !== undefined || emergencyContactPhone !== undefined)) {
      await this.hrRepo.updateEmployee(employee.id, {
        emergencyContactName,
        emergencyContactPhone,
      });
    }

    return this.getProfile(userId);
  }

  listNotifications(userId: string) {
    return this.portalRepo.listNotifications(userId);
  }

  markNotificationRead(userId: string, notificationId: string) {
    return this.portalRepo.markNotificationRead(notificationId, userId);
  }

  listTickets(userId: string) {
    return ticketService.listMyTickets(userId);
  }

  getTicket(ticketId: string, userId: string) {
    return ticketService.getMyTicket(ticketId, userId);
  }

  createTicket(userId: string, input: {
    subject: string;
    description: string;
    priority?: string;
    category?: string;
    attachmentFileId?: string;
  }) {
    return ticketService.createTicket(userId, input);
  }

  replyToTicket(
    ticketId: string,
    userId: string,
    body: string,
    attachmentFileId?: string,
  ) {
    return ticketService.addEmployeeReply(ticketId, userId, body, attachmentFileId);
  }

  async listMyAssets(userId: string) {
    const employee = await this.hrRepo.findEmployeeByUserId(userId);
    if (!employee) return [];
    return this.hrRepo.listAssets({ employeeId: employee.id });
  }

  listPortalPolicies(userId: string) {
    return policyService.listPortalPolicies(userId);
  }

  acknowledgePolicy(policyId: string, userId: string) {
    return policyService.acknowledgePolicy(policyId, userId);
  }

  /** Employee's own payslips only — never another employee's, enforced via their Employee Master record. */
  async listMyPayslips(userId: string) {
    const employee = await this.hrRepo.findEmployeeByUserId(userId);
    if (!employee) return [];
    return payrollService.listMyPayslips(employee.id);
  }

  async getMyPayslipDownload(userId: string, payslipId: string) {
    const employee = await this.hrRepo.findEmployeeByUserId(userId);
    if (!employee) {
      throw new AppError("EMPLOYEE_NOT_FOUND", "Employee record not found for this user", 404);
    }
    return payrollService.getMyPayslipDownload(employee.id, payslipId);
  }
}

export const hrService = new HrService();
export const portalService = new PortalService();
