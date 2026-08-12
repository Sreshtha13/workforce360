import { z } from "zod";

export const reportTypeEnum = z.enum([
  "ATTENDANCE",
  "LEAVE",
  "RECRUITMENT",
  "INVOICE",
  "PAYROLL",
  "PROJECT",
  "EXECUTIVE",
]);

export const reportFormatEnum = z.enum(["CSV", "PDF"]);
export const reportFrequencyEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);
export const kpiScopeEnum = z.enum(["executive", "hr", "finance", "payroll", "project"]);

export const reportFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  departmentId: z.string().optional(),
  format: z
    .string()
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined))
    .pipe(reportFormatEnum.optional()),
});

export const createReportScheduleSchema = z.object({
  name: z.string().min(1).max(255),
  reportType: reportTypeEnum,
  format: reportFormatEnum.optional(),
  frequency: reportFrequencyEnum.optional(),
  dayOfPeriod: z.number().int().min(0).max(28).nullable().optional(),
  hourUtc: z.number().int().min(0).max(23).optional(),
  recipients: z.array(z.string().email()).min(1),
  filters: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const updateReportScheduleSchema = createReportScheduleSchema.partial();

export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
export type CreateReportScheduleInput = z.infer<typeof createReportScheduleSchema>;
export type UpdateReportScheduleInput = z.infer<typeof updateReportScheduleSchema>;
