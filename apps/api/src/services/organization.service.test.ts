import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrganizationService } from "./organization.service";

const mockOrgRepo = {
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
};

vi.mock("../repositories/organization.repository", () => ({
  OrganizationRepository: vi.fn(function OrganizationRepositoryMock() {
    return mockOrgRepo;
  }),
}));

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

  it("creates department via repository", async () => {
    mockOrgRepo.createDepartment.mockResolvedValue({ id: "dept-1" });
    const result = await service.createDepartment({
      companyId: "company-1",
      name: "Engineering",
    });
    expect(result.id).toBe("dept-1");
  });
});
