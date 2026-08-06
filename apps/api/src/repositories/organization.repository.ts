import { prisma } from "../lib/prisma";
import {
  activeEmployeeFilter,
  activeUserSummarySelect,
  buildDesignationMetrics,
  getDepartmentMetricsByIds,
  linkedUserFilter,
  sanitizeUserReference,
} from "../lib/organization-metrics";
import type { Department, Team, Designation, Office, EmployeeType, EmploymentStatus } from "@prisma/client";

export type CreateDepartmentData = {
  companyId: string;
  name: string;
  code?: string;
  description?: string;
  managerId?: string | null;
  parentId?: string | null;
};

export type CreateTeamData = {
  departmentId: string;
  name: string;
  code?: string;
  description?: string;
  leadId?: string | null;
  memberIds?: string[];
};

export type CreateDesignationData = {
  departmentId: string;
  name: string;
  code?: string;
  level: number;
  headcount?: number;
  description?: string;
};

export type CreateOfficeData = {
  companyId: string;
  name: string;
  code?: string;
  type?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
};

export type CreateEmployeeTypeData = {
  name: string;
  code: string;
  description?: string;
};

export type CreateEmploymentStatusData = {
  name: string;
  code?: string;
  description?: string;
};

export class OrganizationRepository {
  async findAllDepartments(companyId?: string) {
    const departments = await prisma.department.findMany({
      where: { deletedAt: null, ...(companyId && { companyId }) },
      include: {
        manager: { select: activeUserSummarySelect },
        parent: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const metricsByDepartment = await getDepartmentMetricsByIds(departments.map((department) => department.id));

    return departments.map((department) => ({
      ...department,
      manager: sanitizeUserReference(department.manager),
      metrics: metricsByDepartment.get(department.id) ?? {
        totalEmployees: 0,
        managers: 0,
        openPositions: 0,
        usersCount: 0,
      },
    }));
  }
  
  async findDepartmentById(id: string) {
    const department = await prisma.department.findUnique({
      where: { id, deletedAt: null },
      include: {
        manager: { select: activeUserSummarySelect },
        parent: { select: { id: true, name: true } },
        children: { where: { deletedAt: null } },
        teams: { where: { deletedAt: null } },
      },
    });

    if (!department) {
      return null;
    }

    return {
      ...department,
      manager: sanitizeUserReference(department.manager),
    };
  }
  
  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    return prisma.department.create({ data });
  }
  
  async updateDepartment(id: string, data: Partial<CreateDepartmentData>): Promise<Department> {
    return prisma.department.update({ where: { id }, data });
  }
  
  async deleteDepartment(id: string): Promise<Department> {
    return prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  
  async findAllTeams(departmentId?: string) {
    const teams = await prisma.team.findMany({
      where: { deletedAt: null, ...(departmentId && { departmentId }) },
      include: {
        department: { select: { id: true, name: true } },
        lead: { select: activeUserSummarySelect },
        _count: { select: { members: { where: { deletedAt: null, user: linkedUserFilter } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return teams.map((team) => ({
      ...team,
      lead: sanitizeUserReference(team.lead),
    }));
  }
  
  async findTeamById(id: string) {
    const team = await prisma.team.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: { select: { id: true, name: true } },
        lead: { select: activeUserSummarySelect },
        members: {
          where: { deletedAt: null, user: linkedUserFilter },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!team) {
      return null;
    }

    return {
      ...team,
      lead: sanitizeUserReference(team.lead),
    };
  }
  
  async createTeam(data: CreateTeamData): Promise<Team> {
    return prisma.team.create({ data });
  }
  
  async updateTeam(id: string, data: Partial<CreateTeamData>): Promise<Team> {
    return prisma.team.update({ where: { id }, data });
  }
  
  async deleteTeam(id: string): Promise<Team> {
    return prisma.team.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async setTeamMembers(teamId: string, userIds: string[]): Promise<void> {
    const existing = await prisma.teamMember.findMany({
      where: { teamId, deletedAt: null },
      select: { id: true, userId: true },
    });

    const targetSet = new Set(userIds);
    const existingSet = new Set(existing.map((m) => m.userId));

    const toRemove = existing.filter((m) => !targetSet.has(m.userId));
    const toAdd = userIds.filter((id) => !existingSet.has(id));

    await prisma.$transaction([
      ...toRemove.map((m) =>
        prisma.teamMember.update({
          where: { id: m.id },
          data: { deletedAt: new Date(), leftAt: new Date() },
        }),
      ),
      ...toAdd.map((userId) =>
        prisma.teamMember.create({
          data: { teamId, userId },
        }),
      ),
    ]);
  }
  
  async findAllDesignations(departmentId?: string) {
    const designations = await prisma.designation.findMany({
      where: { deletedAt: null, ...(departmentId && { departmentId }) },
      include: {
        department: { select: { id: true, name: true } },
        _count: {
          select: {
            users: { where: activeEmployeeFilter },
          },
        },
      },
      orderBy: [{ department: { name: "asc" } }, { level: "asc" }, { name: "asc" }],
    });

    return designations.map((designation) => ({
      ...designation,
      metrics: buildDesignationMetrics(
        designation.headcount,
        designation._count.users,
        designation.isActive,
      ),
    }));
  }

  async findDesignationById(id: string) {
    const designation = await prisma.designation.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: { select: { id: true, name: true } },
        _count: {
          select: {
            users: { where: activeEmployeeFilter },
          },
        },
      },
    });

    if (!designation) {
      return null;
    }

    return {
      ...designation,
      metrics: buildDesignationMetrics(
        designation.headcount,
        designation._count.users,
        designation.isActive,
      ),
    };
  }
  
  async createDesignation(data: CreateDesignationData): Promise<Designation> {
    return prisma.designation.create({ data });
  }
  
  async updateDesignation(id: string, data: Partial<CreateDesignationData>): Promise<Designation> {
    return prisma.designation.update({ where: { id }, data });
  }
  
  async deleteDesignation(id: string): Promise<Designation> {
    return prisma.designation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  
  async findAllOffices(companyId?: string) {
    return prisma.office.findMany({
      where: { deletedAt: null, ...(companyId && { companyId }) },
      include: {
        _count: { select: { users: { where: linkedUserFilter } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  
  async findOfficeById(id: string) {
    return prisma.office.findUnique({
      where: { id, deletedAt: null },
    });
  }
  
  async createOffice(data: CreateOfficeData): Promise<Office> {
    return prisma.office.create({ data });
  }
  
  async updateOffice(id: string, data: Partial<CreateOfficeData>): Promise<Office> {
    return prisma.office.update({ where: { id }, data });
  }
  
  async deleteOffice(id: string): Promise<Office> {
    return prisma.office.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  
  async findAllEmployeeTypes() {
    return prisma.employeeType.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { users: { where: linkedUserFilter } } },
      },
      orderBy: { name: "asc" },
    });
  }
  
  async findEmployeeTypeById(id: string) {
    return prisma.employeeType.findUnique({
      where: { id, deletedAt: null },
    });
  }
  
  async createEmployeeType(data: CreateEmployeeTypeData): Promise<EmployeeType> {
    return prisma.employeeType.create({ data });
  }
  
  async updateEmployeeType(id: string, data: Partial<CreateEmployeeTypeData>): Promise<EmployeeType> {
    return prisma.employeeType.update({ where: { id }, data });
  }
  
  async deleteEmployeeType(id: string): Promise<EmployeeType> {
    return prisma.employeeType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  
  async findAllEmploymentStatuses() {
    return prisma.employmentStatus.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { users: { where: linkedUserFilter } } },
      },
      orderBy: { name: "asc" },
    });
  }
  
  async findEmploymentStatusById(id: string) {
    return prisma.employmentStatus.findUnique({
      where: { id, deletedAt: null },
    });
  }
  
  async createEmploymentStatus(data: CreateEmploymentStatusData): Promise<EmploymentStatus> {
    return prisma.employmentStatus.create({ data });
  }
  
  async updateEmploymentStatus(id: string, data: Partial<CreateEmploymentStatusData>): Promise<EmploymentStatus> {
    return prisma.employmentStatus.update({ where: { id }, data });
  }
  
  async deleteEmploymentStatus(id: string): Promise<EmploymentStatus> {
    return prisma.employmentStatus.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
