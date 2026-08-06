/** Phase 2 — Recruitment & HR types (backend is source of truth). */

export type PipelineStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

export type JobPosting = {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements?: string | null;
  location?: string | null;
  employmentType?: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  publishedAt?: string | null;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  _count?: { applications: number };
};

export type StoredFile = {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  purpose: string;
};

export type Candidate = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  linkedInUrl?: string | null;
  pipelineStatus: PipelineStatus;
  resumeFile?: StoredFile | null;
  applications?: JobApplication[];
  employee?: EmployeeMaster | null;
};

export type JobApplication = {
  id: string;
  status: PipelineStatus;
  coverLetter?: string | null;
  appliedAt: string;
  statusNotes?: string | null;
  candidate?: Candidate;
  jobPosting?: JobPosting;
  interviews?: Interview[];
  assessments?: Assessment[];
  offerLetters?: OfferLetter[];
  checklistItems?: ChecklistItem[];
};

export type Interview = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  location?: string | null;
  meetingLink?: string | null;
  status: string;
  notes?: string | null;
  interviewer?: { id: string; firstName: string; lastName: string; email: string };
  application?: {
    candidate?: { id: string; firstName: string; lastName: string; email: string };
    jobPosting?: { id: string; title: string };
  };
};

export type Assessment = {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  score?: number | null;
};

export type OfferLetter = {
  id: string;
  salary?: string | null;
  currency: string;
  startDate?: string | null;
  content: string;
  status: string;
  sentAt?: string | null;
  application?: {
    candidate?: { id: string; firstName: string; lastName: string; email: string };
    jobPosting?: { id: string; title: string };
  };
};

export type ChecklistItem = {
  id: string;
  title: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: string | null;
  sortOrder: number;
};

export type EmployeeMaster = {
  id: string;
  employeeCode: string;
  lifecycleState: string;
  hiredAt: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    employeeId?: string | null;
    department?: { id: string; name: string } | null;
    designation?: { id: string; name: string } | null;
    office?: { id: string; name: string } | null;
  };
  candidate?: { id: string; email: string } | null;
  assignedAssets?: Asset[];
  lifecycleEvents?: { id: string; fromState?: string | null; toState: string; notes?: string | null; timestamp: string }[];
};

export type CompanyPolicy = {
  id: string;
  title: string;
  description?: string | null;
  version: string;
  status: string;
  publishedAt?: string | null;
  file?: StoredFile | null;
};

export type Asset = {
  id: string;
  name: string;
  tag: string;
  category?: string | null;
  serialNumber?: string | null;
  status: string;
  assignedAt?: string | null;
  employee?: {
    id: string;
    employeeCode: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  } | null;
};

export type SupportTicket = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category?: string | null;
  latestReply?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
};

export type PortalDashboard = {
  employee: EmployeeMaster | null;
  unreadNotifications: number;
  openTickets: number;
  comingSoon: {
    attendance: boolean;
    leave: boolean;
    timesheets: boolean;
    payslips: boolean;
  };
};

export type PortalProfileUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  employeeId?: string | null;
  dateOfBirth?: string | null;
  dateOfJoining?: string | null;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  office?: { id: string; name: string } | null;
  employeeType?: { id: string; name: string } | null;
  employmentStatus?: { id: string; name: string } | null;
  manager?: { id: string; firstName: string; lastName: string } | null;
  teamMemberships?: { team: { id: string; name: string } }[] | null;
};

export type PortalProfile = {
  user: PortalProfileUser;
  employee: EmployeeMaster | null;
};

export type HrDashboard = {
  profile?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { id: string; name: string } | null;
    designation?: { id: string; name: string } | null;
    userRoles?: { role: { id: string; name: string; code?: string | null } }[];
  } | null;
  employeeCount: number;
  activeEmployees: number;
  onboardingEmployees: number;
  joiningToday?: number;
  birthdays?: number;
  probation?: number;
  expiringDocuments?: number;
  openJobs?: number;
  pendingApprovals?: {
    total: number;
    breakdown: { label: string; count: number; href: string }[];
  };
  pipeline: { status: PipelineStatus; _count: { _all: number } }[];
  upcomingInterviews: Interview[];
  recentActivity?: {
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    actor: string;
  }[];
  attendance?: {
    available: boolean;
    message?: string;
  };
};

export type AdminDashboard = {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    totalUsers: number;
    departments: number;
    teams: number;
    designations: number;
    offices: number;
  };
  departmentBreakdown: { id: string; name: string; employeeCount: number }[];
  pendingApprovals: {
    total: number;
    breakdown: { label: string; count: number; href: string }[];
  };
  attendance: { available: false; message: string };
  leave: { available: false; message: string };
  hiring: {
    openJobs: number;
    pipeline: { status: PipelineStatus; _count: { _all: number } }[];
  };
  recentActivity: {
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: string;
    actor: { id: string; name: string; email: string } | null;
  }[];
  searchResults?: {
    employees: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      employeeId: string | null;
      department?: { id: string; name: string } | null;
    }[];
    departments: { id: string; name: string; code: string | null }[];
  };
};

export type DashboardEmployeePreview = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string | null;
  status: string;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  userRoles: { role: { id: string; name: string } }[];
};

export const PIPELINE_STATUSES: PipelineStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export type EmployeeLifecycleState =
  | "PRE_ONBOARDING"
  | "ONBOARDING"
  | "ACTIVE"
  | "OFFBOARDING"
  | "TERMINATED";

export const LIFECYCLE_LABELS: Record<EmployeeLifecycleState, string> = {
  PRE_ONBOARDING: "Pre-onboarding",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  OFFBOARDING: "Offboarding",
  TERMINATED: "Terminated",
};

export const LIFECYCLE_STATES: EmployeeLifecycleState[] = [
  "PRE_ONBOARDING",
  "ONBOARDING",
  "ACTIVE",
  "OFFBOARDING",
  "TERMINATED",
];
