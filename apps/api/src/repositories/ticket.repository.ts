import type {
  Prisma,
  SupportTicketMessageAuthor,
  SupportTicketStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

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
  _count: { select: { messages: true } },
} as const;

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
};

export type CreateTicketInput = {
  userId: string;
  subject: string;
  description: string;
  priority?: string;
  category?: string;
  attachmentFileId?: string;
};

export type AddMessageInput = {
  ticketId: string;
  authorId: string;
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
  }) {
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
      ];
    }

    return prisma.supportTicket.findMany({
      where,
      include: ticketListInclude,
      orderBy: { updatedAt: "desc" },
    });
  }

  findTicketById(id: string) {
    return prisma.supportTicket.findFirst({
      where: { id, deletedAt: null },
      include: ticketDetailInclude,
    });
  }

  async createTicket(input: CreateTicketInput) {
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          userId: input.userId,
          subject: input.subject,
          description: input.description,
          priority: input.priority ?? "medium",
          category: input.category,
          attachmentFileId: input.attachmentFileId,
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
      });
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
      priority?: string;
      resolvedAt?: Date | null;
      closedAt?: Date | null;
    },
  ) {
    return prisma.supportTicket.update({
      where: { id },
      data: {
        status: data.status,
        assignedToId: data.assignedToId,
        priority: data.priority,
        resolvedAt: data.resolvedAt,
        closedAt: data.closedAt,
      },
      include: ticketDetailInclude,
    });
  }
}
