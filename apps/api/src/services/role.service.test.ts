import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoleService } from "./role.service";

const mockRoleRepo = {
  findAllRoles: vi.fn(),
  findRoleById: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  findAllPermissions: vi.fn(),
  findPermissionById: vi.fn(),
  createPermission: vi.fn(),
  updatePermission: vi.fn(),
  deletePermission: vi.fn(),
  assignPermissionToRole: vi.fn(),
  removePermissionFromRole: vi.fn(),
  getRolePermissions: vi.fn(),
};

vi.mock("../repositories/role.repository", () => ({
  RoleRepository: vi.fn(function RoleRepositoryMock() {
    return mockRoleRepo;
  }),
}));

describe("RoleService", () => {
  let service: RoleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RoleService();
  });

  describe("getRoleById", () => {
    it("throws when role not found", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue(null);
      await expect(service.getRoleById("missing")).rejects.toThrow("Role not found");
    });
  });

  describe("updateRole", () => {
    it("throws when role not found", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue(null);
      await expect(service.updateRole("missing", { name: "X" })).rejects.toThrow(
        "Role not found",
      );
    });

    it("prevents updating system roles", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({
        id: "role-1",
        isSystem: true,
      });

      await expect(
        service.updateRole("role-1", { name: "Updated" }),
      ).rejects.toThrow("Cannot update system role");
    });

    it("updates non-system roles", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({
        id: "role-1",
        isSystem: false,
      });
      mockRoleRepo.updateRole.mockResolvedValue({ id: "role-1", name: "Updated" });

      const result = await service.updateRole("role-1", { name: "Updated" });
      expect(result.name).toBe("Updated");
    });
  });

  describe("deleteRole", () => {
    it("prevents deleting system roles", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({
        id: "role-1",
        isSystem: true,
      });

      await expect(service.deleteRole("role-1")).rejects.toThrow(
        "Cannot delete system role",
      );
    });
  });

  describe("getPermissionById", () => {
    it("throws when permission not found", async () => {
      mockRoleRepo.findPermissionById.mockResolvedValue(null);
      await expect(service.getPermissionById("missing")).rejects.toThrow(
        "Permission not found",
      );
    });
  });

  describe("assignPermissionToRole", () => {
    it("throws when role not found", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue(null);
      await expect(
        service.assignPermissionToRole("role-1", "perm-1"),
      ).rejects.toThrow("Role not found");
    });

    it("throws when permission not found", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({ id: "role-1" });
      mockRoleRepo.findPermissionById.mockResolvedValue(null);
      await expect(
        service.assignPermissionToRole("role-1", "perm-1"),
      ).rejects.toThrow("Permission not found");
    });

    it("throws when role already has permission", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({ id: "role-1" });
      mockRoleRepo.findPermissionById.mockResolvedValue({ id: "perm-1" });
      mockRoleRepo.getRolePermissions.mockResolvedValue([
        { permissionId: "perm-1" },
      ]);

      await expect(
        service.assignPermissionToRole("role-1", "perm-1"),
      ).rejects.toThrow("Role already has this permission");
    });

    it("assigns permission when valid", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({ id: "role-1" });
      mockRoleRepo.findPermissionById.mockResolvedValue({ id: "perm-1" });
      mockRoleRepo.getRolePermissions.mockResolvedValue([]);
      mockRoleRepo.assignPermissionToRole.mockResolvedValue({ id: "rp-1" });

      const result = await service.assignPermissionToRole("role-1", "perm-1");
      expect(result.id).toBe("rp-1");
    });
  });
});
