import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";

describe("JWT utilities", () => {
  const userId = "user-123";
  const email = "test@example.com";
  const sessionVersion = 0;

  describe("signAccessToken / verifyAccessToken", () => {
    it("signs and verifies an access token", () => {
      const token = signAccessToken(userId, email, sessionVersion);
      const payload = verifyAccessToken(token);

      expect(payload.userId).toBe(userId);
      expect(payload.email).toBe(email);
      expect(payload.type).toBe("access");
      expect(payload.sessionVersion).toBe(sessionVersion);
    });

    it("rejects a refresh token when verifying access token", () => {
      const refreshToken = signRefreshToken(userId, email, sessionVersion);
      expect(() => verifyAccessToken(refreshToken)).toThrow(
        "Invalid or expired access token",
      );
    });

    it("rejects malformed tokens", () => {
      expect(() => verifyAccessToken("invalid.token.here")).toThrow(
        "Invalid or expired access token",
      );
    });

    it("rejects empty tokens", () => {
      expect(() => verifyAccessToken("")).toThrow(
        "Invalid or expired access token",
      );
    });
  });

  describe("signRefreshToken / verifyRefreshToken", () => {
    it("signs and verifies a refresh token", () => {
      const token = signRefreshToken(userId, email, sessionVersion);
      const payload = verifyRefreshToken(token);

      expect(payload.userId).toBe(userId);
      expect(payload.email).toBe(email);
      expect(payload.type).toBe("refresh");
    });

    it("rejects an access token when verifying refresh token", () => {
      const accessToken = signAccessToken(userId, email, sessionVersion);
      expect(() => verifyRefreshToken(accessToken)).toThrow(
        "Invalid or expired refresh token",
      );
    });

    it("rejects malformed refresh tokens", () => {
      expect(() => verifyRefreshToken("not-a-valid-jwt")).toThrow(
        "Invalid or expired refresh token",
      );
    });
  });
});
