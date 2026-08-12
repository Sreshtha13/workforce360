import { z } from "zod";

export const createApprovalRequestSchema = z.object({
  entityType: z.string().min(1).max(100),
  entityId: z.string().min(1),
  requesterId: z.string().min(1),
  approverIds: z.array(z.string().min(1)).min(1),
  metadata: z.record(z.any()).optional(),
});

export const createFromWorkflowSchema = z.object({
  entityType: z.string().min(1).max(100),
  entityId: z.string().min(1),
  requesterId: z.string().min(1).optional(),
  metadata: z.record(z.any()).optional(),
});

export const approveRequestSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const rejectRequestSchema = z.object({
  notes: z.string().min(1).max(1000),
});

export const cancelApprovalRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const listApprovalRequestsQuerySchema = z.object({
  entityType: z.string().optional(),
  requesterId: z.string().optional(),
  approverId: z.string().optional(),
  status: z.string().optional(),
});

export const workflowLevelSchema = z.object({
  level: z.number().int().positive(),
  approverRoleCode: z.string().max(100).nullable().optional(),
  approverUserId: z.string().nullable().optional(),
  escalateAfterHours: z.number().int().positive().nullable().optional(),
});

export const workflowConditionSchema = z.object({
  field: z.string().min(1).max(100),
  operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in"]),
  value: z.string().min(1).max(500),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(100),
  entityType: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
  levels: z.array(workflowLevelSchema).optional(),
  conditions: z.array(workflowConditionSchema).optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  levels: z.array(workflowLevelSchema).optional(),
  conditions: z.array(workflowConditionSchema).optional(),
});

export const createDelegationSchema = z.object({
  delegatorId: z.string().min(1),
  delegateId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string().max(500).optional(),
});

export const updateDelegationSchema = z.object({
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  reason: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});
