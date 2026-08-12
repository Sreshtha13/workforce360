import type { TrustedDevice, UserMfa } from "@prisma/client";
import { prisma } from "../lib/prisma";

export class MfaRepository {
  async findMfaByUserId(userId: string): Promise<UserMfa | null> {
    return prisma.userMfa.findUnique({ where: { userId } });
  }

  async upsertMfaSetup(userId: string, secret: string): Promise<UserMfa> {
    return prisma.userMfa.upsert({
      where: { userId },
      create: { userId, secret, enabled: false },
      update: { secret, enabled: false, verifiedAt: null },
    });
  }

  async enableMfa(
    userId: string,
    data: { backupCodes: string[] },
  ): Promise<UserMfa> {
    return prisma.userMfa.update({
      where: { userId },
      data: {
        enabled: true,
        verifiedAt: new Date(),
        backupCodes: data.backupCodes,
      },
    });
  }

  async disableMfa(
    userId: string,
    backupCodes: string[],
  ): Promise<UserMfa> {
    return prisma.userMfa.update({
      where: { userId },
      data: {
        enabled: false,
        backupCodes,
        verifiedAt: null,
      },
    });
  }

  async updateBackupCodes(userId: string, backupCodes: string[]): Promise<UserMfa> {
    return prisma.userMfa.update({
      where: { userId },
      data: { backupCodes },
    });
  }

  async userHasRoleRequiringMfa(userId: string): Promise<boolean> {
    const roles = await prisma.userRole.findMany({
      where: { userId, deletedAt: null },
      include: { role: { select: { requiresMfa: true } } },
    });
    return roles.some((userRole) => userRole.role.requiresMfa);
  }

  async upsertTrustedDevice(
    userId: string,
    data: {
      deviceHash: string;
      userAgent: string | null;
      ipAddress: string | null;
      label: string;
      refreshTokenId?: string | null;
    },
  ): Promise<TrustedDevice> {
    return prisma.trustedDevice.upsert({
      where: { userId_deviceHash: { userId, deviceHash: data.deviceHash } },
      create: {
        userId,
        deviceHash: data.deviceHash,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        label: data.label,
        lastSeenAt: new Date(),
        refreshTokenId: data.refreshTokenId ?? null,
      },
      update: {
        lastSeenAt: new Date(),
        userAgent: data.userAgent ?? undefined,
        ipAddress: data.ipAddress ?? undefined,
        revokedAt: null,
        refreshTokenId: data.refreshTokenId ?? undefined,
      },
    });
  }

  async listActiveDevices(userId: string): Promise<TrustedDevice[]> {
    return prisma.trustedDevice.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: "desc" },
    });
  }

  async findDeviceById(userId: string, deviceId: string): Promise<TrustedDevice | null> {
    return prisma.trustedDevice.findFirst({
      where: { id: deviceId, userId },
    });
  }

  async revokeDevice(deviceId: string): Promise<TrustedDevice> {
    return prisma.trustedDevice.update({
      where: { id: deviceId },
      data: { revokedAt: new Date() },
    });
  }

  async listActiveRefreshTokens(userId: string) {
    return prisma.refreshToken.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  async revokeRefreshToken(refreshTokenId: string, userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { id: refreshTokenId, userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }
}

export const mfaRepository = new MfaRepository();
