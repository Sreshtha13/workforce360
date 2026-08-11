import { prisma } from "../lib/prisma";
import { AppError } from "./app-error";

/** Roles that may see all employees/users organization-wide. */
export const UNSCOPED_VISIBILITY_ROLE_CODES = new Set([
  "super_admin",
  "admin",
  "hr",
]);

/** Roles that must be limited to team peers (and self). */
export const TEAM_SCOPED_ROLE_CODES = new Set(["developer"]);

export type EmployeeVisibilityScope =
  | { type: "all" }
  | { type: "userIds"; userIds: string[] };

/**
 * Resolves which users the actor may see on employee/user list & detail endpoints.
 *
 * - Super Admin / Admin / HR → organization-wide
 * - Developer → self + members/leads of teams they belong to (or lead)
 * - Everyone else → unrestricted (preserves custom roles with user.read)
 *
 * Project/board ACL is deferred until the project module exists (#17).
 */
export async function resolveEmployeeVisibilityScope(
  actorId: string,
): Promise<EmployeeVisibilityScope> {
  const roleRows = await prisma.userRole.findMany({
    where: { userId: actorId, deletedAt: null, role: { deletedAt: null } },
    select: { role: { select: { code: true } } },
  });

  const roleCodes = roleRows
    .map((r) => r.role.code)
    .filter((code): code is string => Boolean(code));

  if (roleCodes.some((code) => UNSCOPED_VISIBILITY_ROLE_CODES.has(code))) {
    return { type: "all" };
  }

  const needsTeamScope = roleCodes.some((code) => TEAM_SCOPED_ROLE_CODES.has(code));
  if (!needsTeamScope) {
    return { type: "all" };
  }

  const visibleIds = await resolveTeamPeerUserIds(actorId);
  return { type: "userIds", userIds: [...visibleIds] };
}

export async function resolveTeamPeerUserIds(actorId: string): Promise<Set<string>> {
  const visible = new Set<string>([actorId]);

  const [memberships, ledTeams] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId: actorId, deletedAt: null, leftAt: null },
      select: { teamId: true },
    }),
    prisma.team.findMany({
      where: { leadId: actorId, deletedAt: null },
      select: { id: true },
    }),
  ]);

  const teamIds = new Set<string>([
    ...memberships.map((m) => m.teamId),
    ...ledTeams.map((t) => t.id),
  ]);

  if (teamIds.size === 0) {
    return visible;
  }

  const teamIdList = [...teamIds];

  const [peers, leads] = await Promise.all([
    prisma.teamMember.findMany({
      where: {
        teamId: { in: teamIdList },
        deletedAt: null,
        leftAt: null,
      },
      select: { userId: true },
    }),
    prisma.team.findMany({
      where: { id: { in: teamIdList }, deletedAt: null, leadId: { not: null } },
      select: { leadId: true },
    }),
  ]);

  for (const peer of peers) {
    visible.add(peer.userId);
  }
  for (const team of leads) {
    if (team.leadId) visible.add(team.leadId);
  }

  return visible;
}

export async function assertCanViewUser(
  actorId: string,
  targetUserId: string,
): Promise<void> {
  const scope = await resolveEmployeeVisibilityScope(actorId);
  if (scope.type === "all") return;
  if (scope.userIds.includes(targetUserId)) return;

  throw new AppError(
    "EMPLOYEE_SCOPE_FORBIDDEN",
    "You do not have permission to view this employee",
    403,
  );
}
