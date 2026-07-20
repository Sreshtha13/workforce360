import { Prisma } from "@prisma/client";
import { OrganizationRepository } from "../repositories/organization.repository";
import { departmentManagerService } from "./department-manager.service";
import { prisma } from "../lib/prisma";
import type {
  CreateDepartmentData,
  CreateTeamData,
  CreateDesignationData,
  CreateOfficeData,
  CreateEmployeeTypeData,
  CreateEmploymentStatusData,
} from "../repositories/organization.repository";

export class OrganizationService {
  private orgRepo: OrganizationRepository;
  
  constructor() {
    this.orgRepo = new OrganizationRepository();
  }
  
  async getAllDepartments(companyId?: string) {
    return this.orgRepo.findAllDepartments(companyId);
  }
  
  async getDepartmentById(id: string) {
    const department = await this.orgRepo.findDepartmentById(id);
    if (!department) {
      throw new Error("Department not found");
    }
    return department;
  }
  
  async createDepartment(data: CreateDepartmentData) {
    if (data.managerId) {
      await departmentManagerService.validateManagerUser(data.managerId);
    }

    const department = await prisma.$transaction(async (tx) => {
      const created = await tx.department.create({ data });

      if (created.managerId) {
        await tx.user.updateMany({
          where: {
            departmentId: created.id,
            deletedAt: null,
            id: { not: created.managerId },
          },
          data: { managerId: created.managerId },
        });
      }

      return created;
    });

    return this.orgRepo.findDepartmentById(department.id);
  }
  
  async updateDepartment(id: string, data: Partial<CreateDepartmentData>) {
    const existing = await this.orgRepo.findDepartmentById(id);
    if (!existing) {
      throw new Error("Department not found");
    }

    if (data.managerId) {
      await departmentManagerService.validateManagerUser(data.managerId);
    }

    await prisma.$transaction(async (tx) => {
      await tx.department.update({ where: { id }, data });

      if (data.managerId !== undefined) {
        const nextManagerId = data.managerId ?? null;
        const previousManagerId = existing.managerId ?? null;

        if (nextManagerId === null && previousManagerId) {
          await departmentManagerService.assertCanRemoveDepartmentManager(id);
        }

        await departmentManagerService.syncMembersToDepartmentManager(
          id,
          nextManagerId,
          previousManagerId,
        );
      }
    });

    return this.orgRepo.findDepartmentById(id);
  }
  
  async deleteDepartment(id: string) {
    const existing = await this.orgRepo.findDepartmentById(id);
    if (!existing) {
      throw new Error("Department not found");
    }
    return this.orgRepo.deleteDepartment(id);
  }
  
  async getAllTeams(departmentId?: string) {
    return this.orgRepo.findAllTeams(departmentId);
  }
  
  async getTeamById(id: string) {
    const team = await this.orgRepo.findTeamById(id);
    if (!team) {
      throw new Error("Team not found");
    }
    return team;
  }
  
  private async validateTeamDepartmentAndLead(
    departmentId: string,
    leadId?: string | null,
  ): Promise<void> {
    const department = await this.orgRepo.findDepartmentById(departmentId);
    if (!department) {
      throw new Error("Department not found");
    }

    if (!leadId) {
      return;
    }

    const lead = await prisma.user.findFirst({
      where: { id: leadId, deletedAt: null, status: "active" },
      select: { id: true, departmentId: true },
    });

    if (!lead) {
      throw new Error("Team lead must be an active employee");
    }

    if (lead.departmentId !== departmentId) {
      throw new Error("Team lead must belong to the selected department");
    }
  }

