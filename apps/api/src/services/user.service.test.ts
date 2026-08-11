import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserRepo = {
  findAllUsers: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  assignRole: vi.fn(),
  removeRole: vi.fn(),
  getUserRoles: vi.fn(),
  clearUserAssignments: vi.fn(),
};

const mockAllocateNextEmployeeId = vi.fn();
const mockPreviewNextEmployeeId = vi.fn();
const mockEnsureEmployeeRecord = vi.fn();
const mockSoftDeleteForUser = vi.fn();

vi.mock("../repositories/user.repository", () => ({
  UserRepository: vi.fn(function UserRepositoryMock() {
    return mockUserRepo;
  }),
}));

vi.mock("./employee-id.service", () => ({
  allocateNextEmployeeId: (...args: unknown[]) => mockAllocateNextEmployeeId(...args),
  previewNextEmployeeId: (...args: unknown[]) => mockPreviewNextEmployeeId(...args),
  isEmployeeIdConflict: vi.fn(() => false),
}));

vi.mock("./employee-master.service", () => ({
  employeeMasterService: {
    ensureEmployeeRecord: (...args: unknown[]) => mockEnsureEmployeeRecord(...args),
    softDeleteForUser: (...args: unknown[]) => mockSoftDeleteForUser(...args),
  },
}));

vi.mock("./department-manager.service", () => ({
  departmentManagerService: {
    resolveManagerForDepartmentAssignment: vi.fn(),
    resolveManagerAfterDepartmentRemoval: vi.fn(),
    validateManagerUser: vi.fn(),
    validateNoReportingCycle: vi.fn(),
    assertUserCanBeDeleted: vi.fn(),
  },
}));

vi.mock("./auth.service", () => ({
  authService: {
    invalidateUserSessions: vi.fn(),
  },
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    role: { findFirst: vi.fn() },
    department: { findFirst: vi.fn() },
  },
}));

import { UserService } from "./user.service";

describe("UserService employee master integration", () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
    mockAllocateNextEmployeeId.mockResolvedValue("EMP010");
    mockEnsureEmployeeRecord.mockResolvedValue({ id: "emp-1" });
    mockSoftDeleteForUser.mockResolvedValue(undefined);
  });

  it("allocates an employee ID and creates an employee master record on user create", async () => {
    mockUserRepo.createUser.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      employeeId: "EMP010",
    });

    await service.createUser({
      email: "a@b.com",
      firstName: "A",
      lastName: "B",
    });

    expect(mockAllocateNextEmployeeId).toHaveBeenCalled();
    expect(mockEnsureEmployeeRecord).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ employeeCode: "EMP010", lifecycleState: "ACTIVE" }),
    );
  });

  it("previews the next employee ID without consuming the sequence", async () => {
    mockPreviewNextEmployeeId.mockResolvedValue("EMP011");
    await expect(service.getNextEmployeeId()).resolves.toBe("EMP011");
    expect(mockAllocateNextEmployeeId).not.toHaveBeenCalled();
  });

  it("syncs employee master when user gains an employee ID on update", async () => {
    mockUserRepo.findUserById.mockResolvedValue({
      id: "user-1",
      employeeId: null,
      departmentId: null,
      managerId: null,
    });
    mockUserRepo.updateUser.mockResolvedValue({
      id: "user-1",
      employeeId: "EMP012",
      dateOfJoining: new Date("2024-01-01"),
    });

    await service.updateUser("user-1", { employeeId: "EMP012" });

    expect(mockEnsureEmployeeRecord).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ employeeCode: "EMP012", lifecycleState: "ACTIVE" }),
    );
  });

  it("soft-deletes employee master when user is deleted", async () => {
    mockUserRepo.findUserById.mockResolvedValue({ id: "user-1" });
    mockUserRepo.deleteUser.mockResolvedValue({ id: "user-1" });

    await service.deleteUser("user-1");

    expect(mockSoftDeleteForUser).toHaveBeenCalledWith("user-1");
  });
});
