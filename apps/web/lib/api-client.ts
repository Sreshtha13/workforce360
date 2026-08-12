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
  CodeReview,
  CreateCodeReviewInput,
  CreateDocumentationInput,
  CreateReleaseInput,
  CreateTestCaseInput,
  CreateTrainingInput,
  Documentation,
  EngineeringMetrics,
  EnrollTrainingInput,
  ExecuteTestCaseInput,
  Release,
  SprintDashboard,
  TechTraining,
  TestCase,
  TrainingEnrollment,
  UpdateCodeReviewInput,
  UpdateDocumentationInput,
  UpdateEnrollmentInput,
  UpdateReleaseInput,
  UpdateTestCaseInput,
  UpdateTrainingInput,
} from "@/types/engineering";
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
  CreateKbArticleInput,
  EscalateTicketInput,
  KnowledgeBaseArticle,
  SlaPolicy,
  UpdateKbArticleInput,
  UpsertSlaPolicyInput,
} from "@/types/helpdesk";
import type {
  Announcement,
  AppNotification,
  CreateAnnouncementInput,
  NotificationPreference,
  UpdateAnnouncementInput,
  UpdatePreferenceInput,
} from "@/types/notifications";
import type {
  ApprovalDelegation,
  ApprovalRequest,
  ApprovalStats,
  ApprovalWorkflow,
  CreateDelegationInput,
  CreateWorkflowInput,
  UpdateWorkflowInput,
} from "@/types/approvals";
import type {
  CreateDocumentCategoryInput,
  CreateDocumentInput,
  DocumentCategory,
  DocumentContext,
  ManagedDocument,
  SetDocumentPermissionsInput,
} from "@/types/documents";
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
import type {
  Client,
  CreateClientInput,
  CreateInvoiceInput,
  CreatePayrollRunInput,
  CreateReimbursementInput,
  CreateSalaryStructureInput,
  FinanceDashboard,
  Invoice,
  Payment,
  PayrollRun,
  Payslip,
  PublicPaymentConfig,
  RecordManualPaymentInput,
  Reimbursement,
  RequestSalaryRevisionInput,
  SalaryRevision,
  SalaryStructure,
  UpdateClientInput,
  UpdateInvoiceInput,
} from "@/types/phase4";
import type {
  CreateReportScheduleInput,
  DashboardKpis,
  KpiScope,
  ReportFilters,
  ReportFormat,
  ReportPayload,
  ReportSchedule,
  ReportType,
  UpdateReportScheduleInput,
} from "@/types/reports";
import type {
  AuditLog,
  AuditLogQuery,
  CreateNotificationTemplateInput,
  IntegrationPlaceholder,
  MasterDataSummary,
  NotificationTemplate,
  SecurityEvent,
  SecurityEventQuery,
  SystemSetting,
  UpdateNotificationTemplateInput,
  UpsertSettingsInput,
} from "@/types/admin";
import type {
  DevicesListResult,
  LoginResult,
  MfaEnableResult,
  MfaEnableChallengeResult,
  MfaSetupResult,
  MfaStatus,
  MfaVerifyResult,
} from "@/types/security";
import { downloadBlob } from "@/lib/download";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const AUTH_REFRESH_PATH = "/api/auth/refresh";
const AUTH_LOGIN_PATH = "/api/auth/login";

let refreshInFlight: Promise<boolean> | null = null;

