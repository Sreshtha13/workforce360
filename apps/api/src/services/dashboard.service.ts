import { prisma } from "../lib/prisma";
import {
  activeEmployeeFilter,
  employeeUserFilter,
  linkedUserFilter,
} from "../lib/organization-metrics";
import { RecruitmentRepository } from "../repositories/phase2.repository";

export type DashboardSearchResult = {
  employees: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string | null;
    department?: { id: string; name: string } | null;
  }[];
  departments: { id: string; name: string; code: string | null }[];
};

export class DashboardService {
  private recruitmentRepo = new RecruitmentRepository();

  async getAdminDashboard(search?: string) {
    const [
      totalUsers,
      activeEmployees,
      inactiveEmployees,
      departmentCount,
      teamCount,
      designationCount,
      officeCount,
      departments,
      onboardingCount,
      draftOffers,
      pipelineSummary,
      openJobs,
      recentAudit,
    ] = await Promise.all([
      prisma.user.count({ where: linkedUserFilter }),
      prisma.user.count({ where: activeEmployeeFilter }),
      prisma.user.count({
        where: { ...employeeUserFilter, status: { not: "active" } },
      }),
      prisma.department.count({ where: { deletedAt: null } }),
      prisma.team.count({ where: { deletedAt: null } }),
      prisma.designation.count({ where: { deletedAt: null, isActive: true } }),
      prisma.office.count({ where: { deletedAt: null } }),
      prisma.department.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              users: { where: activeEmployeeFilter },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.employee.count({
        where: {
          deletedAt: null,
          lifecycleState: { in: ["PRE_ONBOARDING", "ONBOARDING"] },
        },
      }),
      prisma.offerLetter.count({
        where: { deletedAt: null, status: "DRAFT" },
      }),
      this.recruitmentRepo.getPipelineSummary(),
      prisma.jobPosting.count({
        where: { deletedAt: null, status: "PUBLISHED" },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    const pendingBreakdown = [
      ...(onboardingCount > 0
        ? [{ label: "Onboarding in progress", count: onboardingCount, href: "/hr/onboarding" }]
        : []),
      ...(draftOffers > 0
        ? [{ label: "Draft offers", count: draftOffers, href: "/hr/offers" }]
        : []),
    ];

    const pipelineInProgress = pipelineSummary
      .filter((row) => !["HIRED", "REJECTED"].includes(row.status))
      .reduce((sum, row) => sum + row._count._all, 0);

    if (pipelineInProgress > 0) {
      pendingBreakdown.push({
        label: "Pipeline applications",
        count: pipelineInProgress,
        href: "/hr/pipeline",
      });
    }

    const searchResults = search?.trim()
      ? await this.search(search.trim())
      : undefined;

    const enrichment = await this.loadLiveEnrichment();

    return {
      stats: {
        totalEmployees: activeEmployees + inactiveEmployees,
        activeEmployees,
        inactiveEmployees,
        totalUsers,
        departments: departmentCount,
        teams: teamCount,
        designations: designationCount,
        offices: officeCount,
      },
      // Convenience aliases matching Super Admin dashboard labels
      metrics: {
        totalEmployees: activeEmployees + inactiveEmployees,
        activeEmployees,
        inactiveEmployees,
        totalUsers,
        departments: departmentCount,
        teams: teamCount,
        designations: designationCount,
        offices: officeCount,
        ...enrichment.metrics,
      },
      departmentBreakdown: departments.map((d) => ({
        id: d.id,
        name: d.name,
        employeeCount: d._count.users,
      })),
      pendingApprovals: {
        total: pendingBreakdown.reduce((sum, item) => sum + item.count, 0),
        breakdown: pendingBreakdown,
      },
      attendance: enrichment.attendance,
      leave: enrichment.leave,
      finance: enrichment.finance,
      payroll: enrichment.payroll,
      projects: enrichment.projects,
      tickets: enrichment.tickets,
      hiring: {
        openJobs,
        pipeline: pipelineSummary,
      },
      recentActivity: recentAudit.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        createdAt: entry.createdAt.toISOString(),
        actor: entry.user
          ? {
              id: entry.user.id,
              name: `${entry.user.firstName} ${entry.user.lastName}`,
              email: entry.user.email,
            }
          : null,
      })),
      searchResults,
    };
  }

  private async loadLiveEnrichment() {
    const empty = {
      metrics: {} as Record<string, number>,
      attendance: {
        available: false as const,
        message: "Attendance data unavailable",
      },
      leave: {
        available: false as const,
        message: "Leave data unavailable",
      },
      finance: { available: false as const, arOutstanding: 0, invoiceCount: 0 },
      payroll: { available: false as const, runCount: 0 },
      projects: { available: false as const, total: 0, active: 0 },
      tickets: { available: false as const, open: 0 },
    };

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        attendanceToday,
        leavePending,
        invoices,
        payrollRuns,
        projectsTotal,
        projectsActive,
        openTickets,
      ] = await Promise.all([
        prisma.attendanceRecord.groupBy({
          by: ["status"],
          where: { deletedAt: null, date: { gte: todayStart } },
          _count: { _all: true },
        }),
        prisma.leaveApplication.count({
          where: { deletedAt: null, status: "PENDING" },
        }),
        prisma.invoice.findMany({
          where: {
            deletedAt: null,
            status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE", "APPROVED"] },
          },
          select: { total: true, amountPaid: true },
        }),
        prisma.payrollRun.count({ where: { deletedAt: null } }),
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.project.count({
          where: { deletedAt: null, status: { in: ["ACTIVE", "PLANNING"] } },
        }),
        prisma.supportTicket.count({
          where: {
            deletedAt: null,
            status: { in: ["OPEN", "IN_PROGRESS"] },
          },
        }),
      ]);

      let arOutstanding = 0;
      for (const inv of invoices) {
        arOutstanding += Math.max(0, Number(inv.total) - Number(inv.amountPaid));
      }

      const presentToday =
        attendanceToday.find((r) => r.status === "PRESENT")?._count._all ?? 0;
      const absentToday =
        attendanceToday.find((r) => r.status === "ABSENT")?._count._all ?? 0;

      return {
        metrics: {
          arOutstanding,
          payrollRuns,
          openTickets,
          projectsActive,
          leavePending,
          presentToday,
        },
        attendance: {
          available: true as const,
          presentToday,
          absentToday,
          byStatus: attendanceToday,
        },
        leave: {
          available: true as const,
          pending: leavePending,
        },
        finance: {
          available: true as const,
          arOutstanding,
          invoiceCount: invoices.length,
        },
        payroll: { available: true as const, runCount: payrollRuns },
        projects: {
          available: true as const,
          total: projectsTotal,
          active: projectsActive,
        },
        tickets: { available: true as const, open: openTickets },
      };
    } catch {
      return empty;
    }
  }

  async search(query: string): Promise<DashboardSearchResult> {
    const [employees, departments] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...linkedUserFilter,
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { employeeId: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          employeeId: true,
          department: { select: { id: true, name: true } },
        },
        take: 20,
        orderBy: { lastName: "asc" },
      }),
      prisma.department.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, code: true },
        take: 10,
        orderBy: { name: "asc" },
      }),
    ]);

    return { employees, departments };
  }

  async listActiveEmployeesPreview(search?: string) {
    return prisma.user.findMany({
      where: {
        ...activeEmployeeFilter,
        ...(search?.trim()
          ? {
              OR: [
                { firstName: { contains: search.trim(), mode: "insensitive" } },
                { lastName: { contains: search.trim(), mode: "insensitive" } },
                { email: { contains: search.trim(), mode: "insensitive" } },
                { employeeId: { contains: search.trim(), mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        employeeId: true,
        status: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, name: true } },
        userRoles: {
          where: { deletedAt: null },
          select: { role: { select: { id: true, name: true } } },
        },
      },
      take: 50,
      orderBy: { lastName: "asc" },
    });
  }
}

export const dashboardService = new DashboardService();
