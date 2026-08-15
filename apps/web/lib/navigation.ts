import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  Briefcase,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Database,
  DollarSign,
  FileBarChart,
  FileText,
  Headphones,
  KeyRound,
  LayoutDashboard,
  Link2,
  MapPin,
  Megaphone,
  BookOpen,
  Receipt,
  ScrollText,
  Settings,
  Shield,
  Tags,
  Timer,
  UserCheck,
  UserCircle,
  Users,
  UsersRound,
  Wallet,
  Workflow,
  Target,
  Handshake,
  GitBranch,
  FlaskConical,
  GitPullRequest,
  GraduationCap,
} from "lucide-react";
import { isPortalModuleEnabled } from "@/lib/module-availability";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Any one of these permissions grants access */
  permissions?: string[];
  /**
   * When set, the user must have at least one of these role codes.
   * Used for applicant-only surfaces (e.g. My Applications).
   */
  roles?: string[];
  /** Hide the item if the user has any of these role codes */
  excludeRoles?: string[];
  /** If true, show to all authenticated users */
  public?: boolean;
};

export type NavFilterUser = {
  permissions: string[];
  roles?: { code?: string | null }[];
};

export const mainNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    public: true,
  },
  {
    label: "Approvals",
    href: "/approvals",
    icon: ClipboardCheck,
    permissions: ["approval.read", "approval.action", "approval.manage"],
  },
  {
    label: "Delegations",
    href: "/approvals/delegations",
    icon: UserCheck,
    permissions: ["approval.delegate", "approval.manage"],
  },
];

export const candidateNav: NavItem[] = [
  {
    label: "My Applications",
    href: "/candidate/dashboard",
    icon: ClipboardList,
    /** Applicant workflow only — not Super Admin / Admin / HR via portal.read */
    roles: ["candidate"],
  },
];

export const hrNav: NavItem[] = [
  {
    label: "HR Dashboard",
    href: "/hr/dashboard",
    icon: LayoutDashboard,
    permissions: ["hr.dashboard.read"],
  },
  {
    label: "Job Postings",
    href: "/hr/jobs",
    icon: Briefcase,
    permissions: ["job.read"],
  },
  {
    label: "Recruitment Pipeline",
    href: "/hr/pipeline",
    icon: Workflow,
    permissions: ["application.read"],
  },
  {
    label: "Candidates",
    href: "/hr/candidates",
    icon: Users,
    permissions: ["candidate.read"],
  },
  {
    label: "Employees",
    href: "/hr/employees",
    icon: UserCheck,
    permissions: ["employee.read"],
  },
  {
    label: "Interviews",
    href: "/hr/interviews",
    icon: Briefcase,
    permissions: ["interview.read"],
  },
  {
    label: "Offers",
    href: "/hr/offers",
    icon: FileText,
    permissions: ["offer.read"],
  },
  {
    label: "Onboarding",
    href: "/hr/onboarding",
    icon: ClipboardList,
    permissions: ["employee.read"],
  },
  {
    label: "Policies",
    href: "/hr/policies",
    icon: FileText,
    permissions: ["policy.read"],
  },
  {
    label: "Assets",
    href: "/hr/assets",
    icon: Tags,
    permissions: ["asset.read"],
  },
  {
    label: "Documents",
    href: "/hr/documents",
    icon: FileText,
    permissions: ["document.read", "document.manage"],
  },
  {
    label: "Support Tickets",
    href: "/hr/tickets",
    icon: Headphones,
    permissions: ["ticket.read"],
  },
  {
    label: "Knowledge Base",
    href: "/hr/knowledge-base",
    icon: BookOpen,
    permissions: ["ticket.read", "ticket.manage"],
  },
  {
    label: "SLA Policies",
    href: "/hr/sla-policies",
    icon: Timer,
    permissions: ["ticket.manage"],
  },
];

export const financeNav: NavItem[] = [
  {
    label: "Finance Dashboard",
    href: "/finance/dashboard",
    icon: LayoutDashboard,
    permissions: ["finance.dashboard.read"],
  },
  {
    label: "Clients",
    href: "/finance/clients",
    icon: Users,
    permissions: ["client.read", "client.manage"],
  },
  {
    label: "Invoices",
    href: "/finance/invoices",
    icon: FileText,
    permissions: ["invoice.read", "invoice.manage", "invoice.approve"],
  },
  {
    label: "Payments",
    href: "/finance/payments",
    icon: CreditCard,
    permissions: ["payment.read", "payment.manage"],
  },
  {
    label: "Reimbursements",
    href: "/finance/reimbursements",
    icon: Receipt,
    permissions: ["reimbursement.read", "reimbursement.review"],
  },
];

