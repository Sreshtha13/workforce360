import { z } from "zod";

export const helpdeskAssignSchema = z.object({
  assignedToId: z.string().min(1).nullable(),
});

export const helpdeskStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_FOR_EMPLOYEE", "RESOLVED", "CLOSED"]),
});

export const helpdeskReplySchema = z.object({
  body: z.string().min(1).max(10000),
  attachmentFileId: z.string().optional(),
  setWaiting: z.boolean().optional(),
});

export const helpdeskEscalateSchema = z.object({
  approverIds: z.array(z.string().min(1)).min(1),
  notes: z.string().max(1000).optional(),
});

export const upsertSlaPolicySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "low", "medium", "high", "urgent"]),
  firstResponseMinutes: z.number().int().positive(),
  resolutionMinutes: z.number().int().positive(),
  escalateAfterMinutes: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createKbArticleSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  slug: z.string().max(150).optional(),
  isPublished: z.boolean().optional(),
});

export const updateKbArticleSchema = createKbArticleSchema.partial();
