import { describe, it, expect } from "vitest";
import {
  filterNavByPermissions,
  mainNav,
  adminNav,
  candidateNav,
  canAccessCandidateApplications,
} from "@/lib/navigation";

describe("filterNavByPermissions", () => {
  it("always includes public nav items", () => {
    const filtered = filterNavByPermissions(mainNav, []);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].label).toBe("Dashboard");
  });

  it("hides permission-gated items when user has no permissions", () => {
    const filtered = filterNavByPermissions(adminNav, []);
    expect(filtered).toHaveLength(0);
  });

  it("shows items when user has any required permission", () => {
    const filtered = filterNavByPermissions(adminNav, ["user.read"]);
    expect(filtered.some((item) => item.label === "Users")).toBe(true);
  });

  it("shows Roles when user has role.read", () => {
    const filtered = filterNavByPermissions(adminNav, ["role.read"]);
    expect(filtered.some((item) => item.label === "Roles")).toBe(true);
  });

  it("hides Roles when user lacks all role permissions", () => {
    const filtered = filterNavByPermissions(adminNav, ["user.read"]);
    expect(filtered.some((item) => item.label === "Roles")).toBe(false);
  });

  it("shows department admin when user has department.create", () => {
    const filtered = filterNavByPermissions(adminNav, ["department.create"]);
    expect(filtered.some((item) => item.label === "Departments")).toBe(true);
  });

  it("includes items without permissions array", () => {
    const items = [
      { label: "Open", href: "/open", icon: mainNav[0].icon },
    ];
    const filtered = filterNavByPermissions(items, []);
    expect(filtered).toHaveLength(1);
  });
});

describe("candidateNav role gating", () => {
  it("hides My Applications for Super Admin even with portal.read", () => {
    const filtered = filterNavByPermissions(candidateNav, {
      permissions: ["portal.read", "user.read"],
      roles: [{ code: "super_admin" }],
    });
    expect(filtered).toHaveLength(0);
  });

  it("hides My Applications for Admin/HR without candidate role", () => {
    const filtered = filterNavByPermissions(candidateNav, {
      permissions: ["portal.read"],
      roles: [{ code: "admin" }, { code: "hr" }],
    });
    expect(filtered).toHaveLength(0);
  });

  it("shows My Applications only for candidate role", () => {
    const filtered = filterNavByPermissions(candidateNav, {
      permissions: [],
      roles: [{ code: "candidate" }],
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].href).toBe("/candidate/dashboard");
  });

  it("canAccessCandidateApplications reflects candidate role only", () => {
    expect(canAccessCandidateApplications({ roles: [{ code: "super_admin" }] })).toBe(false);
    expect(canAccessCandidateApplications({ roles: [{ code: "candidate" }] })).toBe(true);
    expect(canAccessCandidateApplications(null)).toBe(false);
  });
});

describe("adminNav permission codes", () => {
  it("defines permission codes for all admin sections", () => {
    for (const item of adminNav) {
      expect(item.permissions?.length).toBeGreaterThan(0);
    }
  });
});
