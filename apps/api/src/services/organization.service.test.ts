import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const { mockOrgRepo, mockPrisma, mockAllocateNextDesignationCode, mockPreviewNextDesignationCode } =
  vi.hoisted(() => ({
    mockOrgRepo: {
      findAllDepartments: vi.fn(),
      findDepartmentById: vi.fn(),
      createDepartment: vi.fn(),
      updateDepartment: vi.fn(),
      deleteDepartment: vi.fn(),
      findAllTeams: vi.fn(),
      findTeamById: vi.fn(),
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      findAllDesignations: vi.fn(),
      findDesignationById: vi.fn(),
      createDesignation: vi.fn(),
      updateDesignation: vi.fn(),
      deleteDesignation: vi.fn(),
      findAllOffices: vi.fn(),
      findOfficeById: vi.fn(),
      createOffice: vi.fn(),
      updateOffice: vi.fn(),
      deleteOffice: vi.fn(),
      findAllEmployeeTypes: vi.fn(),
      findEmployeeTypeById: vi.fn(),
      createEmployeeType: vi.fn(),
      updateEmployeeType: vi.fn(),
      deleteEmployeeType: vi.fn(),
      findAllEmploymentStatuses: vi.fn(),
      findEmploymentStatusById: vi.fn(),
      createEmploymentStatus: vi.fn(),
      updateEmploymentStatus: vi.fn(),
      deleteEmploymentStatus: vi.fn(),
    },
    mockAllocateNextDesignationCode: vi.fn(),
    mockPreviewNextDesignationCode: vi.fn(),
    mockPrisma: {
      $transaction: vi.fn(),
      department: { create: vi.fn() },
      user: { updateMany: vi.fn() },
      designation: { create: vi.fn() },
    },
  }));

vi.mock("../repositories/organization.repository", () => ({
  OrganizationRepository: vi.fn(function OrganizationRepositoryMock() {
    return mockOrgRepo;
  }),
}));

vi.mock("./designation-code.service", () => ({
  allocateNextDesignationCode: (...args: unknown[]) =>
    mockAllocateNextDesignationCode(...args),
  previewNextDesignationCode: (...args: unknown[]) =>
    mockPreviewNextDesignationCode(...args),
}));

vi.mock("../lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("./department-manager.service", () => ({
  departmentManagerService: {
    validateManagerUser: vi.fn(),
  },
}));

import { OrganizationService } from "./organization.service";

