import type { ApiResponse, HealthCheckData } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

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

async function request<T>(
  path: string,
  init?: RequestInit,
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
      request<{ user: any; accessToken: string; refreshToken: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    
    logout: () =>
      request<{ message: string }>("/api/auth/logout", {
        method: "POST",
      }),
    
    refreshToken: () =>
      request<{ accessToken: string }>("/api/auth/refresh", {
        method: "POST",
      }),
    
    getMe: () =>
      request<any>("/api/auth/me"),
    
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
      request<any[]>("/api/roles"),
    
    get: (id: string) =>
      request<any>(`/api/roles/${id}`),
    
    create: (data: any) =>
      request<any>("/api/roles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: any) =>
      request<any>(`/api/roles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      request<{ message: string }>(`/api/roles/${id}`, {
        method: "DELETE",
      }),
    
    getPermissions: (id: string) =>
      request<any[]>(`/api/roles/${id}/permissions`),
    
    assignPermission: (id: string, permissionId: string) =>
      request<any>(`/api/roles/${id}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissionId }),
      }),
    
    removePermission: (id: string, permissionId: string) =>
      request<{ message: string }>(`/api/roles/${id}/permissions`, {
        method: "DELETE",
        body: JSON.stringify({ permissionId }),
      }),
  },
  
  permissions: {
    list: () =>
      request<any[]>("/api/roles/permissions/all"),
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
