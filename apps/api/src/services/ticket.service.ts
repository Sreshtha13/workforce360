import type { SupportTicketStatus } from "@prisma/client";
import {
  SUPPORT_TICKET_STATUSES,
  toPrismaTicketStatus,
  type TicketWorkflowStatus,
} from "../constants/support-ticket";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import {
  calculateSlaDueDates,
  generateTicketNumber,
  normalizeTicketPriority,
} from "../lib/ticket-sla";
import { TicketRepository, type TicketWorkflowFields } from "../repositories/ticket.repository";
import { ApprovalService } from "./approval.service";
import { NotificationService } from "./notification.service";

export { OPEN_TICKET_STATUSES } from "../constants/support-ticket";
export { calculateSlaDueDates, normalizeTicketPriority, generateTicketNumber } from "../lib/ticket-sla";

export class TicketService {
  private ticketRepo = new TicketRepository();
  private notificationService = new NotificationService();
  private approvalService = new ApprovalService();

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
    const priority = normalizeTicketPriority(input.priority);
    const sla = await this.ticketRepo.findSlaPolicyByPriority(priority);
    const createdAt = new Date();
    const dues = sla
      ? calculateSlaDueDates(createdAt, {
          firstResponseMinutes: sla.firstResponseMinutes,
          resolutionMinutes: sla.resolutionMinutes,
        })
      : { firstResponseDueAt: null, resolutionDueAt: null };

    const ticket = await this.ticketRepo.createTicket({
      userId,
      subject: input.subject.trim(),
      description: input.description.trim(),
      priority,
      category: input.category,
      attachmentFileId: input.attachmentFileId,
      ticketNumber: generateTicketNumber(createdAt),
      slaPolicyId: sla?.id ?? null,
      firstResponseDueAt: dues.firstResponseDueAt,
      resolutionDueAt: dues.resolutionDueAt,
    });

