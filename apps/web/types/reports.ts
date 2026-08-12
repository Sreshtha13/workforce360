/**
 * Frontend mirror of report / KPI API shapes.
 * Backend (`apps/api`) remains the source of truth.
 */

export type ReportType =
  | "ATTENDANCE"
  | "LEAVE"
  | "RECRUITMENT"
  | "INVOICE"
  | "PAYROLL"
  | "PROJECT"
  | "EXECUTIVE";

export type ReportFormat = "CSV" | "PDF";
export type ReportFrequency = "DAILY" | "WEEKLY" | "MONTHLY";
export type KpiScope = "executive" | "hr" | "finance" | "payroll" | "project";

export type ReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
};

export type ReportSchedule = {
  id: string;
  name: string;
  reportType: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  dayOfPeriod?: number | null;
  hourUtc: number;
  recipients: string[];
  filters?: Record<string, unknown> | null;
  isActive: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CreateReportScheduleInput = {
  name: string;
  reportType: ReportType;
  format?: ReportFormat;
  frequency?: ReportFrequency;
  dayOfPeriod?: number | null;
  hourUtc?: number;
  recipients: string[];
  filters?: Record<string, unknown>;
  isActive?: boolean;
};

export type UpdateReportScheduleInput = Partial<CreateReportScheduleInput>;

export type StatusCountRow = {
  status: string;
  _count: { _all: number };
  _sum?: { totalNet?: string | number | null; totalGross?: string | number | null };
};

export type HrKpis = {
  scope: "hr";
  attendanceByStatus: StatusCountRow[];
  leaveByStatus: StatusCountRow[];
  openJobs: number;
  applications: number;
  onboarding: number;
};

export type FinanceKpis = {
  scope: "finance";
  invoiceCount: number;
  byStatus: Record<string, number>;
  arOutstanding: number;
  revenueCollected: number;
};

export type PayrollKpis = {
  scope: "payroll";
  runs: number;
  byStatus: StatusCountRow[];
};

export type ProjectKpis = {
  scope: "project";
  byStatus: StatusCountRow[];
  active: number;
  total: number;
};

export type ExecutiveKpis = {
  scope: "executive";
  hr: HrKpis;
  finance: FinanceKpis;
  payroll: PayrollKpis;
  project: ProjectKpis;
};

export type DashboardKpis =
  | ExecutiveKpis
  | HrKpis
  | FinanceKpis
  | PayrollKpis
  | ProjectKpis;

export type ReportPayload = {
  type: ReportType;
  generatedAt?: string;
  rows?: unknown[];
  summary?: Record<string, unknown>;
  [key: string]: unknown;
};
