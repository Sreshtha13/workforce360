import { z } from "zod";

export const createDepartmentSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  managerId: z.string().optional(),
  parentId: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const createTeamSchema = z.object({
  departmentId: z.string().min(1),
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  leadId: z.string().optional(),
});

export const updateTeamSchema = createTeamSchema.partial();

export const createDesignationSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  level: z.number().int().optional(),
  description: z.string().optional(),
});

export const updateDesignationSchema = createDesignationSchema.partial();

export const createOfficeSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  type: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
});

export const updateOfficeSchema = createOfficeSchema.partial();

export const createEmployeeTypeSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
});

export const updateEmployeeTypeSchema = createEmployeeTypeSchema.partial();

export const createEmploymentStatusSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
});

export const updateEmploymentStatusSchema = createEmploymentStatusSchema.partial();

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
export type CreateOfficeInput = z.infer<typeof createOfficeSchema>;
export type UpdateOfficeInput = z.infer<typeof updateOfficeSchema>;
export type CreateEmployeeTypeInput = z.infer<typeof createEmployeeTypeSchema>;
export type UpdateEmployeeTypeInput = z.infer<typeof updateEmployeeTypeSchema>;
export type CreateEmploymentStatusInput = z.infer<typeof createEmploymentStatusSchema>;
export type UpdateEmploymentStatusInput = z.infer<typeof updateEmploymentStatusSchema>;
