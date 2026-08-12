/** Frontend mirror of backend entity shapes (apps/api is source of truth). */

export type NamedEntity = {
  id: string;
  name: string;
  code?: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  status?: string;
  employeeId?: string | null;
  department?: NamedEntity | null;
  designation?: NamedEntity | null;
  office?: NamedEntity | null;
  employeeType?: NamedEntity | null;
  employmentStatus?: NamedEntity | null;
  roles: { id: string; name: string; code?: string | null }[];
  permissions: string[];
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: "active" | "inactive" | "suspended";
  employeeId?: string | null;
  department?: NamedEntity | null;
  designation?: NamedEntity | null;
  office?: NamedEntity | null;
  employeeType?: NamedEntity | null;
  employmentStatus?: NamedEntity | null;
  userRoles: { role: { id: string; name: string; code?: string | null } }[];
};

export type UserSummary = Pick<User, "id" | "firstName" | "lastName">;

export type CreateUserInput = {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  departmentId?: string;
  designationId?: string;
  officeId?: string;
  employeeTypeId?: string;
  employmentStatusId?: string;
  managerId?: string;
};

export type UpdateUserInput = Partial<CreateUserInput> & {
  status?: "active" | "inactive" | "suspended";
};

export type Role = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  _count?: { userRoles: number; rolePermissions: number };
};

export type CreateRoleInput = {
  name: string;
  code?: string;
  description?: string;
  isSystem?: boolean;
  requiresMfa?: boolean;
};

export type UpdateRoleInput = Partial<CreateRoleInput>;

export type Permission = {
  id: string;
  name: string;
  code: string;
  resource: string;
  action: string;
  description?: string | null;
  isActive?: boolean;
};

export type RolePermission = {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
};

export type Department = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  manager?: { firstName: string; lastName: string } | null;
  parent?: { name: string } | null;
  _count?: { teams: number; users: number };
};

export type CreateDepartmentInput = {
  companyId: string;
  name: string;
  code?: string;
  description?: string;
  managerId?: string;
  parentId?: string;
};

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

export type Team = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  department?: NamedEntity | null;
  lead?: { firstName: string; lastName: string } | null;
  _count?: { members: number };
};

export type CreateTeamInput = {
  departmentId: string;
  name: string;
  code?: string;
  description?: string;
  leadId?: string;
  memberIds?: string[];
};

export type UpdateTeamInput = Partial<CreateTeamInput>;

export type Designation = NamedEntity & {
  level?: number | null;
  description?: string | null;
  isActive?: boolean;
};

export type CreateDesignationInput = {
  name: string;
  code?: string;
  level?: number;
  description?: string;
};

export type UpdateDesignationInput = Partial<CreateDesignationInput>;

export type Office = NamedEntity & {
  type?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
};

export type CreateOfficeInput = {
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

export type UpdateOfficeInput = Partial<CreateOfficeInput>;

export type EmployeeType = NamedEntity & {
  description?: string | null;
  isActive?: boolean;
};

export type CreateEmployeeTypeInput = {
  name: string;
  code?: string;
  description?: string;
};

export type UpdateEmployeeTypeInput = Partial<CreateEmployeeTypeInput>;

export type EmploymentStatus = NamedEntity & {
  description?: string | null;
  isActive?: boolean;
};

export type CreateEmploymentStatusInput = {
  name: string;
  code?: string;
  description?: string;
};

export type UpdateEmploymentStatusInput = Partial<CreateEmploymentStatusInput>;
