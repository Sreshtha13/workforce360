"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { permissionIdsFromRolePermissions, type PermissionRecord } from "@/lib/rbac";
import type { Role } from "@/types/rbac";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { PermissionMatrix } from "@/components/rbac/permission-matrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { glass, iconSize } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type RoleRow = Role;

const emptyRoleForm = {
  name: "",
  code: "",
  description: "",
};

type PermissionSheetMode = "view" | "edit" | null;

export default function RolesAdminPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [permissionTarget, setPermissionTarget] = useState<RoleRow | null>(null);
  const [permissionMode, setPermissionMode] = useState<PermissionSheetMode>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const canView =
    hasPermission("role.read") ||
    hasPermission("role.create") ||
    hasPermission("role.update") ||
    hasPermission("role.delete");
  const canCreate = hasPermission("role.create");
  const canUpdate = hasPermission("role.update");
  const canDelete = hasPermission("role.delete");
  const canEditPermissions = hasPermission("role.update");

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await apiClient.roles.list();
      return (res.data ?? []) as RoleRow[];
    },
    enabled: canView,
  });

  const allPermissionsQuery = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await apiClient.permissions.list();
      return (res.data ?? []) as PermissionRecord[];
    },
    enabled: canView,
  });

  const rolePermissionsQuery = useQuery({
    queryKey: ["role-permissions", permissionTarget?.id],
    enabled: !!permissionTarget,
    queryFn: async () => {
      if (!permissionTarget) return [];
      const res = await apiClient.roles.getPermissions(permissionTarget.id);
      return res.data ?? [];
    },
  });

  useEffect(() => {
    if (rolePermissionsQuery.data) {
      setSelectedPermissionIds(permissionIdsFromRolePermissions(rolePermissionsQuery.data));
    }
  }, [rolePermissionsQuery.data]);

  const saveRoleMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: roleForm.name,
        code: roleForm.code || undefined,
        description: roleForm.description || undefined,
      };
      if (editingRole) return apiClient.roles.update(editingRole.id, payload);
      return apiClient.roles.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setRoleSheetOpen(false);
      setEditingRole(null);
      setRoleForm(emptyRoleForm);
      setFeedback({
        type: "success",
        message: editingRole ? "Role updated" : "Role created",
      });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Failed to save role",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => apiClient.roles.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setFeedback({ type: "success", message: "Role deleted" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Failed to delete role",
      });
    },
  });

  const duplicateRoleMutation = useMutation({
    mutationFn: (role: RoleRow) => apiClient.roles.duplicate(role.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setFeedback({ type: "success", message: "Role duplicated" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Failed to duplicate role",
      });
    },
  });

  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (!permissionTarget) throw new Error("No role selected");
      return apiClient.roles.setPermissions(permissionTarget.id, selectedPermissionIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions", permissionTarget?.id] });
      setPermissionTarget(null);
      setPermissionMode(null);
      setFeedback({ type: "success", message: "Role permissions updated" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Failed to update permissions",
      });
    },
  });

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm(emptyRoleForm);
    setRoleSheetOpen(true);
  };

  const openEditRole = (role: RoleRow) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      code: role.code ?? "",
      description: role.description ?? "",
    });
    setRoleSheetOpen(true);
  };

  const openPermissions = (role: RoleRow, mode: "view" | "edit") => {
    setPermissionTarget(role);
    setPermissionMode(mode);
    setSelectedPermissionIds([]);
  };

  const closePermissionSheet = (open: boolean) => {
    if (!open) {
      setPermissionTarget(null);
      setPermissionMode(null);
    }
  };

  if (!canView) {
    return <ErrorState message="You do not have permission to view role management." />;
  }

  if (rolesQuery.isLoading) return <LoadingState message="Loading roles..." />;
  if (rolesQuery.isError) {
    return (
      <ErrorState
        message={
          rolesQuery.error instanceof ApiClientError
            ? rolesQuery.error.message
            : "Failed to load roles"
        }
        onRetry={() => rolesQuery.refetch()}
      />
    );
  }

  const roles = rolesQuery.data ?? [];
  const allPermissions = allPermissionsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Role Management"
        description="Create roles, assign permissions, and manage access across the organization."
        actionLabel={canCreate ? "Add Role" : undefined}
        onAction={canCreate ? openCreateRole : undefined}
      />

      {feedback && (
        <AlertBanner
          variant={feedback.type === "error" ? "error" : "success"}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {roles.length === 0 ? (
        <EmptyState
          title="No roles found"
          description="Create a role or seed the database with default roles."
          actionLabel={canCreate ? "Add Role" : undefined}
          onAction={canCreate ? openCreateRole : undefined}
        />
      ) : (
        <DataTable
          data={roles}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "name",
              header: "Role",
              render: (r) => (
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  )}
                </div>
              ),
            },
            { key: "code", header: "Code", render: (r) => r.code ?? "—" },
            {
              key: "users",
              header: "Users",
              render: (r) => r._count?.userRoles ?? 0,
            },
            {
              key: "permissions",
              header: "Permissions",
              render: (r) => r._count?.rolePermissions ?? 0,
            },
            {
              key: "flags",
              header: "Flags",
              render: (r) => (
                <div className="flex flex-wrap gap-1">
                  {r.isSystem && <Badge variant="secondary">System</Badge>}
                  <Badge variant={r.isActive ? "success" : "warning"}>
                    {r.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (r) => (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPermissions(r, "view")}
                  >
                    View permissions
                  </Button>
                  {canEditPermissions && !r.isSystem && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPermissions(r, "edit")}
                    >
                      Edit permissions
                    </Button>
                  )}
                  {canUpdate && !r.isSystem && (
                    <Button variant="outline" size="sm" onClick={() => openEditRole(r)}>
                      <Pencil className={cn(iconSize.sm, "mr-1")} />
                      Edit
                    </Button>
                  )}
                  {canCreate && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={duplicateRoleMutation.isPending}
                      onClick={() => duplicateRoleMutation.mutate(r)}
                    >
                      <Copy className={cn(iconSize.sm, "mr-1")} />
                      Duplicate
                    </Button>
                  )}
                  {canDelete && !r.isSystem && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        confirm(`Delete role "${r.name}"?`) && deleteRoleMutation.mutate(r.id)
                      }
                    >
                      <Trash2 className={cn(iconSize.sm, "mr-1")} />
                      Delete
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      <FormSheet
        open={roleSheetOpen}
        onOpenChange={setRoleSheetOpen}
        title={editingRole ? "Edit Role" : "Create Role"}
        description="Define the role name and optional code. Permissions are managed separately."
        onSubmit={() => saveRoleMutation.mutate()}
        loading={saveRoleMutation.isPending}
      >
        <FormField
          label="Name"
          name="name"
          value={roleForm.name}
          onChange={(v) => setRoleForm({ ...roleForm, name: v })}
          required
        />
        <FormField
          label="Code"
          name="code"
          value={roleForm.code}
          onChange={(v) => setRoleForm({ ...roleForm, code: v })}
        />
        <FormTextarea
          label="Description"
          name="description"
          value={roleForm.description}
          onChange={(v) => setRoleForm({ ...roleForm, description: v })}
        />
      </FormSheet>

      <Sheet open={!!permissionTarget} onOpenChange={closePermissionSheet}>
        <SheetContent
          side="right"
          className={cn(glass.nav, "flex w-full flex-col border-l-0 sm:max-w-4xl")}
        >
          <SheetHeader className="border-b border-white/10 pb-4 dark:border-white/5">
            <SheetTitle className="flex items-center gap-2">
              <ShieldCheck className={iconSize.md} />
              {permissionTarget?.name}
            </SheetTitle>
            <SheetDescription>
              {permissionMode === "edit"
                ? "Select permissions for this role using the matrix below."
                : "Read-only view of permissions assigned to this role."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-1 py-4">
            {allPermissionsQuery.isLoading || rolePermissionsQuery.isLoading ? (
              <LoadingState message="Loading permission matrix..." />
            ) : allPermissionsQuery.isError || rolePermissionsQuery.isError ? (
              <ErrorState message="Failed to load permissions" />
            ) : (
              <PermissionMatrix
                permissions={allPermissions}
                selectedIds={selectedPermissionIds}
                onChange={permissionMode === "edit" ? setSelectedPermissionIds : undefined}
                readOnly={permissionMode !== "edit" || permissionTarget?.isSystem}
              />
            )}
          </div>

          {permissionMode === "edit" && canEditPermissions && !permissionTarget?.isSystem && (
            <SheetFooter className="flex-row justify-end gap-2 border-t border-white/10 pt-4 dark:border-white/5">
              <Button
                type="button"
                variant="outline"
                onClick={() => closePermissionSheet(false)}
                disabled={savePermissionsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={savePermissionsMutation.isPending}
                onClick={() => savePermissionsMutation.mutate()}
              >
                {savePermissionsMutation.isPending ? (
                  <>
                    <Loader2 className={cn(iconSize.md, "animate-spin")} />
                    Saving...
                  </>
                ) : (
                  "Save permissions"
                )}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
