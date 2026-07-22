import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
} from "./password";

describe("password utilities", () => {
  describe("validatePasswordPolicy", () => {
    it("accepts a password meeting default policy", () => {
      const result = validatePasswordPolicy("SecurePass1");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects passwords shorter than minimum length", () => {
      const result = validatePasswordPolicy("Ab1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long",
      );
    });

    it("rejects passwords without uppercase letters", () => {
      const result = validatePasswordPolicy("securepass1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter",
      );
    });

    it("rejects passwords without lowercase letters", () => {
      const result = validatePasswordPolicy("SECUREPASS1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one lowercase letter",
      );
    });

    it("rejects passwords without numbers", () => {
      const result = validatePasswordPolicy("SecurePass");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one number",
      );
    });

    it("returns multiple validation errors at once", () => {
      const result = validatePasswordPolicy("abc");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("hashPassword / verifyPassword", () => {
    it("hashes and verifies a password successfully", async () => {
      const password = "SecurePass1";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("returns false for incorrect password", async () => {
      const hash = await hashPassword("SecurePass1");
      expect(await verifyPassword("WrongPass1", hash)).toBe(false);
    });

    it("produces different hashes for the same password", async () => {
      const password = "SecurePass1";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });
});
