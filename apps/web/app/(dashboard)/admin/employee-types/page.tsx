"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, ErrorState, LoadingState } from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Row = { id: string; name: string; code?: string; description?: string; isActive: boolean; _count?: { users: number } };
const emptyForm = { name: "", code: "", description: "" };

export default function EmployeeTypesPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const canCreate = hasPermission("employee_type.create");
  const canUpdate = hasPermission("employee_type.update");
  const canDelete = hasPermission("employee_type.delete");

  const query = useQuery({ queryKey: ["employee-types"], queryFn: async () => (await apiClient.organization.employeeTypes.list()).data ?? [] });
  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, code: form.code || undefined, description: form.description || undefined };
      return editing ? apiClient.organization.employeeTypes.update(editing.id, payload) : apiClient.organization.employeeTypes.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employee-types"] }); setOpen(false); setEditing(null); setForm(emptyForm); setFeedback({ type: "success", message: "Saved" }); },
    onError: (e) => setFeedback({ type: "error", message: e instanceof ApiClientError ? e.message : "Save failed" }),
  });
  const del = useMutation({ mutationFn: (id: string) => apiClient.organization.employeeTypes.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["employee-types"] }); setFeedback({ type: "success", message: "Deleted" }); } });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Failed to load employee types" onRetry={() => query.refetch()} />;
  const rows = (query.data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Employee Types" description="Full-time, part-time, contract, etc." actionLabel={canCreate ? "Add Type" : undefined} onAction={canCreate ? () => { setEditing(null); setForm(emptyForm); setOpen(true); } : undefined} />
      {feedback && <AlertBanner variant={feedback.type === "error" ? "error" : "success"} message={feedback.message} onDismiss={() => setFeedback(null)} />}
      {rows.length === 0 ? <EmptyState title="No employee types" actionLabel={canCreate ? "Create" : undefined} onAction={canCreate ? () => setOpen(true) : undefined} /> : (
        <DataTable data={rows} rowKey={(r) => r.id} columns={[
          { key: "name", header: "Name", render: (r) => r.name },
          { key: "code", header: "Code", render: (r) => r.code ?? "—" },
          { key: "users", header: "Users", render: (r) => r._count?.users ?? 0 },
          { key: "status", header: "Status", render: (r) => <Badge variant={r.isActive ? "success" : "warning"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
          { key: "actions", header: "Actions", className: "text-right", render: (r) => (
            <div className="flex justify-end gap-2">
              {canUpdate && <Button variant="outline" size="sm" onClick={() => { setEditing(r); setForm({ name: r.name, code: r.code ?? "", description: r.description ?? "" }); setOpen(true); }}>Edit</Button>}
              {canDelete && <Button variant="destructive" size="sm" onClick={() => confirm(`Delete ${r.name}?`) && del.mutate(r.id)}>Delete</Button>}
            </div>
          )},
        ]} />
      )}
      <FormSheet open={open} onOpenChange={setOpen} title={editing ? "Edit Employee Type" : "Create Employee Type"} onSubmit={() => save.mutate()} loading={save.isPending}>
        <FormField label="Name" name="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <FormField label="Code" name="code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
        <FormTextarea label="Description" name="description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      </FormSheet>
    </div>
  );
}
