import type { EmployeeLifecycleState } from "@prisma/client";
import { HrRepository, PortalRepository, RecruitmentRepository } from "../repositories/phase2.repository";
import { UserRepository } from "../repositories/user.repository";
import { getNextEmployeeId } from "../lib/employee-id";
import { writeAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";

export class HrService {
  private hrRepo = new HrRepository();
  private recruitmentRepo = new RecruitmentRepository();
  private userRepo = new UserRepository();
  private portalRepo = new PortalRepository();

  listEmployees(filters?: { lifecycleState?: string; search?: string }) {
    return this.hrRepo.listEmployees(filters);
  }

  getEmployee(id: string) {
    return this.hrRepo.findEmployeeById(id);
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

    const latestCode = await this.userRepo.findLatestEmployeeId();
    const employeeCode = getNextEmployeeId(latestCode);

    await prisma.user.update({
      where: { id: userId },
      data: {
        employeeId: employeeCode,
        departmentId: input.departmentId ?? undefined,
        designationId: input.designationId ?? undefined,
        dateOfJoining: new Date(),
        userRoles: {
          upsert: {
            where: { userId_roleId: { userId, roleId: employeeRole.id } },
            create: { roleId: employeeRole.id, assignedBy: input.actorId },
            update: { deletedAt: null },
          },
        },
      },
    });

    const employee = await this.hrRepo.createEmployee({
      user: { connect: { id: userId } },
      candidate: { connect: { id: candidate.id } },
      employeeCode,
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

  listPolicies(filters?: { status?: string }) {
    return this.hrRepo.listPolicies(filters);
  }

  createPolicy(input: {
    title: string;
    description?: string;
    version?: string;
    fileId?: string;
  }) {
    return this.hrRepo.createPolicy({
      title: input.title,
      description: input.description,
      version: input.version ?? "1.0",
      file: input.fileId ? { connect: { id: input.fileId } } : undefined,
    });
  }

  publishPolicy(id: string, publisherId: string) {
    return this.hrRepo.updatePolicy(id, {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedBy: { connect: { id: publisherId } },
    });
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

  getHrDashboard() {
    return Promise.all([
      this.hrRepo.listEmployees(),
      this.recruitmentRepo.getPipelineSummary(),
      this.hrRepo.listInterviews({
        from: new Date(),
        to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      }),
    ]).then(([employees, pipeline, upcomingInterviews]) => ({
      employeeCount: employees.length,
      activeEmployees: employees.filter((e) => e.lifecycleState === "ACTIVE").length,
      onboardingEmployees: employees.filter((e) =>
        ["PRE_ONBOARDING", "ONBOARDING"].includes(e.lifecycleState),
      ).length,
      pipeline,
      upcomingInterviews: upcomingInterviews.slice(0, 10),
    }));
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
      openTickets: tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length,
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

    const user = await this.userRepo.updateUser(userId, userData);

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
    return this.portalRepo.listTickets(userId);
  }

  createTicket(userId: string, input: { subject: string; description: string; priority?: string }) {
    return this.portalRepo.createTicket({
      user: { connect: { id: userId } },
      subject: input.subject,
      description: input.description,
      priority: input.priority ?? "medium",
    });
  }

  async listMyAssets(userId: string) {
    const employee = await this.hrRepo.findEmployeeByUserId(userId);
    if (!employee) return [];
    return this.hrRepo.listAssets({ employeeId: employee.id });
  }

  listPublishedPolicies() {
    return this.hrRepo.listPolicies({ status: "PUBLISHED" });
  }
}

export const hrService = new HrService();
export const portalService = new PortalService();