export const payrollNav: NavItem[] = [
  {
    label: "Payroll Dashboard",
    href: "/payroll/dashboard",
    icon: LayoutDashboard,
    permissions: ["payroll_run.read", "report.read", "dashboard.read"],
  },
  {
    label: "Salary Structures",
    href: "/payroll/salary-structures",
    icon: Wallet,
    permissions: ["salary_structure.read", "salary_structure.manage"],
  },
  {
    label: "Salary Revisions",
    href: "/payroll/salary-revisions",
    icon: DollarSign,
    permissions: ["salary_revision.read", "salary_revision.approve"],
  },
  {
    label: "Payroll Runs",
    href: "/payroll/runs",
    icon: FileText,
    permissions: ["payroll_run.read", "payroll_run.manage", "payroll_run.approve"],
  },
];

export const reportsNav: NavItem[] = [
  {
    label: "Reports",
    href: "/reports",
    icon: FileBarChart,
    permissions: ["report.read"],
  },
  {
    label: "Report schedules",
    href: "/reports/schedules",
    icon: Timer,
    permissions: ["report.schedule.manage"],
  },
];

export const bdNav: NavItem[] = [
  {
    label: "BD Dashboard",
    href: "/bd/dashboard",
    icon: LayoutDashboard,
    permissions: ["bd.lead.read", "bd.contact.read", "report.read"],
  },
  {
    label: "Leads",
    href: "/bd/leads",
    icon: Target,
    permissions: ["bd.lead.read", "bd.lead.create", "bd.lead.update"],
  },
  {
    label: "Contacts",
    href: "/bd/contacts",
    icon: Users,
    permissions: ["bd.contact.read", "bd.contact.create", "bd.contact.update"],
  },
  {
    label: "Bids",
    href: "/bd/bids",
    icon: FileText,
    permissions: ["bd.bid.read", "bd.bid.create", "bd.bid.update"],
  },
  {
    label: "Proposals",
    href: "/bd/proposals",
    icon: Handshake,
    permissions: ["bd.proposal.read", "bd.proposal.create", "bd.proposal.update"],
  },
];

export const engineeringNav: NavItem[] = [
  {
    label: "Engineering Dashboard",
    href: "/engineering/dashboard",
    icon: LayoutDashboard,
    permissions: [
      "engineering.release.read",
      "engineering.testcase.read",
      "engineering.codereview.read",
      "report.read",
    ],
  },
  {
    label: "Releases",
    href: "/engineering/releases",
    icon: GitBranch,
    permissions: ["engineering.release.read", "engineering.release.create"],
  },
  {
    label: "Test Cases",
    href: "/engineering/test-cases",
    icon: FlaskConical,
    permissions: ["engineering.testcase.read", "engineering.testcase.create"],
  },
  {
    label: "Code Reviews",
    href: "/engineering/code-reviews",
    icon: GitPullRequest,
    permissions: ["engineering.codereview.read", "engineering.codereview.create"],
  },
  {
    label: "Documentation",
    href: "/engineering/docs",
    icon: FileText,
    permissions: ["engineering.doc.read", "engineering.doc.create"],
  },
  {
    label: "Training",
    href: "/engineering/training",
    icon: GraduationCap,
    permissions: ["engineering.training.read", "engineering.training.enroll"],
  },
];

export const pmNav: NavItem[] = [
  {
    label: "PM Dashboard",
    href: "/pm/dashboard",
    icon: LayoutDashboard,
    permissions: ["pm.project.read", "report.read", "dashboard.read"],
  },
  {
    label: "Projects",
    href: "/pm/projects",
    icon: Briefcase,
    permissions: ["pm.project.read", "pm.project.create", "pm.project.update"],
  },
  {
    label: "Documents",
    href: "/pm/documents",
    icon: FileText,
    permissions: ["document.read", "pm.project.read"],
  },
];

export const portalNav: NavItem[] = [
  {
    label: "Portal Home",
    href: "/portal/dashboard",
    icon: LayoutDashboard,
    permissions: ["portal.read"],
  },
  {
    label: "My Profile",
    href: "/portal/profile",
    icon: UserCircle,
    permissions: ["portal.read"],
  },
  {
    label: "Security",
    href: "/portal/security",
    icon: Shield,
    permissions: ["portal.read"],
  },
  {
    label: "Attendance",
    href: "/portal/attendance",
    icon: ClipboardList,
    permissions: ["portal.read"],
  },
  {
    label: "Leave",
    href: "/portal/leave",
    icon: FileText,
    permissions: ["portal.read"],
  },
  {
    label: "Timesheets",
    href: "/portal/timesheets",
    icon: FileText,
    permissions: ["portal.read"],
  },
  {
    label: "My Requests",
    href: "/portal/requests",
    icon: ClipboardList,
    permissions: ["portal.read"],
  },
  {
    label: "Payslips",
    href: "/portal/payslips",
    icon: FileText,
    permissions: ["portal.read"],
  },
  {
    label: "My Assets",
    href: "/portal/assets",
    icon: Tags,
    permissions: ["portal.read"],
  },
  {
    label: "Documents",
    href: "/portal/documents",
    icon: FileText,
    permissions: ["document.read", "portal.read"],
  },
  {
    label: "Policies",
    href: "/portal/policies",
    icon: Shield,
    permissions: ["portal.read"],
  },
  {
    label: "Notifications",
    href: "/portal/notifications",
    icon: Bell,
    permissions: ["portal.read"],
  },
  {
    label: "Notification preferences",
    href: "/portal/notification-preferences",
    icon: Bell,
    permissions: ["portal.read"],
  },
  {
    label: "Support",
    href: "/portal/support",
    icon: Headphones,
    permissions: ["ticket.create", "portal.read"],
  },
];

