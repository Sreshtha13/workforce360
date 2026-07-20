import type { ApiResponse, HealthCheckData } from "@/types/api";
import type {
  AssignPermissionInput,
  CreatePermissionInput,
  CreateRoleInput,
  DuplicateRoleInput,
  MessageResponse,
  Permission,
  Role,
  RolePermission,
  SetRolePermissionsInput,
  UpdatePermissionInput,
  UpdateRoleInput,
} from "@/types/rbac";
import type { AuthUser } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const AUTH_REFRESH_PATH = "/api/auth/refresh";
const AUTH_LOGIN_PATH = "/api/auth/login";

let refreshInFlight: Promise<boolean> | null = null;

function buildQuery(params?: Record<string, string | undefined>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Attempt a sliding-session refresh; deduplicated across concurrent 401s. */
async function tryRefreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${AUTH_REFRESH_PATH}`, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

function shouldAttemptRefresh(path: string, retried: boolean): boolean {
  return (
    !retried &&
    path !== AUTH_REFRESH_PATH &&
    path !== AUTH_LOGIN_PATH &&
    path !== "/api/auth/logout"
  );
}

async function request<T>(
  path: string,
  init?: RequestInit,
  retried = false,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401 && shouldAttemptRefresh(path, retried)) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return request<T>(path, init, true);
    }
  }

  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      "Invalid JSON response from API",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  if (!response.ok || body.error) {
    throw new ApiClientError(
      body.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body.error?.code,
      body.error?.details,
    );
  }

  return body;
}

/** Session probe — tries refresh on 401 before treating the user as logged out. */
async function requestSession<T>(
  path: string,
  retried = false,
): Promise<ApiResponse<T> | null> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401 && shouldAttemptRefresh(path, retried)) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return requestSession<T>(path, true);
    }
    return null;
  }

  if (response.status === 401) {
    return null;
  }

  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      "Invalid JSON response from API",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  if (!response.ok || body.error) {
    throw new ApiClientError(
      body.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      body.error?.code,
      body.error?.details,
    );
  }

  return body;
}

/**
 * Typed HTTP client for the Workforce 360 API.
 * The web app must never import Prisma, Postgres drivers, or Supabase Admin SDK.
 */
export const apiClient = {
  health: {
    get: () => request<HealthCheckData>("/api/health"),
  },
  
  auth: {
    login: (email: string, password: string) =>
      request<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    
    logout: () =>
      request<{ message: string }>("/api/auth/logout", {
        method: "POST",
      }),
    
    refreshToken: () =>
      request<{ message: string }>("/api/auth/refresh", {
        method: "POST",
      }),
    
    getMe: () => requestSession<AuthUser>("/api/auth/me"),
    
    requestPasswordReset: (email: string) =>
      request<{ message: string }>("/api/auth/password/request-reset", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    
    resetPassword: (token: string, password: string) =>
      request<{ message: string }>("/api/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
  },
  
  users: {
    list: (params?: { departmentId?: string; status?: string; search?: string }) =>
      request<any[]>(`/api/users${buildQuery(params)}`),

    getNextEmployeeId: () =>
      request<{ employeeId: string }>("/api/users/next-employee-id"),
    
    get: (id: string) =>
      request<any>(`/api/users/${id}`),
    
    create: (data: any) =>
      request<any>("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      request<any>(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      request<{ message: string }>(`/api/users/${id}`, {
        method: "DELETE",
      }),

    revokeSessions: (id: string) =>
      request<{ message: string }>(`/api/users/${id}/revoke-sessions`, {
        method: "POST",
      }),
    
    assignRole: (id: string, roleId: string) =>
      request<any>(`/api/users/${id}/roles`, {
        method: "POST",
        body: JSON.stringify({ roleId }),
      }),
    
    removeRole: (id: string, roleId: string) =>
      request<{ message: string }>(`/api/users/${id}/roles`, {
        method: "DELETE",
        body: JSON.stringify({ roleId }),
      }),
    
    getRoles: (id: string) =>
      request<any[]>(`/api/users/${id}/roles`),
  },
  
  roles: {
    list: () =>
      request<Role[]>("/api/roles"),
    
    get: (id: string) =>
      request<Role>(`/api/roles/${id}`),
    
    create: (data: CreateRoleInput) =>
      request<Role>("/api/roles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: UpdateRoleInput) =>
      request<Role>(`/api/roles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      request<MessageResponse>(`/api/roles/${id}`, {
        method: "DELETE",
      }),
    
    getPermissions: (id: string) =>
      request<RolePermission[]>(`/api/roles/${id}/permissions`),
    
    assignPermission: (id: string, permissionId: string) =>
      request<RolePermission>(`/api/roles/${id}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissionId } satisfies AssignPermissionInput),
      }),
    
    removePermission: (id: string, permissionId: string) =>
      request<MessageResponse>(`/api/roles/${id}/permissions`, {
        method: "DELETE",
        body: JSON.stringify({ permissionId } satisfies AssignPermissionInput),
      }),

    setPermissions: (id: string, permissionIds: string[]) =>
      request<RolePermission[]>(`/api/roles/${id}/permissions/bulk`, {
        method: "PUT",
        body: JSON.stringify({ permissionIds } satisfies SetRolePermissionsInput),
      }),

    duplicate: (id: string, data?: DuplicateRoleInput) =>
      request<Role>(`/api/roles/${id}/duplicate`, {
        method: "POST",
        body: JSON.stringify(data ?? {}),
      }),
  },
  
  permissions: {
    list: () =>
      request<Permission[]>("/api/roles/permissions/all"),

    get: (id: string) =>
      request<Permission>(`/api/roles/permissions/${id}`),

    create: (data: CreatePermissionInput) =>
      request<Permission>("/api/roles/permissions", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdatePermissionInput) =>
      request<Permission>(`/api/roles/permissions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<MessageResponse>(`/api/roles/permissions/${id}`, {
        method: "DELETE",
      }),
  },
  
  organization: {
    departments: {
      list: (companyId?: string) =>
        request<any[]>(`/api/organization/departments${companyId ? `?companyId=${companyId}` : ""}`),
      get: (id: string) =>
        request<any>(`/api/organization/departments/${id}`),
      create: (data: any) =>
        request<any>("/api/organization/departments", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: any) =>
        request<any>(`/api/organization/departments/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/organization/departments/${id}`, {
          method: "DELETE",
        }),
    },
    
    teams: {
      list: (departmentId?: string) =>
        request<any[]>(`/api/organization/teams${departmentId ? `?departmentId=${departmentId}` : ""}`),
      get: (id: string) =>
        request<any>(`/api/organization/teams/${id}`),
      create: (data: any) =>
        request<any>("/api/organization/teams", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: any) =>
        request<any>(`/api/organization/teams/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/organization/teams/${id}`, {
          method: "DELETE",
        }),
    },
    
    designations: {
      list: () =>
        request<any[]>("/api/organization/designations"),
      get: (id: string) =>
        request<any>(`/api/organization/designations/${id}`),
      create: (data: any) =>
        request<any>("/api/organization/designations", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: any) =>
        request<any>(`/api/organization/designations/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/organization/designations/${id}`, {
          method: "DELETE",
        }),
    },
    
    offices: {
      list: (companyId?: string) =>
        request<any[]>(`/api/organization/offices${companyId ? `?companyId=${companyId}` : ""}`),
      get: (id: string) =>
        request<any>(`/api/organization/offices/${id}`),
      create: (data: any) =>
        request<any>("/api/organization/offices", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: any) =>
        request<any>(`/api/organization/offices/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/organization/offices/${id}`, {
          method: "DELETE",
        }),
    },
    
    employeeTypes: {
      list: () =>
        request<any[]>("/api/organization/employee-types"),
      get: (id: string) =>
        request<any>(`/api/organization/employee-types/${id}`),
      create: (data: any) =>
        request<any>("/api/organization/employee-types", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: any) =>
        request<any>(`/api/organization/employee-types/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/organization/employee-types/${id}`, {
          method: "DELETE",
        }),
    },
    
    employmentStatuses: {
      list: () =>
        request<any[]>("/api/organization/employment-statuses"),
      get: (id: string) =>
        request<any>(`/api/organization/employment-statuses/${id}`),
      create: (data: any) =>
        request<any>("/api/organization/employment-statuses", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: any) =>
        request<any>(`/api/organization/employment-statuses/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/organization/employment-statuses/${id}`, {
          method: "DELETE",
        }),
    },
  },
};