  private mapTeamWriteError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return new Error("A team with this code already exists in the selected department");
      }
      if (error.code === "P2003") {
        return new Error("Invalid department or team lead reference");
      }
    }

    return error instanceof Error ? error : new Error("Failed to save team");
  }

  async createTeam(data: CreateTeamData) {
    await this.validateTeamDepartmentAndLead(data.departmentId, data.leadId);

    try {
      const team = await this.orgRepo.createTeam(data);
      return this.orgRepo.findTeamById(team.id);
    } catch (error) {
      throw this.mapTeamWriteError(error);
    }
  }
  
  async updateTeam(id: string, data: Partial<CreateTeamData>) {
    const existing = await this.orgRepo.findTeamById(id);
    if (!existing) {
      throw new Error("Team not found");
    }

    const departmentId = data.departmentId ?? existing.departmentId;
    const leadId =
      data.leadId !== undefined ? data.leadId ?? null : existing.leadId;

    await this.validateTeamDepartmentAndLead(departmentId, leadId);

    try {
      await this.orgRepo.updateTeam(id, data);
      return this.orgRepo.findTeamById(id);
    } catch (error) {
      throw this.mapTeamWriteError(error);
    }
  }
  
  async deleteTeam(id: string) {
    const existing = await this.orgRepo.findTeamById(id);
    if (!existing) {
      throw new Error("Team not found");
    }
    return this.orgRepo.deleteTeam(id);
  }
  
  async getAllDesignations(departmentId?: string) {
    return this.orgRepo.findAllDesignations(departmentId);
  }

  async getDesignationById(id: string) {
    const designation = await this.orgRepo.findDesignationById(id);
    if (!designation) {
      throw new Error("Designation not found");
    }
    return designation;
  }

  private async validateDesignationDepartment(departmentId: string): Promise<void> {
    const department = await this.orgRepo.findDepartmentById(departmentId);
    if (!department) {
      throw new Error("Department not found");
    }
  }

  private mapDesignationWriteError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return new Error("A designation with this code already exists");
      }
      if (error.code === "P2003") {
        return new Error("Invalid department reference");
      }
    }

    return error instanceof Error ? error : new Error("Failed to save designation");
  }

  async createDesignation(data: CreateDesignationData) {
    await this.validateDesignationDepartment(data.departmentId);

    try {
      const designation = await this.orgRepo.createDesignation(data);
      return this.orgRepo.findDesignationById(designation.id);
    } catch (error) {
      throw this.mapDesignationWriteError(error);
    }
  }

  async updateDesignation(id: string, data: Partial<CreateDesignationData>) {
    const existing = await this.orgRepo.findDesignationById(id);
    if (!existing) {
      throw new Error("Designation not found");
    }

    if (data.departmentId) {
      await this.validateDesignationDepartment(data.departmentId);
    }

    try {
      await this.orgRepo.updateDesignation(id, data);
      return this.orgRepo.findDesignationById(id);
    } catch (error) {
      throw this.mapDesignationWriteError(error);
    }
  }
  
  async deleteDesignation(id: string) {
    const existing = await this.orgRepo.findDesignationById(id);
    if (!existing) {
      throw new Error("Designation not found");
    }
    return this.orgRepo.deleteDesignation(id);
  }
  
  async getAllOffices(companyId?: string) {
    return this.orgRepo.findAllOffices(companyId);
  }
  
  async getOfficeById(id: string) {
    const office = await this.orgRepo.findOfficeById(id);
    if (!office) {
      throw new Error("Office not found");
    }
    return office;
  }
  
  async createOffice(data: CreateOfficeData) {
    return this.orgRepo.createOffice(data);
  }
  
  async updateOffice(id: string, data: Partial<CreateOfficeData>) {
    const existing = await this.orgRepo.findOfficeById(id);
    if (!existing) {
      throw new Error("Office not found");
    }
    return this.orgRepo.updateOffice(id, data);
  }
  
  async deleteOffice(id: string) {
    const existing = await this.orgRepo.findOfficeById(id);
    if (!existing) {
      throw new Error("Office not found");
    }
    return this.orgRepo.deleteOffice(id);
  }
  
  async getAllEmployeeTypes() {
    return this.orgRepo.findAllEmployeeTypes();
  }
  
  async getEmployeeTypeById(id: string) {
    const employeeType = await this.orgRepo.findEmployeeTypeById(id);
    if (!employeeType) {
      throw new Error("Employee type not found");
    }
    return employeeType;
  }
  
  async createEmployeeType(data: CreateEmployeeTypeData) {
    return this.orgRepo.createEmployeeType(data);
  }
  
  async updateEmployeeType(id: string, data: Partial<CreateEmployeeTypeData>) {
    const existing = await this.orgRepo.findEmployeeTypeById(id);
    if (!existing) {
      throw new Error("Employee type not found");
    }
    return this.orgRepo.updateEmployeeType(id, data);
  }
  
  async deleteEmployeeType(id: string) {
    const existing = await this.orgRepo.findEmployeeTypeById(id);
    if (!existing) {
      throw new Error("Employee type not found");
    }
    return this.orgRepo.deleteEmployeeType(id);
  }
  
  async getAllEmploymentStatuses() {
    return this.orgRepo.findAllEmploymentStatuses();
  }
  
  async getEmploymentStatusById(id: string) {
    const status = await this.orgRepo.findEmploymentStatusById(id);
    if (!status) {
      throw new Error("Employment status not found");
    }
    return status;
  }
  
  async createEmploymentStatus(data: CreateEmploymentStatusData) {
    return this.orgRepo.createEmploymentStatus(data);
  }
  
  async updateEmploymentStatus(id: string, data: Partial<CreateEmploymentStatusData>) {
    const existing = await this.orgRepo.findEmploymentStatusById(id);
    if (!existing) {
      throw new Error("Employment status not found");
    }
    return this.orgRepo.updateEmploymentStatus(id, data);
  }
  
  async deleteEmploymentStatus(id: string) {
    const existing = await this.orgRepo.findEmploymentStatusById(id);
    if (!existing) {
      throw new Error("Employment status not found");
    }
    return this.orgRepo.deleteEmploymentStatus(id);
  }
}
