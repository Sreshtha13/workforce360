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

type Row = { id: string; name: string; code?: string; level?: number; description?: string; isActive: boolean; _count?: { users: number } };
const emptyForm = { name: "", code: "", level: "", description: "" };

export default function DesignationsPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const canCreate = hasPermission("designation.create");
  const canUpdate = hasPermission("designation.update");
  const canDelete = hasPermission("designation.delete");

  const query = useQuery({ queryKey: ["designations"], queryFn: async () => (await apiClient.organization.designations.list()).data ?? [] });
  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, code: form.code || undefined, level: form.level ? Number(form.level) : undefined, description: form.description || undefined };
      return editing ? apiClient.organization.designations.update(editing.id, payload) : apiClient.organization.designations.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["designations"] }); setOpen(false); setEditing(null); setForm(emptyForm); setFeedback({ type: "success", message: "Saved" }); },
    onError: (e) => setFeedback({ type: "error", message: e instanceof ApiClientError ? e.message : "Save failed" }),
  });
  const del = useMutation({ mutationFn: (id: string) => apiClient.organization.designations.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["designations"] }); setFeedback({ type: "success", message: "Deleted" }); } });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Failed to load designations" onRetry={() => query.refetch()} />;
  const rows = (query.data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Designations" description="Job titles and levels." actionLabel={canCreate ? "Add Designation" : undefined} onAction={canCreate ? () => { setEditing(null); setForm(emptyForm); setOpen(true); } : undefined} />
      {feedback && <AlertBanner variant={feedback.type === "error" ? "error" : "success"} message={feedback.message} onDismiss={() => setFeedback(null)} />}
      {rows.length === 0 ? <EmptyState title="No designations" actionLabel={canCreate ? "Create" : undefined} onAction={canCreate ? () => setOpen(true) : undefined} /> : (
        <DataTable data={rows} rowKey={(r) => r.id} columns={[
          { key: "name", header: "Name", render: (r) => r.name },
          { key: "code", header: "Code", render: (r) => r.code ?? "—" },
          { key: "level", header: "Level", render: (r) => r.level ?? "—" },
          { key: "users", header: "Users", render: (r) => r._count?.users ?? 0 },
          { key: "status", header: "Status", render: (r) => <Badge variant={r.isActive ? "success" : "warning"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
          { key: "actions", header: "Actions", className: "text-right", render: (r) => (
            <div className="flex justify-end gap-2">
              {canUpdate && <Button variant="outline" size="sm" onClick={() => { setEditing(r); setForm({ name: r.name, code: r.code ?? "", level: r.level?.toString() ?? "", description: r.description ?? "" }); setOpen(true); }}>Edit</Button>}
              {canDelete && <Button variant="destructive" size="sm" onClick={() => confirm(`Delete ${r.name}?`) && del.mutate(r.id)}>Delete</Button>}
            </div>
          )},
        ]} />
      )}
      <FormSheet open={open} onOpenChange={setOpen} title={editing ? "Edit Designation" : "Create Designation"} onSubmit={() => save.mutate()} loading={save.isPending}>
        <FormField label="Name" name="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <FormField label="Code" name="code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
        <FormField label="Level" name="level" type="number" value={form.level} onChange={(v) => setForm({ ...form, level: v })} />
        <FormTextarea label="Description" name="description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      </FormSheet>
    </div>
  );
}
