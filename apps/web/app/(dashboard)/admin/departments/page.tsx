"use client";

import { useMemo, useState } from "react";
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
import type { CreateDepartmentInput, Department, UpdateDepartmentInput, UserSummary } from "@/types/entities";

type DepartmentMetrics = {
  totalEmployees: number;
  managers: number;
  openPositions: number;
  usersCount: number;
};

type DepartmentRow = Department & {
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
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canCreate = hasPermission("department.create");
  const canUpdate = hasPermission("department.update");
  const canDelete = hasPermission("department.delete");

  const query = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiClient.organization.departments.list();
      return (res.data ?? []) as DepartmentRow[];
    },
  });

  const lookupsQuery = useQuery({
    queryKey: ["department-lookups"],
    queryFn: async () => {
      const results = await Promise.allSettled([
        apiClient.organization.departments.list(),
        apiClient.users.list(),
      ]);
      const departments =
        results[0].status === "fulfilled" ? (results[0].value.data ?? []) : [];
      const users = results[1].status === "fulfilled" ? (results[1].value.data ?? []) : [];
      return { departments, users };
    },
  });

  const departments = query.data ?? [];

  const hierarchyRows = useMemo(() => {
    const byParent = new Map<string | null, DepartmentRow[]>();
    for (const dept of departments) {
      const parentKey = dept.parent?.id ?? null;
      const siblings = byParent.get(parentKey) ?? [];
      siblings.push(dept);
      byParent.set(parentKey, siblings);
    }

    const rows: { dept: DepartmentRow; depth: number }[] = [];
    const seen = new Set<string>();
    const walk = (parentId: string | null, depth: number) => {
      const children = byParent.get(parentId) ?? [];
      for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
        if (seen.has(child.id)) continue;
        seen.add(child.id);
        rows.push({ dept: child, depth });
        walk(child.id, depth + 1);
      }
    };
    walk(null, 0);

    // Orphans whose parent is missing from the list
    for (const dept of departments) {
      if (!seen.has(dept.id)) {
        rows.push({ dept, depth: 0 });
      }
    }
    return rows;
  }, [departments]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: UpdateDepartmentInput = {
        companyId: DEFAULT_COMPANY_ID,
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        managerId: form.managerId || undefined,
        parentId: form.parentId || undefined,
      };
      if (editing) return apiClient.organization.departments.update(editing.id, payload);
      return apiClient.organization.departments.create(payload as CreateDepartmentInput);
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

  const lookupDepartments = (lookupsQuery.data?.departments ?? []) as DepartmentRow[];
  const deptOptions = lookupDepartments
    .filter((d) => d.id !== editing?.id)
    .map((d) => ({
      value: d.id,
      label: d.parent?.name ? `${d.name} (under ${d.parent.name})` : d.name,
    }));
  const userOptions =
    lookupsQuery.data?.users.map((u: UserSummary) => ({
      value: u.id,
      label: `${u.firstName} ${u.lastName}`,
    })) ?? [];

  if (query.isLoading) return <LoadingState message="Loading departments..." />;
  if (query.isError) {
    return (
      <ErrorState
        message={
          query.error instanceof ApiClientError
            ? query.error.message
            : query.error instanceof Error
              ? query.error.message
              : "Failed to load departments"
        }
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Departments"
        description="Organizational units with optional parent hierarchy and a department head. Assigning a head syncs reporting managers for users in that department."
        actionLabel={canCreate ? "Add Department" : undefined}
        onAction={
          canCreate
            ? () => {
                setEditing(null);
                setForm(emptyForm);
                setSheetOpen(true);
              }
            : undefined
        }
      />

      {feedback && (
        <AlertBanner
          variant={feedback.type === "error" ? "error" : "success"}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {departments.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Create a top-level department, then nest child departments under a parent if needed."
          actionLabel={canCreate ? "Create Department" : undefined}
          onAction={canCreate ? () => setSheetOpen(true) : undefined}
        />
      ) : (
        <>
          <div className="rounded-2xl border border-white/15 bg-white/20 p-4 dark:bg-white/5">
            <h3 className="mb-1 text-sm font-semibold">Department hierarchy</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Indentation shows parent → child. Root departments have no parent.
            </p>
            {hierarchyRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hierarchy to display.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {hierarchyRows.map(({ dept, depth }) => (
                  <li
                    key={dept.id}
                    style={{ paddingLeft: depth * 20 }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    {depth > 0 && (
                      <span className="text-muted-foreground" aria-hidden>
                        └
                      </span>
                    )}
                    <span className="font-medium">{dept.name}</span>
                    {dept.parent?.name && depth === 0 && (
                      <Badge variant="outline">Parent: {dept.parent.name}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {dept.metrics?.totalEmployees ?? 0} employees
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
                    {d.parent?.name && (
                      <p className="text-xs text-muted-foreground">Under {d.parent.name}</p>
                    )}
                  </div>
                ),
              },
              {
                key: "parent",
                header: "Parent",
                render: (d) => d.parent?.name ?? "—",
              },
              {
                key: "totalEmployees",
                header: "Total Employees",
                render: (d) => d.metrics?.totalEmployees ?? 0,
              },
              {
                key: "managers",
                header: "Managers",
                render: (d) => d.metrics?.managers ?? 0,
              },
              {
                key: "openPositions",
                header: "Open Positions",
                render: (d) => d.metrics?.openPositions ?? 0,
              },
              {
                key: "usersCount",
                header: "Users Count",
                render: (d) => d.metrics?.usersCount ?? 0,
              },
              {
                key: "departmentHead",
                header: "Department Head",
                render: (d) =>
                  d.manager ? `${d.manager.firstName} ${d.manager.lastName}` : "—",
              },
              {
                key: "status",
                header: "Status",
                render: (d) => (
                  <Badge variant={d.isActive ? "success" : "warning"}>
                    {d.isActive ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                className: "text-right",
                render: (d) => (
                  <div className="flex justify-end gap-2">
                    {canUpdate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(d);
                          setForm({
                            name: d.name,
                            code: d.code ?? "",
                            description: d.description ?? "",
                            managerId: d.manager?.id ?? "",
                            parentId: d.parent?.id ?? "",
                          });
                          setSheetOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          confirm(`Delete ${d.name}?`) && deleteMutation.mutate(d.id)
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
        </>
      )}

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit Department" : "Create Department"}
        description="Optionally nest under a parent department and assign a department head."
        onSubmit={() => {
          if (!form.name.trim()) {
            setFeedback({ type: "error", message: "Department name is required" });
            return;
          }
          saveMutation.mutate();
        }}
        loading={saveMutation.isPending}
      >
        <FormField
          label="Name"
          name="name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
          helperText="Display name shown across HR and org charts."
        />
        <FormField
          label="Code"
          name="code"
          value={form.code}
          onChange={(v) => setForm({ ...form, code: v })}
          helperText="Optional short code (e.g. ENG, HR)."
        />
        <FormTextarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <FormSelect
          label="Parent department"
          name="parentId"
          value={form.parentId}
          onChange={(v) => setForm({ ...form, parentId: v })}
          options={deptOptions}
          placeholder="None (top-level)"
          helperText="Leave empty for a root department. Choose a parent to nest this unit."
        />
        <FormSelect
          label="Department head"
          name="managerId"
          value={form.managerId}
          onChange={(v) => setForm({ ...form, managerId: v })}
          options={userOptions}
          placeholder="Select department head..."
          helperText="The head becomes the reporting manager for users assigned to this department."
        />
        {lookupsQuery.isError && (
          <p className="text-xs text-destructive">
            Some lookup data failed to load. You can still save the department name and code.
          </p>
        )}
      </FormSheet>
    </div>
  );
}
