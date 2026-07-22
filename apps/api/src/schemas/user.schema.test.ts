import { describe, it, expect } from "vitest";
import {
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
  removeRoleSchema,
} from "./user.schema";

describe("user schemas", () => {
  const validUser = {
    email: "new@example.com",
    firstName: "Jane",
    lastName: "Doe",
  };

  describe("createUserSchema", () => {
    it("accepts valid user data", () => {
      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("accepts optional password of at least 8 characters", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: "SecurePass1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        email: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty firstName", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        firstName: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: "short",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserSchema", () => {
    it("accepts partial updates", () => {
      const result = updateUserSchema.safeParse({ firstName: "Updated" });
      expect(result.success).toBe(true);
    });

    it("accepts valid status enum", () => {
      const result = updateUserSchema.safeParse({ status: "active" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = updateUserSchema.safeParse({ status: "unknown" });
      expect(result.success).toBe(false);
    });
  });

  describe("assignRoleSchema", () => {
    it("requires roleId", () => {
      expect(assignRoleSchema.safeParse({ roleId: "role-1" }).success).toBe(true);
      expect(assignRoleSchema.safeParse({}).success).toBe(false);
      expect(assignRoleSchema.safeParse({ roleId: "" }).success).toBe(false);
    });
  });

  describe("removeRoleSchema", () => {
    it("requires roleId", () => {
      expect(removeRoleSchema.safeParse({ roleId: "role-1" }).success).toBe(true);
      expect(removeRoleSchema.safeParse({}).success).toBe(false);
    });
  });
});
