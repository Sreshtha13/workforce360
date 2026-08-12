import type { DocumentAccessLevel } from "@prisma/client";

const ACCESS_RANK: Record<DocumentAccessLevel, number> = {
  VIEW: 1,
  EDIT: 2,
  DELETE: 3,
  MANAGE: 4,
};

export type DocumentPermissionRow = {
  userId: string | null;
  roleCode: string | null;
  accessLevel: DocumentAccessLevel;
};

/**
 * Pure permission check for DMS.
 * Creator and users with document.manage bypass always have full access.
 */
export function checkDocumentAccess(input: {
  required: DocumentAccessLevel;
  createdById: string;
  actorId: string;
  actorRoleCodes: string[];
  hasDocumentManage: boolean;
  permissions: DocumentPermissionRow[];
}): boolean {
  if (input.hasDocumentManage) return true;
  if (input.createdById === input.actorId) return true;

  const requiredRank = ACCESS_RANK[input.required];
  for (const perm of input.permissions) {
    const matchesUser = perm.userId != null && perm.userId === input.actorId;
    const matchesRole = perm.roleCode != null && input.actorRoleCodes.includes(perm.roleCode);
    if (!matchesUser && !matchesRole) continue;
    if (ACCESS_RANK[perm.accessLevel] >= requiredRank) return true;
  }
  return false;
}
