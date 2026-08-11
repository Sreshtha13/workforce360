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
  const { hasPermission, isSuperAdmin, refetch: refetchAuth } = useAuth();
  const queryClient = useQueryClient();
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [createPermissionIds, setCreatePermissionIds] = useState<string[]>([]);
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
  /** Custom roles: role.update. System roles: Super Admin only (API-enforced). */
  const canEditCustomPermissions = hasPermission("role.update");
  const canEditSystemPermissions = isSuperAdmin;

  const canEditRolePermissions = (role: RoleRow) =>
    role.isSystem ? canEditSystemPermissions : canEditCustomPermissions;

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
        name: roleForm.name.trim(),
        code: roleForm.code.trim() || undefined,
        description: roleForm.description.trim() || undefined,
      };

      if (editingRole) {
        return apiClient.roles.update(editingRole.id, payload);
      }

      if (createPermissionIds.length === 0) {
        throw new Error("Select at least one permission");
      }

      const created = await apiClient.roles.create(payload);
      const roleId = created.data?.id;
      if (!roleId) throw new Error("Role created but no id returned");
      await apiClient.roles.setPermissions(roleId, createPermissionIds);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setRoleSheetOpen(false);
      setEditingRole(null);
      setRoleForm(emptyRoleForm);
      setCreatePermissionIds([]);
      setFeedback({
        type: "success",
        message: editingRole ? "Role updated" : "Role created with permissions",
      });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message:
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to save role",
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
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-permissions", permissionTarget?.id] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      await refetchAuth();
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
    setCreatePermissionIds([]);
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

  const handleSaveRole = () => {
    if (!roleForm.name.trim()) {
      setFeedback({ type: "error", message: "Role name is required" });
      return;
    }
    if (!editingRole && createPermissionIds.length === 0) {
      setFeedback({ type: "error", message: "Select at least one permission before saving" });
      return;
    }
    saveRoleMutation.mutate();
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
        description="Create roles and assign permissions. System role names stay locked; only Super Admins can edit system role permissions."
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
              render: (r) => {
                const canEditPerms = canEditRolePermissions(r);
                return (
                  <div className="flex flex-wrap justify-end gap-2">
                    {canEditPerms ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openPermissions(r, "edit")}
                      >
                        <Pencil className={cn(iconSize.sm, "mr-1")} />
                        Edit Permissions
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPermissions(r, "view")}
                    >
                      View permissions
                    </Button>
                    {canUpdate && !r.isSystem && (
                      <Button variant="outline" size="sm" onClick={() => openEditRole(r)}>
                        <Pencil className={cn(iconSize.sm, "mr-1")} />
                        Edit role
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
                );
              },
            },
          ]}
        />
      )}

      <FormSheet
        open={roleSheetOpen}
        onOpenChange={(open) => {
          setRoleSheetOpen(open);
          if (!open) {
            setCreatePermissionIds([]);
            setEditingRole(null);
            setRoleForm(emptyRoleForm);
          }
        }}
        title={editingRole ? "Edit Role" : "Create Role"}
        description={
          editingRole
            ? "Update the role name and description. Use Edit Permissions to change access."
            : "Define the role and select at least one permission. System roles stay read-only."
        }
        onSubmit={handleSaveRole}
        loading={saveRoleMutation.isPending}
        size={editingRole ? "default" : "wide"}
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
        {!editingRole && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Permissions<span className="ml-0.5 text-destructive">*</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Select at least one permission. These are applied immediately after the role is created.
            </p>
            {allPermissionsQuery.isLoading ? (
              <LoadingState message="Loading permissions..." />
            ) : allPermissionsQuery.isError ? (
              <ErrorState message="Failed to load permissions" onRetry={() => allPermissionsQuery.refetch()} />
            ) : (
              <PermissionMatrix
                permissions={allPermissions}
                selectedIds={createPermissionIds}
                onChange={setCreatePermissionIds}
              />
            )}
            {createPermissionIds.length === 0 && (
              <p className="text-xs text-destructive">At least one permission is required.</p>
            )}
          </div>
        )}
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
              {permissionMode === "edit" && permissionTarget?.isSystem
                ? "System role — Super Admin may update the permission matrix. Name and code stay locked."
                : permissionMode === "edit"
                  ? "Select permissions for this role using the matrix below."
                  : permissionTarget?.isSystem
                    ? isSuperAdmin
                      ? "System role permissions. Use Edit Permissions to make changes."
                      : "System role permissions are read-only. Only Super Administrators can change them."
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
                onChange={
                  permissionMode === "edit" &&
                  permissionTarget &&
                  canEditRolePermissions(permissionTarget)
                    ? setSelectedPermissionIds
                    : undefined
                }
                readOnly={
                  permissionMode !== "edit" ||
                  !permissionTarget ||
                  !canEditRolePermissions(permissionTarget)
                }
              />
            )}
          </div>

          {permissionMode === "edit" &&
            permissionTarget &&
            canEditRolePermissions(permissionTarget) && (
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
                disabled={savePermissionsMutation.isPending || selectedPermissionIds.length === 0}
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