describe("OrganizationService", () => {
  let service: OrganizationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrganizationService();
  });

  const entityTests = [
    {
      name: "Department",
      getById: () => service.getDepartmentById("id-1"),
      update: () => service.updateDepartment("id-1", { name: "Updated" }),
      delete: () => service.deleteDepartment("id-1"),
      findMock: () => mockOrgRepo.findDepartmentById,
      notFoundMessage: "Department not found",
    },
    {
      name: "Team",
      getById: () => service.getTeamById("id-1"),
      update: () => service.updateTeam("id-1", { name: "Updated" }),
      delete: () => service.deleteTeam("id-1"),
      findMock: () => mockOrgRepo.findTeamById,
      notFoundMessage: "Team not found",
    },
    {
      name: "Designation",
      getById: () => service.getDesignationById("id-1"),
      update: () => service.updateDesignation("id-1", { name: "Updated" }),
      delete: () => service.deleteDesignation("id-1"),
      findMock: () => mockOrgRepo.findDesignationById,
      notFoundMessage: "Designation not found",
    },
    {
      name: "Office",
      getById: () => service.getOfficeById("id-1"),
      update: () => service.updateOffice("id-1", { name: "Updated" }),
      delete: () => service.deleteOffice("id-1"),
      findMock: () => mockOrgRepo.findOfficeById,
      notFoundMessage: "Office not found",
    },
    {
      name: "EmployeeType",
      getById: () => service.getEmployeeTypeById("id-1"),
      update: () => service.updateEmployeeType("id-1", { name: "Updated" }),
      delete: () => service.deleteEmployeeType("id-1"),
      findMock: () => mockOrgRepo.findEmployeeTypeById,
      notFoundMessage: "Employee type not found",
    },
    {
      name: "EmploymentStatus",
      getById: () => service.getEmploymentStatusById("id-1"),
      update: () =>
        service.updateEmploymentStatus("id-1", { name: "Updated" }),
      delete: () => service.deleteEmploymentStatus("id-1"),
      findMock: () => mockOrgRepo.findEmploymentStatusById,
      notFoundMessage: "Employment status not found",
    },
  ];

  describe.each(entityTests)(
    "$name entity guards",
    ({ getById, update, delete: deleteFn, findMock, notFoundMessage }) => {
      it("throws on getById when not found", async () => {
        findMock().mockResolvedValue(null);
        await expect(getById()).rejects.toThrow(notFoundMessage);
      });

      it("throws on update when not found", async () => {
        findMock().mockResolvedValue(null);
        await expect(update()).rejects.toThrow(notFoundMessage);
      });

      it("throws on delete when not found", async () => {
        findMock().mockResolvedValue(null);
        await expect(deleteFn()).rejects.toThrow(notFoundMessage);
      });
    },
  );

  it("passes companyId filter to findAllDepartments", async () => {
    mockOrgRepo.findAllDepartments.mockResolvedValue([]);
    await service.getAllDepartments("company-1");
    expect(mockOrgRepo.findAllDepartments).toHaveBeenCalledWith("company-1");
  });

  describe("createDesignation", () => {
    it("allocates a code when omitted", async () => {
      mockOrgRepo.findDepartmentById.mockResolvedValue({ id: "dept-1", code: "ENG" });
      mockAllocateNextDesignationCode.mockResolvedValue("ENG-001");
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          designation: {
            create: vi.fn().mockResolvedValue({ id: "des-1", code: "ENG-001" }),
          },
        };
        return fn(tx);
      });
      mockOrgRepo.findDesignationById.mockResolvedValue({
        id: "des-1",
        code: "ENG-001",
        name: "Engineer",
      });

      const result = await service.createDesignation({
        departmentId: "dept-1",
        name: "Engineer",
        level: 2,
      });

      expect(mockAllocateNextDesignationCode).toHaveBeenCalled();
      expect(result.code).toBe("ENG-001");
    });

    it("normalizes provided code and skips allocation", async () => {
      mockOrgRepo.findDepartmentById.mockResolvedValue({ id: "dept-1", code: "ENG" });
      const create = vi.fn().mockResolvedValue({ id: "des-2", code: "ENG-LEAD" });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ designation: { create } }),
      );
      mockOrgRepo.findDesignationById.mockResolvedValue({
        id: "des-2",
        code: "ENG-LEAD",
      });

      await service.createDesignation({
        departmentId: "dept-1",
        name: "Lead",
        code: "eng-lead",
        level: 3,
      });

      expect(mockAllocateNextDesignationCode).not.toHaveBeenCalled();
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: "ENG-LEAD" }),
        }),
      );
    });

    it("maps duplicate code to department-scoped message", async () => {
      mockOrgRepo.findDepartmentById.mockResolvedValue({ id: "dept-1", code: "ENG" });
      mockPrisma.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "6.0.0",
          meta: { target: ["department_id", "code"] },
        }),
      );

      await expect(
        service.createDesignation({
          departmentId: "dept-1",
          name: "Engineer",
          code: "ENG-001",
          level: 2,
        }),
      ).rejects.toThrow("A designation with this code already exists in this department");
    });

    it("previews next designation code", async () => {
      mockOrgRepo.findDepartmentById.mockResolvedValue({ id: "dept-1" });
      mockPreviewNextDesignationCode.mockResolvedValue("ENG-003");

      const result = await service.previewNextDesignationCode("dept-1");
      expect(result).toEqual({ code: "ENG-003" });
      expect(mockPreviewNextDesignationCode).toHaveBeenCalledWith("dept-1");
    });
  });
});
