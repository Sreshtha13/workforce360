/** Phase 9 — Approvals inbox & workflows (backend is source of truth). */

export type ApprovalRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | string;

export type ApprovalActionType =
  | "APPROVE"
  | "REJECT"
  | "CANCEL"
  | "ESCALATE"
  | "DELEGATE"
  | string;

export type ApprovalStepDetail = {
  id: string;
  approvalRequestId?: string;
  level: number;
  approverId: string;
  status: ApprovalRequestStatus;
  assignedAt?: string;
  respondedAt?: string | null;
  notes?: string | null;
  dueAt?: string | null;
  delegatedFromId?: string | null;
  approver?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type ApprovalAction = {
  id: string;
  approvalRequestId: string;
  actorId: string;
  actionType: ApprovalActionType;
  level: number;
  notes?: string | null;
  timestamp: string;
  actor?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type ApprovalRequest = {
  id: string;
  entityType: string;
  entityId: string;
  requesterId: string;
  workflowId?: string | null;
  currentLevel: number;
  totalLevels: number;
  status: ApprovalRequestStatus;
  metadata?: Record<string, unknown> | null;
  dueAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: { id: string; firstName: string; lastName: string; email: string } | null;
  workflow?: { id: string; name: string; code: string } | null;
  steps?: ApprovalStepDetail[];
  actions?: ApprovalAction[];
};

export type ApprovalWorkflowLevel = {
  id?: string;
  level: number;
  approverRoleCode?: string | null;
  approverUserId?: string | null;
  escalateAfterHours?: number | null;
};

export type ApprovalWorkflowCondition = {
  id?: string;
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | string;
  value: string;
};

export type ApprovalWorkflow = {
  id: string;
  name: string;
  code: string;
  entityType: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  levels?: ApprovalWorkflowLevel[];
  conditions?: ApprovalWorkflowCondition[];
};

export type ApprovalDelegation = {
  id: string;
  delegatorId: string;
  delegateId: string;
  startsAt: string;
  endsAt: string;
  reason?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  delegator?: { id: string; firstName: string; lastName: string; email: string } | null;
  delegate?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type CreateWorkflowInput = {
  name: string;
  code: string;
  entityType: string;
  description?: string;
  isActive?: boolean;
  levels?: Array<{
    level: number;
    approverRoleCode?: string | null;
    approverUserId?: string | null;
    escalateAfterHours?: number | null;
  }>;
  conditions?: Array<{ field: string; operator: string; value: string }>;
};

export type UpdateWorkflowInput = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  levels?: CreateWorkflowInput["levels"];
  conditions?: CreateWorkflowInput["conditions"];
};

export type CreateDelegationInput = {
  delegatorId: string;
  delegateId: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
};

export type ApprovalStats = {
  pendingCount: number;
};
