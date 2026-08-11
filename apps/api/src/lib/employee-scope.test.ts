import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    userRole: { findMany: vi.fn() },
    teamMember: { findMany: vi.fn() },
    team: { findMany: vi.fn() },
  },
}));

vi.mock("./prisma", () => ({
  prisma: mockPrisma,
}));

import {
  assertCanViewUser,
  resolveEmployeeVisibilityScope,
} from "./employee-scope";

describe("employee-scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveEmployeeVisibilityScope", () => {
    it("returns all for HR / Admin / Super Admin", async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([{ role: { code: "hr" } }]);

      await expect(resolveEmployeeVisibilityScope("user-1")).resolves.toEqual({
        type: "all",
      });
      expect(mockPrisma.teamMember.findMany).not.toHaveBeenCalled();
    });

    it("returns all for custom roles without developer", async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { code: "custom_manager" } },
      ]);

      await expect(resolveEmployeeVisibilityScope("user-1")).resolves.toEqual({
        type: "all",
      });
    });

    it("scopes developers to team peers", async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { code: "developer" } },
      ]);
      mockPrisma.teamMember.findMany
        .mockResolvedValueOnce([{ teamId: "team-a" }])
        .mockResolvedValueOnce([{ userId: "user-1" }, { userId: "peer-2" }]);
      mockPrisma.team.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ leadId: "lead-9" }]);

      const scope = await resolveEmployeeVisibilityScope("user-1");
      expect(scope.type).toBe("userIds");
      if (scope.type === "userIds") {
        expect(scope.userIds).toEqual(
          expect.arrayContaining(["user-1", "peer-2", "lead-9"]),
        );
      }
    });

    it("scopes developers with no team to self only", async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { code: "developer" } },
      ]);
      mockPrisma.teamMember.findMany.mockResolvedValue([]);
      mockPrisma.team.findMany.mockResolvedValue([]);

      await expect(resolveEmployeeVisibilityScope("solo-dev")).resolves.toEqual({
        type: "userIds",
        userIds: ["solo-dev"],
      });
    });
  });

  describe("assertCanViewUser", () => {
    it("allows when scope is all", async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([{ role: { code: "admin" } }]);
      await expect(assertCanViewUser("admin-1", "anyone")).resolves.toBeUndefined();
    });

    it("allows peer within developer scope", async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { code: "developer" } },
      ]);
      mockPrisma.teamMember.findMany
        .mockResolvedValueOnce([{ teamId: "t1" }])
        .mockResolvedValueOnce([{ userId: "dev-1" }, { userId: "peer-2" }]);
      mockPrisma.team.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await expect(assertCanViewUser("dev-1", "peer-2")).resolves.toBeUndefined();
    });

    it("rejects outside developer scope", async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([
        { role: { code: "developer" } },
      ]);
      mockPrisma.teamMember.findMany.mockResolvedValue([]);
      mockPrisma.team.findMany.mockResolvedValue([]);

      await expect(assertCanViewUser("dev-1", "stranger")).rejects.toMatchObject({
        code: "EMPLOYEE_SCOPE_FORBIDDEN",
      });
    });
  });
});
