/**
 * Canonical RBAC expectations for system roles (source of truth for tests).
 * Keep in sync with apps/api/db/seed.ts permission assignments.
 *
 * Notes:
 * - Super Admin receives every permission at seed time (not listed exhaustively).
 * - Administrator receives all permissions except role/permission write actions.
 * - Developer visibility of people lists is further restricted by employee-scope
 *   (team peers only) even when user.read / employee.read are granted.
 * - Project/board ACL is out of scope until the project module exists.
 */

export const SYSTEM_ROLE_CODES = [
  "super_admin",
  "admin",
  "hr",
  "employee",
  "candidate",
  "developer",
] as const;

export type SystemRoleCode = (typeof SYSTEM_ROLE_CODES)[number];

/** Permissions every Administrator must have (and Developers must not). */
export const ADMIN_DASHBOARD_PERMISSION = "dashboard.read";

export const DEVELOPER_PERMISSIONS = [
  "portal.read",
  "portal.update",
  "user.read",
  "employee.read",
  "team.read",
  "department.read",
  "designation.read",
  "ticket.create",
] as const;

export const EMPLOYEE_PERMISSIONS = [
  "portal.read",
  "portal.update",
  "ticket.create",
] as const;

export const CANDIDATE_PERMISSIONS = ["portal.read", "portal.update"] as const;

/** HR resources granted wholesale in seed (all actions for these resources). */
export const HR_RESOURCES = [
  "user",
  "department",
  "team",
  "designation",
  "office",
  "employee_type",
  "employment_status",
  "job",
  "candidate",
  "application",
  "interview",
  "assessment",
  "offer",
  "employee",
  "hr",
  "policy",
  "asset",
  "ticket",
] as const;

/** Admin must not receive these write codes (read-only on roles/permissions). */
export const ADMIN_DENIED_PERMISSIONS = [
  "role.create",
  "role.update",
  "role.delete",
  "permission.create",
  "permission.update",
  "permission.delete",
] as const;

/** Sensitive admin endpoints that require elevated permissions. */
export const ENDPOINT_PERMISSION_MATRIX: {
  method: string;
  path: string;
  anyOf: string[];
}[] = [
  { method: "GET", path: "/api/dashboard", anyOf: [ADMIN_DASHBOARD_PERMISSION] },
  { method: "GET", path: "/api/dashboard/employees", anyOf: [ADMIN_DASHBOARD_PERMISSION] },
  { method: "GET", path: "/api/dashboard/search", anyOf: [ADMIN_DASHBOARD_PERMISSION] },
  { method: "GET", path: "/api/users", anyOf: ["user.read"] },
  { method: "POST", path: "/api/users", anyOf: ["user.create"] },
  { method: "GET", path: "/api/hr/employees", anyOf: ["employee.read"] },
  { method: "GET", path: "/api/hr/tickets", anyOf: ["ticket.read"] },
  { method: "POST", path: "/api/hr/tickets/:id/replies", anyOf: ["ticket.manage"] },
  { method: "GET", path: "/api/hr/policies", anyOf: ["policy.read"] },
  { method: "POST", path: "/api/hr/policies", anyOf: ["policy.create"] },
  { method: "GET", path: "/api/portal/policies", anyOf: ["portal.read"] },
];

export function roleShouldHavePermission(
  role: SystemRoleCode,
  permissionCode: string,
  allPermissionCodes: string[],
): boolean {
  if (role === "super_admin") {
    return allPermissionCodes.includes(permissionCode);
  }

  if (role === "admin") {
    if ((ADMIN_DENIED_PERMISSIONS as readonly string[]).includes(permissionCode)) {
      return false;
    }
    return allPermissionCodes.includes(permissionCode);
  }

  if (role === "developer") {
    return (DEVELOPER_PERMISSIONS as readonly string[]).includes(permissionCode);
  }

  if (role === "employee") {
    return (EMPLOYEE_PERMISSIONS as readonly string[]).includes(permissionCode);
  }

  if (role === "candidate") {
    return (CANDIDATE_PERMISSIONS as readonly string[]).includes(permissionCode);
  }

  if (role === "hr") {
    const resource = permissionCode.split(".")[0];
    return (HR_RESOURCES as readonly string[]).includes(resource);
  }

  return false;
}
