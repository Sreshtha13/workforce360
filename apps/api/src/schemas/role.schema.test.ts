import { describe, it, expect } from "vitest";
import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  updatePermissionSchema,
  assignPermissionSchema,
  removePermissionSchema,
} from "./role.schema";

describe("role schemas", () => {
  describe("createRoleSchema", () => {
    it("accepts valid role data", () => {
      const result = createRoleSchema.safeParse({
        name: "Manager",
        code: "manager",
        description: "Team manager role",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = createRoleSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("accepts optional isSystem flag", () => {
      const result = createRoleSchema.safeParse({
        name: "Admin",
        isSystem: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateRoleSchema", () => {
    it("accepts partial role updates", () => {
      const result = updateRoleSchema.safeParse({ description: "Updated" });
      expect(result.success).toBe(true);
    });
  });

  describe("createPermissionSchema", () => {
    it("accepts valid permission data", () => {
      const result = createPermissionSchema.safeParse({
        name: "Read Users",
        code: "user.read",
        module: "Administration",
        feature: "Users",
        resource: "user",
        action: "read",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required fields", () => {
      const result = createPermissionSchema.safeParse({ name: "Incomplete" });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePermissionSchema", () => {
    it("accepts partial permission updates", () => {
      const result = updatePermissionSchema.safeParse({ description: "Updated" });
      expect(result.success).toBe(true);
    });
  });

  describe("assignPermissionSchema", () => {
    it("requires permissionId", () => {
      expect(
        assignPermissionSchema.safeParse({ permissionId: "perm-1" }).success,
      ).toBe(true);
      expect(assignPermissionSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("removePermissionSchema", () => {
    it("requires permissionId", () => {
      expect(
        removePermissionSchema.safeParse({ permissionId: "perm-1" }).success,
      ).toBe(true);
      expect(removePermissionSchema.safeParse({ permissionId: "" }).success).toBe(
        false,
      );
    });
  });
});
