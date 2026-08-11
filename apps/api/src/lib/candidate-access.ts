import { prisma } from "./prisma";

export async function userHasRole(userId: string, roleCode: string): Promise<boolean> {
  const assignment = await prisma.userRole.findFirst({
    where: {
      userId,
      deletedAt: null,
      role: { code: roleCode, deletedAt: null },
    },
    select: { id: true },
  });

  return assignment !== null;
}

/** Roles that should never use the applicant self-service surface. */
const STAFF_ROLE_CODES = ["super_admin", "admin", "hr"] as const;

export async function userIsStaffWithoutCandidateAccess(userId: string): Promise<boolean> {
  const hasCandidateRole = await userHasRole(userId, "candidate");
  if (hasCandidateRole) return false;

  for (const code of STAFF_ROLE_CODES) {
    if (await userHasRole(userId, code)) return true;
  }

  return false;
}
