import type { SupportTicketStatus } from "@prisma/client";
import {
  SUPPORT_TICKET_STATUSES,
  toPrismaTicketStatus,
  type TicketWorkflowStatus,
} from "../constants/support-ticket";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { TicketRepository, type TicketWorkflowFields } from "../repositories/ticket.repository";

export { OPEN_TICKET_STATUSES } from "../constants/support-ticket";

export class TicketService {
  private ticketRepo = new TicketRepository();

  listMyTickets(userId: string) {
    return this.ticketRepo.listTickets({ userId });
  }

  listStaffTickets(filters?: { status?: string; assignedToId?: string; search?: string }) {
    return this.ticketRepo.listTickets(filters);
  }

  async getMyTicket(ticketId: string, userId: string) {
    const ticket = await this.ticketRepo.findTicketById(ticketId);
    if (!ticket || ticket.userId !== userId) {
      throw new AppError("TICKET_NOT_FOUND", "Ticket not found", 404);
    }
    return ticket;
  }

  async getStaffTicket(ticketId: string) {
    const ticket = await this.ticketRepo.findTicketById(ticketId);
    if (!ticket) {
      throw new AppError("TICKET_NOT_FOUND", "Ticket not found", 404);
    }
    return ticket;
  }

  async createTicket(
    userId: string,
    input: {
      subject: string;
      description: string;
      priority?: string;
      category?: string;
      attachmentFileId?: string;
    },
  ) {
    const ticket = await this.ticketRepo.createTicket({
      userId,
      subject: input.subject.trim(),
      description: input.description.trim(),
      priority: input.priority,
      category: input.category,
      attachmentFileId: input.attachmentFileId,
    });

    await writeAuditLog({
      userId,
      action: "create_support_ticket",
      entity: "support_ticket",
      entityId: ticket?.id,
      after: { subject: input.subject, priority: input.priority, category: input.category },
    });

    return ticket;
  }

  async addEmployeeReply(
    ticketId: string,
    userId: string,
    body: string,
    attachmentFileId?: string,
  ) {
    const ticket = await this.getMyTicket(ticketId, userId);
    const status = ticket.status as TicketWorkflowStatus;
    if (status === "CLOSED") {
      throw new AppError("TICKET_CLOSED", "Closed tickets cannot receive new replies", 400);
    }

    await this.ticketRepo.addMessage({
      ticketId,
      authorId: userId,
      authorType: "EMPLOYEE",
      body: body.trim(),
      attachmentFileId,
    });

    if (status === "WAITING_FOR_EMPLOYEE" || status === "RESOLVED") {
      await this.ticketRepo.updateTicket(ticketId, { status: toPrismaTicketStatus("IN_PROGRESS") });
    }

    await writeAuditLog({
      userId,
      action: "reply_support_ticket",
      entity: "support_ticket",
      entityId: ticketId,
      after: { authorType: "EMPLOYEE" },
    });

    return this.getMyTicket(ticketId, userId);
  }

  async addStaffReply(
    ticketId: string,
    staffUserId: string,
    body: string,
    options?: { attachmentFileId?: string; setWaiting?: boolean },
  ) {
    const ticket = await this.getStaffTicket(ticketId);
    const fields = ticket as unknown as TicketWorkflowFields;
    const status = fields.status as TicketWorkflowStatus;
    if (status === "CLOSED") {
      throw new AppError("TICKET_CLOSED", "Closed tickets cannot receive new replies", 400);
    }

    await this.ticketRepo.addMessage({
      ticketId,
      authorId: staffUserId,
      authorType: "STAFF",
      body: body.trim(),
      attachmentFileId: options?.attachmentFileId,
    });

    const nextStatus: TicketWorkflowStatus =
      options?.setWaiting === false ? "IN_PROGRESS" : "WAITING_FOR_EMPLOYEE";

    if (status !== "RESOLVED") {
      await this.ticketRepo.updateTicket(ticketId, {
        status: toPrismaTicketStatus(nextStatus),
        assignedToId: fields.assignedToId ?? staffUserId,
      });
    }

    await writeAuditLog({
      userId: staffUserId,
      action: "staff_reply_support_ticket",
      entity: "support_ticket",
      entityId: ticketId,
      after: { authorType: "STAFF", status: nextStatus },
    });

    return this.getStaffTicket(ticketId);
  }

  async assignTicket(ticketId: string, assigneeId: string | null, actorId: string) {
    await this.getStaffTicket(ticketId);

    const updated = await this.ticketRepo.updateTicket(ticketId, {
      assignedToId: assigneeId,
      status: assigneeId ? toPrismaTicketStatus("IN_PROGRESS") : undefined,
    });

    await writeAuditLog({
      userId: actorId,
      action: "assign_support_ticket",
      entity: "support_ticket",
      entityId: ticketId,
      after: { assignedToId: assigneeId },
    });

    return updated;
  }

  async updateStatus(ticketId: string, status: SupportTicketStatus, actorId: string) {
    const workflowStatus = status as TicketWorkflowStatus;
    if (!(SUPPORT_TICKET_STATUSES as readonly string[]).includes(workflowStatus)) {
      throw new AppError("INVALID_TICKET_STATUS", "Invalid ticket status", 400);
    }

    const existing = await this.getStaffTicket(ticketId);
    const fields = existing as unknown as TicketWorkflowFields;
    const updated = await this.ticketRepo.updateTicket(ticketId, {
      status: toPrismaTicketStatus(workflowStatus),
      resolvedAt: workflowStatus === "RESOLVED" ? new Date() : fields.resolvedAt,
      closedAt: workflowStatus === "CLOSED" ? new Date() : fields.closedAt,
    });

    await this.ticketRepo.addMessage({
      ticketId,
      authorId: actorId,
      authorType: "SYSTEM",
      body: `Status changed to ${workflowStatus}`,
    });

    await writeAuditLog({
      userId: actorId,
      action: "update_support_ticket_status",
      entity: "support_ticket",
      entityId: ticketId,
      before: { status: existing.status },
      after: { status: workflowStatus },
    });

    return updated;
  }
}

export const ticketService = new TicketService();
