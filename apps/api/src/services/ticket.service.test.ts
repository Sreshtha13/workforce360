import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockTicketRepo, mockNotification, mockApproval } = vi.hoisted(() => ({
  mockTicketRepo: {
    listTickets: vi.fn(),
    findTicketById: vi.fn(),
    createTicket: vi.fn(),
    addMessage: vi.fn(),
    updateTicket: vi.fn(),
    findSlaPolicyByPriority: vi.fn(),
    listSlaPolicies: vi.fn(),
    upsertSlaPolicy: vi.fn(),
  },
  mockNotification: {
    createInApp: vi.fn().mockResolvedValue(null),
  },
  mockApproval: {
    createApprovalRequest: vi.fn(),
  },
}));

vi.mock("../repositories/ticket.repository", () => ({
  TicketRepository: vi.fn(function TicketRepositoryMock() {
    return mockTicketRepo;
  }),
}));

vi.mock("./notification.service", () => ({
  NotificationService: vi.fn(function () {
    return mockNotification;
  }),
}));

vi.mock("./approval.service", () => ({
  ApprovalService: vi.fn(function () {
    return mockApproval;
  }),
}));

vi.mock("../lib/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { TicketService } from "./ticket.service";

describe("TicketService", () => {
  let service: TicketService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TicketService();
  });

  describe("getMyTicket", () => {
    it("rejects access to another user's ticket", async () => {
      mockTicketRepo.findTicketById.mockResolvedValue({
        id: "t1",
        userId: "other-user",
        status: "OPEN",
      });

      await expect(service.getMyTicket("t1", "user-1")).rejects.toThrow("Ticket not found");
    });

    it("returns own ticket", async () => {
      mockTicketRepo.findTicketById.mockResolvedValue({
        id: "t1",
        userId: "user-1",
        status: "OPEN",
      });

      const ticket = await service.getMyTicket("t1", "user-1");
      expect(ticket.id).toBe("t1");
    });
  });

  describe("createTicket", () => {
    it("applies SLA due dates from policy", async () => {
      mockTicketRepo.findSlaPolicyByPriority.mockResolvedValue({
        id: "sla-high",
        firstResponseMinutes: 60,
        resolutionMinutes: 480,
      });
      mockTicketRepo.createTicket.mockImplementation(async (input: Record<string, unknown>) => ({
        id: "t1",
        ticketNumber: input.ticketNumber,
        firstResponseDueAt: input.firstResponseDueAt,
        resolutionDueAt: input.resolutionDueAt,
        priority: "HIGH",
      }));

      const ticket = await service.createTicket("user-1", {
        subject: "Outage",
        description: "Down",
        priority: "HIGH",
      });

      expect(mockTicketRepo.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          slaPolicyId: "sla-high",
          firstResponseDueAt: expect.any(Date),
          resolutionDueAt: expect.any(Date),
        }),
      );
      expect(ticket?.priority).toBe("HIGH");
    });
  });

  describe("addEmployeeReply", () => {
    it("blocks replies on closed tickets", async () => {
      mockTicketRepo.findTicketById.mockResolvedValue({
        id: "t1",
        userId: "user-1",
        status: "CLOSED",
      });

      await expect(service.addEmployeeReply("t1", "user-1", "hello")).rejects.toThrow(
        /Closed tickets/,
      );
    });

    it("reopens waiting tickets to IN_PROGRESS", async () => {
      mockTicketRepo.findTicketById
        .mockResolvedValueOnce({
          id: "t1",
          userId: "user-1",
          status: "WAITING_FOR_EMPLOYEE",
          assignedToId: null,
        })
        .mockResolvedValueOnce({
          id: "t1",
          userId: "user-1",
          status: "IN_PROGRESS",
          messages: [],
        });
      mockTicketRepo.addMessage.mockResolvedValue({ id: "m1" });
      mockTicketRepo.updateTicket.mockResolvedValue({});

      await service.addEmployeeReply("t1", "user-1", "Following up");

      expect(mockTicketRepo.updateTicket).toHaveBeenCalledWith("t1", {
        status: "IN_PROGRESS",
      });
    });
  });

  describe("updateStatus", () => {
    it("rejects invalid status", async () => {
      await expect(
        service.updateStatus("t1", "NOT_A_STATUS" as never, "staff-1"),
      ).rejects.toThrow(/Invalid ticket status/);
    });

    it("updates status and writes system message", async () => {
      mockTicketRepo.findTicketById
        .mockResolvedValueOnce({
          id: "t1",
          userId: "user-1",
          status: "OPEN",
          resolvedAt: null,
          closedAt: null,
        })
        .mockResolvedValueOnce({
          id: "t1",
          status: "RESOLVED",
        });
      mockTicketRepo.updateTicket.mockResolvedValue({ id: "t1", status: "RESOLVED", subject: "x" });
      mockTicketRepo.addMessage.mockResolvedValue({ id: "m1" });

      const result = await service.updateStatus("t1", "RESOLVED", "staff-1");
      expect(mockTicketRepo.updateTicket).toHaveBeenCalledWith(
        "t1",
        expect.objectContaining({ status: "RESOLVED" }),
      );
      expect(mockTicketRepo.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          authorType: "SYSTEM",
          body: "Status changed to RESOLVED",
        }),
      );
      expect(result.status).toBe("RESOLVED");
    });
  });
});
