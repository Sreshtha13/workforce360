import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Briefcase,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Shield,
  Tags,
  UserCheck,
  Users,
  UsersRound,
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
