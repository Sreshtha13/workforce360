import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Briefcase,
  ClipboardList,
  FileText,
  Headphones,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Shield,
  Tags,
  UserCheck,
  UserCircle,
  Users,
  UsersRound,
  Workflow,
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
    label: "Support Tickets",
    href: "/hr/tickets",
    icon: Headphones,
    permissions: ["ticket.read"],
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
    permissions: ["portal.read"],
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
    icon: ClipboardList,
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
