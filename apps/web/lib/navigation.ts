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

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Any one of these permissions grants access */
  permissions?: string[];
  /** If true, show to all authenticated users */
  public?: boolean;
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
    permissions: ["portal.read"],
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
    permissions: ["portal.read"],
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
    permissions: ["department.create", "department.update", "department.delete"],
  },
  {
    label: "Teams",
    href: "/admin/teams",
    icon: UsersRound,
    permissions: ["team.create", "team.update", "team.delete"],
  },
  {
    label: "Designations",
    href: "/admin/designations",
    icon: Briefcase,
    permissions: ["designation.create", "designation.update", "designation.delete"],
  },
  {
    label: "Offices",
    href: "/admin/offices",
    icon: MapPin,
    permissions: ["office.create", "office.update", "office.delete"],
  },
  {
    label: "Employee Types",
    href: "/admin/employee-types",
    icon: Tags,
    permissions: ["employee_type.create", "employee_type.update", "employee_type.delete"],
  },
  {
    label: "Employment Statuses",
    href: "/admin/employment-statuses",
    icon: UserCheck,
    permissions: [
      "employment_status.create",
      "employment_status.update",
      "employment_status.delete",
    ],
  },
];

export function filterNavByPermissions(
  items: NavItem[],
  permissions: string[],
): NavItem[] {
  return items.filter((item) => {
    if (item.public) return true;
    if (!item.permissions?.length) return true;
    return item.permissions.some((p) => permissions.includes(p));
  });
}
