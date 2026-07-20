/** Account lifecycle status stored on users.status (login/access control) */
export const USER_ACCOUNT_STATUSES = [
  "active",
  "inactive",
  "blocked",
  "deleted",
] as const;

export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];

export const USER_ACCOUNT_STATUS_LABELS: Record<UserAccountStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
  deleted: "Deleted",
};

/** Canonical employment type lookup codes (employment_statuses table) */
export const EMPLOYMENT_TYPE_CODES = [
  "full_time",
  "part_time",
  "contract",
  "intern",
  "probation",
  "consultant",
] as const;

export const EMPLOYMENT_TYPE_SEED = [
  { name: "Full Time", code: "full_time" },
  { name: "Part Time", code: "part_time" },
  { name: "Contract", code: "contract" },
  { name: "Intern", code: "intern" },
  { name: "Probation", code: "probation" },
  { name: "Consultant", code: "consultant" },
] as const;
