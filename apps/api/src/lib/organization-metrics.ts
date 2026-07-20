import { prisma } from "./prisma";

/** Non-deleted users linked to an org entity. */
export const linkedUserFilter = { deletedAt: null } as const;

/** Active employees only (non-deleted, active status). */
export const activeEmployeeFilter = { deletedAt: null, status: "active" } as const;

export const activeUserSummarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  deletedAt: true,
} as const;

type UserSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  deletedAt?: Date | null;
};

/** Hide soft-deleted users from relation payloads shown in UI dropdowns and tables. */
export function sanitizeUserReference<T extends UserSummary | null | undefined>(
  user: T,
): T extends UserSummary ? Omit<UserSummary, "deletedAt"> | null : null {
  if (!user || user.deletedAt) {
    return null as T extends UserSummary ? Omit<UserSummary, "deletedAt"> | null : null;
  }

  const { deletedAt: _deletedAt, ...rest } = user;
  return rest as T extends UserSummary ? Omit<UserSummary, "deletedAt"> | null : null;
}

export type DepartmentMetrics = {
  totalEmployees: number;
  managers: number;
  openPositions: number;
  usersCount: number;
};

export type DesignationMetrics = {
  usersAssigned: number;
  vacantPositions: number;
};

export async function getDepartmentMetricsByIds(
  departmentIds: string[],
): Promise<Map<string, DepartmentMetrics>> {
  if (departmentIds.length === 0) {
    return new Map();
  }

  const [usersCountRows, activeEmployeeRows, managerRows, designations] = await Promise.all([
    prisma.user.groupBy({
      by: ["departmentId"],
      where: {
        ...linkedUserFilter,
        departmentId: { in: departmentIds },
      },
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["departmentId"],
      where: {
        ...activeEmployeeFilter,
        departmentId: { in: departmentIds },
      },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: {
        ...activeEmployeeFilter,
        departmentId: { in: departmentIds },
        managerId: { not: null },
      },
      select: { departmentId: true, managerId: true },
    }),
    prisma.designation.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        departmentId: { in: departmentIds },
      },
      select: {
        departmentId: true,
        headcount: true,
        _count: {
          select: {
            users: { where: activeEmployeeFilter },
          },
        },
      },
    }),
  ]);

  const usersCountByDept = new Map(
    usersCountRows
      .filter((row) => row.departmentId)
      .map((row) => [row.departmentId!, row._count._all]),
  );

  const activeEmployeesByDept = new Map(
    activeEmployeeRows
      .filter((row) => row.departmentId)
      .map((row) => [row.departmentId!, row._count._all]),
  );

  const managerIds = [...new Set(managerRows.map((row) => row.managerId!).filter(Boolean))];
  const managerDepartments = managerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: managerIds }, ...activeEmployeeFilter },
        select: { id: true, departmentId: true },
      })
    : [];
  const managerDeptById = new Map(
    managerDepartments
      .filter((manager) => manager.departmentId)
      .map((manager) => [manager.id, manager.departmentId!]),
  );

  const managersByDept = new Map<string, Set<string>>();
  for (const row of managerRows) {
    if (!row.departmentId || !row.managerId) continue;
    if (managerDeptById.get(row.managerId) !== row.departmentId) continue;
    const managers = managersByDept.get(row.departmentId) ?? new Set<string>();
    managers.add(row.managerId);
    managersByDept.set(row.departmentId, managers);
  }

  const openPositionsByDept = new Map<string, number>();
  for (const designation of designations) {
    const assigned = designation._count.users;
    const vacant = Math.max(0, designation.headcount - assigned);
    if (vacant === 0) continue;
    openPositionsByDept.set(
      designation.departmentId,
      (openPositionsByDept.get(designation.departmentId) ?? 0) + vacant,
    );
  }

  return new Map(
    departmentIds.map((departmentId) => [
      departmentId,
      {
        totalEmployees: activeEmployeesByDept.get(departmentId) ?? 0,
        managers: managersByDept.get(departmentId)?.size ?? 0,
        openPositions: openPositionsByDept.get(departmentId) ?? 0,
        usersCount: usersCountByDept.get(departmentId) ?? 0,
      },
    ]),
  );
}

export function buildDesignationMetrics(
  headcount: number,
  usersAssigned: number,
  isActive: boolean,
): DesignationMetrics {
  const vacantPositions = isActive ? Math.max(0, headcount - usersAssigned) : 0;
  return { usersAssigned, vacantPositions };
}
