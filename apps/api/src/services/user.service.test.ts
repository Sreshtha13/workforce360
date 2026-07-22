import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "./user.service";

const mockUserRepo = {
  findAllUsers: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  assignRole: vi.fn(),
  removeRole: vi.fn(),
  getUserRoles: vi.fn(),
};

vi.mock("../repositories/user.repository", () => ({
  UserRepository: vi.fn(function UserRepositoryMock() {
    return mockUserRepo;
  }),
}));

describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
  });

  describe("getUserById", () => {
    it("throws when user not found", async () => {
      mockUserRepo.findUserById.mockResolvedValue(null);
      await expect(service.getUserById("missing")).rejects.toThrow("User not found");
    });
  });

  describe("createUser", () => {
    it("creates user without password", async () => {
      mockUserRepo.createUser.mockResolvedValue({ id: "user-1", email: "a@b.com" });

      const result = await service.createUser({
        email: "a@b.com",
        firstName: "A",
        lastName: "B",
      });

      expect(result.id).toBe("user-1");
      expect(mockUserRepo.createUser).toHaveBeenCalledWith(
        expect.not.objectContaining({ passwordHash: expect.anything() }),
      );
    });

    it("hashes password when provided", async () => {
      mockUserRepo.createUser.mockResolvedValue({ id: "user-1" });

      await service.createUser({
        email: "a@b.com",
        firstName: "A",
        lastName: "B",
        password: "SecurePass1",
      });

      expect(mockUserRepo.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: expect.any(String) }),
      );
    });
  });

  describe("updateUser", () => {
    it("throws when user not found", async () => {
      mockUserRepo.findUserById.mockResolvedValue(null);
      await expect(
        service.updateUser("missing", { firstName: "X" }),
      ).rejects.toThrow("User not found");
    });

    it("hashes new password when provided", async () => {
      mockUserRepo.findUserById.mockResolvedValue({ id: "user-1" });
      mockUserRepo.updateUser.mockResolvedValue({ id: "user-1" });

      await service.updateUser("user-1", { password: "NewPass123" });

      expect(mockUserRepo.updateUser).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ passwordHash: expect.any(String) }),
      );
    });
  });

  describe("deleteUser", () => {
    it("throws when user not found", async () => {
      mockUserRepo.findUserById.mockResolvedValue(null);
      await expect(service.deleteUser("missing")).rejects.toThrow("User not found");
    });
  });

  describe("assignRole", () => {
    it("throws when user not found", async () => {
      mockUserRepo.findUserById.mockResolvedValue(null);
      await expect(service.assignRole("user-1", "role-1")).rejects.toThrow(
        "User not found",
      );
    });

    it("throws when user already has role", async () => {
      mockUserRepo.findUserById.mockResolvedValue({ id: "user-1" });
      mockUserRepo.getUserRoles.mockResolvedValue([{ roleId: "role-1" }]);

      await expect(service.assignRole("user-1", "role-1")).rejects.toThrow(
        "User already has this role",
      );
    });

    it("assigns role when valid", async () => {
      mockUserRepo.findUserById.mockResolvedValue({ id: "user-1" });
      mockUserRepo.getUserRoles.mockResolvedValue([]);
      mockUserRepo.assignRole.mockResolvedValue({ id: "ur-1" });

      const result = await service.assignRole("user-1", "role-1", "admin-1");
      expect(result.id).toBe("ur-1");
    });
  });

  describe("removeRole", () => {
    it("throws when user not found", async () => {
      mockUserRepo.findUserById.mockResolvedValue(null);
      await expect(service.removeRole("user-1", "role-1")).rejects.toThrow(
        "User not found",
      );
    });
  });
});
