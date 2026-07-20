import { describe, it, expect } from "vitest";
import {
  filterNavByPermissions,
  mainNav,
  adminNav,
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

  it("shows Roles when user has one of role permissions", () => {
    const filtered = filterNavByPermissions(adminNav, ["role.update"]);
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

describe("adminNav permission codes", () => {
  it("defines permission codes for all admin sections", () => {
    for (const item of adminNav) {
      expect(item.permissions?.length).toBeGreaterThan(0);
    }
  });
});
