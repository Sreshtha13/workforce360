/** Phase 8 — Help Desk types (backend is source of truth). */

import type { StoredFile, SupportTicketMessage } from "@/types/phase2";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_EMPLOYEE"
  | "RESOLVED"
  | "CLOSED";

export type SlaPolicy = {
  id: string;
  name: string;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  escalateAfterMinutes?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeBaseArticle = {
  id: string;
  title: string;
  slug: string;
  content: string;
  category?: string | null;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type SupportTicket = {
  id: string;
  ticketNumber?: string | null;
  subject: string;
  description: string;
  status: TicketStatus | string;
  priority: TicketPriority | string;
  category?: string | null;
  latestReply?: string | null;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  firstResponseDueAt?: string | null;
  resolutionDueAt?: string | null;
  firstRespondedAt?: string | null;
  escalatedAt?: string | null;
  escalationLevel?: number;
  approvalRequestId?: string | null;
  user?: { id: string; firstName: string; lastName: string; email: string } | null;
  assignedTo?: { id: string; firstName: string; lastName: string; email: string } | null;
  attachment?: StoredFile | null;
  messages?: SupportTicketMessage[];
  slaPolicy?: Pick<SlaPolicy, "id" | "name" | "priority" | "firstResponseMinutes" | "resolutionMinutes"> | null;
  _count?: { messages: number };
};

export type CreateKbArticleInput = {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  slug?: string;
  isPublished?: boolean;
};

export type UpdateKbArticleInput = Partial<CreateKbArticleInput>;

export type UpsertSlaPolicyInput = {
  id?: string;
  name: string;
  priority: TicketPriority | string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  escalateAfterMinutes?: number | null;
  isActive?: boolean;
};

export type EscalateTicketInput = {
  approverIds: string[];
  notes?: string;
};
