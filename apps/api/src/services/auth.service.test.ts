import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuthRepo } = vi.hoisted(() => ({
  mockAuthRepo: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    findUserByGoogleId: vi.fn(),
    createUser: vi.fn(),
    updateLastLogin: vi.fn(),
    linkGoogleId: vi.fn(),
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
    incrementSessionVersion: vi.fn(),
    rotateRefreshToken: vi.fn(),
  },
}));

vi.mock("../repositories/auth.repository", () => ({
  AuthRepository: vi.fn(function AuthRepositoryMock() {
    return mockAuthRepo;
  }),
}));

vi.mock("../lib/google-oauth", () => ({
  verifyGoogleToken: vi.fn(),
}));

vi.mock("./mfa.service", () => ({
  mfaService: {
    userRequiresMfa: vi.fn(async () => ({ required: false, enabled: false })),
    upsertTrustedDevice: vi.fn(async () => ({})),
    createChallengeToken: vi.fn(() => "mfa-challenge-token"),
  },
}));

vi.mock("../lib/security-monitor", () => ({
  recordFailedLogin: vi.fn(async () => undefined),
}));

vi.mock("../lib/email", () => ({
  sendEmail: vi.fn(async () => ({ sent: false, mode: "console" })),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    notificationTemplate: {
      findFirst: vi.fn(async () => null),
    },
  },
}));

import { AuthService } from "./auth.service";
import { verifyGoogleToken } from "../lib/google-oauth";
import { hashPassword } from "../lib/password";
import { signRefreshToken } from "../lib/jwt";
import { mfaService } from "./mfa.service";

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

      expect(mockAuthRepo.createLoginHistory).not.toHaveBeenCalled();
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
        sessionVersion: 0,
      });

      const result = await service.login(
        "user@example.com",
        "SecurePass1",
        "127.0.0.1",
        "test-agent",
      );

      expect(result.user.email).toBe("user@example.com");
      expect(result.mfaRequired).toBe(false);
      if (result.mfaRequired) throw new Error("expected full session");
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(mockAuthRepo.updateLastLogin).toHaveBeenCalledWith("user-1");
      expect(mockAuthRepo.createRefreshToken).toHaveBeenCalled();
      expect(mockAuthRepo.createLoginHistory).toHaveBeenCalledWith(
        expect.objectContaining({ status: "success" }),
      );
      expect(mfaService.upsertTrustedDevice).toHaveBeenCalled();
    });

    it("returns mfa challenge when MFA is required", async () => {
      vi.mocked(mfaService.userRequiresMfa).mockResolvedValueOnce({
        required: true,
        enabled: true,
      });
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
        firstName: "Jane",
        lastName: "Doe",
        passwordHash: await hashPassword("SecurePass1"),
        status: "active",
        sessionVersion: 0,
      });

      const result = await service.login("user@example.com", "SecurePass1");
      expect(result.mfaRequired).toBe(true);
      if (!result.mfaRequired) throw new Error("expected mfa");
      expect(result.mfaToken).toBe("mfa-challenge-token");
      expect(mockAuthRepo.createRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe("googleLogin", () => {
    it("throws when Google verification fails", async () => {
      vi.mocked(verifyGoogleToken).mockResolvedValue(null);

      await expect(service.googleLogin("bad-code")).rejects.toThrow(
        "Google authentication failed",
      );
    });

    it("links googleId when user exists by email", async () => {
      vi.mocked(verifyGoogleToken).mockResolvedValue({
        id: "google-2",
        email: "existing@workforce360.com",
        verified_email: true,
        name: "Existing User",
        given_name: "Existing",
        family_name: "User",
      });
      mockAuthRepo.findUserByGoogleId.mockResolvedValue(null);
      mockAuthRepo.findUserByEmail.mockResolvedValue({
        id: "user-existing",
        email: "existing@workforce360.com",
        firstName: "Existing",
        lastName: "User",
        status: "active",
        sessionVersion: 0,
        googleId: null,
      });
      mockAuthRepo.linkGoogleId.mockResolvedValue({
        id: "user-existing",
        email: "existing@workforce360.com",
        firstName: "Existing",
        lastName: "User",
        status: "active",
        sessionVersion: 0,
        googleId: "google-2",
      });

      const result = await service.googleLogin("auth-code");

      expect(mockAuthRepo.linkGoogleId).toHaveBeenCalledWith("user-existing", "google-2");
      if (result.mfaRequired) throw new Error("expected full session");
      expect(result.accessToken).toBeTruthy();
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
        sessionVersion: 0,
      });

      const result = await service.googleLogin("auth-code");

      expect(mockAuthRepo.createUser).toHaveBeenCalled();
      if (result.mfaRequired) throw new Error("expected full session");
      expect(result.accessToken).toBeTruthy();
    });
  });

  describe("refreshSession", () => {
    it("throws for revoked or expired refresh token record", async () => {
      mockAuthRepo.findRefreshToken.mockResolvedValue(null);

      await expect(service.refreshSession("token")).rejects.toThrow(
        "Invalid or expired refresh token",
      );
    });

    it("returns new access token for valid refresh token", async () => {
      const refreshToken = signRefreshToken("user-1", "user@example.com", 0);
      mockAuthRepo.findRefreshToken.mockResolvedValue({
        token: refreshToken,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockAuthRepo.findUserById.mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
        status: "active",
        sessionVersion: 0,
      });

      const result = await service.refreshSession(refreshToken);

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
