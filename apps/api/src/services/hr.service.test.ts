import { describe, it, expect, vi, beforeEach } from "vitest";

const mockHrRepo = vi.hoisted(() => ({
  findEmployeeById: vi.fn(),
  findEmployeeByUserId: vi.fn(),
  createEmployee: vi.fn(),
  createLifecycleEvent: vi.fn(),
  updateEmployee: vi.fn(),
}));

const mockRecruitmentRepo = vi.hoisted(() => ({
  findApplicationById: vi.fn(),
}));

const mockUserRepo = vi.hoisted(() => ({
  findLatestEmployeeId: vi.fn(),
  findUserById: vi.fn(),
  updateUser: vi.fn(),
}));

const mockPortalRepo = vi.hoisted(() => ({
  createNotification: vi.fn(),
  listNotifications: vi.fn(),
  listTickets: vi.fn(),
}));

vi.mock("../repositories/phase2.repository", () => ({
  HrRepository: vi.fn(function HrRepositoryMock() {
    return mockHrRepo;
  }),
  RecruitmentRepository: vi.fn(function RecruitmentRepositoryMock() {
    return mockRecruitmentRepo;
  }),
  PortalRepository: vi.fn(function PortalRepositoryMock() {
    return mockPortalRepo;
  }),
}));

vi.mock("../repositories/user.repository", () => ({
  UserRepository: vi.fn(function UserRepositoryMock() {
    return mockUserRepo;
  }),
}));

vi.mock("../lib/audit", () => ({
  writeAuditLog: vi.fn(),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    role: { findUnique: vi.fn() },
    user: { update: vi.fn() },
  },
}));

import { HrService, PortalService } from "./hr.service";
import { prisma } from "../lib/prisma";
import { writeAuditLog } from "../lib/audit";

describe("HrService", () => {
  let service: HrService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new HrService();
  });

  describe("hireCandidate", () => {
    it("creates employee master when application is HIRED", async () => {
      mockRecruitmentRepo.findApplicationById.mockResolvedValue({
        id: "app-1",
        status: "HIRED",
        jobPosting: { departmentId: "dept-1", designationId: "des-1" },
        candidate: {
          id: "cand-1",
          userId: "user-1",
          employee: null,
        },
      });
      vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: "role-emp", code: "employee" } as never);
      mockUserRepo.findLatestEmployeeId.mockResolvedValue("EMP005");
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);
      mockHrRepo.createEmployee.mockResolvedValue({
        id: "emp-1",
        employeeCode: "EMP006",
        userId: "user-1",
      });
      mockHrRepo.createLifecycleEvent.mockResolvedValue({});
      mockPortalRepo.createNotification.mockResolvedValue({});

      const result = await service.hireCandidate({
        applicationId: "app-1",
        actorId: "hr-1",
      });

      expect(result.employeeCode).toBe("EMP006");
      expect(prisma.user.update).toHaveBeenCalled();
      expect(mockHrRepo.createEmployee).toHaveBeenCalled();
      expect(mockPortalRepo.createNotification).toHaveBeenCalled();
      expect(writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: "hire_candidate", entity: "employee" }),
      );
    });

    it("returns existing employee if already hired", async () => {
      const existing = { id: "emp-1", employeeCode: "EMP002" };
      mockRecruitmentRepo.findApplicationById.mockResolvedValue({
        id: "app-1",
        status: "HIRED",
        candidate: { id: "cand-1", userId: "user-1", employee: existing },
      });

      const result = await service.hireCandidate({ applicationId: "app-1", actorId: "hr-1" });
      expect(result).toBe(existing);
      expect(mockHrRepo.createEmployee).not.toHaveBeenCalled();
    });

    it("throws when application is not HIRED", async () => {
      mockRecruitmentRepo.findApplicationById.mockResolvedValue({
        id: "app-1",
        status: "OFFER",
        candidate: { userId: "user-1", employee: null },
      });

      await expect(
        service.hireCandidate({ applicationId: "app-1", actorId: "hr-1" }),
      ).rejects.toThrow("Application must be in HIRED status");
    });
  });

  describe("updateLifecycleState", () => {
    it("records lifecycle event and audit log", async () => {
      mockHrRepo.findEmployeeById.mockResolvedValue({
        id: "emp-1",
        lifecycleState: "ONBOARDING",
      });
      mockHrRepo.updateEmployee.mockResolvedValue({ id: "emp-1", lifecycleState: "ACTIVE" });
      mockHrRepo.createLifecycleEvent.mockResolvedValue({});

      await service.updateLifecycleState("emp-1", "ACTIVE", "hr-1", "Completed onboarding");

      expect(mockHrRepo.createLifecycleEvent).toHaveBeenCalled();
      expect(writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: "lifecycle_change" }),
      );
    });
  });
});

describe("PortalService", () => {
  let service: PortalService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PortalService();
  });

  describe("updateOwnProfile", () => {
    it("updates only the requesting user's profile", async () => {
      mockUserRepo.findUserById.mockResolvedValue({
        id: "user-1",
        firstName: "Janet",
        lastName: "Doe",
      });
      mockUserRepo.updateUser.mockResolvedValue({
        id: "user-1",
        firstName: "Janet",
        lastName: "Doe",
      });
      mockHrRepo.findEmployeeByUserId.mockResolvedValue(null);

      const result = await service.updateOwnProfile("user-1", { firstName: "Janet" });

      expect(mockUserRepo.updateUser).toHaveBeenCalledWith("user-1", { firstName: "Janet" });
      expect(result.user.firstName).toBe("Janet");
    });

    it("updates emergency contact on linked employee record", async () => {
      mockUserRepo.findUserById.mockResolvedValue({ id: "user-1", firstName: "Jane", lastName: "Doe" });
      mockUserRepo.updateUser.mockResolvedValue({ id: "user-1", firstName: "Jane", lastName: "Doe" });
      mockHrRepo.findEmployeeByUserId.mockResolvedValue({ id: "emp-1" });
      mockHrRepo.updateEmployee.mockResolvedValue({});

      await service.updateOwnProfile("user-1", {
        emergencyContactName: "John Doe",
        emergencyContactPhone: "+15551234567",
      });

      expect(mockHrRepo.updateEmployee).toHaveBeenCalledWith("emp-1", {
        emergencyContactName: "John Doe",
        emergencyContactPhone: "+15551234567",
      });
    });
  });
});
