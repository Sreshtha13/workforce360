"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  actionLabel,
  featureLabel,
  RBAC_ACTIONS,
  RBAC_MODULES,
  type PermissionRecord,
} from "@/lib/rbac";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const emptyForm = {
  name: "",
  code: "",
  module: "Administration",
  feature: "",
  resource: "",
  action: "read",
  description: "",
};

export default function PermissionsAdminPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PermissionRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const canView = hasPermission("permission.read");
  const canCreate = hasPermission("permission.create");
  const canUpdate = hasPermission("permission.update");
  const canDelete = hasPermission("permission.delete");

  const query = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await apiClient.permissions.list();
      return (res.data ?? []) as PermissionRecord[];
    },
    enabled: canView,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        code: form.code,
        module: form.module,
        feature: form.feature,
        resource: form.resource,
        action: form.action,
        description: form.description || undefined,
      };
      if (editing) return apiClient.permissions.update(editing.id, payload);
      return apiClient.permissions.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      setSheetOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback({
        type: "success",
        message: editing ? "Permission updated" : "Permission created",
      });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Save failed",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.permissions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      setFeedback({ type: "success", message: "Permission deleted" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Delete failed",
      });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (perm: PermissionRecord) => {
    setEditing(perm);
    setForm({
      name: perm.name,
      code: perm.code,
      module: perm.module || "General",
      feature: perm.feature ?? featureLabel(perm),
      resource: perm.resource,
      action: perm.action,
      description: perm.description ?? "",
    });
    setSheetOpen(true);
  };

  if (!canView) {
    return <ErrorState message="You do not have permission to view permissions." />;
  }

  if (query.isLoading) return <LoadingState message="Loading permissions..." />;
  if (query.isError) {
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : "Failed to load"}
        onRetry={() => query.refetch()}
      />
    );
  }

  const permissions = query.data ?? [];
  const moduleOptions = RBAC_MODULES.map((m) => ({ value: m, label: m }));
  const actionOptions = RBAC_ACTIONS.map((a) => ({ value: a.key, label: a.label }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Permissions"
        description="Manage permission definitions grouped by module, feature, and action."
        actionLabel={canCreate ? "Add Permission" : undefined}
        onAction={canCreate ? openCreate : undefined}
      />

      {feedback && (
        <AlertBanner
          variant={feedback.type === "error" ? "error" : "success"}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {permissions.length === 0 ? (
        <EmptyState
          title="No permissions yet"
          actionLabel={canCreate ? "Create Permission" : undefined}
          onAction={canCreate ? openCreate : undefined}
        />
      ) : (
        <DataTable
          data={permissions}
          rowKey={(p) => p.id}
          columns={[
            {
              key: "name",
              header: "Permission",
              render: (p) => (
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.code}</p>
                </div>
              ),
            },
            {
              key: "module",
              header: "Module",
              render: (p) => <Badge variant="secondary">{p.module || "General"}</Badge>,
            },
            {
              key: "feature",
              header: "Feature",
              render: (p) => featureLabel(p),
            },
            {
              key: "action",
              header: "Action",
              render: (p) => actionLabel(p.action),
            },
            { key: "resource", header: "Resource", render: (p) => p.resource },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (p) => (
                <div className="flex justify-end gap-2">
                  {canUpdate && (
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        confirm(`Delete permission "${p.name}"?`) && deleteMutation.mutate(p.id)
                      }
                    >
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
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit Permission" : "Create Permission"}
        description="Permissions are categorized by module and feature for the role matrix."
        onSubmit={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
      >
        <FormField
          label="Name"
          name="name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <FormField
          label="Code"
          name="code"
          value={form.code}
          onChange={(v) => setForm({ ...form, code: v })}
          required
        />
        <FormSelect
          label="Module"
          name="module"
          value={form.module}
          onChange={(v) => setForm({ ...form, module: v })}
          options={moduleOptions}
          required
        />
        <FormField
          label="Feature"
          name="feature"
          value={form.feature}
          onChange={(v) => setForm({ ...form, feature: v })}
          required
        />
        <FormField
          label="Resource"
          name="resource"
          value={form.resource}
          onChange={(v) => setForm({ ...form, resource: v })}
          required
        />
        <FormSelect
          label="Action"
          name="action"
          value={form.action}
          onChange={(v) => setForm({ ...form, action: v })}
          options={actionOptions}
          required
        />
        <FormTextarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
      </FormSheet>
    </div>
  );
}
