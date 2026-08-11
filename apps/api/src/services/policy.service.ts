import type { PolicyAssignmentTarget } from "@prisma/client";
import { AppError } from "../lib/app-error";
import { bumpPolicyVersion } from "../lib/policy-version";
import { writeAuditLog } from "../lib/audit";
import {
  PolicyRepository,
  type AssignPolicyData,
  type CreatePolicyData,
  type UpdatePolicyData,
} from "../repositories/policy.repository";

export class PolicyService {
  private policyRepo: PolicyRepository;

  constructor() {
    this.policyRepo = new PolicyRepository();
  }

  listPolicies(filters?: { status?: string; familyId?: string }) {
    return this.policyRepo.listPolicies(filters);
  }

  async getPolicyById(id: string) {
    const policy = await this.policyRepo.findPolicyById(id);
    if (!policy) {
      throw new AppError("POLICY_NOT_FOUND", "Policy not found", 404);
    }
    return policy;
  }

  async createPolicy(input: CreatePolicyData, actorId?: string) {
    const policy = await this.policyRepo.createPolicy(input);

    if (actorId) {
      await writeAuditLog({
        userId: actorId,
        action: "create_policy",
        entity: "company_policy",
        entityId: policy.id,
        after: { title: policy.title, familyId: policy.familyId, version: policy.version },
      });
    }

    return policy;
  }

  async updatePolicy(id: string, input: UpdatePolicyData, actorId?: string) {
    const existing = await this.policyRepo.findPolicyById(id);
    if (!existing) {
      throw new AppError("POLICY_NOT_FOUND", "Policy not found", 404);
    }
    if (existing.status !== "DRAFT") {
      throw new AppError(
        "POLICY_NOT_EDITABLE",
        "Only draft policies can be edited. Create a new version from the published policy.",
        403,
      );
    }

    const updated = await this.policyRepo.updatePolicy(id, input);

    if (actorId) {
      await writeAuditLog({
        userId: actorId,
        action: "update_policy",
        entity: "company_policy",
        entityId: id,
        before: { title: existing.title, version: existing.version },
        after: { title: updated.title, version: updated.version },
      });
    }

    return updated;
  }

  async publishPolicy(id: string, publisherId: string) {
    const existing = await this.policyRepo.findPolicyById(id);
    if (!existing) {
      throw new AppError("POLICY_NOT_FOUND", "Policy not found", 404);
    }
    if (existing.status !== "DRAFT") {
      throw new AppError("POLICY_NOT_PUBLISHABLE", "Only draft policies can be published", 400);
    }

    const published = await this.policyRepo.publishPolicy(id, publisherId);
    if (!published) {
      throw new AppError("POLICY_NOT_FOUND", "Policy not found", 404);
    }

    await writeAuditLog({
      userId: publisherId,
      action: "publish_policy",
      entity: "company_policy",
      entityId: id,
      after: { familyId: published.familyId, version: published.version, status: published.status },
    });

    return published;
  }

  async createPolicyVersion(id: string, actorId?: string) {
    const source = await this.policyRepo.findPolicyById(id);
    if (!source) {
      throw new AppError("POLICY_NOT_FOUND", "Policy not found", 404);
    }
    if (source.status !== "PUBLISHED") {
      throw new AppError(
        "POLICY_VERSION_SOURCE_INVALID",
        "New versions can only be created from a published policy",
        400,
      );
    }

    const existingDraft = await this.policyRepo.findDraftInFamily(source.familyId);
    if (existingDraft) {
      throw new AppError(
        "POLICY_DRAFT_EXISTS",
        "A draft version already exists for this policy. Edit or publish it before creating another version.",
        409,
      );
    }

    const draft = await this.policyRepo.createPolicyVersion({
      familyId: source.familyId,
      previousVersionId: source.id,
      title: source.title,
      description: source.description,
      version: bumpPolicyVersion(source.version),
      fileId: source.fileId,
    });

    if (actorId) {
      await writeAuditLog({
        userId: actorId,
        action: "create_policy_version",
        entity: "company_policy",
        entityId: draft.id,
        after: {
          familyId: draft.familyId,
          previousVersionId: source.id,
          version: draft.version,
        },
      });
    }

    return draft;
  }

  listAssignments(familyId: string) {
    return this.policyRepo.listAssignments(familyId);
  }

  async assignPolicy(input: AssignPolicyData, actorId?: string) {
    this.validateAssignmentTarget(input);

    const latest = await this.policyRepo.findLatestPublishedInFamily(input.familyId);
    if (!latest) {
      const anyInFamily = await this.policyRepo.listPolicies({ familyId: input.familyId });
      if (anyInFamily.length === 0) {
        throw new AppError("POLICY_FAMILY_NOT_FOUND", "Policy family not found", 404);
      }
    }

    const assignment = await this.policyRepo.createAssignment({
      ...input,
      assignedById: actorId,
    });

    if (actorId) {
      await writeAuditLog({
        userId: actorId,
        action: "assign_policy",
        entity: "policy_assignment",
        entityId: assignment.id,
        after: {
          familyId: input.familyId,
          targetType: input.targetType,
          userId: input.userId,
          departmentId: input.departmentId,
          teamId: input.teamId,
        },
      });
    }

    return assignment;
  }

