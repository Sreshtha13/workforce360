import { prisma } from "../lib/prisma";

const userManagerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

export class DepartmentManagerService {
  async validateManagerUser(managerId: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: managerId, deletedAt: null, status: "active" },
      select: { id: true },
    });

    if (!user) {
      throw new Error("Manager must be an active user");
    }
  }

  async validateNoReportingCycle(userId: string, managerId: string): Promise<void> {
    if (userId === managerId) {
      throw new Error("A user cannot be their own manager");
    }

    let currentId: string | null = managerId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === userId) {
        throw new Error("Manager assignment would create a reporting cycle");
      }
      if (visited.has(currentId)) break;
      visited.add(currentId);

      const current = await prisma.user.findUnique({
        where: { id: currentId },
        select: { managerId: true },
      });
      currentId = current?.managerId ?? null;
    }
  }

  async assertUserCanBeDeleted(userId: string): Promise<void> {
    const managedDepartments = await prisma.department.findMany({
      where: { managerId: userId, deletedAt: null },
      select: { name: true },
    });

    if (managedDepartments.length > 0) {
      const names = managedDepartments.map((d) => d.name).join(", ");
      throw new Error(
        `Cannot delete user: they manage ${managedDepartments.length} department(s) (${names}). Reassign department manager(s) first.`,
      );
    }
  }

  async assertCanRemoveDepartmentManager(departmentId: string): Promise<void> {
    const memberCount = await prisma.user.count({
      where: { departmentId, deletedAt: null },
    });

    if (memberCount > 0) {
      throw new Error(
        "Cannot remove the department manager while the department has members. Assign a replacement manager first.",
      );
    }
  }

  /** Align department members' User.managerId with Department.managerId. */
  async syncMembersToDepartmentManager(
    departmentId: string,
    managerId: string | null,
    previousManagerId?: string | null,
  ): Promise<number> {
    if (managerId) {
      const result = await prisma.user.updateMany({
        where: {
          departmentId,
          deletedAt: null,
          id: { not: managerId },
        },
        data: { managerId },
      });
      return result.count;
    }

    if (previousManagerId) {
      const result = await prisma.user.updateMany({
        where: {
          departmentId,
          deletedAt: null,
          managerId: previousManagerId,
        },
        data: { managerId: null },
      });
      return result.count;
    }

    return 0;
  }

  /** Derive reporting manager when a user joins or moves departments. */
  async resolveManagerForDepartmentAssignment(
    userId: string,
    departmentId: string,
  ): Promise<string | null> {
    const department = await prisma.department.findFirst({
      where: { id: departmentId, deletedAt: null },
      select: { managerId: true },
    });

    if (!department?.managerId || department.managerId === userId) {
      return null;
    }

    await this.validateNoReportingCycle(userId, department.managerId);
    return department.managerId;
  }

  /** Clear reporting manager when leaving a department whose head was the manager. */
  async resolveManagerAfterDepartmentRemoval(
    userId: string,
    previousDepartmentId: string,
    currentManagerId: string | null,
  ): Promise<string | null | undefined> {
    const previousDepartment = await prisma.department.findFirst({
      where: { id: previousDepartmentId, deletedAt: null },
      select: { managerId: true },
    });

    if (previousDepartment?.managerId && currentManagerId === previousDepartment.managerId) {
      return null;
    }

    return undefined;
  }

  getUserManagerSelect() {
    return userManagerSelect;
  }
}

export const departmentManagerService = new DepartmentManagerService();
