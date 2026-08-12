import { z } from "zod";

export const auditLogQuerySchema = z.object({
  userId: z.string().optional(),
  entity: z.string().optional(),
  action: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