  async removeAssignment(assignmentId: string, actorId?: string) {
    const removed = await this.policyRepo.softDeleteAssignment(assignmentId);

    if (actorId) {
      await writeAuditLog({
        userId: actorId,
        action: "remove_policy_assignment",
        entity: "policy_assignment",
        entityId: assignmentId,
      });
    }

    return removed;
  }

  async getAcknowledgementReport(policyId: string) {
    const policy = await this.policyRepo.findPolicyById(policyId);
    if (!policy) {
      throw new AppError("POLICY_NOT_FOUND", "Policy not found", 404);
    }

    const [assignments, acknowledgements] = await Promise.all([
      this.policyRepo.listAssignments(policy.familyId),
      this.policyRepo.listAcknowledgementsForPolicy(policyId),
    ]);

    return {
      policy: {
        id: policy.id,
        familyId: policy.familyId,
        title: policy.title,
        version: policy.version,
        status: policy.status,
      },
      assignments,
      acknowledgements,
      summary: {
        acknowledgedCount: acknowledgements.length,
      },
    };
  }

  async listPortalPolicies(userId: string) {
    const [assignments, userContext] = await Promise.all([
      this.policyRepo.listActiveAssignments(),
      this.policyRepo.getUserAssignmentContext(userId),
    ]);

    if (!userContext) {
      return [];
    }

    const teamIds = new Set(userContext.teamMemberships.map((m) => m.teamId));
    const matchedFamilyIds = new Set<string>();

    for (const assignment of assignments) {
      if (this.assignmentMatchesUser(assignment, userContext, teamIds)) {
        matchedFamilyIds.add(assignment.familyId);
      }
    }

    if (matchedFamilyIds.size === 0) {
      return [];
    }

    const policies = await Promise.all(
      [...matchedFamilyIds].map((familyId) =>
        this.policyRepo.findLatestPublishedInFamily(familyId),
      ),
    );

    const published = policies.filter((p): p is NonNullable<typeof p> => p !== null);

    const withAck = await Promise.all(
      published.map(async (policy) => {
        const ack = await this.policyRepo.findAcknowledgement(policy.id, userId);
        return {
          ...policy,
          acknowledged: ack !== null,
          acknowledgedAt: ack?.acknowledgedAt ?? null,
        };
      }),
    );

    return withAck;
  }

  async acknowledgePolicy(policyId: string, userId: string) {
    const policy = await this.policyRepo.findPolicyById(policyId);
    if (!policy || policy.status !== "PUBLISHED") {
      throw new AppError("POLICY_NOT_FOUND", "Published policy not found", 404);
    }

    const assignments = await this.policyRepo.listActiveAssignments();
    const userContext = await this.policyRepo.getUserAssignmentContext(userId);
    if (!userContext) {
      throw new AppError("FORBIDDEN", "You are not assigned to this policy", 403);
    }

    const teamIds = new Set(userContext.teamMemberships.map((m) => m.teamId));
    const familyAssignments = assignments.filter((a) => a.familyId === policy.familyId);
    const isAssigned = familyAssignments.some((a) =>
      this.assignmentMatchesUser(a, userContext, teamIds),
    );

    if (!isAssigned) {
      throw new AppError("FORBIDDEN", "You are not assigned to this policy", 403);
    }

    const existing = await this.policyRepo.findAcknowledgement(policyId, userId);
    if (existing) {
      return existing;
    }

    const ack = await this.policyRepo.createAcknowledgement(policyId, userId);

    await writeAuditLog({
      userId,
      action: "acknowledge_policy",
      entity: "company_policy",
      entityId: policyId,
      after: { version: policy.version, familyId: policy.familyId },
    });

    return ack;
  }

  private validateAssignmentTarget(input: AssignPolicyData) {
    switch (input.targetType) {
      case "ALL":
        if (input.userId || input.departmentId || input.teamId) {
          throw new AppError(
            "INVALID_ASSIGNMENT",
            "ALL assignments must not specify user, department, or team",
            400,
          );
        }
        break;
      case "USER":
        if (!input.userId) {
          throw new AppError("INVALID_ASSIGNMENT", "userId is required for USER assignments", 400);
        }
        break;
      case "DEPARTMENT":
        if (!input.departmentId) {
          throw new AppError(
            "INVALID_ASSIGNMENT",
            "departmentId is required for DEPARTMENT assignments",
            400,
          );
        }
        break;
      case "TEAM":
        if (!input.teamId) {
          throw new AppError("INVALID_ASSIGNMENT", "teamId is required for TEAM assignments", 400);
        }
        break;
      default:
        throw new AppError("INVALID_ASSIGNMENT", "Invalid assignment target type", 400);
    }
  }

  private assignmentMatchesUser(
    assignment: {
      targetType: PolicyAssignmentTarget;
      userId: string | null;
      departmentId: string | null;
      teamId: string | null;
    },
    user: { id: string; departmentId: string | null },
    teamIds: Set<string>,
  ): boolean {
    switch (assignment.targetType) {
      case "ALL":
        return true;
      case "USER":
        return assignment.userId === user.id;
      case "DEPARTMENT":
        return (
          assignment.departmentId !== null && assignment.departmentId === user.departmentId
        );
      case "TEAM":
        return assignment.teamId !== null && teamIds.has(assignment.teamId);
      default:
        return false;
    }
  }
}

export const policyService = new PolicyService();
