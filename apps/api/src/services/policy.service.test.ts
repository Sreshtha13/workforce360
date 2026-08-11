import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPolicyRepo } = vi.hoisted(() => ({
  mockPolicyRepo: {
    findPolicyById: vi.fn(),
    findDraftInFamily: vi.fn(),
    createPolicyVersion: vi.fn(),
    findLatestPublishedInFamily: vi.fn(),
    listPolicies: vi.fn(),
    listActiveAssignments: vi.fn(),
    getUserAssignmentContext: vi.fn(),
    findAcknowledgement: vi.fn(),
    createAcknowledgement: vi.fn(),
    listAssignments: vi.fn(),
    listAcknowledgementsForPolicy: vi.fn(),
    createPolicy: vi.fn(),
    updatePolicy: vi.fn(),
    publishPolicy: vi.fn(),
    createAssignment: vi.fn(),
    softDeleteAssignment: vi.fn(),
  },
}));

vi.mock("../repositories/policy.repository", () => ({
  PolicyRepository: vi.fn(function PolicyRepositoryMock() {
    return mockPolicyRepo;
  }),
}));

vi.mock("../lib/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { PolicyService } from "./policy.service";

describe("PolicyService", () => {
  let service: PolicyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PolicyService();
  });

  describe("createPolicyVersion", () => {
    it("rejects non-published source", async () => {
      mockPolicyRepo.findPolicyById.mockResolvedValue({
        id: "p1",
        status: "DRAFT",
        familyId: "fam-1",
        version: "1.0",
      });

      await expect(service.createPolicyVersion("p1")).rejects.toThrow(
        /published policy/i,
      );
    });

    it("creates draft from published policy", async () => {
      mockPolicyRepo.findPolicyById.mockResolvedValue({
        id: "p1",
        status: "PUBLISHED",
        familyId: "fam-1",
        title: "Code of Conduct",
        description: "Rules",
        version: "1.0",
        fileId: null,
      });
      mockPolicyRepo.findDraftInFamily.mockResolvedValue(null);
      mockPolicyRepo.createPolicyVersion.mockResolvedValue({
        id: "p2",
        version: "1.1",
        status: "DRAFT",
      });

      const result = await service.createPolicyVersion("p1", "user-1");
      expect(mockPolicyRepo.createPolicyVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          familyId: "fam-1",
          previousVersionId: "p1",
          version: "1.1",
        }),
      );
      expect(result.version).toBe("1.1");
    });
  });

  describe("updatePolicy", () => {
    it("rejects editing published policies", async () => {
      mockPolicyRepo.findPolicyById.mockResolvedValue({
        id: "p1",
        status: "PUBLISHED",
        title: "Policy",
        version: "1.0",
      });

      await expect(service.updatePolicy("p1", { title: "X" })).rejects.toThrow(
        /Only draft policies can be edited/,
      );
    });
  });

  describe("acknowledgePolicy", () => {
    it("rejects when user is not assigned", async () => {
      mockPolicyRepo.findPolicyById.mockResolvedValue({
        id: "p1",
        status: "PUBLISHED",
        familyId: "fam-1",
        version: "1.0",
      });
      mockPolicyRepo.listActiveAssignments.mockResolvedValue([
        { familyId: "fam-1", targetType: "USER", userId: "other", departmentId: null, teamId: null },
      ]);
      mockPolicyRepo.getUserAssignmentContext.mockResolvedValue({
        id: "user-1",
        departmentId: null,
        teamMemberships: [],
      });

      await expect(service.acknowledgePolicy("p1", "user-1")).rejects.toThrow(
        /not assigned/i,
      );
    });
  });
});
