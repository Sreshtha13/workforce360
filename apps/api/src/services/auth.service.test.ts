import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service";

const mockAuthRepo = {
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  findUserByGoogleId: vi.fn(),
  createUser: vi.fn(),
  updateLastLogin: vi.fn(),
  updatePassword: vi.fn(),
  createRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllUserRefreshTokens: vi.fn(),
  createLoginHistory: vi.fn(),
  createPasswordReset: vi.fn(),
  findPasswordReset: vi.fn(),
  markPasswordResetAsUsed: vi.fn(),
  getUserWithRolesAndPermissions: vi.fn(),
};

vi.mock("../repositories/auth.repository", () => ({
  AuthRepository: vi.fn(function AuthRepositoryMock() {
    return mockAuthRepo;
  }),
}));

vi.mock("../lib/google-oauth", () => ({
  verifyGoogleToken: vi.fn(),
}));

import { verifyGoogleToken } from "../lib/google-oauth";
import { hashPassword } from "../lib/password";
import { signRefreshToken } from "../lib/jwt";

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
  });

  describe("login", () => {
    it("throws for unknown email", async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.login("unknown@example.com", "password"),
      ).rejects.toThrow("Invalid email or password");

      expect(mockAuthRepo.createLoginHistory).toHaveBeenCalledWith(
        expect.objectContaining({ status: "failed", method: "email_password" }),
      );
    });

    it("throws for user without password hash", async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
        passwordHash: null,
        status: "active",
      });

      await expect(
        service.login("user@example.com", "password"),
      ).rejects.toThrow("Invalid email or password");
    });

    it("throws for inactive account", async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
        passwordHash: await hashPassword("SecurePass1"),
        status: "inactive",
      });

      await expect(
        service.login("user@example.com", "SecurePass1"),
      ).rejects.toThrow("Account is inactive");
    });

    it("throws for wrong password", async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
        passwordHash: await hashPassword("SecurePass1"),
        status: "active",
      });

      await expect(
        service.login("user@example.com", "WrongPass1"),
      ).rejects.toThrow("Invalid email or password");
    });

    it("returns tokens and user on successful login", async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
        firstName: "Jane",
        lastName: "Doe",
        passwordHash: await hashPassword("SecurePass1"),
        status: "active",
      });

      const result = await service.login(
        "user@example.com",
        "SecurePass1",
        "127.0.0.1",
        "test-agent",
      );

      expect(result.user.email).toBe("user@example.com");
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(mockAuthRepo.updateLastLogin).toHaveBeenCalledWith("user-1");
      expect(mockAuthRepo.createRefreshToken).toHaveBeenCalled();
      expect(mockAuthRepo.createLoginHistory).toHaveBeenCalledWith(
        expect.objectContaining({ status: "success" }),
      );
    });
  });

  describe("googleLogin", () => {
    it("throws when Google verification fails", async () => {
      vi.mocked(verifyGoogleToken).mockResolvedValue(null);

      await expect(service.googleLogin("bad-code")).rejects.toThrow(
        "Google authentication failed",
      );
    });

    it("creates new user when not found by googleId or email", async () => {
      vi.mocked(verifyGoogleToken).mockResolvedValue({
        id: "google-1",
        email: "new@gmail.com",
        verified_email: true,
        name: "New User",
        given_name: "New",
        family_name: "User",
      });
      mockAuthRepo.findUserByGoogleId.mockResolvedValue(null);
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthRepo.createUser.mockResolvedValue({
        id: "user-new",
        email: "new@gmail.com",
        firstName: "New",
        lastName: "User",
        status: "active",
      });

      const result = await service.googleLogin("auth-code");

      expect(mockAuthRepo.createUser).toHaveBeenCalled();
      expect(result.accessToken).toBeTruthy();
    });
  });

  describe("refreshAccessToken", () => {
    it("throws for revoked or expired refresh token record", async () => {
      mockAuthRepo.findRefreshToken.mockResolvedValue(null);

      await expect(service.refreshAccessToken("token")).rejects.toThrow(
        "Invalid or expired refresh token",
      );
    });

    it("returns new access token for valid refresh token", async () => {
      const refreshToken = signRefreshToken("user-1", "user@example.com");
      mockAuthRepo.findRefreshToken.mockResolvedValue({
        token: refreshToken,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockAuthRepo.findUserById.mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
        status: "active",
      });

      const result = await service.refreshAccessToken(refreshToken);

      expect(result.accessToken).toBeTruthy();
    });
  });

  describe("logout", () => {
    it("revokes refresh token without throwing on error", async () => {
      mockAuthRepo.revokeRefreshToken.mockRejectedValue(new Error("Not found"));

      await expect(service.logout("token")).resolves.toBeUndefined();
    });
  });

  describe("requestPasswordReset", () => {
    it("silently returns when user not found", async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);

      const result = await service.requestPasswordReset("unknown@example.com");

      expect(result).toBeUndefined();
      expect(mockAuthRepo.createPasswordReset).not.toHaveBeenCalled();
    });

    it("creates reset token for existing user", async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue({ id: "user-1" });

      const result = await service.requestPasswordReset("user@example.com");

      expect(result?.token).toBeTruthy();
      expect(mockAuthRepo.createPasswordReset).toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("throws for invalid reset token", async () => {
      mockAuthRepo.findPasswordReset.mockResolvedValue(null);

      await expect(
        service.resetPassword("bad-token", "SecurePass1"),
      ).rejects.toThrow("Invalid or expired reset token");
    });

    it("throws when password fails policy validation", async () => {
      mockAuthRepo.findPasswordReset.mockResolvedValue({
        userId: "user-1",
        isUsed: false,
        expiresAt: new Date(Date.now() + 3600000),
      });

      await expect(
        service.resetPassword("valid-token", "weak"),
      ).rejects.toThrow(/Password must be at least/);
    });

    it("updates password and revokes sessions on success", async () => {
      mockAuthRepo.findPasswordReset.mockResolvedValue({
        userId: "user-1",
        isUsed: false,
        expiresAt: new Date(Date.now() + 3600000),
      });

      await service.resetPassword("valid-token", "SecurePass1");

      expect(mockAuthRepo.updatePassword).toHaveBeenCalled();
      expect(mockAuthRepo.markPasswordResetAsUsed).toHaveBeenCalledWith(
        "valid-token",
      );
      expect(mockAuthRepo.revokeAllUserRefreshTokens).toHaveBeenCalledWith(
        "user-1",
      );
    });
  });

  describe("getMe", () => {
    it("throws when user not found", async () => {
      mockAuthRepo.getUserWithRolesAndPermissions.mockResolvedValue(null);

      await expect(service.getMe("missing")).rejects.toThrow("User not found");
    });

    it("returns user with deduplicated active permissions", async () => {
      mockAuthRepo.getUserWithRolesAndPermissions.mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
        firstName: "Jane",
        lastName: "Doe",
        phone: null,
        avatar: null,
        status: "active",
        employeeId: null,
        department: null,
        designation: null,
        office: null,
        employeeType: null,
        employmentStatus: null,
        userRoles: [
          {
            role: {
              rolePermissions: [
                { permission: { code: "user.read", isActive: true } },
                { permission: { code: "user.read", isActive: true } },
                { permission: { code: "user.delete", isActive: false } },
              ],
            },
          },
        ],
      });

      const result = await service.getMe("user-1");

      expect(result.permissions).toEqual(["user.read"]);
    });
  });
});
