import { z } from "zod";

export const securityEventQuerySchema = z.object({
  userId: z.string().optional(),
  eventType: z.string().optional(),
  severity: z.enum(["INFO", "WARN", "CRITICAL"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type SecurityEventQueryInput = z.infer<typeof securityEventQuerySchema>;
