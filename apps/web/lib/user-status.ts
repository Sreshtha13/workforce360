/** Account lifecycle status (users.status) — controls login and account access */
export const USER_ACCOUNT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blocked", label: "Blocked" },
  { value: "deleted", label: "Deleted" },
] as const;

export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number]["value"];

export const USER_ACCOUNT_STATUS_LABELS: Record<UserAccountStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
  deleted: "Deleted",
};

export function accountStatusBadgeVariant(
  status: string,
): "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    case "blocked":
      return "destructive";
    case "deleted":
      return "secondary";
    default:
      return "secondary";
  }
}

export const ACCOUNT_STATUS_HELPER =
  "Account lifecycle status — controls whether the user can sign in (Active, Inactive, Blocked, Deleted).";

export const EMPLOYMENT_STATUS_HELPER =
  "Employment type — describes how the employee works (Full Time, Part Time, Contract, etc.).";
