import type { Request, Response } from "express";
import { OrganizationService } from "../services/organization.service";
import { sendSuccess, sendError } from "../lib/response";

export class OrganizationController {
  private orgService: OrganizationService;
  
  constructor() {
    this.orgService = new OrganizationService();
  }
  
  getDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyId } = req.query;
      const departments = await this.orgService.getAllDepartments(companyId as string);
      sendSuccess(res, departments);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_DEPARTMENTS_FAILED",
        message: error instanceof Error ? error.message : "Failed to get departments",
      });
    }
  };
  
  getDepartmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const department = await this.orgService.getDepartmentById(id);
      sendSuccess(res, department);
    } catch (error) {
      sendError(res, 404, {
        code: "DEPARTMENT_NOT_FOUND",
        message: error instanceof Error ? error.message : "Department not found",
      });
    }
  };
  
  createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const department = await this.orgService.createDepartment(req.body);
      sendSuccess(res, department, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_DEPARTMENT_FAILED",
        message: error instanceof Error ? error.message : "Failed to create department",
      });
    }
  };
  
  updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const department = await this.orgService.updateDepartment(id, req.body);
      sendSuccess(res, department);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_DEPARTMENT_FAILED",
        message: error instanceof Error ? error.message : "Failed to update department",
      });
    }
  };
  
  deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.orgService.deleteDepartment(id);
      sendSuccess(res, { message: "Department deleted successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "DELETE_DEPARTMENT_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete department",
      });
    }
  };
  
  getTeams = async (req: Request, res: Response): Promise<void> => {
    try {
      const { departmentId } = req.query;
      const teams = await this.orgService.getAllTeams(departmentId as string);
      sendSuccess(res, teams);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_TEAMS_FAILED",
        message: error instanceof Error ? error.message : "Failed to get teams",
      });
    }
  };
  
  getTeamById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const team = await this.orgService.getTeamById(id);
      sendSuccess(res, team);
    } catch (error) {
      sendError(res, 404, {
        code: "TEAM_NOT_FOUND",
        message: error instanceof Error ? error.message : "Team not found",
      });
    }
  };
  
  createTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const team = await this.orgService.createTeam(req.body);
      sendSuccess(res, team, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_TEAM_FAILED",
        message: error instanceof Error ? error.message : "Failed to create team",
      });
    }
  };
  
  updateTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const team = await this.orgService.updateTeam(id, req.body);
      sendSuccess(res, team);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_TEAM_FAILED",
        message: error instanceof Error ? error.message : "Failed to update team",
      });
    }
  };
  
  deleteTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.orgService.deleteTeam(id);
      sendSuccess(res, { message: "Team deleted successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "DELETE_TEAM_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete team",
      });
    }
  };
  
  getDesignations = async (req: Request, res: Response): Promise<void> => {
    try {
      const designations = await this.orgService.getAllDesignations();
      sendSuccess(res, designations);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_DESIGNATIONS_FAILED",
        message: error instanceof Error ? error.message : "Failed to get designations",
      });
    }
  };
  
  getDesignationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const designation = await this.orgService.getDesignationById(id);
      sendSuccess(res, designation);
    } catch (error) {
      sendError(res, 404, {
        code: "DESIGNATION_NOT_FOUND",
        message: error instanceof Error ? error.message : "Designation not found",
      });
    }
  };
  
  createDesignation = async (req: Request, res: Response): Promise<void> => {
    try {
      const designation = await this.orgService.createDesignation(req.body);
      sendSuccess(res, designation, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_DESIGNATION_FAILED",
        message: error instanceof Error ? error.message : "Failed to create designation",
      });
    }
  };
  
  updateDesignation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const designation = await this.orgService.updateDesignation(id, req.body);
      sendSuccess(res, designation);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_DESIGNATION_FAILED",
        message: error instanceof Error ? error.message : "Failed to update designation",
      });
    }
  };
  
  deleteDesignation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.orgService.deleteDesignation(id);
      sendSuccess(res, { message: "Designation deleted successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "DELETE_DESIGNATION_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete designation",
      });
    }
  };
  
  getOffices = async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyId } = req.query;
      const offices = await this.orgService.getAllOffices(companyId as string);
      sendSuccess(res, offices);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_OFFICES_FAILED",
        message: error instanceof Error ? error.message : "Failed to get offices",
      });
    }
  };
  
  getOfficeById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const office = await this.orgService.getOfficeById(id);
      sendSuccess(res, office);
    } catch (error) {
      sendError(res, 404, {
        code: "OFFICE_NOT_FOUND",
        message: error instanceof Error ? error.message : "Office not found",
      });
    }
  };
  
  createOffice = async (req: Request, res: Response): Promise<void> => {
    try {
      const office = await this.orgService.createOffice(req.body);
      sendSuccess(res, office, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_OFFICE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create office",
      });
    }
  };
  
  updateOffice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const office = await this.orgService.updateOffice(id, req.body);
      sendSuccess(res, office);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_OFFICE_FAILED",
        message: error instanceof Error ? error.message : "Failed to update office",
      });
    }
  };
  
  deleteOffice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.orgService.deleteOffice(id);
      sendSuccess(res, { message: "Office deleted successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "DELETE_OFFICE_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete office",
      });
    }
  };
  
  getEmployeeTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const employeeTypes = await this.orgService.getAllEmployeeTypes();
      sendSuccess(res, employeeTypes);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_EMPLOYEE_TYPES_FAILED",
        message: error instanceof Error ? error.message : "Failed to get employee types",
      });
    }
  };
  
  getEmployeeTypeById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const employeeType = await this.orgService.getEmployeeTypeById(id);
      sendSuccess(res, employeeType);
    } catch (error) {
      sendError(res, 404, {
        code: "EMPLOYEE_TYPE_NOT_FOUND",
        message: error instanceof Error ? error.message : "Employee type not found",
      });
    }
  };
  
  createEmployeeType = async (req: Request, res: Response): Promise<void> => {
    try {
      const employeeType = await this.orgService.createEmployeeType(req.body);
      sendSuccess(res, employeeType, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_EMPLOYEE_TYPE_FAILED",
        message: error instanceof Error ? error.message : "Failed to create employee type",
      });
    }
  };
  
  updateEmployeeType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const employeeType = await this.orgService.updateEmployeeType(id, req.body);
      sendSuccess(res, employeeType);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_EMPLOYEE_TYPE_FAILED",
        message: error instanceof Error ? error.message : "Failed to update employee type",
      });
    }
  };
  
  deleteEmployeeType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.orgService.deleteEmployeeType(id);
      sendSuccess(res, { message: "Employee type deleted successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "DELETE_EMPLOYEE_TYPE_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete employee type",
      });
    }
  };
  
  getEmploymentStatuses = async (req: Request, res: Response): Promise<void> => {
    try {
      const statuses = await this.orgService.getAllEmploymentStatuses();
      sendSuccess(res, statuses);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_EMPLOYMENT_STATUSES_FAILED",
        message: error instanceof Error ? error.message : "Failed to get employment statuses",
      });
    }
  };
  
  getEmploymentStatusById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const status = await this.orgService.getEmploymentStatusById(id);
      sendSuccess(res, status);
    } catch (error) {
      sendError(res, 404, {
        code: "EMPLOYMENT_STATUS_NOT_FOUND",
        message: error instanceof Error ? error.message : "Employment status not found",
      });
    }
  };
  
  createEmploymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.orgService.createEmploymentStatus(req.body);
      sendSuccess(res, status, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_EMPLOYMENT_STATUS_FAILED",
        message: error instanceof Error ? error.message : "Failed to create employment status",
      });
    }
  };
  
  updateEmploymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const status = await this.orgService.updateEmploymentStatus(id, req.body);
      sendSuccess(res, status);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_EMPLOYMENT_STATUS_FAILED",
        message: error instanceof Error ? error.message : "Failed to update employment status",
      });
    }
  };
  
  deleteEmploymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.orgService.deleteEmploymentStatus(id);
      sendSuccess(res, { message: "Employment status deleted successfully" });
    } catch (error) {
      sendError(res, 400, {
        code: "DELETE_EMPLOYMENT_STATUS_FAILED",
        message: error instanceof Error ? error.message : "Failed to delete employment status",
      });
    }
  };
}
