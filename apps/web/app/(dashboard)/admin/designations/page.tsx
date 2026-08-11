"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, ErrorState, LoadingState } from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DesignationMetrics = {
  usersAssigned: number;
  vacantPositions: number;
};

type Designation = {
  id: string;
  name: string;
  code?: string;
  level: number;
  headcount: number;
  description?: string;
  isActive: boolean;
  department?: { id: string; name: string };
  metrics: DesignationMetrics;
};

const HIERARCHY_LEVELS = [
  { value: "1", label: "L1" },
  { value: "2", label: "L2" },
  { value: "3", label: "L3" },
  { value: "4", label: "L4" },
  { value: "5", label: "L5" },
];

const emptyForm = { departmentId: "", name: "", code: "", level: "", headcount: "1", description: "" };

function formatLevel(level?: number | null): string {
  return level != null ? `L${level}` : "—";
}

export default function DesignationsPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const canCreate = hasPermission("designation.create");
  const canUpdate = hasPermission("designation.update");
  const canDelete = hasPermission("designation.delete");
  const canView =
    hasPermission("designation.read") || canCreate || canUpdate || canDelete;

  const query = useQuery({
    queryKey: ["designations"],
    queryFn: async () => (await apiClient.organization.designations.list()).data ?? [],
    enabled: canView,
  });

  const departmentsQuery = useQuery({
    queryKey: ["designation-departments"],
    queryFn: async () => (await apiClient.organization.departments.list()).data ?? [],
    enabled: canView,
  });

  useEffect(() => {
    if (!open || editing || !form.departmentId) return;

    let cancelled = false;
    setCodeLoading(true);

    apiClient.organization.designations
      .nextCode(form.departmentId)
      .then((res) => {
        if (cancelled) return;
        const code = res.data?.code ?? "";
        setForm((prev) => (prev.departmentId === form.departmentId ? { ...prev, code } : prev));
      })
      .catch(() => {
        if (!cancelled) {
          setForm((prev) => (prev.departmentId === form.departmentId ? { ...prev, code: "" } : prev));
        }
      })
      .finally(() => {
        if (!cancelled) setCodeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, editing, form.departmentId]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        departmentId: form.departmentId,
        name: form.name,
        code: form.code || undefined,
        level: Number(form.level),
        headcount: Number(form.headcount),
        description: form.description || undefined,
      };
      return editing
        ? apiClient.organization.designations.update(editing.id, payload)
        : apiClient.organization.designations.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["designations"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback({ type: "success", message: "Saved" });
    },
    onError: (e) => setFeedback({ type: "error", message: e instanceof ApiClientError ? e.message : "Save failed" }),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiClient.organization.designations.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["designations"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
      setFeedback({ type: "success", message: "Deleted" });
    },
  });

  if (!canView) {
    return <ErrorState message="You do not have permission to view designations." />;
  }
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Failed to load designations" onRetry={() => query.refetch()} />;

  const rows = (query.data ?? []) as Designation[];
  const deptOptions =
    departmentsQuery.data?.map((d: { id: string; name: string }) => ({
      value: d.id,
      label: d.name,
    })) ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (row: Designation) => {
    setEditing(row);
    setForm({
      departmentId: row.department?.id ?? "",
      name: row.name,
      code: row.code ?? "",
      level: row.level?.toString() ?? "",
      headcount: row.headcount?.toString() ?? "1",
      description: row.description ?? "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Designations"
        description="Job titles with hierarchy levels and live assignment metrics. Codes are unique per department (e.g. ENG-001)."
        actionLabel={canCreate ? "Add Designation" : undefined}
        onAction={canCreate ? openCreate : undefined}
      />
      {feedback && (
        <AlertBanner variant={feedback.type === "error" ? "error" : "success"} message={feedback.message} onDismiss={() => setFeedback(null)} />
      )}
      {rows.length === 0 ? (
        <EmptyState title="No designations" actionLabel={canCreate ? "Create" : undefined} onAction={canCreate ? openCreate : undefined} />
      ) : (
        <DataTable
          data={rows}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "Designation", render: (r) => r.name },
            { key: "code", header: "Code", render: (r) => r.code ?? "—" },
            { key: "department", header: "Department", render: (r) => r.department?.name ?? "—" },
            { key: "level", header: "Hierarchy Level", render: (r) => formatLevel(r.level) },
            { key: "usersAssigned", header: "Users Assigned", render: (r) => r.metrics.usersAssigned },
            { key: "vacantPositions", header: "Vacant Positions", render: (r) => r.metrics.vacantPositions },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={r.isActive ? "success" : "warning"}>{r.isActive ? "Active" : "Inactive"}</Badge>,
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (r) => (
                <div className="flex justify-end gap-2">
                  {canUpdate && (
                    <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="destructive" size="sm" onClick={() => confirm(`Delete ${r.name}?`) && del.mutate(r.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
      <FormSheet open={open} onOpenChange={setOpen} title={editing ? "Edit Designation" : "Create Designation"} onSubmit={() => save.mutate()} loading={save.isPending}>
        <FormSelect
          label="Department"
          name="departmentId"
          value={form.departmentId}
          onChange={(v) => setForm({ ...form, departmentId: v, code: editing ? form.code : "" })}
          options={deptOptions}
          required
          helperText={departmentsQuery.isError ? "Failed to load departments" : undefined}
        />
        <FormField label="Name" name="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <FormField
          label="Code"
          name="code"
          value={form.code}
          onChange={(v) => setForm({ ...form, code: v })}
          helperText={
            editing
              ? "Unique within this department."
              : codeLoading
                ? "Generating next code…"
                : "Auto-generated per department (e.g. ENG-001). You can edit before saving."
          }
        />
        <FormSelect
          label="Hierarchy Level"
          name="level"
          value={form.level}
          onChange={(v) => setForm({ ...form, level: v })}
          options={HIERARCHY_LEVELS}
          required
          placeholder="Select level"
        />
        <FormField
          label="Approved headcount"
          name="headcount"
          type="number"
          value={form.headcount}
          onChange={(v) => setForm({ ...form, headcount: v })}
          required
          helperText="Planned position capacity. Vacant positions = headcount − users assigned."
        />
        <FormTextarea label="Description" name="description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      </FormSheet>
    </div>
  );
}
