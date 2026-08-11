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
  setRolePermissions: vi.fn(),
};

vi.mock("../repositories/role.repository", () => ({
  RoleRepository: vi.fn(function RoleRepositoryMock() {
    return mockRoleRepo;
  }),
}));

const mockUserIsSuperAdmin = vi.fn();
vi.mock("../lib/super-admin", () => ({
  userIsSuperAdmin: (...args: unknown[]) => mockUserIsSuperAdmin(...args),
}));

vi.mock("../lib/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe("RoleService", () => {
  let service: RoleService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserIsSuperAdmin.mockResolvedValue(false);
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

      await expect(service.updateRole("role-1", { name: "Updated" })).rejects.toThrow(
        /System roles cannot be renamed/,
      );
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
        "System roles cannot be deleted.",
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
      await expect(service.assignPermissionToRole("role-1", "perm-1")).rejects.toThrow(
        "Role not found",
      );
    });

    it("throws when permission not found", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({ id: "role-1", isSystem: false });
      mockRoleRepo.findPermissionById.mockResolvedValue(null);
      await expect(service.assignPermissionToRole("role-1", "perm-1")).rejects.toThrow(
        "Permission not found",
      );
    });

    it("throws when role already has permission", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({ id: "role-1", isSystem: false });
      mockRoleRepo.findPermissionById.mockResolvedValue({ id: "perm-1" });
      mockRoleRepo.getRolePermissions.mockResolvedValue([{ permissionId: "perm-1" }]);

      await expect(service.assignPermissionToRole("role-1", "perm-1")).rejects.toThrow(
        "Role already has this permission",
      );
    });

    it("assigns permission when valid", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({ id: "role-1", isSystem: false });
      mockRoleRepo.findPermissionById.mockResolvedValue({ id: "perm-1" });
      mockRoleRepo.getRolePermissions.mockResolvedValue([]);
      mockRoleRepo.assignPermissionToRole.mockResolvedValue({ id: "rp-1" });

      const result = await service.assignPermissionToRole("role-1", "perm-1");
      expect(result.id).toBe("rp-1");
    });

    it("blocks non–Super Admin from assigning to system roles", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({
        id: "role-1",
        name: "Administrator",
        isSystem: true,
      });
      mockUserIsSuperAdmin.mockResolvedValue(false);

      await expect(
        service.assignPermissionToRole("role-1", "perm-1", "user-1"),
      ).rejects.toThrow(/Only Super Administrators can edit permissions/);
    });
  });

  describe("setRolePermissions", () => {
    it("allows custom role permission edits without Super Admin", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({
        id: "role-1",
        name: "Custom",
        isSystem: false,
      });
      mockRoleRepo.findAllPermissions.mockResolvedValue([{ id: "perm-1" }, { id: "perm-2" }]);
      mockRoleRepo.getRolePermissions
        .mockResolvedValueOnce([{ permissionId: "perm-1" }])
        .mockResolvedValueOnce([{ permissionId: "perm-1" }, { permissionId: "perm-2" }]);
      mockRoleRepo.setRolePermissions.mockResolvedValue(undefined);

      const result = await service.setRolePermissions("role-1", ["perm-1", "perm-2"], "user-1");
      expect(mockRoleRepo.setRolePermissions).toHaveBeenCalledWith("role-1", [
        "perm-1",
        "perm-2",
      ]);
      expect(result).toHaveLength(2);
    });

    it("blocks non–Super Admin from editing system role permissions", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({
        id: "role-sys",
        name: "HR Team",
        isSystem: true,
      });
      mockUserIsSuperAdmin.mockResolvedValue(false);

      await expect(
        service.setRolePermissions("role-sys", ["perm-1"], "user-1"),
      ).rejects.toThrow(/Only Super Administrators can edit permissions/);
      expect(mockRoleRepo.setRolePermissions).not.toHaveBeenCalled();
    });

    it("allows Super Admin to edit system role permissions", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({
        id: "role-sys",
        name: "HR Team",
        isSystem: true,
      });
      mockUserIsSuperAdmin.mockResolvedValue(true);
      mockRoleRepo.findAllPermissions.mockResolvedValue([{ id: "perm-1" }]);
      mockRoleRepo.getRolePermissions
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ permissionId: "perm-1" }]);
      mockRoleRepo.setRolePermissions.mockResolvedValue(undefined);

      const result = await service.setRolePermissions("role-sys", ["perm-1"], "super-1");
      expect(mockUserIsSuperAdmin).toHaveBeenCalledWith("super-1");
      expect(mockRoleRepo.setRolePermissions).toHaveBeenCalledWith("role-sys", ["perm-1"]);
      expect(result).toEqual([{ permissionId: "perm-1" }]);
    });

    it("requires at least one permission", async () => {
      mockRoleRepo.findRoleById.mockResolvedValue({
        id: "role-1",
        name: "Custom",
        isSystem: false,
      });

      await expect(service.setRolePermissions("role-1", [], "user-1")).rejects.toThrow(
        /At least one permission/,
      );
    });
  });
});
