/**
 * Frontend mirror of MFA / trusted-device API shapes.
 * Backend (`apps/api`) remains the source of truth.
 */

import type { AuthUser } from "@/types/entities";

export type MfaStatus = {
  enabled: boolean;
  enforcedByRole: boolean;
  verifiedAt?: string | null;
  backupCodesRemaining: number;
};

export type MfaSetupResult = {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
};

export type MfaEnableResult = {
  enabled: boolean;
  backupCodes: string[];
};

export type LoginResult =
  | {
      mfaRequired: true;
      mfaSetupRequired?: boolean;
      mfaToken: string;
      user?: Pick<AuthUser, "id" | "email" | "firstName" | "lastName">;
    }
  | {
      mfaRequired: false;
      user: AuthUser;
    };

export type MfaVerifyResult = {
  mfaRequired: false;
  user: AuthUser;
};

export type MfaEnableChallengeResult = {
  enabled: boolean;
  backupCodes: string[];
  mfaRequired: false;
  user: AuthUser;
};

export type TrustedDevice = {
  id: string;
  userId: string;
  deviceHash: string;
  label?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  lastSeenAt: string;
  refreshTokenId?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeviceSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
};

export type DevicesListResult = {
  devices: TrustedDevice[];
  refreshTokens: DeviceSession[];
};
