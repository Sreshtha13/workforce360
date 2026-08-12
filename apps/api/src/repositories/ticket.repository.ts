import type {
  Prisma,
  SupportTicketMessageAuthor,
  SupportTicketStatus,
  TicketPriority,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { generateTicketNumber, normalizeTicketPriority } from "../lib/ticket-sla";

const ticketListInclude = {
  user: {
    select: { id: true, firstName: true, lastName: true, email: true, departmentId: true },
  },
  assignedTo: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  attachment: {
    select: { id: true, originalName: true, mimeType: true, sizeBytes: true },
  },
  slaPolicy: true,
  _count: { select: { messages: true } },
} satisfies Prisma.SupportTicketInclude;

const ticketDetailInclude = {
  ...ticketListInclude,
  messages: {
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" as const },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, email: true } },
      attachment: {
        select: { id: true, originalName: true, mimeType: true, sizeBytes: true },
      },
    },
  },
} satisfies Prisma.SupportTicketInclude;

export type TicketListItem = Prisma.SupportTicketGetPayload<{
  include: typeof ticketListInclude;
}>;

export type TicketDetail = Prisma.SupportTicketGetPayload<{
  include: typeof ticketDetailInclude;
}>;

/** Scalar fields used by ticket workflow actions — stable when Prisma include typing lags. */
export type TicketWorkflowFields = {
  id: string;
  userId: string;
  assignedToId: string | null;
  status: SupportTicketStatus;
  priority: TicketPriority;
  firstRespondedAt: Date | null;
  escalatedAt: Date | null;
  escalationLevel: number;
  approvalRequestId: string | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
};

export type CreateTicketInput = {
  userId: string;
  subject: string;
  description: string;
  priority?: string;
  category?: string;
  attachmentFileId?: string;
  ticketNumber?: string;
  slaPolicyId?: string | null;
  firstResponseDueAt?: Date | null;
  resolutionDueAt?: Date | null;
};

export type AddMessageInput = {
  ticketId: string;
  authorId: string | null;
  authorType: SupportTicketMessageAuthor;
  body: string;
  attachmentFileId?: string;
};

export class TicketRepository {
  listTickets(filters?: {
    userId?: string;
    assignedToId?: string;
    status?: string;
    search?: string;
  }): Promise<TicketListItem[]> {
    const where: Prisma.SupportTicketWhereInput = { deletedAt: null };
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.status) {
      where.status = filters.status as SupportTicketStatus;
    }
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { subject: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { ticketNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    return prisma.supportTicket.findMany({
      where,
      include: ticketListInclude,
      orderBy: { updatedAt: "desc" },
    }) as Promise<TicketListItem[]>;
  }

  findTicketById(id: string): Promise<TicketDetail | null> {
    return prisma.supportTicket.findFirst({
      where: { id, deletedAt: null },
      include: ticketDetailInclude,
    }) as Promise<TicketDetail | null>;
  }

  findSlaPolicyByPriority(priority: TicketPriority) {
    return prisma.slaPolicy.findFirst({
      where: { priority, isActive: true, deletedAt: null },
    });
  }

  listSlaPolicies() {
    return prisma.slaPolicy.findMany({
      where: { deletedAt: null },
      orderBy: { priority: "asc" },
    });
  }

  upsertSlaPolicy(data: {
    id?: string;
    name: string;
    priority: TicketPriority;
    firstResponseMinutes: number;
    resolutionMinutes: number;
    escalateAfterMinutes?: number | null;
    isActive?: boolean;
  }) {
    if (data.id) {
      return prisma.slaPolicy.update({
        where: { id: data.id },
        data: {
          name: data.name,
          firstResponseMinutes: data.firstResponseMinutes,
          resolutionMinutes: data.resolutionMinutes,
          escalateAfterMinutes: data.escalateAfterMinutes,
          isActive: data.isActive,
        },
      });
    }
    return prisma.slaPolicy.upsert({
      where: { priority: data.priority },
      create: {
        name: data.name,
        priority: data.priority,
        firstResponseMinutes: data.firstResponseMinutes,
        resolutionMinutes: data.resolutionMinutes,
        escalateAfterMinutes: data.escalateAfterMinutes,
        isActive: data.isActive ?? true,
      },
      update: {
        name: data.name,
        firstResponseMinutes: data.firstResponseMinutes,
        resolutionMinutes: data.resolutionMinutes,
        escalateAfterMinutes: data.escalateAfterMinutes,
        isActive: data.isActive,
        deletedAt: null,
      },
    });
  }

  async createTicket(input: CreateTicketInput): Promise<TicketDetail | null> {
    const priority = normalizeTicketPriority(input.priority);
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          userId: input.userId,
          subject: input.subject,
          description: input.description,
          priority,
          category: input.category,
          attachmentFileId: input.attachmentFileId,
          ticketNumber: input.ticketNumber ?? generateTicketNumber(),
          slaPolicyId: input.slaPolicyId,
          firstResponseDueAt: input.firstResponseDueAt,
          resolutionDueAt: input.resolutionDueAt,
        },
      });

      await tx.supportTicketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: input.userId,
          authorType: "EMPLOYEE",
          body: input.description,
          attachmentFileId: input.attachmentFileId,
        },
      });

      return tx.supportTicket.findFirst({
        where: { id: ticket.id },
        include: ticketDetailInclude,
      }) as Promise<TicketDetail | null>;
    });
  }

  async addMessage(input: AddMessageInput) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.supportTicketMessage.create({
        data: {
          ticketId: input.ticketId,
          authorId: input.authorId,
          authorType: input.authorType,
          body: input.body,
          attachmentFileId: input.attachmentFileId,
        },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, email: true } },
          attachment: {
            select: { id: true, originalName: true, mimeType: true, sizeBytes: true },
          },
        },
      });

      await tx.supportTicket.update({
        where: { id: input.ticketId },
        data: { latestReply: input.body.slice(0, 500) },
      });

      return message;
    });
  }

  updateTicket(
    id: string,
    data: {
      status?: SupportTicketStatus;
      assignedToId?: string | null;
      priority?: TicketPriority | string;
      resolvedAt?: Date | null;
      closedAt?: Date | null;
      firstRespondedAt?: Date | null;
      escalatedAt?: Date | null;
      escalationLevel?: number;
      approvalRequestId?: string | null;
      slaPolicyId?: string | null;
      firstResponseDueAt?: Date | null;
      resolutionDueAt?: Date | null;
      ticketNumber?: string;
    },
  ): Promise<TicketDetail> {
    return prisma.supportTicket.update({
      where: { id },
      data: {
        status: data.status,
        assignedToId: data.assignedToId,
        priority: data.priority
          ? normalizeTicketPriority(String(data.priority))
          : undefined,
        resolvedAt: data.resolvedAt,
        closedAt: data.closedAt,
        firstRespondedAt: data.firstRespondedAt,
        escalatedAt: data.escalatedAt,
        escalationLevel: data.escalationLevel,
        approvalRequestId: data.approvalRequestId,
        slaPolicyId: data.slaPolicyId,
        firstResponseDueAt: data.firstResponseDueAt,
        resolutionDueAt: data.resolutionDueAt,
        ticketNumber: data.ticketNumber,
      },
      include: ticketDetailInclude,
    }) as Promise<TicketDetail>;
  }
}
