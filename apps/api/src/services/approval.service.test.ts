import { describe, it, expect, beforeEach, vi } from "vitest";
import { ApprovalService } from "./approval.service";
import { ApprovalRepository } from "../repositories/approval.repository";

vi.mock("../repositories/approval.repository");
vi.mock("../lib/audit");

describe("ApprovalService", () => {
  let approvalService: ApprovalService;
  let approvalRepo: ApprovalRepository;

  beforeEach(() => {
    approvalService = new ApprovalService();
    approvalRepo = (approvalService as any).approvalRepo;
  });

  describe("Approval Workflow", () => {
    it("should create approval request with multiple levels", async () => {
      const mockRequest = {
        id: "req-1",
        entityType: "leave_application",
        entityId: "leave-1",
        requesterId: "emp-1",
        currentLevel: 1,
        totalLevels: 2,
        status: "PENDING",
        steps: [
          { id: "step-1", level: 1, approverId: "manager-1", status: "PENDING" },
          { id: "step-2", level: 2, approverId: "hr-1", status: "PENDING" },
        ],
        actions: [],
      };

      vi.spyOn(approvalRepo, "createApprovalRequest").mockResolvedValue(mockRequest as any);

      const result = await approvalService.createApprovalRequest(
        {
          entityType: "leave_application",
          entityId: "leave-1",
          requesterId: "emp-1",
          approverIds: ["manager-1", "hr-1"],
        },
        "emp-1"
      );

      expect(result.totalLevels).toBe(2);
      expect(result.currentLevel).toBe(1);
      expect(result.status).toBe("PENDING");
    });

    it("should approve at first level and advance to next level", async () => {
      const mockRequest = {
        id: "req-1",
        entityType: "leave_application",
        entityId: "leave-1",
        requesterId: "emp-1",
        currentLevel: 1,
        totalLevels: 2,
        status: "PENDING",
        steps: [
          { id: "step-1", level: 1, approverId: "manager-1", status: "PENDING" },
          { id: "step-2", level: 2, approverId: "hr-1", status: "PENDING" },
        ],
        actions: [],
      };

      const mockStep = {
        id: "step-1",
        level: 1,
        approverId: "manager-1",
        status: "PENDING",
      };

      vi.spyOn(approvalRepo, "findApprovalRequestById").mockResolvedValue(mockRequest as any);
      vi.spyOn(approvalRepo, "findPendingStepForApprover").mockResolvedValue(mockStep as any);
      vi.spyOn(approvalRepo, "updateApprovalStep").mockResolvedValue({
        ...mockStep,
        status: "APPROVED",
      } as any);
      vi.spyOn(approvalRepo, "createApprovalAction").mockResolvedValue({} as any);
      vi.spyOn(approvalRepo, "updateApprovalRequest").mockResolvedValue({
        ...mockRequest,
        currentLevel: 2,
      } as any);

      await approvalService.approveRequest("req-1", "manager-1", "Looks good");

      expect(approvalRepo.updateApprovalRequest).toHaveBeenCalledWith(
        "req-1",
        expect.objectContaining({ currentLevel: 2 })
      );
    });

    it("should mark request as approved at final level", async () => {
      const mockRequest = {
        id: "req-1",
        entityType: "leave_application",
        entityId: "leave-1",
        requesterId: "emp-1",
        currentLevel: 2,
        totalLevels: 2,
        status: "PENDING",
        steps: [
          { id: "step-1", level: 1, approverId: "manager-1", status: "APPROVED" },
          { id: "step-2", level: 2, approverId: "hr-1", status: "PENDING" },
        ],
        actions: [],
      };

      const mockStep = {
        id: "step-2",
        level: 2,
        approverId: "hr-1",
        status: "PENDING",
      };

      vi.spyOn(approvalRepo, "findApprovalRequestById").mockResolvedValue(mockRequest as any);
      vi.spyOn(approvalRepo, "findPendingStepForApprover").mockResolvedValue(mockStep as any);
      vi.spyOn(approvalRepo, "updateApprovalStep").mockResolvedValue({
        ...mockStep,
        status: "APPROVED",
      } as any);
      vi.spyOn(approvalRepo, "createApprovalAction").mockResolvedValue({} as any);
      vi.spyOn(approvalRepo, "updateApprovalRequest").mockResolvedValue({
        ...mockRequest,
        status: "APPROVED",
      } as any);

      await approvalService.approveRequest("req-1", "hr-1", "Final approval");

      expect(approvalRepo.updateApprovalRequest).toHaveBeenCalledWith(
        "req-1",
        expect.objectContaining({
          status: "APPROVED",
          completedAt: expect.any(Date),
        })
      );
    });

    it("should reject request and mark as rejected", async () => {
      const mockRequest = {
        id: "req-1",
        entityType: "leave_application",
        entityId: "leave-1",
        requesterId: "emp-1",
        currentLevel: 1,
        totalLevels: 2,
        status: "PENDING",
        steps: [
          { id: "step-1", level: 1, approverId: "manager-1", status: "PENDING" },
          { id: "step-2", level: 2, approverId: "hr-1", status: "PENDING" },
        ],
        actions: [],
      };

      const mockStep = {
        id: "step-1",
        level: 1,
        approverId: "manager-1",
        status: "PENDING",
      };

      vi.spyOn(approvalRepo, "findApprovalRequestById").mockResolvedValue(mockRequest as any);
      vi.spyOn(approvalRepo, "findPendingStepForApprover").mockResolvedValue(mockStep as any);
      vi.spyOn(approvalRepo, "updateApprovalStep").mockResolvedValue({
        ...mockStep,
        status: "REJECTED",
      } as any);
      vi.spyOn(approvalRepo, "createApprovalAction").mockResolvedValue({} as any);
      vi.spyOn(approvalRepo, "updateApprovalRequest").mockResolvedValue({
        ...mockRequest,
        status: "REJECTED",
      } as any);

      await approvalService.rejectRequest("req-1", "manager-1", "Not sufficient");

      expect(approvalRepo.updateApprovalRequest).toHaveBeenCalledWith(
        "req-1",
        expect.objectContaining({
          status: "REJECTED",
          completedAt: expect.any(Date),
        })
      );
    });

    it("should throw error if approver tries to approve out of order", async () => {
      const mockRequest = {
        id: "req-1",
        entityType: "leave_application",
        entityId: "leave-1",
        requesterId: "emp-1",
        currentLevel: 1,
        totalLevels: 2,
        status: "PENDING",
        steps: [
          { id: "step-1", level: 1, approverId: "manager-1", status: "PENDING" },
          { id: "step-2", level: 2, approverId: "hr-1", status: "PENDING" },
        ],
        actions: [],
      };

      const mockStep = {
        id: "step-2",
        level: 2,
        approverId: "hr-1",
        status: "PENDING",
      };

      vi.spyOn(approvalRepo, "findApprovalRequestById").mockResolvedValue(mockRequest as any);
      vi.spyOn(approvalRepo, "findPendingStepForApprover").mockResolvedValue(mockStep as any);

      await expect(
        approvalService.approveRequest("req-1", "hr-1", "Approved")
      ).rejects.toThrow("Approval must follow sequential order");
    });

    it("should allow requester to cancel pending approval", async () => {
      const mockRequest = {
        id: "req-1",
        entityType: "leave_application",
        entityId: "leave-1",
        requesterId: "emp-1",
        currentLevel: 1,
        totalLevels: 2,
        status: "PENDING",
        steps: [],
        actions: [],
      };

      vi.spyOn(approvalRepo, "findApprovalRequestById").mockResolvedValue(mockRequest as any);
      vi.spyOn(approvalRepo, "createApprovalAction").mockResolvedValue({} as any);
      vi.spyOn(approvalRepo, "updateApprovalRequest").mockResolvedValue({
        ...mockRequest,
        status: "CANCELLED",
      } as any);

      await approvalService.cancelApprovalRequest("req-1", "emp-1", "Changed plans");

      expect(approvalRepo.updateApprovalRequest).toHaveBeenCalledWith(
        "req-1",
        expect.objectContaining({
          status: "CANCELLED",
          completedAt: expect.any(Date),
        })
      );
    });

    it("should throw error if non-requester tries to cancel", async () => {
      const mockRequest = {
        id: "req-1",
        entityType: "leave_application",
        entityId: "leave-1",
        requesterId: "emp-1",
        currentLevel: 1,
        totalLevels: 2,
        status: "PENDING",
        steps: [],
        actions: [],
      };

      vi.spyOn(approvalRepo, "findApprovalRequestById").mockResolvedValue(mockRequest as any);

      await expect(
        approvalService.cancelApprovalRequest("req-1", "other-user", "Reason")
      ).rejects.toThrow("Only the requester can cancel the approval request");
    });

    it("should get pending approvals for a specific approver", async () => {
      const mockRequests = [
        {
          id: "req-1",
          entityType: "leave_application",
          requesterId: "emp-1",
          status: "PENDING",
          steps: [{ approverId: "manager-1", status: "PENDING" }],
        },
        {
          id: "req-2",
          entityType: "leave_application",
          requesterId: "emp-2",
          status: "PENDING",
          steps: [{ approverId: "manager-1", status: "PENDING" }],
        },
      ];

      vi.spyOn(approvalRepo, "findPendingRequestsForApprover").mockResolvedValue(mockRequests as any);

      const result = await approvalService.getPendingApprovalsForUser("manager-1");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("req-1");
      expect(result[1].id).toBe("req-2");
    });
  });
});