export const adminNav: NavItem[] = [
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    permissions: ["user.read"],
  },
  {
    label: "Roles",
    href: "/admin/roles",
    icon: Shield,
    permissions: ["role.read"],
  },
  {
    label: "Permissions",
    href: "/admin/permissions",
    icon: KeyRound,
    permissions: ["permission.read"],
  },
  {
    label: "Master Data",
    href: "/admin/master-data",
    icon: Database,
    permissions: ["settings.manage", "dashboard.read", "department.read"],
  },
  {
    label: "Departments",
    href: "/admin/departments",
    icon: Building2,
    permissions: ["department.read", "department.create", "department.update", "department.delete"],
  },
  {
    label: "Teams",
    href: "/admin/teams",
    icon: UsersRound,
    permissions: ["team.read", "team.create", "team.update", "team.delete"],
  },
  {
    label: "Designations",
    href: "/admin/designations",
    icon: Briefcase,
    permissions: ["designation.read", "designation.create", "designation.update", "designation.delete"],
  },
  {
    label: "Offices",
    href: "/admin/offices",
    icon: MapPin,
    permissions: ["office.read", "office.create", "office.update", "office.delete"],
  },
  {
    label: "Employee Types",
    href: "/admin/employee-types",
    icon: Tags,
    permissions: ["employee_type.read", "employee_type.create", "employee_type.update", "employee_type.delete"],
  },
  {
    label: "Employment Statuses",
    href: "/admin/employment-statuses",
    icon: UserCheck,
    permissions: [
      "employment_status.read",
      "employment_status.create",
      "employment_status.update",
      "employment_status.delete",
    ],
  },
  {
    label: "Approval Workflows",
    href: "/admin/approval-workflows",
    icon: Workflow,
    permissions: ["approval.read", "approval.manage"],
  },
  {
    label: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
    permissions: ["announcement.manage"],
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ScrollText,
    permissions: ["audit.read"],
  },
  {
    label: "Security Events",
    href: "/admin/security-events",
    icon: Shield,
    permissions: ["security.read"],
  },
  {
    label: "Notification Templates",
    href: "/admin/notification-templates",
    icon: Bell,
    permissions: ["template.manage"],
  },
  {
    label: "System Settings",
    href: "/admin/settings",
    icon: Settings,
    permissions: ["settings.manage"],
  },
  {
    label: "Integrations",
    href: "/admin/integrations",
    icon: Link2,
    permissions: ["settings.manage", "dashboard.read"],
  },
];

function roleCodes(user: NavFilterUser | string[]): Set<string> {
  if (Array.isArray(user)) return new Set();
  return new Set(
    (user.roles ?? [])
      .map((role) => role.code)
      .filter((code): code is string => Boolean(code)),
  );
}

function permissionList(user: NavFilterUser | string[]): string[] {
  return Array.isArray(user) ? user : user.permissions;
}

/**
 * Filters nav items by module flags, permissions, and optional role rules.
 * Passing a bare permission string[] remains supported for existing call sites.
 */
export function filterNavByPermissions(
  items: NavItem[],
  userOrPermissions: NavFilterUser | string[],
): NavItem[] {
  const permissions = permissionList(userOrPermissions);
  const codes = roleCodes(userOrPermissions);

  return items.filter((item) => {
    if (!isPortalModuleEnabled(item.href)) return false;

    if (item.excludeRoles?.length && item.excludeRoles.some((code) => codes.has(code))) {
      return false;
    }

    if (item.roles?.length) {
      if (!item.roles.some((code) => codes.has(code))) {
        return false;
      }
    }

    if (item.public) return true;
    // Role checks already applied above; items with no permission list are visible
    if (!item.permissions?.length) return true;
    return item.permissions.some((p) => permissions.includes(p));
  });
}

/** True when the user should see the applicant "My Applications" surface. */
export function canAccessCandidateApplications(
  user: { roles?: { code?: string | null }[] } | null | undefined,
): boolean {
  return user?.roles?.some((role) => role.code === "candidate") ?? false;
}
