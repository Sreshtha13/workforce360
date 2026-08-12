import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { env } from "../lib/env";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import { getRefreshTokenExpiresAt } from "../lib/token-expiry";
import {
  buildOtpAuthQr,
  generateBackupCodes,
  generateSecret,
  hashDeviceFingerprint,
  verifyBackupCode,
  verifyToken,
} from "../lib/mfa";
import { recordSecurityEvent } from "../lib/security-monitor";
import { AuthRepository } from "../repositories/auth.repository";
import { mfaRepository } from "../repositories/mfa.repository";

type MfaJwtPayload = {
  userId: string;
  email: string;
  type: "mfa";
};

function signMfaToken(userId: string, email: string): string {
  if (!env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }
  const payload: MfaJwtPayload = { userId, email, type: "mfa" };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
}

function verifyMfaToken(token: string): MfaJwtPayload {
  if (!env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as MfaJwtPayload;
    if (payload.type !== "mfa") throw new Error("Invalid token type");
    return payload;
  } catch {
    throw new AppError("INVALID_MFA_TOKEN", "Invalid or expired MFA token", 401);
  }
}

export class MfaService {
  private readonly repo = mfaRepository;

  async userRequiresMfa(userId: string): Promise<{ required: boolean; enabled: boolean }> {
    const [mfa, roleRequires] = await Promise.all([
      this.repo.findMfaByUserId(userId),
      this.repo.userHasRoleRequiringMfa(userId),
    ]);

    const enabled = Boolean(mfa?.enabled);
    return { required: enabled || roleRequires, enabled };
  }

  async getStatus(userId: string) {
    const mfa = await this.repo.findMfaByUserId(userId);
    const req = await this.userRequiresMfa(userId);
    return {
      enabled: Boolean(mfa?.enabled),
      enforcedByRole: Boolean(mfa?.enforcedByRole) || (req.required && !mfa?.enabled),
      verifiedAt: mfa?.verifiedAt ?? null,
      backupCodesRemaining: mfa?.backupCodes?.length ?? 0,
    };
  }

