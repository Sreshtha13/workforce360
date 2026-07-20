import { prisma } from "../lib/prisma";
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
};

export type CreateDesignationData = {
  name: string;
  code?: string;
  level?: number;
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
  code?: string;
  description?: string;
};

export type CreateEmploymentStatusData = {
  name: string;
  code?: string;
  description?: string;
};

export class OrganizationRepository {
  async findAllDepartments(companyId?: string) {
    return prisma.department.findMany({
      where: { deletedAt: null, ...(companyId && { companyId }) },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, teams: true, users: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  
  async findDepartmentById(id: string) {
    return prisma.department.findUnique({
      where: { id, deletedAt: null },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, name: true } },
        children: { where: { deletedAt: null } },
        teams: { where: { deletedAt: null } },
      },
    });
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
    return prisma.team.findMany({
      where: { deletedAt: null, ...(departmentId && { departmentId }) },
      include: {
        department: { select: { id: true, name: true } },
        lead: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  
  async findTeamById(id: string) {
    return prisma.team.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: { select: { id: true, name: true } },
        lead: { select: { id: true, firstName: true, lastName: true, email: true } },
        members: {
          where: { deletedAt: null },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
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
  
  async findAllDesignations() {
    return prisma.designation.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { users: true } },
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });
  }
  
  async findDesignationById(id: string) {
    return prisma.designation.findUnique({
      where: { id, deletedAt: null },
    });
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
        _count: { select: { users: true } },
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
        _count: { select: { users: true } },
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
        _count: { select: { users: true } },
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
