import { describe, it, expect } from "vitest";
import {
  ADMIN_DASHBOARD_PERMISSION,
  ADMIN_DENIED_PERMISSIONS,
  CANDIDATE_PERMISSIONS,
  DEVELOPER_PERMISSIONS,
  EMPLOYEE_PERMISSIONS,
  ENDPOINT_PERMISSION_MATRIX,
  HR_RESOURCES,
  roleShouldHavePermission,
  SYSTEM_ROLE_CODES,
  type SystemRoleCode,
} from "../constants/rbac-matrix";
import { STORAGE_PURPOSE_PERMISSIONS } from "../middleware/storage-rbac";

/** Representative permission catalog (mirrors seed codes used in matrix checks). */
const ALL_PERMISSION_CODES = [
  "user.read",
  "user.create",
  "user.update",
  "user.delete",
  "user.assign_role",
  ADMIN_DASHBOARD_PERMISSION,
  "role.read",
  "role.create",
  "role.update",
  "role.delete",
  "permission.read",
  "permission.create",
  "permission.update",
  "permission.delete",
  "department.read",
  "department.create",
  "team.read",
  "designation.read",
  "office.read",
  "employee_type.read",
  "employment_status.read",
  "job.read",
  "candidate.read",
  "application.read",
  "interview.read",
  "assessment.read",
  "offer.read",
  "offer.create",
  "employee.read",
  "hr.dashboard.read",
  "policy.read",
  "policy.create",
  "policy.update",
  "asset.read",
  "asset.create",
  "ticket.read",
  "ticket.create",
  "ticket.manage",
  "portal.read",
  "portal.update",
];

