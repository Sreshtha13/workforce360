import { describe, it, expect } from "vitest";
import {
  loginSchema,
  googleLoginSchema,
  refreshTokenSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "./auth.schema";

describe("auth schemas", () => {
  describe("loginSchema", () => {
    it("accepts valid login credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "secret",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "secret",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("googleLoginSchema", () => {
    it("accepts authorization code", () => {
      const result = googleLoginSchema.safeParse({ code: "auth-code-123" });
      expect(result.success).toBe(true);
    });

    it("rejects empty code", () => {
      const result = googleLoginSchema.safeParse({ code: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("refreshTokenSchema", () => {
    it("accepts refresh token", () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: "token-abc" });
      expect(result.success).toBe(true);
    });

    it("rejects missing refresh token", () => {
      const result = refreshTokenSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("requestPasswordResetSchema", () => {
    it("accepts valid email", () => {
      const result = requestPasswordResetSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = requestPasswordResetSchema.safeParse({ email: "bad" });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("accepts valid reset payload", () => {
      const result = resetPasswordSchema.safeParse({
        token: "reset-token",
        password: "newpassword",
      });
      expect(result.success).toBe(true);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = resetPasswordSchema.safeParse({
        token: "reset-token",
        password: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing token", () => {
      const result = resetPasswordSchema.safeParse({ password: "longenough" });
      expect(result.success).toBe(false);
    });
  });
});
