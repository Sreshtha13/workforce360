import { Router } from "express";
import { OrganizationController } from "../controllers/organization.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createTeamSchema,
  updateTeamSchema,
  createDesignationSchema,
  updateDesignationSchema,
  createOfficeSchema,
  updateOfficeSchema,
  createEmployeeTypeSchema,
  updateEmployeeTypeSchema,
  createEmploymentStatusSchema,
  updateEmploymentStatusSchema,
} from "../schemas/organization.schema";

const router = Router();
const orgController = new OrganizationController();

router.get("/departments", requireAuth, orgController.getDepartments);
router.get("/departments/:id", requireAuth, orgController.getDepartmentById);
router.post(
  "/departments",
  requireAuth,
  requirePermission("department.create"),
  validate(createDepartmentSchema),
  orgController.createDepartment,
);
router.put(
  "/departments/:id",
  requireAuth,
  requirePermission("department.update"),
  validate(updateDepartmentSchema),
  orgController.updateDepartment,
);
router.delete(
  "/departments/:id",
  requireAuth,
  requirePermission("department.delete"),
  orgController.deleteDepartment,
);

router.get("/teams", requireAuth, orgController.getTeams);
router.get("/teams/:id", requireAuth, orgController.getTeamById);
router.post(
  "/teams",
  requireAuth,
  requirePermission("team.create"),
  validate(createTeamSchema),
  orgController.createTeam,
);
router.put(
  "/teams/:id",
  requireAuth,
  requirePermission("team.update"),
  validate(updateTeamSchema),
  orgController.updateTeam,
);
router.delete(
  "/teams/:id",
  requireAuth,
  requirePermission("team.delete"),
  orgController.deleteTeam,
);

router.get("/designations", requireAuth, orgController.getDesignations);
router.get("/designations/:id", requireAuth, orgController.getDesignationById);
router.post(
  "/designations",
  requireAuth,
  requirePermission("designation.create"),
  validate(createDesignationSchema),
  orgController.createDesignation,
);
router.put(
  "/designations/:id",
  requireAuth,
  requirePermission("designation.update"),
  validate(updateDesignationSchema),
  orgController.updateDesignation,
);
router.delete(
  "/designations/:id",
  requireAuth,
  requirePermission("designation.delete"),
  orgController.deleteDesignation,
);

router.get("/offices", requireAuth, orgController.getOffices);
router.get("/offices/:id", requireAuth, orgController.getOfficeById);
router.post(
  "/offices",
  requireAuth,
  requirePermission("office.create"),
  validate(createOfficeSchema),
  orgController.createOffice,
);
router.put(
  "/offices/:id",
  requireAuth,
  requirePermission("office.update"),
  validate(updateOfficeSchema),
  orgController.updateOffice,
);
router.delete(
  "/offices/:id",
  requireAuth,
  requirePermission("office.delete"),
  orgController.deleteOffice,
);

router.get("/employee-types", requireAuth, orgController.getEmployeeTypes);
router.get("/employee-types/:id", requireAuth, orgController.getEmployeeTypeById);
router.post(
  "/employee-types",
  requireAuth,
  requirePermission("employee_type.create"),
  validate(createEmployeeTypeSchema),
  orgController.createEmployeeType,
);
router.put(
  "/employee-types/:id",
  requireAuth,
  requirePermission("employee_type.update"),
  validate(updateEmployeeTypeSchema),
  orgController.updateEmployeeType,
);
router.delete(
  "/employee-types/:id",
  requireAuth,
  requirePermission("employee_type.delete"),
  orgController.deleteEmployeeType,
);

router.get("/employment-statuses", requireAuth, orgController.getEmploymentStatuses);
router.get("/employment-statuses/:id", requireAuth, orgController.getEmploymentStatusById);
router.post(
  "/employment-statuses",
  requireAuth,
  requirePermission("employment_status.create"),
  validate(createEmploymentStatusSchema),
  orgController.createEmploymentStatus,
);
router.put(
  "/employment-statuses/:id",
  requireAuth,
  requirePermission("employment_status.update"),
  validate(updateEmploymentStatusSchema),
  orgController.updateEmploymentStatus,
);
router.delete(
  "/employment-statuses/:id",
  requireAuth,
  requirePermission("employment_status.delete"),
  orgController.deleteEmploymentStatus,
);

export { router as organizationRouter };