function buildQuery(
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
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

/** Binary download (CSV/PDF) — returns blob + filename from Content-Disposition when present. */
async function requestBlob(
  path: string,
  init?: RequestInit,
  retried = false,
): Promise<{ blob: Blob; filename: string }> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "*/*",
      ...init?.headers,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401 && shouldAttemptRefresh(path, retried)) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return requestBlob(path, init, true);
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as ApiResponse<unknown>;
      if (body.error?.message) message = body.error.message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiClientError(message, response.status);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = match?.[1] ?? "download";
  const blob = await response.blob();
  return { blob, filename };
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
      request<LoginResult>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    getGoogleAuthUrl: () =>
      request<{ enabled: boolean; url?: string }>("/api/auth/google/url"),

    googleLogin: (code: string) =>
      request<LoginResult>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ code }),
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

    mfa: {
      status: () => request<MfaStatus>("/api/auth/mfa/status"),
      setup: () =>
        request<MfaSetupResult>("/api/auth/mfa/setup", { method: "POST" }),
      enable: (code: string) =>
        request<MfaEnableResult>("/api/auth/mfa/enable", {
          method: "POST",
          body: JSON.stringify({ code }),
        }),
      disable: (code: string) =>
        request<{ enabled: boolean }>("/api/auth/mfa/disable", {
          method: "POST",
          body: JSON.stringify({ code }),
        }),
      verify: (mfaToken: string, code: string) =>
        request<MfaVerifyResult>("/api/auth/mfa/verify", {
          method: "POST",
          body: JSON.stringify({ mfaToken, code }),
        }),
      setupChallenge: (mfaToken: string) =>
        request<MfaSetupResult>("/api/auth/mfa/setup-challenge", {
          method: "POST",
          body: JSON.stringify({ mfaToken }),
        }),
      enableChallenge: (mfaToken: string, code: string) =>
        request<MfaEnableChallengeResult>("/api/auth/mfa/enable-challenge", {
          method: "POST",
          body: JSON.stringify({ mfaToken, code }),
        }),
    },

    devices: {
      list: () => request<DevicesListResult>("/api/auth/devices"),
      revoke: (id: string) =>
        request<{ id: string; revoked: boolean }>(`/api/auth/devices/${id}`, {
          method: "DELETE",
        }),
    },
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
      priority?: "low" | "medium" | "high" | "urgent" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
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
    listPayslips: () => request<Payslip[]>("/api/portal/payslips"),
    /** Downloads (or opens, for S3-backed pre-signed URLs) the employee's own payslip PDF. */
    downloadPayslip: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/portal/payslips/${id}/download`, {
        headers: { Accept: "application/json, application/pdf" },
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        let code: string | undefined;
        try {
          const body = (await response.json()) as ApiResponse<unknown>;
          message = body?.error?.message ?? message;
          code = body?.error?.code;
        } catch {
          // Non-JSON error body — keep the generic message.
        }
        throw new ApiClientError(message, response.status, code);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = (await response.json()) as ApiResponse<{ url: string; fileName: string }>;
        if (body.data?.url) {
          window.open(body.data.url, "_blank", "noopener,noreferrer");
          return;
        }
        throw new ApiClientError("Unexpected response from payslip download", response.status);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const fileName = /filename="?([^"]+)"?/.exec(disposition)?.[1] ?? "payslip.pdf";
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    },
  },

  finance: {
    getDashboard: () => request<FinanceDashboard>("/api/finance/dashboard"),
    getPaymentConfig: () => request<PublicPaymentConfig>("/api/finance/payment-config"),

    clients: {
      list: (params?: { status?: string; search?: string }) =>
        request<Client[]>(`/api/finance/clients${buildQuery(params)}`),
      get: (id: string) => request<Client>(`/api/finance/clients/${id}`),
      create: (data: CreateClientInput) =>
        request<Client>("/api/finance/clients", { method: "POST", body: JSON.stringify(data) }),
      update: (id: string, data: UpdateClientInput) =>
        request<Client>(`/api/finance/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      delete: (id: string) =>
        request<{ message: string }>(`/api/finance/clients/${id}`, { method: "DELETE" }),
    },

    invoices: {
      list: (params?: { clientId?: string; status?: string; from?: string; to?: string }) =>
        request<Invoice[]>(`/api/finance/invoices${buildQuery(params)}`),
      get: (id: string) => request<Invoice>(`/api/finance/invoices/${id}`),
      create: (data: CreateInvoiceInput) =>
        request<Invoice>("/api/finance/invoices", { method: "POST", body: JSON.stringify(data) }),
      update: (id: string, data: UpdateInvoiceInput) =>
        request<Invoice>(`/api/finance/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      submitForApproval: (id: string, approverIds: string[]) =>
        request<Invoice>(`/api/finance/invoices/${id}/submit`, {
          method: "POST",
          body: JSON.stringify({ approverIds }),
        }),
      approve: (id: string, notes?: string) =>
        request<Invoice>(`/api/finance/invoices/${id}/approve`, {
          method: "POST",
          body: JSON.stringify({ notes }),
        }),
      reject: (id: string, notes: string) =>
        request<Invoice>(`/api/finance/invoices/${id}/reject`, {
          method: "POST",
          body: JSON.stringify({ notes }),
        }),
      send: (id: string) => request<Invoice>(`/api/finance/invoices/${id}/send`, { method: "POST" }),
      cancel: (id: string) => request<Invoice>(`/api/finance/invoices/${id}/cancel`, { method: "POST" }),
      markOverdue: () =>
        request<{ updatedCount: number }>("/api/finance/invoices/mark-overdue", { method: "POST" }),
    },

    payments: {
      list: (params?: { invoiceId?: string; status?: string; provider?: string }) =>
        request<Payment[]>(`/api/finance/payments${buildQuery(params)}`),
      recordManual: (data: RecordManualPaymentInput) =>
        request<Payment>("/api/finance/payments/manual", { method: "POST", body: JSON.stringify(data) }),
      createCheckoutSession: (invoiceId: string, provider: "STRIPE" | "RAZORPAY") =>
        request<{
          payment: Payment;
          session: {
            provider: "STRIPE" | "RAZORPAY";
            sessionId: string;
            checkoutUrl?: string;
            razorpayOrderId?: string;
            amount: number;
            currency: string;
            publishableKey?: string;
          };
        }>("/api/finance/payments/checkout-session", {
          method: "POST",
          body: JSON.stringify({ invoiceId, provider }),
        }),
    },

    reimbursements: {
      list: (params?: { employeeId?: string; status?: string }) =>
        request<Reimbursement[]>(`/api/finance/reimbursements${buildQuery(params)}`),
      get: (id: string) => request<Reimbursement>(`/api/finance/reimbursements/${id}`),
      create: (data: CreateReimbursementInput) =>
        request<Reimbursement>("/api/finance/reimbursements", { method: "POST", body: JSON.stringify(data) }),
      review: (id: string, data: { status: "APPROVED" | "REJECTED"; reviewNotes?: string }) =>
        request<Reimbursement>(`/api/finance/reimbursements/${id}/review`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      markPaid: (id: string, data?: { paymentReference?: string }) =>
        request<Reimbursement>(`/api/finance/reimbursements/${id}/mark-paid`, {
          method: "POST",
          body: JSON.stringify(data ?? {}),
        }),
    },
  },

  payroll: {
    salaryStructures: {
      list: (params?: { employeeId?: string }) =>
        request<SalaryStructure[]>(`/api/payroll/salary-structures${buildQuery(params)}`),
      getActive: (employeeId: string) =>
        request<SalaryStructure>(`/api/payroll/salary-structures/active/${employeeId}`),
      create: (data: CreateSalaryStructureInput) =>
        request<SalaryStructure>("/api/payroll/salary-structures", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },

    salaryRevisions: {
      list: (params?: { employeeId?: string; status?: string }) =>
        request<SalaryRevision[]>(`/api/payroll/salary-revisions${buildQuery(params)}`),
      get: (id: string) => request<SalaryRevision>(`/api/payroll/salary-revisions/${id}`),
      request: (data: RequestSalaryRevisionInput) =>
        request<SalaryRevision>("/api/payroll/salary-revisions", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      approve: (id: string, reviewNotes?: string) =>
        request<SalaryRevision>(`/api/payroll/salary-revisions/${id}/approve`, {
          method: "POST",
          body: JSON.stringify({ reviewNotes }),
        }),
      reject: (id: string, reviewNotes?: string) =>
        request<SalaryRevision>(`/api/payroll/salary-revisions/${id}/reject`, {
          method: "POST",
          body: JSON.stringify({ reviewNotes }),
        }),
    },

    runs: {
      list: (params?: { year?: string; status?: string }) =>
        request<PayrollRun[]>(`/api/payroll/runs${buildQuery(params)}`),
      get: (id: string) => request<PayrollRun>(`/api/payroll/runs/${id}`),
      create: (data: CreatePayrollRunInput) =>
        request<PayrollRun>("/api/payroll/runs", { method: "POST", body: JSON.stringify(data) }),
      calculate: (id: string) =>
        request<{ run: PayrollRun; skippedEmployeeIds: string[] }>(`/api/payroll/runs/${id}/calculate`, {
          method: "POST",
        }),
      submitForApproval: (id: string, approverIds: string[]) =>
        request<PayrollRun>(`/api/payroll/runs/${id}/submit`, {
          method: "POST",
          body: JSON.stringify({ approverIds }),
        }),
      approve: (id: string, notes?: string) =>
        request<PayrollRun>(`/api/payroll/runs/${id}/approve`, {
          method: "POST",
          body: JSON.stringify({ notes }),
        }),
      reject: (id: string, notes?: string) =>
        request<PayrollRun>(`/api/payroll/runs/${id}/reject`, {
          method: "POST",
          body: JSON.stringify({ notes }),
        }),
      process: (id: string) => request<PayrollRun>(`/api/payroll/runs/${id}/process`, { method: "POST" }),
      markPaid: (id: string) => request<PayrollRun>(`/api/payroll/runs/${id}/mark-paid`, { method: "POST" }),
      cancel: (id: string) => request<PayrollRun>(`/api/payroll/runs/${id}/cancel`, { method: "POST" }),
    },

    payslips: {
      list: (params?: { employeeId?: string; year?: string }) =>
        request<Payslip[]>(`/api/payroll/payslips${buildQuery(params)}`),
    },
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

  // Phase 7: Development & QA Module
  engineering: {
    releases: {
      list: (params?: { projectId?: string; status?: string }) =>
        request<Release[]>(
          `/api/engineering/releases${buildQuery({
            projectId: params?.projectId,
            status: params?.status,
          })}`,
        ),
      get: (id: string) => request<Release>(`/api/engineering/releases/${id}`),
      create: (data: CreateReleaseInput) =>
        request<Release>("/api/engineering/releases", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateReleaseInput) =>
        request<Release>(`/api/engineering/releases/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      deploy: (id: string) =>
        request<Release>(`/api/engineering/releases/${id}/deploy`, {
          method: "POST",
        }),
      rollback: (id: string) =>
        request<Release>(`/api/engineering/releases/${id}/rollback`, {
          method: "POST",
        }),
    },

    testCases: {
      list: (params?: { projectId?: string; releaseId?: string; status?: string; assignedToId?: string }) =>
        request<TestCase[]>(
          `/api/engineering/test-cases${buildQuery({
            projectId: params?.projectId,
            releaseId: params?.releaseId,
            status: params?.status,
            assignedToId: params?.assignedToId,
          })}`,
        ),
      get: (id: string) => request<TestCase>(`/api/engineering/test-cases/${id}`),
      create: (data: CreateTestCaseInput) =>
        request<TestCase>("/api/engineering/test-cases", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateTestCaseInput) =>
        request<TestCase>(`/api/engineering/test-cases/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      execute: (id: string, data: ExecuteTestCaseInput) =>
        request<TestCase>(`/api/engineering/test-cases/${id}/execute`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },

    documentation: {
      list: (params?: { projectId?: string; category?: string; search?: string }) =>
        request<Documentation[]>(
          `/api/engineering/docs${buildQuery({
            projectId: params?.projectId,
            category: params?.category,
            search: params?.search,
          })}`,
        ),
      get: (id: string) => request<Documentation>(`/api/engineering/docs/${id}`),
      create: (data: CreateDocumentationInput) =>
        request<Documentation>("/api/engineering/docs", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateDocumentationInput) =>
        request<Documentation>(`/api/engineering/docs/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      publish: (id: string) =>
        request<Documentation>(`/api/engineering/docs/${id}/publish`, {
          method: "POST",
        }),
    },

    training: {
      list: (params?: { category?: string; isRequired?: boolean }) =>
        request<TechTraining[]>(
          `/api/engineering/training${buildQuery({
            category: params?.category,
            isRequired: params?.isRequired,
          })}`,
        ),
      get: (id: string) => request<TechTraining>(`/api/engineering/training/${id}`),
      create: (data: CreateTrainingInput) =>
        request<TechTraining>("/api/engineering/training", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateTrainingInput) =>
        request<TechTraining>(`/api/engineering/training/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      myEnrollments: () => request<TrainingEnrollment[]>("/api/engineering/training/my-enrollments"),
      enroll: (data: EnrollTrainingInput) =>
        request<TrainingEnrollment>("/api/engineering/training/enroll", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      updateEnrollment: (id: string, data: UpdateEnrollmentInput) =>
        request<TrainingEnrollment>(`/api/engineering/training/enrollments/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
    },

    codeReviews: {
      list: (params?: { projectId?: string; authorId?: string; reviewerId?: string; status?: string }) =>
        request<CodeReview[]>(
          `/api/engineering/code-reviews${buildQuery({
            projectId: params?.projectId,
            authorId: params?.authorId,
            reviewerId: params?.reviewerId,
            status: params?.status,
          })}`,
        ),
      get: (id: string) => request<CodeReview>(`/api/engineering/code-reviews/${id}`),
      create: (data: CreateCodeReviewInput) =>
        request<CodeReview>("/api/engineering/code-reviews", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (id: string, data: UpdateCodeReviewInput) =>
        request<CodeReview>(`/api/engineering/code-reviews/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      approve: (id: string) =>
        request<CodeReview>(`/api/engineering/code-reviews/${id}/approve`, {
          method: "POST",
        }),
      requestChanges: (id: string, notes: string) =>
        request<CodeReview>(`/api/engineering/code-reviews/${id}/request-changes`, {
          method: "POST",
          body: JSON.stringify({ notes }),
        }),
    },

    dashboard: {
      mySprintDashboard: (sprintId?: string) =>
        request<SprintDashboard>(
          `/api/engineering/dashboard/my-sprint${buildQuery({ sprintId })}`,
        ),
      myMetrics: (period?: string) =>
        request<EngineeringMetrics>(
          `/api/engineering/dashboard/my-metrics${buildQuery({ period })}`,
        ),
      teamMetrics: (projectId?: string) =>
        request<EngineeringMetrics[]>(
          `/api/engineering/dashboard/team-metrics${buildQuery({ projectId })}`,
        ),
    },
  },

  helpdesk: {
    listTickets: (params?: { status?: string; assignedToId?: string; search?: string }) =>
      request<SupportTicket[]>(
        `/api/helpdesk/tickets${buildQuery({
          status: params?.status,
          assignedToId: params?.assignedToId,
          search: params?.search,
        })}`,
      ),
    getTicket: (id: string) => request<SupportTicket>(`/api/helpdesk/tickets/${id}`),
    assignTicket: (id: string, assignedToId: string | null) =>
      request<SupportTicket>(`/api/helpdesk/tickets/${id}/assign`, {
        method: "POST",
        body: JSON.stringify({ assignedToId }),
      }),
    updateTicketStatus: (
      id: string,
      status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_EMPLOYEE" | "RESOLVED" | "CLOSED",
    ) =>
      request<SupportTicket>(`/api/helpdesk/tickets/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    replyToTicket: (
      id: string,
      data: { body: string; attachmentFileId?: string; setWaiting?: boolean },
    ) =>
      request<SupportTicket>(`/api/helpdesk/tickets/${id}/reply`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    escalateTicket: (id: string, data: EscalateTicketInput) =>
      request<SupportTicket>(`/api/helpdesk/tickets/${id}/escalate`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    listSlaPolicies: () => request<SlaPolicy[]>("/api/helpdesk/sla"),
    upsertSlaPolicy: (data: UpsertSlaPolicyInput) =>
      request<SlaPolicy>("/api/helpdesk/sla", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    listKb: (params?: { publishedOnly?: boolean; category?: string; search?: string }) =>
      request<KnowledgeBaseArticle[]>(
        `/api/helpdesk/kb${buildQuery({
          publishedOnly: params?.publishedOnly ? "true" : undefined,
          category: params?.category,
          search: params?.search,
        })}`,
      ),
    getKb: (id: string) => request<KnowledgeBaseArticle>(`/api/helpdesk/kb/${id}`),
    createKb: (data: CreateKbArticleInput) =>
      request<KnowledgeBaseArticle>("/api/helpdesk/kb", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateKb: (id: string, data: UpdateKbArticleInput) =>
      request<KnowledgeBaseArticle>(`/api/helpdesk/kb/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteKb: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/api/helpdesk/kb/${id}`, { method: "DELETE" }),
  },

  notifications: {
    list: (params?: { unreadOnly?: boolean; category?: string }) =>
      request<AppNotification[]>(
        `/api/notifications${buildQuery({
          unreadOnly: params?.unreadOnly ? "true" : undefined,
          category: params?.category,
        })}`,
      ),
    unreadCount: () => request<{ count: number }>("/api/notifications/unread-count"),
    markRead: (id: string) =>
      request<AppNotification>(`/api/notifications/${id}/read`, { method: "POST" }),
    markAllRead: () =>
      request<{ count: number }>("/api/notifications/read-all", { method: "POST" }),
    getPreferences: () => request<NotificationPreference[]>("/api/notifications/preferences"),
    updatePreference: (data: UpdatePreferenceInput) =>
      request<NotificationPreference>("/api/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    listAnnouncements: (activeOnly?: boolean) =>
      request<Announcement[]>(
        `/api/notifications/announcements${buildQuery(
          activeOnly ? { activeOnly: "true" } : undefined,
        )}`,
      ),
    createAnnouncement: (data: CreateAnnouncementInput) =>
      request<Announcement>("/api/notifications/announcements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateAnnouncement: (id: string, data: UpdateAnnouncementInput) =>
      request<Announcement>(`/api/notifications/announcements/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    publishAnnouncement: (id: string) =>
      request<Announcement>(`/api/notifications/announcements/${id}/publish`, {
        method: "POST",
      }),
    deleteAnnouncement: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/api/notifications/announcements/${id}`, {
        method: "DELETE",
      }),
  },

  approvals: {
    list: (params?: {
      entityType?: string;
      requesterId?: string;
      approverId?: string;
      status?: string;
    }) =>
      request<ApprovalRequest[]>(
        `/api/approvals${buildQuery({
          entityType: params?.entityType,
          requesterId: params?.requesterId,
          approverId: params?.approverId,
          status: params?.status,
        })}`,
      ),
    getPending: () => request<ApprovalRequest[]>("/api/approvals/pending/my"),
    getStats: () => request<ApprovalStats>("/api/approvals/stats/my"),
    getById: (id: string) => request<ApprovalRequest>(`/api/approvals/${id}`),
    getHistory: (id: string) =>
      request<ApprovalRequest["actions"]>(`/api/approvals/${id}/history`),
    approve: (id: string, notes?: string) =>
      request<ApprovalRequest>(`/api/approvals/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    reject: (id: string, notes: string) =>
      request<ApprovalRequest>(`/api/approvals/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    cancel: (id: string, reason?: string) =>
      request<ApprovalRequest>(`/api/approvals/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    listWorkflows: (entityType?: string) =>
      request<ApprovalWorkflow[]>(
        `/api/approvals/workflows${buildQuery(entityType ? { entityType } : undefined)}`,
      ),
    getWorkflow: (id: string) => request<ApprovalWorkflow>(`/api/approvals/workflows/${id}`),
    createWorkflow: (data: CreateWorkflowInput) =>
      request<ApprovalWorkflow>("/api/approvals/workflows", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateWorkflow: (id: string, data: UpdateWorkflowInput) =>
      request<ApprovalWorkflow>(`/api/approvals/workflows/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteWorkflow: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/api/approvals/workflows/${id}`, {
        method: "DELETE",
      }),
    listDelegations: () => request<ApprovalDelegation[]>("/api/approvals/delegations"),
    createDelegation: (data: CreateDelegationInput) =>
      request<ApprovalDelegation>("/api/approvals/delegations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateDelegation: (
      id: string,
      data: { startsAt?: string; endsAt?: string; reason?: string | null; isActive?: boolean },
    ) =>
      request<ApprovalDelegation>(`/api/approvals/delegations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteDelegation: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/api/approvals/delegations/${id}`, {
        method: "DELETE",
      }),
    processEscalations: () =>
      request<{ processed: number }>("/api/approvals/process-escalations", { method: "POST" }),
  },

  documents: {
    listCategories: () => request<DocumentCategory[]>("/api/documents/categories"),
    createCategory: (data: CreateDocumentCategoryInput) =>
      request<DocumentCategory>("/api/documents/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateCategory: (
      id: string,
      data: { name?: string; description?: string | null; context?: DocumentContext | null },
    ) =>
      request<DocumentCategory>(`/api/documents/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteCategory: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/api/documents/categories/${id}`, {
        method: "DELETE",
      }),
    list: (params?: {
      search?: string;
      context?: DocumentContext;
      contextEntityId?: string;
      categoryId?: string;
      createdById?: string;
    }) =>
      request<ManagedDocument[]>(
        `/api/documents${buildQuery({
          search: params?.search,
          context: params?.context,
          contextEntityId: params?.contextEntityId,
          categoryId: params?.categoryId,
          createdById: params?.createdById,
        })}`,
      ),
    getById: (id: string) => request<ManagedDocument>(`/api/documents/${id}`),
    create: (data: CreateDocumentInput) =>
      request<ManagedDocument>("/api/documents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    addVersion: (id: string, data: { fileId: string; changeNotes?: string }) =>
      request<ManagedDocument>(`/api/documents/${id}/versions`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    setPermissions: (id: string, data: SetDocumentPermissionsInput) =>
      request<ManagedDocument>(`/api/documents/${id}/permissions`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/api/documents/${id}`, { method: "DELETE" }),
  },

  reports: {
    getKpis: (scope: KpiScope, filters?: ReportFilters) =>
      request<DashboardKpis>(
        `/api/reports/kpis/${scope}${buildQuery({
          dateFrom: filters?.dateFrom,
          dateTo: filters?.dateTo,
          departmentId: filters?.departmentId,
        })}`,
      ),

    getReport: (type: ReportType, filters?: ReportFilters) =>
      request<ReportPayload>(
        `/api/reports/${type}${buildQuery({
          dateFrom: filters?.dateFrom,
          dateTo: filters?.dateTo,
          departmentId: filters?.departmentId,
        })}`,
      ),

    exportReport: async (
      type: ReportType,
      format: ReportFormat,
      filters?: ReportFilters,
    ) => {
      const { blob, filename } = await requestBlob(
        `/api/reports/${type}/export${buildQuery({
          format,
          dateFrom: filters?.dateFrom,
          dateTo: filters?.dateTo,
          departmentId: filters?.departmentId,
        })}`,
      );
      downloadBlob(blob, filename);
      return { filename };
    },

    listSchedules: () => request<ReportSchedule[]>("/api/reports/schedules"),

    createSchedule: (data: CreateReportScheduleInput) =>
      request<ReportSchedule>("/api/reports/schedules", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateSchedule: (id: string, data: UpdateReportScheduleInput) =>
      request<ReportSchedule>(`/api/reports/schedules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    deleteSchedule: (id: string) =>
      request<{ id: string; deleted?: boolean }>(`/api/reports/schedules/${id}`, {
        method: "DELETE",
      }),

    runDue: () =>
      request<{ processed: number; errors: unknown[] }>("/api/reports/schedules/run-due", {
        method: "POST",
      }),
  },

  audit: {
    list: (params?: AuditLogQuery) =>
      request<AuditLog[]>(
        `/api/audit-logs${buildQuery({
          userId: params?.userId,
          entity: params?.entity,
          action: params?.action,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
          search: params?.search,
          page: params?.page != null ? String(params.page) : undefined,
          pageSize: params?.pageSize != null ? String(params.pageSize) : undefined,
        })}`,
      ),
  },

  securityEvents: {
    list: (params?: SecurityEventQuery) =>
      request<SecurityEvent[]>(
        `/api/security-events${buildQuery({
          userId: params?.userId,
          eventType: params?.eventType,
          severity: params?.severity,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
          search: params?.search,
          page: params?.page != null ? String(params.page) : undefined,
          pageSize: params?.pageSize != null ? String(params.pageSize) : undefined,
        })}`,
      ),
  },

  settings: {
    list: () => request<SystemSetting[]>("/api/settings"),
    upsert: (data: UpsertSettingsInput) =>
      request<SystemSetting[]>("/api/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  notificationTemplates: {
    list: () => request<NotificationTemplate[]>("/api/notification-templates"),
    create: (data: CreateNotificationTemplateInput) =>
      request<NotificationTemplate>("/api/notification-templates", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateNotificationTemplateInput) =>
      request<NotificationTemplate>(`/api/notification-templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<NotificationTemplate>(`/api/notification-templates/${id}`, {
        method: "DELETE",
      }),
  },

  admin: {
    getMasterData: () => request<MasterDataSummary>("/api/admin/master-data"),
    getIntegrations: () => request<IntegrationPlaceholder[]>("/api/admin/integrations"),
  },
};