    await writeAuditLog({
      userId,
      action: "create_support_ticket",
      entity: "support_ticket",
      entityId: ticket?.id,
      after: {
        subject: input.subject,
        priority,
        category: input.category,
        ticketNumber: ticket?.ticketNumber,
      },
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

    if (ticket.assignedToId) {
      await this.notificationService.createInApp({
        userId: ticket.assignedToId,
        title: `Ticket reply: ${ticket.ticketNumber ?? ticketId}`,
        message: `Requester replied on "${ticket.subject}"`,
        category: "TICKET",
        link: `/helpdesk/tickets/${ticketId}`,
      });
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

    const updates: Parameters<TicketRepository["updateTicket"]>[1] = {
      assignedToId: fields.assignedToId ?? staffUserId,
    };

    if (!fields.firstRespondedAt) {
      updates.firstRespondedAt = new Date();
    }

    if (status !== "RESOLVED") {
      updates.status = toPrismaTicketStatus(nextStatus);
    }

    await this.ticketRepo.updateTicket(ticketId, updates);

    await this.notificationService.createInApp({
      userId: fields.userId,
      title: `Ticket update: ${ticket.ticketNumber ?? ticketId}`,
      message: `Staff replied on "${ticket.subject}"`,
      category: "TICKET",
      link: `/portal/tickets/${ticketId}`,
    });

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

    await this.ticketRepo.addMessage({
      ticketId,
      authorId: actorId,
      authorType: "SYSTEM",
      body: assigneeId ? `Ticket assigned to user ${assigneeId}` : "Ticket unassigned",
    });

    if (assigneeId) {
      await this.notificationService.createInApp({
        userId: assigneeId,
        title: `Ticket assigned: ${updated.ticketNumber ?? ticketId}`,
        message: `You were assigned "${updated.subject}"`,
        category: "TICKET",
        link: `/helpdesk/tickets/${ticketId}`,
      });
    }

    await this.notificationService.createInApp({
      userId: updated.userId,
      title: `Ticket assigned: ${updated.ticketNumber ?? ticketId}`,
      message: assigneeId
        ? `Your ticket "${updated.subject}" was assigned to staff`
        : `Your ticket "${updated.subject}" was unassigned`,
      category: "TICKET",
      link: `/portal/tickets/${ticketId}`,
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

    if (workflowStatus === "RESOLVED" || workflowStatus === "CLOSED") {
      await this.notificationService.createInApp({
        userId: fields.userId,
        title: `Ticket ${workflowStatus.toLowerCase()}: ${updated.ticketNumber ?? ticketId}`,
        message: `Your ticket "${updated.subject}" is now ${workflowStatus}`,
        category: "TICKET",
        link: `/portal/tickets/${ticketId}`,
      });
      if (fields.assignedToId) {
        await this.notificationService.createInApp({
          userId: fields.assignedToId,
          title: `Ticket ${workflowStatus.toLowerCase()}: ${updated.ticketNumber ?? ticketId}`,
          message: `Ticket "${updated.subject}" is now ${workflowStatus}`,
          category: "TICKET",
          link: `/helpdesk/tickets/${ticketId}`,
        });
      }
    }

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

  async escalateTicket(
    ticketId: string,
    actorId: string,
    input: { approverIds: string[]; notes?: string },
  ) {
    const ticket = await this.getStaffTicket(ticketId);
    const fields = ticket as unknown as TicketWorkflowFields;

    if (!input.approverIds?.length) {
      throw new AppError("APPROVER_REQUIRED", "At least one approver is required to escalate", 400);
    }

    const approval = await this.approvalService.createApprovalRequest(
      {
        entityType: "support_ticket",
        entityId: ticketId,
        requesterId: actorId,
        approverIds: input.approverIds,
        metadata: {
          ticketNumber: ticket.ticketNumber,
          priority: fields.priority,
          notes: input.notes,
        },
      },
      actorId,
    );

    const nextLevel = (fields.escalationLevel ?? 0) + 1;
    const updated = await this.ticketRepo.updateTicket(ticketId, {
      escalatedAt: new Date(),
      escalationLevel: nextLevel,
      approvalRequestId: approval.id,
    });

    await this.ticketRepo.addMessage({
      ticketId,
      authorId: actorId,
      authorType: "SYSTEM",
      body: `Ticket escalated (level ${nextLevel})${input.notes ? `: ${input.notes}` : ""}`,
    });

    await this.notificationService.createInApp({
      userId: fields.userId,
      title: `Ticket escalated: ${ticket.ticketNumber ?? ticketId}`,
      message: `Your ticket "${ticket.subject}" was escalated`,
      category: "TICKET",
      link: `/portal/tickets/${ticketId}`,
    });

    for (const approverId of input.approverIds) {
      await this.notificationService.createInApp({
        userId: approverId,
        title: `Escalation approval: ${ticket.ticketNumber ?? ticketId}`,
        message: `Please review escalated ticket "${ticket.subject}"`,
        category: "APPROVAL",
        link: `/approvals/${approval.id}`,
      });
    }

    await writeAuditLog({
      userId: actorId,
      action: "escalate_support_ticket",
      entity: "support_ticket",
      entityId: ticketId,
      after: { escalationLevel: nextLevel, approvalRequestId: approval.id },
    });

    return updated;
  }

  listSlaPolicies() {
    return this.ticketRepo.listSlaPolicies();
  }

  async upsertSlaPolicy(
    data: {
      id?: string;
      name: string;
      priority: string;
      firstResponseMinutes: number;
      resolutionMinutes: number;
      escalateAfterMinutes?: number | null;
      isActive?: boolean;
    },
    actorId: string,
  ) {
    const policy = await this.ticketRepo.upsertSlaPolicy({
      ...data,
      priority: normalizeTicketPriority(data.priority),
    });
    await writeAuditLog({
      userId: actorId,
      action: "upsert",
      entity: "sla_policy",
      entityId: policy.id,
      after: policy,
    });
    return policy;
  }

  async noteSlaBreach(ticketId: string, actorId: string, note: string) {
    await this.getStaffTicket(ticketId);
    await this.ticketRepo.addMessage({
      ticketId,
      authorId: actorId,
      authorType: "SYSTEM",
      body: `SLA note: ${note}`,
    });
    return this.getStaffTicket(ticketId);
  }
}

export const ticketService = new TicketService();
