import { OrganizationRepository } from "../repositories/organization.repository";
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
    return this.orgRepo.createDepartment(data);
  }
  
  async updateDepartment(id: string, data: Partial<CreateDepartmentData>) {
    const existing = await this.orgRepo.findDepartmentById(id);
    if (!existing) {
      throw new Error("Department not found");
    }
    return this.orgRepo.updateDepartment(id, data);
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
  
  async createTeam(data: CreateTeamData) {
    return this.orgRepo.createTeam(data);
  }
  
  async updateTeam(id: string, data: Partial<CreateTeamData>) {
    const existing = await this.orgRepo.findTeamById(id);
    if (!existing) {
      throw new Error("Team not found");
    }
    return this.orgRepo.updateTeam(id, data);
  }
  
  async deleteTeam(id: string) {
    const existing = await this.orgRepo.findTeamById(id);
    if (!existing) {
      throw new Error("Team not found");
    }
    return this.orgRepo.deleteTeam(id);
  }
  
  async getAllDesignations() {
    return this.orgRepo.findAllDesignations();
  }
  
  async getDesignationById(id: string) {
    const designation = await this.orgRepo.findDesignationById(id);
    if (!designation) {
      throw new Error("Designation not found");
    }
    return designation;
  }
  
  async createDesignation(data: CreateDesignationData) {
    return this.orgRepo.createDesignation(data);
  }
  
  async updateDesignation(id: string, data: Partial<CreateDesignationData>) {
    const existing = await this.orgRepo.findDesignationById(id);
    if (!existing) {
      throw new Error("Designation not found");
    }
    return this.orgRepo.updateDesignation(id, data);
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
