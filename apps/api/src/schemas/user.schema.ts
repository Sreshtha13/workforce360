import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  phone: z.string().max(50).optional(),
  employeeId: z.string().max(50).optional(),
  dateOfBirth: z.string().datetime().optional(),
  dateOfJoining: z.string().datetime().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  officeId: z.string().optional(),
  employeeTypeId: z.string().optional(),
  employmentStatusId: z.string().optional(),
  managerId: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export const assignRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
});

export const removeRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type RemoveRoleInput = z.infer<typeof removeRoleSchema>;