  async setup(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { email: true },
    });
    if (!user) throw new AppError("USER_NOT_FOUND", "User not found", 404);

    const secret = generateSecret();
    await this.repo.upsertMfaSetup(userId, secret);

    const { otpauthUrl, qrDataUrl } = await buildOtpAuthQr(user.email, secret);
    return { secret, otpauthUrl, qrDataUrl };
  }

  async enable(userId: string, code: string) {
    const mfa = await this.repo.findMfaByUserId(userId);
    if (!mfa) throw new AppError("MFA_NOT_SETUP", "Run MFA setup first", 400);

    const ok = await verifyToken(mfa.secret, code);
    if (!ok) {
      await recordSecurityEvent({
        userId,
        eventType: "MFA_FAILURE",
        severity: "WARN",
        message: "MFA enable verification failed",
      });
      throw new AppError("INVALID_MFA_CODE", "Invalid MFA code", 400);
    }

    const { codes, hashes } = await generateBackupCodes(8);
    const updated = await this.repo.enableMfa(userId, { backupCodes: hashes });

    await writeAuditLog({
      userId,
      action: "enable",
      entity: "user_mfa",
      entityId: updated.id,
    });

    return { enabled: true, backupCodes: codes };
  }

  async disable(userId: string, code: string) {
    const mfa = await this.repo.findMfaByUserId(userId);
    if (!mfa?.enabled) throw new AppError("MFA_NOT_ENABLED", "MFA is not enabled", 400);

    const totpOk = await verifyToken(mfa.secret, code);
    let backupOk = false;
    let remaining = mfa.backupCodes;
    if (!totpOk) {
      const result = await verifyBackupCode(code, mfa.backupCodes);
      backupOk = result.ok;
      remaining = result.remainingHashes;
    }

    if (!totpOk && !backupOk) {
      await recordSecurityEvent({
        userId,
        eventType: "MFA_FAILURE",
        severity: "WARN",
        message: "MFA disable verification failed",
      });
      throw new AppError("INVALID_MFA_CODE", "Invalid MFA code", 400);
    }

    const updated = await this.repo.disableMfa(userId, remaining);

    await writeAuditLog({
      userId,
      action: "disable",
      entity: "user_mfa",
      entityId: updated.id,
    });

    return { enabled: false };
  }

  createChallengeToken(userId: string, email: string): string {
    return signMfaToken(userId, email);
  }

  async setupChallenge(mfaToken: string) {
    const payload = verifyMfaToken(mfaToken);
    const mfa = await this.repo.findMfaByUserId(payload.userId);
    if (mfa?.enabled) {
      throw new AppError("MFA_ALREADY_ENABLED", "MFA is already enabled", 400);
    }

    const roleRequires = await this.repo.userHasRoleRequiringMfa(payload.userId);
    if (!roleRequires && !mfa) {
      throw new AppError(
        "MFA_SETUP_NOT_REQUIRED",
        "MFA setup is not required for this account",
        400,
      );
    }

    return this.setup(payload.userId);
  }

  async enableChallenge(
    mfaToken: string,
    code: string,
    opts?: { ipAddress?: string; userAgent?: string },
  ) {
    const payload = verifyMfaToken(mfaToken);
    const mfa = await this.repo.findMfaByUserId(payload.userId);
    if (mfa?.enabled) {
      throw new AppError("MFA_ALREADY_ENABLED", "MFA is already enabled", 400);
    }

    const enableResult = await this.enable(payload.userId, code);
    const session = await this.issueSessionAfterMfa(payload.userId, opts);
    return { ...enableResult, ...session };
  }

  async verifyChallenge(
    mfaToken: string,
    code: string,
    opts?: { ipAddress?: string; userAgent?: string },
  ) {
    const payload = verifyMfaToken(mfaToken);
    const mfa = await this.repo.findMfaByUserId(payload.userId);
    const roleRequires = await this.repo.userHasRoleRequiringMfa(payload.userId);

    if (!mfa?.enabled && roleRequires) {
      throw new AppError(
        "MFA_SETUP_REQUIRED",
        "MFA is required for your role. Complete MFA setup first.",
        403,
      );
    }

    if (!mfa?.enabled) {
      throw new AppError("MFA_NOT_ENABLED", "MFA is not enabled for this user", 400);
    }

    const totpOk = await verifyToken(mfa.secret, code);
    let remaining = mfa.backupCodes;
    if (!totpOk) {
      const result = await verifyBackupCode(code, mfa.backupCodes);
      if (!result.ok) {
        await recordSecurityEvent({
          userId: payload.userId,
          eventType: "MFA_FAILURE",
          severity: "WARN",
          message: "MFA login verification failed",
          ipAddress: opts?.ipAddress,
          userAgent: opts?.userAgent,
        });
        throw new AppError("INVALID_MFA_CODE", "Invalid MFA code", 401);
      }
      remaining = result.remainingHashes;
      await this.repo.updateBackupCodes(payload.userId, remaining);
    }

    return this.issueSessionAfterMfa(payload.userId, opts);
  }

  private async issueSessionAfterMfa(
    userId: string,
    opts?: { ipAddress?: string; userAgent?: string },
  ) {
    const authRepo = new AuthRepository();
    const user = await authRepo.findUserById(userId);
    if (!user || user.status !== "active") {
      throw new AppError("USER_INACTIVE", "User not found or inactive", 401);
    }

    const accessToken = signAccessToken(user.id, user.email, user.sessionVersion);
    const refreshToken = signRefreshToken(user.id, user.email, user.sessionVersion);
    await authRepo.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiresAt(),
    });
    await authRepo.updateLastLogin(user.id);
    await authRepo.createLoginHistory({
      userId: user.id,
      ipAddress: opts?.ipAddress,
      userAgent: opts?.userAgent,
      status: "success",
      method: "mfa",
    });

    await this.upsertTrustedDevice(userId, opts?.userAgent, opts?.ipAddress);

    const me = await authRepo.getUserWithRolesAndPermissions(user.id);
    const permissions = me
      ? Array.from(
          new Set(
            me.userRoles.flatMap((ur) =>
              ur.role.rolePermissions
                .filter((rp) => rp.permission.isActive)
                .map((rp) => rp.permission.code),
            ),
          ),
        )
      : [];

    return {
      accessToken,
      refreshToken,
      user: me
        ? {
            id: me.id,
            email: me.email,
            firstName: me.firstName,
            lastName: me.lastName,
            roles: me.userRoles.map((ur) => ur.role),
            permissions,
          }
        : {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
    };
  }

  async upsertTrustedDevice(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
    refreshTokenId?: string,
  ) {
    const deviceHash = hashDeviceFingerprint(userAgent ?? "unknown", ipAddress);
    return this.repo.upsertTrustedDevice(userId, {
      deviceHash,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
      label: userAgent?.slice(0, 80) ?? "Unknown device",
      refreshTokenId,
    });
  }

  async listDevices(userId: string) {
    const [devices, refreshTokens] = await Promise.all([
      this.repo.listActiveDevices(userId),
      this.repo.listActiveRefreshTokens(userId),
    ]);

    return { devices, refreshTokens };
  }

  async revokeDevice(userId: string, deviceId: string) {
    const device = await this.repo.findDeviceById(userId, deviceId);
    if (!device) throw new AppError("DEVICE_NOT_FOUND", "Device not found", 404);

    await this.repo.revokeDevice(deviceId);

    if (device.refreshTokenId) {
      await this.repo.revokeRefreshToken(device.refreshTokenId, userId);
    }

    await writeAuditLog({
      userId,
      action: "revoke",
      entity: "trusted_device",
      entityId: deviceId,
    });

    return { id: deviceId, revoked: true };
  }
}

export const mfaService = new MfaService();
