import { prisma } from "../lib/prisma";
import { hashRefreshToken } from "../lib/refresh-token-hash";
import type { User, RefreshToken, LoginHistory, PasswordReset } from "@prisma/client";

export type CreateUserData = {
  email: string;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  googleId?: string | null;
  emailVerified?: boolean;
};

export type CreateRefreshTokenData = {
  userId: string;
  token: string;
  expiresAt: Date;
};

export type CreateLoginHistoryData = {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  method: string;
};

export type CreatePasswordResetData = {
  userId: string;
  token: string;
  expiresAt: Date;
};

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }
  
  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
  }
  
  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { googleId, deletedAt: null },
    });
  }
  
  async createUser(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data,
    });
  }
  
  async updateLastLogin(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
  
  async updatePassword(userId: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async incrementSessionVersion(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    });
  }
  
  async createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        token: hashRefreshToken(data.token),
        expiresAt: data.expiresAt,
      },
    });
  }
  
  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token: hashRefreshToken(token) },
    });
  }
  
  async revokeRefreshToken(token: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { token: hashRefreshToken(token) },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }
  
  async revokeAllUserRefreshTokens(userId: string): Promise<{ count: number }> {
    return prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  async rotateRefreshToken(
    oldToken: string,
    newToken: string,
    userId: string,
    expiresAt: Date,
  ): Promise<void> {
    const oldTokenHash = hashRefreshToken(oldToken);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { token: oldTokenHash },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      }),
      prisma.refreshToken.create({
        data: {
          userId,
          token: hashRefreshToken(newToken),
          expiresAt,
        },
      }),
    ]);
  }
  
  async createLoginHistory(data: CreateLoginHistoryData): Promise<LoginHistory> {
    return prisma.loginHistory.create({
      data,
    });
  }
  
  async createPasswordReset(data: CreatePasswordResetData): Promise<PasswordReset> {
    return prisma.passwordReset.create({
      data,
    });
  }
  
  async findPasswordReset(token: string): Promise<PasswordReset | null> {
    return prisma.passwordReset.findUnique({
      where: { token },
    });
  }
  
  async markPasswordResetAsUsed(token: string): Promise<PasswordReset> {
    return prisma.passwordReset.update({
      where: { token },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });
  }
  
  async getUserWithRolesAndPermissions(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        department: true,
        designation: true,
        office: true,
        employeeType: true,
        employmentStatus: true,
        userRoles: {
          where: { deletedAt: null },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
