import crypto from "crypto";
import { AuthRepository } from "../repositories/auth.repository";
import { hashPassword, verifyPassword, validatePasswordPolicy } from "../lib/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { getRefreshTokenExpiresAt } from "../lib/token-expiry";
import { verifyGoogleToken } from "../lib/google-oauth";
import { recordFailedLogin } from "../lib/security-monitor";
import { sendEmail } from "../lib/email";
import { prisma } from "../lib/prisma";
import { renderTemplate } from "../lib/template-render";
import { env } from "../lib/env";
import { mfaService } from "./mfa.service";

export class AuthService {
  private authRepo: AuthRepository;
  
  constructor() {
    this.authRepo = new AuthRepository();
  }

  private async issueSession(user: { id: string; email: string; sessionVersion: number }) {
    const accessToken = signAccessToken(user.id, user.email, user.sessionVersion);
    const refreshToken = signRefreshToken(user.id, user.email, user.sessionVersion);
    const expiresAt = getRefreshTokenExpiresAt();

    await this.authRepo.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  /** Revoke all refresh tokens and invalidate outstanding access tokens. */
  async invalidateUserSessions(userId: string): Promise<void> {
    await this.authRepo.revokeAllUserRefreshTokens(userId);
    await this.authRepo.incrementSessionVersion(userId);
  }
  
  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.authRepo.findUserByEmail(email);
    
    if (!user || !user.passwordHash) {
      if (user?.id) {
        await this.authRepo.createLoginHistory({
          userId: user.id,
          ipAddress,
          userAgent,
          status: "failed",
          method: "email_password",
        });
      }
      await recordFailedLogin({
        email,
        userId: user?.id,
        ipAddress,
        userAgent,
      });
      throw new Error("Invalid email or password");
    }
    
    if (user.status !== "active") {
      await this.authRepo.createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        status: "failed",
        method: "email_password",
      });
      await recordFailedLogin({
        email,
        userId: user.id,
        ipAddress,
        userAgent,
      });
      throw new Error("Account is inactive");
    }
    
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      await this.authRepo.createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        status: "failed",
        method: "email_password",
      });
      await recordFailedLogin({
        email,
        userId: user.id,
        ipAddress,
        userAgent,
      });
      throw new Error("Invalid email or password");
    }

    const mfa = await mfaService.userRequiresMfa(user.id);
    if (mfa.required) {
      await this.authRepo.createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        status: "mfa_pending",
        method: "email_password",
      });
      return {
        mfaRequired: true as const,
        mfaSetupRequired: !mfa.enabled,
        mfaToken: mfaService.createChallengeToken(user.id, user.email),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    }

    await this.authRepo.updateLastLogin(user.id);
    await this.authRepo.createLoginHistory({
      userId: user.id,
      ipAddress,
      userAgent,
      status: "success",
      method: "email_password",
    });

    const tokens = await this.issueSession(user);
    await mfaService.upsertTrustedDevice(user.id, userAgent, ipAddress);
    
    return {
      mfaRequired: false as const,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }
  
  async googleLogin(
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const googleUser = await verifyGoogleToken(code);
    
    if (!googleUser || !googleUser.verified_email) {
      throw new Error("Google authentication failed");
    }
    
    let user = await this.authRepo.findUserByGoogleId(googleUser.id);
    
    if (!user) {
      user = await this.authRepo.findUserByEmail(googleUser.email);
      
      if (!user) {
        user = await this.authRepo.createUser({
          email: googleUser.email,
          passwordHash: null,
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          googleId: googleUser.id,
          emailVerified: true,
        });
      }
    }
    
    if (user.status !== "active") {
      await this.authRepo.createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        status: "failed",
        method: "google_oauth",
      });
      throw new Error("Account is inactive");
    }
    
    const mfa = await mfaService.userRequiresMfa(user.id);
    if (mfa.required) {
      await this.authRepo.createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        status: "mfa_pending",
        method: "google_oauth",
      });
      return {
        mfaRequired: true as const,
        mfaSetupRequired: !mfa.enabled,
        mfaToken: mfaService.createChallengeToken(user.id, user.email),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    }

    await this.authRepo.updateLastLogin(user.id);
    await this.authRepo.createLoginHistory({
      userId: user.id,
      ipAddress,
      userAgent,
      status: "success",
      method: "google_oauth",
    });

    const tokens = await this.issueSession(user);
    await mfaService.upsertTrustedDevice(user.id, userAgent, ipAddress);
    
    return {
      mfaRequired: false as const,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }
  
  async refreshSession(refreshToken: string) {
    const tokenRecord = await this.authRepo.findRefreshToken(refreshToken);

    if (!tokenRecord) {
      throw new Error("Invalid or expired refresh token");
    }

    if (tokenRecord.isRevoked) {
      await this.invalidateUserSessions(tokenRecord.userId);
      throw new Error("Invalid or expired refresh token");
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new Error("Invalid or expired refresh token");
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await this.authRepo.findUserById(payload.userId);

    if (!user || user.status !== "active") {
      throw new Error("Invalid user or account inactive");
    }

    if ((payload.sessionVersion ?? 0) !== user.sessionVersion) {
      throw new Error("Invalid or expired refresh token");
    }

    const newAccessToken = signAccessToken(user.id, user.email, user.sessionVersion);
    const newRefreshToken = signRefreshToken(user.id, user.email, user.sessionVersion);
    const expiresAt = getRefreshTokenExpiresAt();

    await this.authRepo.rotateRefreshToken(
      refreshToken,
      newRefreshToken,
      user.id,
      expiresAt,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
  
  async logout(refreshToken: string) {
    try {
      await this.authRepo.revokeRefreshToken(refreshToken);
    } catch {
      // Idempotent logout — cookie may already be cleared or token rotated.
    }
  }
  
  async requestPasswordReset(email: string) {
    const user = await this.authRepo.findUserByEmail(email);
    
    if (!user) {
      return;
    }
    
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    await this.authRepo.createPasswordReset({
      userId: user.id,
      token,
      expiresAt,
    });

    const resetLink = `${env.APP_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    const vars = {
      firstName: user.firstName,
      resetLink,
      email: user.email,
    };

    let subject = "Reset your Workforce 360 password";
    let body = `Hello ${user.firstName},\n\nUse this link to reset your password (expires in 1 hour):\n${resetLink}`;

    const template = await prisma.notificationTemplate.findFirst({
      where: { code: "password_reset", deletedAt: null, isActive: true },
    });
    if (template) {
      subject = renderTemplate(template.subject ?? subject, vars);
      body = renderTemplate(template.body, vars);
    }

    await sendEmail({
      to: user.email,
      subject,
      text: body,
      html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
    });
    
    return { token };
  }
  
  async resetPassword(token: string, newPassword: string) {
    const passwordReset = await this.authRepo.findPasswordReset(token);
    
    if (!passwordReset || passwordReset.isUsed || passwordReset.expiresAt < new Date()) {
      throw new Error("Invalid or expired reset token");
    }
    
    const validation = validatePasswordPolicy(newPassword);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }
    
    const passwordHash = await hashPassword(newPassword);
    
    await this.authRepo.updatePassword(passwordReset.userId, passwordHash);
    await this.authRepo.markPasswordResetAsUsed(token);
    await this.invalidateUserSessions(passwordReset.userId);
  }
  
  async getMe(userId: string) {
    const user = await this.authRepo.getUserWithRolesAndPermissions(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions
        .filter((rp) => rp.permission.isActive)
        .map((rp) => rp.permission.code),
    );
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      employeeId: user.employeeId,
      department: user.department,
      designation: user.designation,
      office: user.office,
      employeeType: user.employeeType,
      employmentStatus: user.employmentStatus,
      roles: user.userRoles.map((ur) => ur.role),
      permissions: Array.from(new Set(permissions)),
    };
  }

  async issueTokensForUser(userId: string) {
    const user = await this.authRepo.getUserWithRolesAndPermissions(userId);
    if (!user || user.status !== "active") {
      throw new Error("User not found or inactive");
    }

    const tokens = await this.issueSession(user);
    const me = await this.getMe(userId);

    return {
      ...tokens,
      user: me,
    };
  }
}

export const authService = new AuthService();
