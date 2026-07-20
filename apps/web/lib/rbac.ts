import type { Permission } from "@/types/rbac";

/** Permission shape used by matrix and admin UI helpers. */
export type PermissionRecord = Pick<
  Permission,
  "id" | "name" | "code" | "module" | "resource" | "action" | "description"
> & {
  feature?: string | null;
};

export const RBAC_ACTIONS = [
  { key: "read", label: "View" },
  { key: "create", label: "Create" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
  { key: "export", label: "Export" },
  { key: "import", label: "Import" },
  { key: "assign", label: "Assign" },
  { key: "assign_role", label: "Assign" },
] as const;

const ACTION_LABELS: Record<string, string> = {
  read: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
  approve: "Approve",
  export: "Export",
  import: "Import",
  assign: "Assign",
  assign_role: "Assign",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function featureLabel(permission: PermissionRecord): string {
  if (permission.feature) return permission.feature;
  return permission.resource
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export type PermissionMatrixModule = {
  module: string;
  features: {
    feature: string;
    cells: Partial<Record<string, PermissionRecord>>;
  }[];
};

/** Group permissions into module → feature → action for matrix rendering. */
export function buildPermissionMatrix(permissions: PermissionRecord[]): PermissionMatrixModule[] {
  const moduleMap = new Map<string, Map<string, Map<string, PermissionRecord>>>();

  for (const perm of permissions) {
    const moduleName = perm.module || "General";
    const featureName = featureLabel(perm);
    if (!moduleMap.has(moduleName)) moduleMap.set(moduleName, new Map());
    const featureMap = moduleMap.get(moduleName)!;
    if (!featureMap.has(featureName)) featureMap.set(featureName, new Map());
    featureMap.get(featureName)!.set(perm.action, perm);
  }

  return Array.from(moduleMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, featureMap]) => ({
      module,
      features: Array.from(featureMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([feature, actionMap]) => ({
          feature,
          cells: Object.fromEntries(actionMap.entries()),
        })),
    }));
}

export function matrixActionColumns(permissions: PermissionRecord[]): string[] {
  const present = new Set(permissions.map((p) => p.action));
  const ordered: string[] = RBAC_ACTIONS.map((a) => a.key).filter((key) => present.has(key));
  for (const action of Array.from(present)) {
    if (!ordered.includes(action)) ordered.push(action);
  }
  return ordered;
}

export function permissionIdsFromRolePermissions(
  rolePermissions: { permissionId?: string; permission?: { id: string } }[],
): string[] {
  return rolePermissions
    .map((rp) => rp.permissionId ?? rp.permission?.id)
    .filter((id): id is string => Boolean(id));
}

export const RBAC_MODULES = [
  "Administration",
  "Organization",
  "HR",
  "Finance",
  "Projects",
  "General",
] as const;
