import { describe, it, expect, beforeEach, vi } from "vitest";
import { LeaveService } from "./leave.service";
import { LeaveRepository } from "../repositories/leave.repository";
import { AppError } from "../lib/app-error";

vi.mock("../repositories/leave.repository");
vi.mock("../lib/audit");

describe("LeaveService", () => {
  let leaveService: LeaveService;
  let leaveRepo: LeaveRepository;

  beforeEach(() => {
    leaveService = new LeaveService();
    leaveRepo = (leaveService as any).leaveRepo;
  });

  describe("Leave Balance Calculation", () => {
    it("should correctly initialize leave balance", async () => {
      const mockLeaveType = {
        id: "leave-type-1",
        name: "Annual Leave",
        requiresApproval: true,
      };

      vi.spyOn(leaveRepo, "findLeaveTypeById").mockResolvedValue(mockLeaveType as any);
      vi.spyOn(leaveRepo, "findLeaveBalance").mockResolvedValue(null);
      vi.spyOn(leaveRepo, "createLeaveBalance").mockResolvedValue({
        id: "balance-1",
        employeeId: "emp-1",
        leaveTypeId: "leave-type-1",
        year: 2024,
        allocated: 20,
        used: 0,
        balance: 25,
        carriedOver: 5,
      } as any);

      const result = await leaveService.initializeLeaveBalance(
        {
          employeeId: "emp-1",
          leaveTypeId: "leave-type-1",
          year: 2024,
          allocated: 20,
          carriedOver: 5,
        },
        "admin-1"
      );

      expect(result.balance).toBe(25);
      expect(result.allocated).toBe(20);
      expect(result.carriedOver).toBe(5);
      expect(result.used).toBe(0);
    });

    it("should correctly adjust leave balance", async () => {
      const mockExistingBalance = {
        id: "balance-1",
        employeeId: "emp-1",
        leaveTypeId: "leave-type-1",
        year: 2024,
        allocated: 20,
        used: 5,
        balance: 15,
        carriedOver: 0,
      };

      vi.spyOn(leaveRepo, "findLeaveBalanceById").mockResolvedValue(mockExistingBalance as any);
      vi.spyOn(leaveRepo, "updateLeaveBalance").mockResolvedValue({
        ...mockExistingBalance,
        used: 10,
        balance: 10,
      } as any);

      const result = await leaveService.adjustLeaveBalance(
        "balance-1",
        { used: 10 },
        "admin-1"
      );

      expect(result.used).toBe(10);
      expect(result.balance).toBe(10);
    });

    it("should throw error if balance becomes negative", async () => {
      const mockExistingBalance = {
        id: "balance-1",
        employeeId: "emp-1",
        leaveTypeId: "leave-type-1",
        year: 2024,
        allocated: 20,
        used: 5,
        balance: 15,
        carriedOver: 0,
      };

      vi.spyOn(leaveRepo, "findLeaveBalanceById").mockResolvedValue(mockExistingBalance as any);

      await expect(
        leaveService.adjustLeaveBalance("balance-1", { used: 25 }, "admin-1")
      ).rejects.toThrow(AppError);
    });

    it("should deduct leave balance when leave is approved", async () => {
      const mockApplication = {
        id: "app-1",
        employeeId: "emp-1",
        leaveTypeId: "leave-type-1",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-03"),
        dayCount: 3,
        status: "PENDING",
      };

      const mockBalance = {
        id: "balance-1",
        employeeId: "emp-1",
        leaveTypeId: "leave-type-1",
        year: 2024,
        allocated: 20,
        used: 5,
        balance: 15,
        carriedOver: 0,
      };

      vi.spyOn(leaveRepo, "findLeaveApplicationById").mockResolvedValue(mockApplication as any);
      vi.spyOn(leaveRepo, "findLeaveBalance").mockResolvedValue(mockBalance as any);
      vi.spyOn(leaveRepo, "updateLeaveApplication").mockResolvedValue({
        ...mockApplication,
        status: "APPROVED",
      } as any);
      vi.spyOn(leaveRepo, "updateLeaveBalance").mockResolvedValue({
        ...mockBalance,
        used: 8,
        balance: 12,
      } as any);

      const result = await leaveService.reviewLeaveApplication(
        "app-1",
        { status: "APPROVED", reviewNotes: "Approved" },
        "manager-1"
      );

      expect(result.status).toBe("APPROVED");
      expect(leaveRepo.updateLeaveBalance).toHaveBeenCalledWith(
        "balance-1",
        expect.objectContaining({
          used: 8,
          balance: 12,
        })
      );
    });

    it("should restore balance when approved leave is cancelled", async () => {
      const mockApplication = {
        id: "app-1",
        employeeId: "emp-1",
        leaveTypeId: "leave-type-1",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-03"),
        dayCount: 3,
        status: "APPROVED",
      };

      const mockBalance = {
        id: "balance-1",
        employeeId: "emp-1",
        leaveTypeId: "leave-type-1",
        year: 2024,
        allocated: 20,
        used: 8,
        balance: 12,
        carriedOver: 0,
      };

      vi.spyOn(leaveRepo, "findLeaveApplicationById").mockResolvedValue(mockApplication as any);
      vi.spyOn(leaveRepo, "findLeaveBalance").mockResolvedValue(mockBalance as any);
      vi.spyOn(leaveRepo, "updateLeaveApplication").mockResolvedValue({
        ...mockApplication,
        status: "CANCELLED",
      } as any);
      vi.spyOn(leaveRepo, "updateLeaveBalance").mockResolvedValue({
        ...mockBalance,
        used: 5,
        balance: 15,
      } as any);

      const result = await leaveService.cancelLeaveApplication("app-1", "emp-1", "Changed plans");

      expect(result.status).toBe("CANCELLED");
      expect(leaveRepo.updateLeaveBalance).toHaveBeenCalledWith(
        "balance-1",
        expect.objectContaining({
          used: 5,
          balance: 15,
        })
      );
    });

    it("should prevent overlapping leave applications", async () => {
      const mockLeaveType = {
        id: "leave-type-1",
        name: "Annual Leave",
        requiresApproval: true,
      };

      const mockOverlappingLeave = {
        id: "app-existing",
        employeeId: "emp-1",
        leaveTypeId: "leave-type-1",
        startDate: new Date("2024-01-02"),
        endDate: new Date("2024-01-05"),
        status: "APPROVED",
      };

      vi.spyOn(leaveRepo, "findLeaveTypeById").mockResolvedValue(mockLeaveType as any);
      vi.spyOn(leaveRepo, "findOverlappingLeaves").mockResolvedValue([mockOverlappingLeave] as any);

      await expect(
        leaveService.applyLeave(
          "emp-1",
          {
            leaveTypeId: "leave-type-1",
            startDate: "2024-01-01",
            endDate: "2024-01-03",
            reason: "Vacation",
          },
          "emp-1"
        )
      ).rejects.toThrow("Leave dates overlap with existing leave application");
    });

    it("should check for sufficient balance before applying leave", async () => {
      const mockLeaveType = {
        id: "leave-type-1",
        name: "Annual Leave",
        requiresApproval: true,
      };

      const mockBalance = {
        id: "balance-1",
        employeeId: "emp-1",
        leaveTypeId: "leave-type-1",
        year: 2024,
        allocated: 20,
        used: 18,
        balance: 2,
        carriedOver: 0,
      };

      vi.spyOn(leaveRepo, "findLeaveTypeById").mockResolvedValue(mockLeaveType as any);
      vi.spyOn(leaveRepo, "findOverlappingLeaves").mockResolvedValue([]);
      vi.spyOn(leaveRepo, "findLeaveBalance").mockResolvedValue(mockBalance as any);

      await expect(
        leaveService.applyLeave(
          "emp-1",
          {
            leaveTypeId: "leave-type-1",
            startDate: "2024-01-01",
            endDate: "2024-01-05",
            reason: "Vacation",
          },
          "emp-1"
        )
      ).rejects.toThrow("Insufficient leave balance");
    });
  });

  describe("Leave Stats", () => {
    it("should calculate leave stats correctly", async () => {
      const mockBalances = [
        {
          id: "balance-1",
          employeeId: "emp-1",
          leaveTypeId: "leave-type-1",
          year: 2024,
          allocated: 20,
          used: 8,
          balance: 12,
          carriedOver: 0,
          leaveType: { name: "Annual Leave" },
        },
        {
          id: "balance-2",
          employeeId: "emp-1",
          leaveTypeId: "leave-type-2",
          year: 2024,
          allocated: 10,
          used: 3,
          balance: 7,
          carriedOver: 0,
          leaveType: { name: "Sick Leave" },
        },
      ];

      vi.spyOn(leaveRepo, "findManyLeaveBalances").mockResolvedValue(mockBalances as any);

      const result = await leaveService.getLeaveStats("emp-1", 2024);

      expect(result.year).toBe(2024);
      expect(result.totals.totalAllocated).toBe(30);
      expect(result.totals.totalUsed).toBe(11);
      expect(result.totals.totalBalance).toBe(19);
    });
  });
});
