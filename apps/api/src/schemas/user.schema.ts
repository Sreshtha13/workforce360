import { z } from "zod";
import { USER_ACCOUNT_STATUSES } from "../constants/user-status";

const userAccountStatusSchema = z.enum(USER_ACCOUNT_STATUSES);

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  phone: z.string().max(50).optional(),
  employeeId: z.string().max(50).optional(),
  status: userAccountStatusSchema.optional().default("active"),
  dateOfBirth: z.string().datetime().optional(),
  dateOfJoining: z.string().datetime().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  officeId: z.string().optional(),
  employeeTypeId: z.string().optional(),
  employmentStatusId: z.string().nullable().optional(),
  managerId: z.string().optional(),
});

export const updateUserSchema = createUserSchema
  .partial()
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    employmentStatusId: z.string().nullable().optional(),
    status: userAccountStatusSchema.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field is required to update" },
  );

export const assignRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
});

export const removeRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
});

export const listUsersQuerySchema = z.object({
  departmentId: z.string().optional(),
  status: z.enum(USER_ACCOUNT_STATUSES).optional(),
  search: z.string().optional(),
  includeDeleted: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type RemoveRoleInput = z.infer<typeof removeRoleSchema>;
