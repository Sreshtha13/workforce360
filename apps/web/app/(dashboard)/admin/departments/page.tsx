"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_COMPANY_ID } from "@/lib/constants";
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

type DepartmentMetrics = {
  totalEmployees: number;
  managers: number;
  openPositions: number;
  usersCount: number;
};

type Department = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  manager?: { id: string; firstName: string; lastName: string };
  parent?: { id: string; name: string };
  metrics: DepartmentMetrics;
};

const emptyForm = {
  name: "",
  code: "",
  description: "",
  managerId: "",
  parentId: "",
};

export default function DepartmentsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canCreate = hasPermission("department.create");
  const canUpdate = hasPermission("department.update");
  const canDelete = hasPermission("department.delete");

  const query = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiClient.organization.departments.list();
      return (res.data ?? []) as Department[];
    },
  });

  const lookupsQuery = useQuery({
    queryKey: ["department-lookups"],
    queryFn: async () => {
      const [departments, users] = await Promise.all([
        apiClient.organization.departments.list(),
        apiClient.users.list(),
      ]);
      return {
        departments: departments.data ?? [],
        users: users.data ?? [],
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        companyId: DEFAULT_COMPANY_ID,
        name: form.name,
        code: form.code || undefined,
        description: form.description || undefined,
        managerId: form.managerId || null,
        parentId: form.parentId || null,
      };
      if (editing) return apiClient.organization.departments.update(editing.id, payload);
      return apiClient.organization.departments.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["department-lookups"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-form-lookups"] });
      setSheetOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback({ type: "success", message: editing ? "Department updated" : "Department created" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Save failed",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.organization.departments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setFeedback({ type: "success", message: "Department deleted" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Delete failed",
      });
    },
  });

  if (query.isLoading) return <LoadingState message="Loading departments..." />;
  if (query.isError) {
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : "Failed to load"}
        onRetry={() => query.refetch()}
      />
    );
  }

  const departments = query.data ?? [];
  const deptOptions =
    lookupsQuery.data?.departments
      .filter((d: { id: string }) => d.id !== editing?.id)
      .map((d: { id: string; name: string }) => ({ value: d.id, label: d.name })) ?? [];
  const userOptions =
    lookupsQuery.data?.users.map((u: { id: string; firstName: string; lastName: string }) => ({
      value: u.id,
      label: `${u.firstName} ${u.lastName}`,
    })) ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Departments"
        description="Organizational departments with live workforce metrics."
        actionLabel={canCreate ? "Add Department" : undefined}
        onAction={canCreate ? () => { setEditing(null); setForm(emptyForm); setSheetOpen(true); } : undefined}
      />

      {feedback && (
        <AlertBanner variant={feedback.type === "error" ? "error" : "success"} message={feedback.message} onDismiss={() => setFeedback(null)} />
      )}

      {departments.length === 0 ? (
        <EmptyState title="No departments yet" actionLabel={canCreate ? "Create Department" : undefined} onAction={canCreate ? () => setSheetOpen(true) : undefined} />
      ) : (
        <DataTable
          data={departments}
          rowKey={(d) => d.id}
          columns={[
            {
              key: "name",
              header: "Department",
              render: (d) => (
                <div>
                  <p className="font-medium">{d.name}</p>
                  {d.code && <p className="text-xs text-muted-foreground">{d.code}</p>}
                </div>
              ),
            },
            { key: "totalEmployees", header: "Total Employees", render: (d) => d.metrics.totalEmployees },
            { key: "managers", header: "Managers", render: (d) => d.metrics.managers },
            { key: "openPositions", header: "Open Positions", render: (d) => d.metrics.openPositions },
            { key: "usersCount", header: "Users Count", render: (d) => d.metrics.usersCount },
            {
              key: "departmentHead",
              header: "Department Head",
              render: (d) => (d.manager ? `${d.manager.firstName} ${d.manager.lastName}` : "—"),
            },
            {
              key: "status",
              header: "Status",
              render: (d) => <Badge variant={d.isActive ? "success" : "warning"}>{d.isActive ? "Active" : "Inactive"}</Badge>,
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (d) => (
                <div className="flex justify-end gap-2">
                  {canUpdate && (
                    <Button variant="outline" size="sm" onClick={() => { setEditing(d); setForm({ name: d.name, code: d.code ?? "", description: d.description ?? "", managerId: d.manager?.id ?? "", parentId: d.parent?.id ?? "" }); setSheetOpen(true); }}>
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="destructive" size="sm" onClick={() => confirm(`Delete ${d.name}?`) && deleteMutation.mutate(d.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      <FormSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? "Edit Department" : "Create Department"} onSubmit={() => saveMutation.mutate()} loading={saveMutation.isPending}>
        <FormField label="Name" name="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <FormField label="Code" name="code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
        <FormTextarea label="Description" name="description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <FormSelect label="Parent department" name="parentId" value={form.parentId} onChange={(v) => setForm({ ...form, parentId: v })} options={deptOptions} />
        <FormSelect label="Department head" name="managerId" value={form.managerId} onChange={(v) => setForm({ ...form, managerId: v })} options={userOptions} />
      </FormSheet>
    </div>
  );
}
