import { describe, it, expect } from "vitest";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createTeamSchema,
  createDesignationSchema,
  createOfficeSchema,
  createEmployeeTypeSchema,
  createEmploymentStatusSchema,
} from "./organization.schema";

describe("organization schemas", () => {
  describe("department schemas", () => {
    it("accepts valid department create payload", () => {
      const result = createDepartmentSchema.safeParse({
        companyId: "company-1",
        name: "Engineering",
      });
      expect(result.success).toBe(true);
    });

    it("rejects department without companyId", () => {
      const result = createDepartmentSchema.safeParse({ name: "Engineering" });
      expect(result.success).toBe(false);
    });

    it("accepts partial department updates", () => {
      const result = updateDepartmentSchema.safeParse({ name: "Updated" });
      expect(result.success).toBe(true);
    });
  });

  describe("team schemas", () => {
    it("requires departmentId and name", () => {
      expect(
        createTeamSchema.safeParse({
          departmentId: "dept-1",
          name: "Platform",
        }).success,
      ).toBe(true);
      expect(createTeamSchema.safeParse({ name: "Platform" }).success).toBe(false);
    });
  });

  describe("designation schemas", () => {
    it("accepts optional numeric level", () => {
      const result = createDesignationSchema.safeParse({
        name: "Senior Engineer",
        level: 5,
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-integer level", () => {
      const result = createDesignationSchema.safeParse({
        name: "Engineer",
        level: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("office schemas", () => {
    it("accepts valid office with optional email", () => {
      const result = createOfficeSchema.safeParse({
        companyId: "company-1",
        name: "HQ",
        email: "hq@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid office email", () => {
      const result = createOfficeSchema.safeParse({
        companyId: "company-1",
        name: "HQ",
        email: "not-email",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("employee type schemas", () => {
    it("requires name", () => {
      expect(createEmployeeTypeSchema.safeParse({ name: "Full Time" }).success).toBe(
        true,
      );
      expect(createEmployeeTypeSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("employment status schemas", () => {
    it("requires name", () => {
      expect(
        createEmploymentStatusSchema.safeParse({ name: "Active" }).success,
      ).toBe(true);
      expect(createEmploymentStatusSchema.safeParse({}).success).toBe(false);
    });
  });
});
