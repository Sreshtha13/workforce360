import type { Prisma, ReportFormat, ReportScheduleFrequency, ReportType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { sendEmail } from "../lib/email";
import { generateReportPdf, rowsToCsv, type ReportColumn } from "../lib/report-export";
import { renderTemplate } from "../lib/template-render";

export type ReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
};

export type DashboardKpiScope = "executive" | "hr" | "finance" | "payroll" | "project";

function parseDateRange(filters: ReportFilters): { from?: Date; to?: Date } {
  const from = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
  const to = filters.dateTo ? new Date(filters.dateTo) : undefined;
  if (to) {
    // inclusive end-of-day
    to.setHours(23, 59, 59, 999);
  }
  return { from, to };
}

async function employeeIdsForDepartment(departmentId?: string): Promise<string[] | undefined> {
  if (!departmentId) return undefined;
  const rows = await prisma.employee.findMany({
    where: { deletedAt: null, user: { departmentId } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

function employeeIdFilter(ids?: string[]) {
  if (!ids?.length) return undefined;
  return { employeeId: { in: ids } };
}

export function computeNextRunAt(
  frequency: ReportScheduleFrequency,
  hourUtc: number,
  dayOfPeriod: number | null | undefined,
  from: Date = new Date(),
): Date {
  const next = new Date(from);
  next.setUTCSeconds(0, 0);
  next.setUTCMinutes(0);
  next.setUTCHours(hourUtc);

  if (frequency === "DAILY") {
    if (next <= from) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  if (frequency === "WEEKLY") {
    const targetDow = dayOfPeriod ?? 1; // Monday default
    const currentDow = next.getUTCDay();
    let add = (targetDow - currentDow + 7) % 7;
    if (add === 0 && next <= from) add = 7;
    next.setUTCDate(next.getUTCDate() + add);
    return next;
  }

  // MONTHLY
  const day = Math.min(Math.max(dayOfPeriod ?? 1, 1), 28);
  next.setUTCDate(day);
  if (next <= from) {
    next.setUTCMonth(next.getUTCMonth() + 1);
    next.setUTCDate(day);
  }
  return next;
}

type ReportPayload = {
  title: string;
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
  summary?: Record<string, unknown>;
};

export class ReportService {
  async getDashboardKpis(scope: DashboardKpiScope, filters: ReportFilters = {}) {
    const { from, to } = parseDateRange(filters);
    const dept = filters.departmentId;

    switch (scope) {
      case "hr":
        return this.hrKpis(from, to, dept);
      case "finance":
        return this.financeKpis(from, to);
      case "payroll":
        return this.payrollKpis(from, to);
      case "project":
        return this.projectKpis(from, to);
      case "executive":
      default:
        return this.executiveKpis(from, to, dept);
    }
  }

  private async hrKpis(from?: Date, to?: Date, departmentId?: string) {
    const employeeIds = await employeeIdsForDepartment(departmentId);
    const dateFilter: Prisma.DateTimeFilter | undefined =
      from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;

    const [attendanceByStatus, leaveByStatus, openJobs, applications, onboarding] =
      await Promise.all([
        prisma.attendanceRecord.groupBy({
          by: ["status"],
          where: {
            deletedAt: null,
            ...(dateFilter ? { date: dateFilter } : {}),
            ...employeeIdFilter(employeeIds),
          },
          _count: { _all: true },
        }),
        prisma.leaveApplication.groupBy({
          by: ["status"],
          where: {
            deletedAt: null,
            ...(dateFilter ? { startDate: dateFilter } : {}),
            ...employeeIdFilter(employeeIds),
          },
          _count: { _all: true },
        }),
        prisma.jobPosting.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
        prisma.jobApplication.count({
          where: {
            deletedAt: null,
            ...(dateFilter ? { appliedAt: dateFilter } : {}),
          },
        }),
        prisma.employee.count({
          where: {
            deletedAt: null,
            lifecycleState: { in: ["PRE_ONBOARDING", "ONBOARDING"] },
          },
        }),
      ]);

    return {
      scope: "hr" as const,
      attendanceByStatus,
      leaveByStatus,
      openJobs,
      applications,
      onboarding,
    };
  }

  private async financeKpis(from?: Date, to?: Date) {
    const dateFilter: Prisma.DateTimeFilter | undefined =
      from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;

    const invoices = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        ...(dateFilter ? { issueDate: dateFilter } : {}),
        status: { notIn: ["CANCELLED", "DRAFT"] },
      },
      select: { status: true, totalAmount: true, amountPaid: true },
    });

    let arOutstanding = 0;
    let revenueCollected = 0;
    const byStatus: Record<string, number> = {};

    for (const inv of invoices) {
      const total = Number(inv.totalAmount);
      const paid = Number(inv.amountPaid);
      byStatus[inv.status] = (byStatus[inv.status] ?? 0) + 1;
      revenueCollected += paid;
      if (!["PAID", "CANCELLED"].includes(inv.status)) {
        arOutstanding += Math.max(0, total - paid);
      }
    }

    return {
      scope: "finance" as const,
      invoiceCount: invoices.length,
      byStatus,
      arOutstanding,
      revenueCollected,
    };
  }

  private async payrollKpis(from?: Date, to?: Date) {
    const dateFilter: Prisma.DateTimeFilter | undefined =
      from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;

    const [runs, byStatus] = await Promise.all([
      prisma.payrollRun.count({
        where: {
          deletedAt: null,
          ...(dateFilter ? { payPeriodStart: dateFilter } : {}),
        },
      }),
      prisma.payrollRun.groupBy({
        by: ["status"],
        where: {
          deletedAt: null,
          ...(dateFilter ? { payPeriodStart: dateFilter } : {}),
        },
        _count: { _all: true },
        _sum: { totalNet: true, totalGross: true },
      }),
    ]);

    return { scope: "payroll" as const, runs, byStatus };
  }

  private async projectKpis(from?: Date, to?: Date) {
    const dateFilter: Prisma.DateTimeFilter | undefined =
      from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;

    const [byStatus, active, total] = await Promise.all([
      prisma.project.groupBy({
        by: ["status"],
        where: {
          deletedAt: null,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _count: { _all: true },
      }),
      prisma.project.count({
        where: {
          deletedAt: null,
          status: { in: ["ACTIVE", "PLANNING"] },
        },
      }),
      prisma.project.count({ where: { deletedAt: null } }),
    ]);

    return { scope: "project" as const, byStatus, active, total };
  }

  private async executiveKpis(from?: Date, to?: Date, departmentId?: string) {
    const [hr, finance, payroll, project] = await Promise.all([
      this.hrKpis(from, to, departmentId),
      this.financeKpis(from, to),
      this.payrollKpis(from, to),
      this.projectKpis(from, to),
    ]);
    return { scope: "executive" as const, hr, finance, payroll, project };
  }

  async getReportData(type: ReportType, filters: ReportFilters = {}): Promise<ReportPayload> {
    const { from, to } = parseDateRange(filters);
    const dateFilter: Prisma.DateTimeFilter | undefined =
      from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;
    const employeeIds = await employeeIdsForDepartment(filters.departmentId);

    switch (type) {
      case "ATTENDANCE": {
        const records = await prisma.attendanceRecord.findMany({
          where: {
            deletedAt: null,
            ...(dateFilter ? { date: dateFilter } : {}),
            ...employeeIdFilter(employeeIds),
          },
          orderBy: { date: "desc" },
          take: 5000,
        });
        const employees = await prisma.employee.findMany({
          where: { id: { in: [...new Set(records.map((r) => r.employeeId))] } },
          include: {
            user: { select: { firstName: true, lastName: true, email: true, employeeId: true } },
          },
        });
        const employeeById = new Map(employees.map((e) => [e.id, e]));
        return {
          title: "Attendance Report",
          columns: [
            { key: "date", label: "Date" },
            { key: "employee", label: "Employee" },
            { key: "email", label: "Email" },
            { key: "status", label: "Status" },
            { key: "hours", label: "Hours" },
          ],
          rows: records.map((r) => {
            const user = employeeById.get(r.employeeId)?.user;
            return {
              date: r.date.toISOString().slice(0, 10),
              employee: user ? `${user.firstName} ${user.lastName}` : r.employeeId,
              email: user?.email ?? "",
              status: r.status,
              hours: r.workHours?.toString() ?? "",
            };
          }),
        };
      }
      case "LEAVE": {
        const apps = await prisma.leaveApplication.findMany({
          where: {
            deletedAt: null,
            ...(dateFilter ? { startDate: dateFilter } : {}),
            ...employeeIdFilter(employeeIds),
          },
          include: {
            leaveType: { select: { name: true, code: true } },
          },
          orderBy: { startDate: "desc" },
          take: 5000,
        });
        const employees = await prisma.employee.findMany({
          where: { id: { in: [...new Set(apps.map((a) => a.employeeId))] } },
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        });
        const employeeById = new Map(employees.map((e) => [e.id, e]));
        return {
          title: "Leave Report",
          columns: [
            { key: "employee", label: "Employee" },
            { key: "type", label: "Type" },
            { key: "startDate", label: "Start" },
            { key: "endDate", label: "End" },
            { key: "days", label: "Days" },
            { key: "status", label: "Status" },
          ],
          rows: apps.map((a) => {
            const user = employeeById.get(a.employeeId)?.user;
            return {
              employee: user ? `${user.firstName} ${user.lastName}` : a.employeeId,
              type: a.leaveType.name,
              startDate: a.startDate.toISOString().slice(0, 10),
              endDate: a.endDate.toISOString().slice(0, 10),
              days: a.dayCount.toString(),
              status: a.status,
            };
          }),
        };
      }
      case "RECRUITMENT": {
        const apps = await prisma.jobApplication.findMany({
          where: {
            deletedAt: null,
            ...(dateFilter ? { appliedAt: dateFilter } : {}),
          },
          include: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
            jobPosting: { select: { title: true } },
          },
          orderBy: { appliedAt: "desc" },
          take: 5000,
        });
        return {
          title: "Recruitment Report",
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "email", label: "Email" },
            { key: "job", label: "Job" },
            { key: "status", label: "Status" },
            { key: "appliedAt", label: "Applied" },
          ],
          rows: apps.map((a) => ({
            candidate: `${a.candidate.firstName} ${a.candidate.lastName}`,
            email: a.candidate.email,
            job: a.jobPosting.title,
            status: a.status,
            appliedAt: a.appliedAt.toISOString().slice(0, 10),
          })),
        };
      }
      case "INVOICE": {
        const invoices = await prisma.invoice.findMany({
          where: {
            deletedAt: null,
            ...(dateFilter ? { issueDate: dateFilter } : {}),
          },
          include: { client: { select: { name: true } } },
          orderBy: { issueDate: "desc" },
          take: 5000,
        });
        return {
          title: "Invoice Report",
          columns: [
            { key: "invoiceNumber", label: "Invoice #" },
            { key: "client", label: "Client" },
            { key: "issueDate", label: "Issue Date" },
            { key: "dueDate", label: "Due Date" },
            { key: "status", label: "Status" },
            { key: "total", label: "Total" },
            { key: "amountPaid", label: "Paid" },
          ],
          rows: invoices.map((i) => ({
            invoiceNumber: i.invoiceNumber,
            client: i.client.name,
            issueDate: i.issueDate.toISOString().slice(0, 10),
            dueDate: i.dueDate.toISOString().slice(0, 10),
            status: i.status,
            total: i.totalAmount.toString(),
            amountPaid: i.amountPaid.toString(),
          })),
        };
      }
      case "PAYROLL": {
        const runs = await prisma.payrollRun.findMany({
          where: {
            deletedAt: null,
            ...(dateFilter ? { payPeriodStart: dateFilter } : {}),
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 1000,
        });
        return {
          title: "Payroll Report",
          columns: [
            { key: "title", label: "Title" },
            { key: "period", label: "Period" },
            { key: "status", label: "Status" },
            { key: "employees", label: "Employees" },
            { key: "gross", label: "Gross" },
            { key: "net", label: "Net" },
          ],
          rows: runs.map((r) => ({
            title: `${r.year}-${String(r.month).padStart(2, "0")}`,
            period: `${r.payPeriodStart.toISOString().slice(0, 10)} – ${r.payPeriodEnd.toISOString().slice(0, 10)}`,
            status: r.status,
            employees: r.employeeCount,
            gross: r.totalGross.toString(),
            net: r.totalNet.toString(),
          })),
        };
      }
      case "PROJECT": {
        const projects = await prisma.project.findMany({
          where: {
            deletedAt: null,
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
          include: {
            manager: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 2000,
        });
        return {
          title: "Project Report",
          columns: [
            { key: "name", label: "Name" },
            { key: "code", label: "Code" },
            { key: "status", label: "Status" },
            { key: "manager", label: "Manager" },
            { key: "budget", label: "Budget" },
            { key: "startDate", label: "Start" },
            { key: "endDate", label: "End" },
          ],
          rows: projects.map((p) => ({
            name: p.name,
            code: p.code ?? "",
            status: p.status,
            manager: p.manager ? `${p.manager.firstName} ${p.manager.lastName}` : "",
            budget: p.budget?.toString() ?? "",
            startDate: p.startDate?.toISOString().slice(0, 10) ?? "",
            endDate: p.endDate?.toISOString().slice(0, 10) ?? "",
          })),
        };
      }
      case "EXECUTIVE": {
        const kpis = await this.executiveKpis(from, to, filters.departmentId);
        const rows = [
          { metric: "Open jobs", value: kpis.hr.openJobs },
          { metric: "Applications", value: kpis.hr.applications },
          { metric: "Onboarding", value: kpis.hr.onboarding },
          { metric: "AR outstanding", value: kpis.finance.arOutstanding },
          { metric: "Revenue collected", value: kpis.finance.revenueCollected },
          { metric: "Payroll runs", value: kpis.payroll.runs },
          { metric: "Projects total", value: kpis.project.total },
          { metric: "Projects active", value: kpis.project.active },
        ];
        return {
          title: "Executive KPI Report",
          columns: [
            { key: "metric", label: "Metric" },
            { key: "value", label: "Value" },
          ],
          rows,
          summary: kpis as unknown as Record<string, unknown>,
        };
      }
      default:
        throw new AppError("INVALID_REPORT_TYPE", `Unknown report type: ${type}`, 400);
    }
  }

  async exportReport(
    type: ReportType,
    format: ReportFormat,
    filters: ReportFilters = {},
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const data = await this.getReportData(type, filters);
    const stamp = new Date().toISOString().slice(0, 10);
    const base = `${type.toLowerCase()}-report-${stamp}`;

    if (format === "CSV") {
      const headers = data.columns.map((c) => c.key);
      const csv = rowsToCsv(headers, data.rows);
      return {
        buffer: Buffer.from(csv, "utf8"),
        filename: `${base}.csv`,
        contentType: "text/csv; charset=utf-8",
      };
    }

    const pdf = await generateReportPdf(data.title, data.columns, data.rows);
    return {
      buffer: pdf,
      filename: `${base}.pdf`,
      contentType: "application/pdf",
    };
  }

  // --- Schedules ---

  async listSchedules() {
    return prisma.reportSchedule.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSchedule(id: string) {
    const schedule = await prisma.reportSchedule.findFirst({
      where: { id, deletedAt: null },
    });
    if (!schedule) throw new AppError("SCHEDULE_NOT_FOUND", "Report schedule not found", 404);
    return schedule;
  }

  async createSchedule(
    input: {
      name: string;
      reportType: ReportType;
      format?: ReportFormat;
      frequency?: ReportScheduleFrequency;
      dayOfPeriod?: number | null;
      hourUtc?: number;
      recipients: string[];
      filters?: Record<string, unknown>;
      isActive?: boolean;
    },
    actorId: string,
  ) {
    const frequency = input.frequency ?? "WEEKLY";
    const hourUtc = input.hourUtc ?? 8;
    const nextRunAt = computeNextRunAt(frequency, hourUtc, input.dayOfPeriod ?? null);

    const schedule = await prisma.reportSchedule.create({
      data: {
        name: input.name,
        reportType: input.reportType,
        format: input.format ?? "CSV",
        frequency,
        dayOfPeriod: input.dayOfPeriod ?? null,
        hourUtc,
        recipients: input.recipients,
        filters: (input.filters ?? undefined) as Prisma.InputJsonValue | undefined,
        isActive: input.isActive ?? true,
        nextRunAt,
        createdById: actorId,
      },
    });

    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "report_schedule",
      entityId: schedule.id,
      after: schedule,
    });

    return schedule;
  }

  async updateSchedule(
    id: string,
    input: Partial<{
      name: string;
      reportType: ReportType;
      format: ReportFormat;
      frequency: ReportScheduleFrequency;
      dayOfPeriod: number | null;
      hourUtc: number;
      recipients: string[];
      filters: Record<string, unknown>;
      isActive: boolean;
    }>,
    actorId: string,
  ) {
    const existing = await this.getSchedule(id);
    const frequency = input.frequency ?? existing.frequency;
    const hourUtc = input.hourUtc ?? existing.hourUtc;
    const dayOfPeriod =
      input.dayOfPeriod !== undefined ? input.dayOfPeriod : existing.dayOfPeriod;

    const nextRunAt =
      input.frequency !== undefined ||
      input.hourUtc !== undefined ||
      input.dayOfPeriod !== undefined
        ? computeNextRunAt(frequency, hourUtc, dayOfPeriod)
        : existing.nextRunAt;

    const updated = await prisma.reportSchedule.update({
      where: { id },
      data: {
        name: input.name,
        reportType: input.reportType,
        format: input.format,
        frequency: input.frequency,
        dayOfPeriod: input.dayOfPeriod === undefined ? undefined : input.dayOfPeriod,
        hourUtc: input.hourUtc,
        recipients: input.recipients,
        filters:
          input.filters === undefined
            ? undefined
            : (input.filters as Prisma.InputJsonValue),
        isActive: input.isActive,
        nextRunAt,
      },
    });

    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "report_schedule",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async deleteSchedule(id: string, actorId: string) {
    const existing = await this.getSchedule(id);
    const updated = await prisma.reportSchedule.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "report_schedule",
      entityId: id,
      before: existing,
    });
    return updated;
  }

  async runDueSchedules(): Promise<{ processed: number; errors: string[] }> {
    const now = new Date();
    const due = await prisma.reportSchedule.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ nextRunAt: { lte: now } }, { nextRunAt: null }],
      },
      take: 50,
    });

    const errors: string[] = [];
    let processed = 0;

    for (const schedule of due) {
      try {
        const filters = (schedule.filters ?? {}) as ReportFilters;
        const exported = await this.exportReport(
          schedule.reportType,
          schedule.format,
          filters,
        );

        let subject = `Report ready: ${schedule.name}`;
        let body = `Your scheduled report "${schedule.name}" (${schedule.reportType}) is ready.\nGenerated at: ${now.toISOString()}`;

        const template = await prisma.notificationTemplate.findFirst({
          where: { code: "report_ready", deletedAt: null, isActive: true },
        });
        if (template) {
          const vars = {
            reportName: schedule.name,
            reportType: schedule.reportType,
            generatedAt: now.toISOString(),
          };
          subject = renderTemplate(template.subject ?? subject, vars);
          body = renderTemplate(template.body, vars);
        }

        for (const to of schedule.recipients) {
          await sendEmail({
            to,
            subject,
            text: body,
            html: `<pre>${body}</pre><p>Attachment: ${exported.filename} (${exported.contentType})</p>`,
          });
        }

        const nextRunAt = computeNextRunAt(
          schedule.frequency,
          schedule.hourUtc,
          schedule.dayOfPeriod,
          now,
        );

        await prisma.reportSchedule.update({
          where: { id: schedule.id },
          data: { lastRunAt: now, nextRunAt },
        });
        processed += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${schedule.id}: ${msg}`);
        console.error("[report-schedule] failed", schedule.id, err);
      }
    }

    return { processed, errors };
  }
}

export const reportService = new ReportService();
