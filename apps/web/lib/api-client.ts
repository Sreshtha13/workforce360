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
import type {
  AttendanceRecord,
  CheckInInput,
  CheckOutInput,
  CreateLeaveApplicationInput,
  CreateTimesheetEntryInput,
  LeaveApplication,
  LeaveBalance,
  LeavePolicy,
  ReviewLeaveApplicationInput,
  TimesheetEntry,
  UpdateTimesheetEntryInput,
} from "@/types/attendance";
import type {
  CreateFinanceClientInput,
  CreateInvoiceInput,
  CreateReimbursementInput,
  FinanceClient,
  Invoice,
  Payment,
  RecordPaymentInput,
  Reimbursement,
  ReviewReimbursementInput,
  UpdateFinanceClientInput,
  UpdateInvoiceInput,
} from "@/types/finance";
import type {
  CreatePayrollRunInput,
  CreateSalaryStructureInput,
  PayrollRun,
  Payslip,
  SalaryRevision,
  SalaryStructure,
  UpdatePayrollRunInput,
  UpdateSalaryStructureInput,
} from "@/types/payroll";
import type {
  AuthUser,
  CreateDepartmentInput,
  CreateDesignationInput,
  CreateEmployeeTypeInput,
  CreateEmploymentStatusInput,
  CreateOfficeInput,
  CreateTeamInput,
  CreateUserInput,
  Department,
  Designation,
  EmployeeType,
  EmploymentStatus,
  Office,
  Team,
  UpdateDepartmentInput,
  UpdateDesignationInput,
  UpdateEmployeeTypeInput,
  UpdateEmploymentStatusInput,
  UpdateOfficeInput,
  UpdateTeamInput,
  UpdateUserInput,
  User,
} from "@/types/entities";
import type {
  Candidate,
  CompanyPolicy,
  PolicyAcknowledgementReport,
  PolicyAssignment,
  EmployeeMaster,
  HrDashboard,
  JobApplication,
  JobPosting,
  NotificationItem,
  PortalDashboard,
  PortalProfile,
  PipelineStatus,
  SupportTicket,
  Asset,
  Interview,
  OfferLetter,
  Assessment,
  AdminDashboard,
  DashboardEmployeePreview,
} from "@/types/phase2";
import type {
  Contact,
  Lead,
  Bid,
  Proposal,
  ClientCommunication,
  PortfolioItem,
  PipelineSummary,
  CreateContactInput,
  UpdateContactInput,
  CreateLeadInput,
  UpdateLeadInput,
  CreateBidInput,
  UpdateBidInput,
  CreateProposalInput,
  UpdateProposalInput,
  CreateCommunicationInput,
  CreatePortfolioItemInput,
  UpdatePortfolioItemInput,
} from "@/types/bd";
import type {
  Project,
  Milestone,
  Task,
  Sprint,
  TaskTimeEntry,
  TaskComment,
  ProjectTeamAllocation,
  ProjectBudgetEntry,
  ProjectReport,
  CreateProjectInput,
  UpdateProjectInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateSprintInput,
  UpdateSprintInput,
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
  CreateTaskCommentInput,
  AllocateTeamMemberInput,
  UpdateTeamAllocationInput,
  CreateBudgetEntryInput,
  UpdateBudgetEntryInput,
} from "@/types/pm";

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
    list: (params?: {
      departmentId?: string;
      officeId?: string;
      employeeTypeId?: string;
      employmentStatusId?: string;
      status?: string;
      search?: string;
      includeDeleted?: boolean;
    }) =>
      request<User[]>(
        `/api/users${buildQuery({
          departmentId: params?.departmentId,
          officeId: params?.officeId,
          employeeTypeId: params?.employeeTypeId,
          employmentStatusId: params?.employmentStatusId,
          status: params?.status,
          search: params?.search,
          includeDeleted: params?.includeDeleted ? "true" : undefined,
        })}`,
      ),

    getNextEmployeeId: () =>
      request<{ employeeId: string }>("/api/users/next-employee-id"),

    get: (id: string) => request<User>(`/api/users/${id}`),

    create: (data: CreateUserInput) =>
      request<User>("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdateUserInput) =>
      request<User>(`/api/users/${id}`, {
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
      request<User>(`/api/users/${id}/roles`, {
        method: "POST",
        body: JSON.stringify({ roleId }),
      }),

    removeRole: (id: string, roleId: string) =>
      request<{ message: string }>(`/api/users/${id}/roles`, {
        method: "DELETE",
        body: JSON.stringify({ roleId }),
      }),

    getRoles: (id: string) => request<Role[]>(`/api/users/${id}/roles`),
  },

  roles: {
    list: () => request<Role[]>("/api/roles"),

    get: (id: string) => request<Role>(`/api/roles/${id}`),

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
    list: () => request<Permission[]>("/api/roles/permissions/all"),

    get: (id: string) => request<Permission>(`/api/roles/permissions/${id}`),

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
        request<Department[]>(
          `/api/organization/departments${companyId ? `?companyId=${companyId}` : ""}`,
        ),
      get: (id: string) => request<Department>(`/api/organization/departments/${id}`),
      create: (data: CreateDepartmentInput) =>
        request<Department>("/api/organization/departments", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateDepartmentInput) =>
        request<Department>(`/api/organization/departments/${id}`, {
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
        request<Team[]>(
          `/api/organization/teams${departmentId ? `?departmentId=${departmentId}` : ""}`,
        ),
      get: (id: string) => request<Team>(`/api/organization/teams/${id}`),
      create: (data: CreateTeamInput) =>
        request<Team>("/api/organization/teams", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateTeamInput) =>
        request<Team>(`/api/organization/teams/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/organization/teams/${id}`, {
          method: "DELETE",
        }),
    },

    designations: {
      list: (departmentId?: string) =>
        request<Designation[]>(
          `/api/organization/designations${departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ""}`,
        ),
      get: (id: string) => request<Designation>(`/api/organization/designations/${id}`),
      nextCode: (departmentId: string) =>
        request<{ code: string }>(
          `/api/organization/designations/next-code?departmentId=${encodeURIComponent(departmentId)}`,
        ),
      create: (data: CreateDesignationInput) =>
        request<Designation>("/api/organization/designations", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateDesignationInput) =>
        request<Designation>(`/api/organization/designations/${id}`, {
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
        request<Office[]>(
          `/api/organization/offices${companyId ? `?companyId=${companyId}` : ""}`,
        ),
      get: (id: string) => request<Office>(`/api/organization/offices/${id}`),
      create: (data: CreateOfficeInput) =>
        request<Office>("/api/organization/offices", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateOfficeInput) =>
        request<Office>(`/api/organization/offices/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/organization/offices/${id}`, {
          method: "DELETE",
        }),
    },

    employeeTypes: {
      list: () => request<EmployeeType[]>("/api/organization/employee-types"),
      get: (id: string) => request<EmployeeType>(`/api/organization/employee-types/${id}`),
      create: (data: CreateEmployeeTypeInput) =>
        request<EmployeeType>("/api/organization/employee-types", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateEmployeeTypeInput) =>
        request<EmployeeType>(`/api/organization/employee-types/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/organization/employee-types/${id}`, {
          method: "DELETE",
        }),
    },

    employmentStatuses: {
      list: () => request<EmploymentStatus[]>("/api/organization/employment-statuses"),
      get: (id: string) =>
        request<EmploymentStatus>(`/api/organization/employment-statuses/${id}`),
      create: (data: CreateEmploymentStatusInput) =>
        request<EmploymentStatus>("/api/organization/employment-statuses", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateEmploymentStatusInput) =>
        request<EmploymentStatus>(`/api/organization/employment-statuses/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/organization/employment-statuses/${id}`, {
          method: "DELETE",
        }),
    },
  },

  storage: {
    presign: (data: { fileName: string; mimeType: string; purpose: string }) =>
      request<{ uploadUrl: string; storageKey: string; expiresInSeconds: number }>(
        "/api/storage/presign",
        { method: "POST", body: JSON.stringify(data) },
      ),
    confirm: (data: {
      storageKey: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      purpose: string;
      entityType?: string;
      entityId?: string;
    }) =>
      request<{ id: string; storageKey: string; originalName: string }>(
        "/api/storage/confirm",
        { method: "POST", body: JSON.stringify(data) },
      ),
  },

  careers: {
    listJobs: () => request<JobPosting[]>("/api/careers/jobs"),
    getJob: (slug: string) => request<JobPosting>(`/api/careers/jobs/${slug}`),
    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      linkedInUrl?: string;
    }) =>
      request<{ user: AuthUser }>("/api/careers/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    apply: (data: {
      jobPostingId: string;
      coverLetter?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    }) =>
      request<JobApplication>("/api/careers/apply", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  recruitment: {
    listJobs: (params?: { status?: string; search?: string }) =>
      request<JobPosting[]>(
        `/api/recruitment/jobs${buildQuery({ status: params?.status, search: params?.search })}`,
      ),
    createJob: (data: Partial<JobPosting>) =>
      request<JobPosting>("/api/recruitment/jobs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateJob: (id: string, data: Partial<JobPosting>) =>
      request<JobPosting>(`/api/recruitment/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    listCandidates: (params?: { status?: string; search?: string }) =>
      request<Candidate[]>(
        `/api/recruitment/candidates${buildQuery({ status: params?.status, search: params?.search })}`,
      ),
    getCandidate: (id: string) => request<Candidate>(`/api/recruitment/candidates/${id}`),
    getMyProfile: () => request<Candidate>("/api/recruitment/candidates/me"),
    attachResume: (fileId: string) =>
      request<Candidate>("/api/recruitment/candidates/me/resume", {
        method: "POST",
        body: JSON.stringify({ fileId }),
      }),
    listApplications: (params?: { status?: string; statuses?: string; jobPostingId?: string }) =>
      request<JobApplication[]>(
        `/api/recruitment/applications${buildQuery({
          status: params?.status,
          statuses: params?.statuses,
          jobPostingId: params?.jobPostingId,
        })}`,
      ),
    getApplication: (id: string) =>
      request<JobApplication>(`/api/recruitment/applications/${id}`),
    updateApplicationStatus: (id: string, status: PipelineStatus, statusNotes?: string) =>
      request<{ application: JobApplication; employee?: EmployeeMaster }>(
        `/api/recruitment/applications/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, statusNotes }),
        },
      ),
    getPipeline: () =>
      request<{ summary: HrDashboard["pipeline"]; applications: JobApplication[] }>(
        "/api/recruitment/pipeline",
      ),
    scheduleInterview: (data: {
      applicationId: string;
      scheduledAt: string;
      durationMinutes?: number;
      location?: string;
      meetingLink?: string;
      interviewerId?: string;
      notes?: string;
    }) =>
      request<Interview>("/api/recruitment/interviews", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    createOffer: (data: {
      applicationId: string;
      salary?: number;
      currency?: string;
      startDate?: string;
      content: string;
      fileId?: string;
    }) =>
      request<OfferLetter>("/api/recruitment/offers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    sendOffer: (id: string) =>
      request<OfferLetter>(`/api/recruitment/offers/${id}/send`, { method: "POST" }),
    assignAssessment: (data: {
      applicationId: string;
      title: string;
      description?: string;
      dueAt?: string;
    }) =>
      request<Assessment>("/api/recruitment/assessments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateChecklist: (id: string, isCompleted: boolean) =>
      request<unknown>(`/api/recruitment/checklist/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isCompleted }),
      }),
  },

  dashboard: {
    getAdmin: (search?: string) =>
      request<AdminDashboard>(
        `/api/dashboard${buildQuery(search ? { search } : undefined)}`,
      ),
    listEmployees: (search?: string) =>
      request<DashboardEmployeePreview[]>(
        `/api/dashboard/employees${buildQuery(search ? { search } : undefined)}`,
      ),
    search: (q: string) =>
      request<AdminDashboard["searchResults"]>(
        `/api/dashboard/search${buildQuery({ q })}`,
      ),
  },

  hr: {
    getDashboard: () => request<HrDashboard>("/api/hr/dashboard"),
    listEmployees: (params?: { lifecycleState?: string; search?: string }) =>
      request<EmployeeMaster[]>(
        `/api/hr/employees${buildQuery({
          lifecycleState: params?.lifecycleState,
          search: params?.search,
        })}`,
      ),
    getEmployee: (id: string) => request<EmployeeMaster>(`/api/hr/employees/${id}`),
    updateLifecycle: (id: string, lifecycleState: string, notes?: string) =>
      request<EmployeeMaster>(`/api/hr/employees/${id}/lifecycle`, {
        method: "PATCH",
        body: JSON.stringify({ lifecycleState, notes }),
      }),
    listPolicies: (status?: string, familyId?: string) =>
      request<CompanyPolicy[]>(
        `/api/hr/policies${buildQuery({ status, familyId })}`,
      ),
    getPolicy: (id: string) => request<CompanyPolicy>(`/api/hr/policies/${id}`),
    createPolicy: (data: { title: string; description?: string; version?: string; fileId?: string }) =>
      request<CompanyPolicy>("/api/hr/policies", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updatePolicy: (
      id: string,
      data: { title?: string; description?: string; version?: string; fileId?: string | null },
    ) =>
      request<CompanyPolicy>(`/api/hr/policies/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    publishPolicy: (id: string) =>
      request<CompanyPolicy>(`/api/hr/policies/${id}/publish`, { method: "POST" }),
    createPolicyVersion: (id: string) =>
      request<CompanyPolicy>(`/api/hr/policies/${id}/versions`, { method: "POST" }),
    listPolicyAssignments: (familyId: string) =>
      request<PolicyAssignment[]>(`/api/hr/policy-families/${familyId}/assignments`),
    assignPolicy: (data: {
      familyId: string;
      targetType: "ALL" | "USER" | "DEPARTMENT" | "TEAM";
      userId?: string;
      departmentId?: string;
      teamId?: string;
    }) =>
      request<PolicyAssignment>("/api/hr/policy-assignments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    removePolicyAssignment: (assignmentId: string) =>
      request<{ message: string }>(`/api/hr/policy-assignments/${assignmentId}`, {
        method: "DELETE",
      }),
    getPolicyAcknowledgements: (policyId: string) =>
      request<PolicyAcknowledgementReport>(`/api/hr/policies/${policyId}/acknowledgements`),
    listAssets: (params?: { status?: string; employeeId?: string }) =>
      request<Asset[]>(
        `/api/hr/assets${buildQuery({ status: params?.status, employeeId: params?.employeeId })}`,
      ),
    createAsset: (data: { name: string; tag: string; category?: string; serialNumber?: string; notes?: string }) =>
      request<Asset>("/api/hr/assets", { method: "POST", body: JSON.stringify(data) }),
    assignAsset: (assetId: string, employeeId: string) =>
      request<Asset>(`/api/hr/assets/${assetId}/assign`, {
        method: "POST",
        body: JSON.stringify({ employeeId }),
      }),
    listTickets: (params?: { status?: string; assignedToId?: string; search?: string }) =>
      request<SupportTicket[]>(
        `/api/hr/tickets${buildQuery({
          status: params?.status,
          assignedToId: params?.assignedToId,
          search: params?.search,
        })}`,
      ),
    getTicket: (id: string) => request<SupportTicket>(`/api/hr/tickets/${id}`),
    assignTicket: (id: string, assignedToId: string | null) =>
      request<SupportTicket>(`/api/hr/tickets/${id}/assign`, {
        method: "POST",
        body: JSON.stringify({ assignedToId }),
      }),
    updateTicketStatus: (
      id: string,
      status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_EMPLOYEE" | "RESOLVED" | "CLOSED",
    ) =>
      request<SupportTicket>(`/api/hr/tickets/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    replyToTicket: (
      id: string,
      data: { body: string; attachmentFileId?: string; setWaiting?: boolean },
    ) =>
      request<SupportTicket>(`/api/hr/tickets/${id}/replies`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    listInterviews: (params?: { from?: string; to?: string }) =>
      request<Interview[]>(
        `/api/hr/interviews${buildQuery({ from: params?.from, to: params?.to })}`,
      ),
    listOffers: (status?: string) =>
      request<OfferLetter[]>(`/api/hr/offers${buildQuery({ status })}`),
  },

  portal: {
    getDashboard: () => request<PortalDashboard>("/api/portal/dashboard"),
    getProfile: () => request<PortalProfile>("/api/portal/profile"),
    updateProfile: (data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    }) =>
      request<PortalProfile>("/api/portal/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    listNotifications: () => request<NotificationItem[]>("/api/portal/notifications"),
    markNotificationRead: (id: string) =>
      request<{ ok: boolean }>(`/api/portal/notifications/${id}/read`, { method: "POST" }),
    listTickets: () => request<SupportTicket[]>("/api/portal/tickets"),
    getTicket: (id: string) => request<SupportTicket>(`/api/portal/tickets/${id}`),
    createTicket: (data: {
      subject: string;
      description: string;
      category?: string;
      priority?: "low" | "medium" | "high";
      attachmentFileId?: string;
    }) =>
      request<SupportTicket>("/api/portal/tickets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    replyToTicket: (id: string, data: { body: string; attachmentFileId?: string }) =>
      request<SupportTicket>(`/api/portal/tickets/${id}/replies`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    listMyAssets: () => request<Asset[]>("/api/portal/assets"),
    listPolicies: () => request<CompanyPolicy[]>("/api/portal/policies"),
    acknowledgePolicy: (policyId: string) =>
      request<{ id: string; acknowledgedAt: string }>(`/api/portal/policies/${policyId}/acknowledge`, {
        method: "POST",
      }),
  },

  // Phase 3: Attendance & Leave Management
  attendance: {
    list: (params?: { userId?: string; startDate?: string; endDate?: string }) =>
      request<AttendanceRecord[]>(
        `/api/attendance${buildQuery({
          userId: params?.userId,
          startDate: params?.startDate,
          endDate: params?.endDate,
        })}`,
      ),
    get: (id: string) => request<AttendanceRecord>(`/api/attendance/${id}`),
    checkIn: (data: CheckInInput) =>
      request<AttendanceRecord>("/api/attendance/check-in", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    checkOut: (data: CheckOutInput) =>
      request<AttendanceRecord>("/api/attendance/check-out", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getToday: () => request<AttendanceRecord | null>("/api/attendance/today"),
  },

  leave: {
    policies: {
      list: () => request<LeavePolicy[]>("/api/leave/policies"),
      get: (id: string) => request<LeavePolicy>(`/api/leave/policies/${id}`),
    },
    applications: {
      list: (params?: { userId?: string; status?: string; startDate?: string }) =>
        request<LeaveApplication[]>(
          `/api/leave/applications${buildQuery({
            userId: params?.userId,
            status: params?.status,
            startDate: params?.startDate,
          })}`,
        ),
      get: (id: string) => request<LeaveApplication>(`/api/leave/applications/${id}`),
      create: (data: CreateLeaveApplicationInput) =>
        request<LeaveApplication>("/api/leave/applications", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      cancel: (id: string) =>
        request<LeaveApplication>(`/api/leave/applications/${id}/cancel`, {
          method: "POST",
        }),
      review: (id: string, data: ReviewLeaveApplicationInput) =>
        request<LeaveApplication>(`/api/leave/applications/${id}/review`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },
    balance: (userId?: string) =>
      request<LeaveBalance[]>(`/api/leave/balance${buildQuery({ userId })}`),
  },

  timesheets: {
    list: (params?: { userId?: string; startDate?: string; endDate?: string; projectId?: string }) =>
      request<TimesheetEntry[]>(
        `/api/timesheets${buildQuery({
          userId: params?.userId,
          startDate: params?.startDate,
          endDate: params?.endDate,
          projectId: params?.projectId,
        })}`,
      ),
    get: (id: string) => request<TimesheetEntry>(`/api/timesheets/${id}`),
    create: (data: CreateTimesheetEntryInput) =>
      request<TimesheetEntry>("/api/timesheets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateTimesheetEntryInput) =>
      request<TimesheetEntry>(`/api/timesheets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/timesheets/${id}`, {
        method: "DELETE",
      }),
  },

  // Phase 4: Finance Module
  finance: {
    clients: {
      list: (params?: { search?: string }) =>
        request<FinanceClient[]>(`/api/finance/clients${buildQuery({ search: params?.search })}`),
      get: (id: string) => request<FinanceClient>(`/api/finance/clients/${id}`),
      create: (data: CreateFinanceClientInput) =>
        request<FinanceClient>("/api/finance/clients", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateFinanceClientInput) =>
        request<FinanceClient>(`/api/finance/clients/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },
    invoices: {
      list: (params?: { clientId?: string; status?: string; search?: string }) =>
        request<Invoice[]>(
          `/api/finance/invoices${buildQuery({
            clientId: params?.clientId,
            status: params?.status,
            search: params?.search,
          })}`,
        ),
      get: (id: string) => request<Invoice>(`/api/finance/invoices/${id}`),
      create: (data: CreateInvoiceInput) =>
        request<Invoice>("/api/finance/invoices", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateInvoiceInput) =>
        request<Invoice>(`/api/finance/invoices/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      submit: (id: string) =>
        request<Invoice>(`/api/finance/invoices/${id}/submit`, {
          method: "POST",
        }),
      send: (id: string) =>
        request<Invoice>(`/api/finance/invoices/${id}/send`, {
          method: "POST",
        }),
      cancel: (id: string) =>
        request<Invoice>(`/api/finance/invoices/${id}/cancel`, {
          method: "POST",
        }),
      recordPayment: (id: string, data: RecordPaymentInput) =>
        request<Payment>(`/api/finance/invoices/${id}/payments`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },
    payments: {
      list: (invoiceId?: string) =>
        request<Payment[]>(`/api/finance/payments${buildQuery({ invoiceId })}`),
    },
    reimbursements: {
      list: (params?: { userId?: string; status?: string }) =>
        request<Reimbursement[]>(
          `/api/finance/reimbursements${buildQuery({
            userId: params?.userId,
            status: params?.status,
          })}`,
        ),
      get: (id: string) => request<Reimbursement>(`/api/finance/reimbursements/${id}`),
      create: (data: CreateReimbursementInput) =>
        request<Reimbursement>("/api/finance/reimbursements", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      review: (id: string, data: ReviewReimbursementInput) =>
        request<Reimbursement>(`/api/finance/reimbursements/${id}/review`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      markPaid: (id: string) =>
        request<Reimbursement>(`/api/finance/reimbursements/${id}/mark-paid`, {
          method: "POST",
        }),
    },
  },

  // Phase 4: Payroll Module
  payroll: {
    structures: {
      list: (params?: { userId?: string; isActive?: boolean }) =>
        request<SalaryStructure[]>(
          `/api/payroll/structures${buildQuery({
            userId: params?.userId,
            isActive: params?.isActive,
          })}`,
        ),
      get: (id: string) => request<SalaryStructure>(`/api/payroll/structures/${id}`),
      create: (data: CreateSalaryStructureInput) =>
        request<SalaryStructure>("/api/payroll/structures", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateSalaryStructureInput) =>
        request<SalaryStructure>(`/api/payroll/structures/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },
    runs: {
      list: (params?: { status?: string }) =>
        request<PayrollRun[]>(`/api/payroll/runs${buildQuery({ status: params?.status })}`),
      get: (id: string) => request<PayrollRun>(`/api/payroll/runs/${id}`),
      create: (data: CreatePayrollRunInput) =>
        request<PayrollRun>("/api/payroll/runs", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdatePayrollRunInput) =>
        request<PayrollRun>(`/api/payroll/runs/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      calculate: (id: string) =>
        request<PayrollRun>(`/api/payroll/runs/${id}/calculate`, {
          method: "POST",
        }),
      submit: (id: string) =>
        request<PayrollRun>(`/api/payroll/runs/${id}/submit`, {
          method: "POST",
        }),
      process: (id: string) =>
        request<PayrollRun>(`/api/payroll/runs/${id}/process`, {
          method: "POST",
        }),
      markPaid: (id: string) =>
        request<PayrollRun>(`/api/payroll/runs/${id}/mark-paid`, {
          method: "POST",
        }),
    },
    payslips: {
      list: (params?: { runId?: string; userId?: string }) =>
        request<Payslip[]>(
          `/api/payroll/payslips${buildQuery({
            runId: params?.runId,
            userId: params?.userId,
          })}`,
        ),
      get: (id: string) => request<Payslip>(`/api/payroll/payslips/${id}`),
      download: (id: string) => `/api/payroll/payslips/${id}/download`,
    },
    revisions: {
      list: () => request<SalaryRevision[]>("/api/payroll/revisions"),
    },
  },

  // Business Development Module
  bd: {
    contacts: {
      list: (params?: { search?: string }) =>
        request<Contact[]>(`/api/bd/contacts${buildQuery({ search: params?.search })}`),
      get: (id: string) => request<Contact>(`/api/bd/contacts/${id}`),
      create: (data: CreateContactInput) =>
        request<Contact>("/api/bd/contacts", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateContactInput) =>
        request<Contact>(`/api/bd/contacts/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },

    leads: {
      list: (params?: { status?: string; assignedToId?: string; search?: string }) =>
        request<Lead[]>(
          `/api/bd/leads${buildQuery({
            status: params?.status,
            assignedToId: params?.assignedToId,
            search: params?.search,
          })}`,
        ),
      get: (id: string) => request<Lead>(`/api/bd/leads/${id}`),
      create: (data: CreateLeadInput) =>
        request<Lead>("/api/bd/leads", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateLeadInput) =>
        request<Lead>(`/api/bd/leads/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      getPipeline: () => request<PipelineSummary[]>("/api/bd/pipeline"),
    },

    bids: {
      list: (params?: { leadId?: string; status?: string }) =>
        request<Bid[]>(
          `/api/bd/bids${buildQuery({
            leadId: params?.leadId,
            status: params?.status,
          })}`,
        ),
      get: (id: string) => request<Bid>(`/api/bd/bids/${id}`),
      create: (data: CreateBidInput) =>
        request<Bid>("/api/bd/bids", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateBidInput) =>
        request<Bid>(`/api/bd/bids/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },

    proposals: {
      list: (params?: { leadId?: string; bidId?: string; status?: string }) =>
        request<Proposal[]>(
          `/api/bd/proposals${buildQuery({
            leadId: params?.leadId,
            bidId: params?.bidId,
            status: params?.status,
          })}`,
        ),
      get: (id: string) => request<Proposal>(`/api/bd/proposals/${id}`),
      create: (data: CreateProposalInput) =>
        request<Proposal>("/api/bd/proposals", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateProposalInput) =>
        request<Proposal>(`/api/bd/proposals/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },

    communications: {
      list: (params?: { leadId?: string; contactId?: string }) =>
        request<ClientCommunication[]>(
          `/api/bd/communications${buildQuery({
            leadId: params?.leadId,
            contactId: params?.contactId,
          })}`,
        ),
      create: (data: CreateCommunicationInput) =>
        request<ClientCommunication>("/api/bd/communications", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },

    portfolio: {
      list: (params?: { isPublished?: boolean; category?: string }) =>
        request<PortfolioItem[]>(
          `/api/bd/portfolio${buildQuery({
            isPublished: params?.isPublished ? "true" : undefined,
            category: params?.category,
          })}`,
        ),
      get: (id: string) => request<PortfolioItem>(`/api/bd/portfolio/${id}`),
      create: (data: CreatePortfolioItemInput) =>
        request<PortfolioItem>("/api/bd/portfolio", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdatePortfolioItemInput) =>
        request<PortfolioItem>(`/api/bd/portfolio/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },
  },

  // Project Management Module
  pm: {
    projects: {
      list: (params?: { status?: string; managerId?: string; search?: string }) =>
        request<Project[]>(
          `/api/pm/projects${buildQuery({
            status: params?.status,
            managerId: params?.managerId,
            search: params?.search,
          })}`,
        ),
      get: (id: string) => request<Project>(`/api/pm/projects/${id}`),
      create: (data: CreateProjectInput) =>
        request<Project>("/api/pm/projects", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateProjectInput) =>
        request<Project>(`/api/pm/projects/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      getReport: (projectId: string) => request<ProjectReport>(`/api/pm/projects/${projectId}/report`),
    },

    milestones: {
      list: (params?: { projectId?: string }) =>
        request<Milestone[]>(
          `/api/pm/milestones${buildQuery({
            projectId: params?.projectId,
          })}`,
        ),
      get: (id: string) => request<Milestone>(`/api/pm/milestones/${id}`),
      create: (data: CreateMilestoneInput) =>
        request<Milestone>("/api/pm/milestones", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateMilestoneInput) =>
        request<Milestone>(`/api/pm/milestones/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },

    tasks: {
      list: (params?: {
        projectId?: string;
        milestoneId?: string;
        sprintId?: string;
        assigneeId?: string;
        status?: string;
        search?: string;
      }) =>
        request<Task[]>(
          `/api/pm/tasks${buildQuery({
            projectId: params?.projectId,
            milestoneId: params?.milestoneId,
            sprintId: params?.sprintId,
            assigneeId: params?.assigneeId,
            status: params?.status,
            search: params?.search,
          })}`,
        ),
      get: (id: string) => request<Task>(`/api/pm/tasks/${id}`),
      create: (data: CreateTaskInput) =>
        request<Task>("/api/pm/tasks", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateTaskInput) =>
        request<Task>(`/api/pm/tasks/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      addComment: (data: CreateTaskCommentInput) =>
        request<TaskComment>("/api/pm/tasks/comments", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },

    sprints: {
      list: (params?: { projectId?: string; status?: string }) =>
        request<Sprint[]>(
          `/api/pm/sprints${buildQuery({
            projectId: params?.projectId,
            status: params?.status,
          })}`,
        ),
      get: (id: string) => request<Sprint>(`/api/pm/sprints/${id}`),
      create: (data: CreateSprintInput) =>
        request<Sprint>("/api/pm/sprints", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateSprintInput) =>
        request<Sprint>(`/api/pm/sprints/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },

    timeEntries: {
      list: (params?: { taskId?: string; userId?: string; startDate?: string; endDate?: string }) =>
        request<TaskTimeEntry[]>(
          `/api/pm/time-entries${buildQuery({
            taskId: params?.taskId,
            userId: params?.userId,
            startDate: params?.startDate,
            endDate: params?.endDate,
          })}`,
        ),
      create: (data: CreateTimeEntryInput) =>
        request<TaskTimeEntry>("/api/pm/time-entries", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateTimeEntryInput) =>
        request<TaskTimeEntry>(`/api/pm/time-entries/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },

    teamAllocations: {
      list: (params?: { projectId?: string; userId?: string }) =>
        request<ProjectTeamAllocation[]>(
          `/api/pm/team-allocations${buildQuery({
            projectId: params?.projectId,
            userId: params?.userId,
          })}`,
        ),
      create: (data: AllocateTeamMemberInput) =>
        request<ProjectTeamAllocation>("/api/pm/team-allocations", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateTeamAllocationInput) =>
        request<ProjectTeamAllocation>(`/api/pm/team-allocations/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },

    budget: {
      list: (projectId: string) =>
        request<ProjectBudgetEntry[]>(`/api/pm/projects/${projectId}/budget`),
      create: (data: CreateBudgetEntryInput) =>
        request<ProjectBudgetEntry>("/api/pm/budget", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateBudgetEntryInput) =>
        request<ProjectBudgetEntry>(`/api/pm/budget/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },
  },
};