describe("RBAC matrix (#21)", () => {
  it("covers all system role codes", () => {
    expect(SYSTEM_ROLE_CODES).toEqual([
      "super_admin",
      "admin",
      "hr",
      "employee",
      "candidate",
      "developer",
      "finance",
      "payroll",
    ]);
  });

  it("developer never receives admin dashboard or write-heavy perms", () => {
    expect(roleShouldHavePermission("developer", ADMIN_DASHBOARD_PERMISSION, ALL_PERMISSION_CODES)).toBe(
      false,
    );
    expect(roleShouldHavePermission("developer", "user.create", ALL_PERMISSION_CODES)).toBe(false);
    expect(roleShouldHavePermission("developer", "policy.create", ALL_PERMISSION_CODES)).toBe(false);
    expect(roleShouldHavePermission("developer", "ticket.manage", ALL_PERMISSION_CODES)).toBe(false);

    for (const code of DEVELOPER_PERMISSIONS) {
      expect(roleShouldHavePermission("developer", code, ALL_PERMISSION_CODES)).toBe(true);
    }
  });

  it("admin gets dashboard.read but not role/permission writes", () => {
    expect(roleShouldHavePermission("admin", ADMIN_DASHBOARD_PERMISSION, ALL_PERMISSION_CODES)).toBe(
      true,
    );
    expect(roleShouldHavePermission("admin", "role.read", ALL_PERMISSION_CODES)).toBe(true);
    for (const denied of ADMIN_DENIED_PERMISSIONS) {
      expect(roleShouldHavePermission("admin", denied, ALL_PERMISSION_CODES)).toBe(false);
    }
  });

  it("employee and candidate stay on portal (+ ticket.create for employee)", () => {
    for (const code of EMPLOYEE_PERMISSIONS) {
      expect(roleShouldHavePermission("employee", code, ALL_PERMISSION_CODES)).toBe(true);
    }
    expect(roleShouldHavePermission("employee", "user.read", ALL_PERMISSION_CODES)).toBe(false);
    expect(roleShouldHavePermission("employee", ADMIN_DASHBOARD_PERMISSION, ALL_PERMISSION_CODES)).toBe(
      false,
    );

    for (const code of CANDIDATE_PERMISSIONS) {
      expect(roleShouldHavePermission("candidate", code, ALL_PERMISSION_CODES)).toBe(true);
    }
    expect(roleShouldHavePermission("candidate", "ticket.create", ALL_PERMISSION_CODES)).toBe(false);
  });

  it("HR receives wholesale access to HR resources but not admin dashboard", () => {
    expect(roleShouldHavePermission("hr", "policy.read", ALL_PERMISSION_CODES)).toBe(true);
    expect(roleShouldHavePermission("hr", "ticket.manage", ALL_PERMISSION_CODES)).toBe(true);
    expect(roleShouldHavePermission("hr", "hr.dashboard.read", ALL_PERMISSION_CODES)).toBe(true);
    expect(roleShouldHavePermission("hr", ADMIN_DASHBOARD_PERMISSION, ALL_PERMISSION_CODES)).toBe(
      false,
    );
    expect(roleShouldHavePermission("hr", "role.create", ALL_PERMISSION_CODES)).toBe(false);

    for (const resource of HR_RESOURCES) {
      expect(roleShouldHavePermission("hr", `${resource}.read`, ALL_PERMISSION_CODES)).toBe(true);
    }
  });

  it("super_admin receives every catalog permission", () => {
    for (const code of ALL_PERMISSION_CODES) {
      expect(roleShouldHavePermission("super_admin", code, ALL_PERMISSION_CODES)).toBe(true);
    }
  });

  describe("endpoint permission matrix", () => {
    it("documents required permissions for sensitive routes", () => {
      expect(ENDPOINT_PERMISSION_MATRIX.length).toBeGreaterThan(5);

      const dashboard = ENDPOINT_PERMISSION_MATRIX.find((e) => e.path === "/api/dashboard");
      expect(dashboard?.anyOf).toEqual([ADMIN_DASHBOARD_PERMISSION]);

      const users = ENDPOINT_PERMISSION_MATRIX.find((e) => e.path === "/api/users" && e.method === "GET");
      expect(users?.anyOf).toEqual(["user.read"]);

      const tickets = ENDPOINT_PERMISSION_MATRIX.find((e) => e.path === "/api/hr/tickets");
      expect(tickets?.anyOf).toEqual(["ticket.read"]);
    });

    it.each(ENDPOINT_PERMISSION_MATRIX)(
      "$method $path requires at least one permission",
      ({ anyOf }) => {
        expect(anyOf.length).toBeGreaterThan(0);
        for (const code of anyOf) {
          expect(code.includes("/*")).toBe(false);
        }
      },
    );
  });

  describe("role × sensitive permission matrix", () => {
    const cases: { role: SystemRoleCode; permission: string; allowed: boolean }[] = [
      { role: "developer", permission: "user.read", allowed: true },
      { role: "developer", permission: ADMIN_DASHBOARD_PERMISSION, allowed: false },
      { role: "developer", permission: "ticket.create", allowed: true },
      { role: "developer", permission: "ticket.read", allowed: false },
      { role: "employee", permission: "portal.read", allowed: true },
      { role: "employee", permission: "user.read", allowed: false },
      { role: "candidate", permission: "portal.update", allowed: true },
      { role: "candidate", permission: "employee.read", allowed: false },
      { role: "hr", permission: "offer.create", allowed: true },
      { role: "hr", permission: ADMIN_DASHBOARD_PERMISSION, allowed: false },
      { role: "admin", permission: ADMIN_DASHBOARD_PERMISSION, allowed: true },
      { role: "admin", permission: "role.delete", allowed: false },
      { role: "super_admin", permission: "permission.delete", allowed: true },
    ];

    it.each(cases)("$role × $permission → $allowed", ({ role, permission, allowed }) => {
      expect(roleShouldHavePermission(role, permission, ALL_PERMISSION_CODES)).toBe(allowed);
    });
  });

  describe("storage purpose matrix", () => {
    it("POLICY requires policy write, not portal alone", () => {
      expect(STORAGE_PURPOSE_PERMISSIONS.POLICY).toContain("policy.create");
      expect(STORAGE_PURPOSE_PERMISSIONS.POLICY).not.toContain("portal.read");
    });

    it("OFFER_LETTER requires offer permissions", () => {
      expect(STORAGE_PURPOSE_PERMISSIONS.OFFER_LETTER).toEqual(
        expect.arrayContaining(["offer.create", "offer.update"]),
      );
    });

    it("RESUME is available to portal users", () => {
      expect(STORAGE_PURPOSE_PERMISSIONS.RESUME).toContain("portal.read");
    });
  });
});
