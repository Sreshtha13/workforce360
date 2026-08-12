import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const googleLoginSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const mfaVerifySchema = z.object({
  mfaToken: z.string().min(1),
  code: z.string().min(4).max(32),
});

export const mfaChallengeTokenSchema = z.object({
  mfaToken: z.string().min(1),
});

export const mfaCodeSchema = z.object({
  code: z.string().min(4).max(32),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type MfaChallengeTokenInput = z.infer<typeof mfaChallengeTokenSchema>;
export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;
