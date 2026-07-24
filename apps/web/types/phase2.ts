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
};

export type SupportTicket = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
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

export type PortalProfile = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    employeeId?: string | null;
    department?: { id: string; name: string } | null;
    designation?: { id: string; name: string } | null;
  };
  employee: EmployeeMaster | null;
};

export type HrDashboard = {
  employeeCount: number;
  activeEmployees: number;
  onboardingEmployees: number;
  pipeline: { status: PipelineStatus; _count: { _all: number } }[];
  upcomingInterviews: Interview[];
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
