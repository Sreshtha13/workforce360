"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_COMPANY_ID } from "@/lib/constants";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, ErrorState, LoadingState } from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Row = { id: string; name: string; code?: string; city?: string; country?: string; type?: string; isActive: boolean; _count?: { users: number } };
const emptyForm = { name: "", code: "", type: "", address: "", city: "", state: "", country: "", postalCode: "", phone: "", email: "" };

export default function OfficesPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const canCreate = hasPermission("office.create");
  const canUpdate = hasPermission("office.update");
  const canDelete = hasPermission("office.delete");

  const query = useQuery({ queryKey: ["offices"], queryFn: async () => (await apiClient.organization.offices.list()).data ?? [] });
  const save = useMutation({
    mutationFn: async () => {
      const payload = { companyId: DEFAULT_COMPANY_ID, ...form, code: form.code || undefined, type: form.type || undefined, address: form.address || undefined, city: form.city || undefined, state: form.state || undefined, country: form.country || undefined, postalCode: form.postalCode || undefined, phone: form.phone || undefined, email: form.email || undefined };
      return editing ? apiClient.organization.offices.update(editing.id, payload) : apiClient.organization.offices.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offices"] }); setOpen(false); setEditing(null); setForm(emptyForm); setFeedback({ type: "success", message: "Saved" }); },
    onError: (e) => setFeedback({ type: "error", message: e instanceof ApiClientError ? e.message : "Save failed" }),
  });
  const del = useMutation({ mutationFn: (id: string) => apiClient.organization.offices.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["offices"] }); setFeedback({ type: "success", message: "Deleted" }); } });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Failed to load offices" onRetry={() => query.refetch()} />;
  const rows = (query.data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Offices & Branches" description="Office locations for your organization." actionLabel={canCreate ? "Add Office" : undefined} onAction={canCreate ? () => { setEditing(null); setForm(emptyForm); setOpen(true); } : undefined} />
      {feedback && <AlertBanner variant={feedback.type === "error" ? "error" : "success"} message={feedback.message} onDismiss={() => setFeedback(null)} />}
      {rows.length === 0 ? <EmptyState title="No offices" actionLabel={canCreate ? "Create Office" : undefined} onAction={canCreate ? () => setOpen(true) : undefined} /> : (
        <DataTable data={rows} rowKey={(r) => r.id} columns={[
          { key: "name", header: "Office", render: (r) => r.name },
          { key: "type", header: "Type", render: (r) => r.type ?? "—" },
          { key: "location", header: "Location", render: (r) => [r.city, r.country].filter(Boolean).join(", ") || "—" },
          { key: "users", header: "Users", render: (r) => r._count?.users ?? 0 },
          { key: "status", header: "Status", render: (r) => <Badge variant={r.isActive ? "success" : "warning"}>{r.isActive ? "Active" : "Inactive"}</Badge> },
          { key: "actions", header: "Actions", className: "text-right", render: (r) => (
            <div className="flex justify-end gap-2">
              {canUpdate && <Button variant="outline" size="sm" onClick={() => { setEditing(r); setForm({ name: r.name, code: r.code ?? "", type: r.type ?? "", address: "", city: r.city ?? "", state: "", country: r.country ?? "", postalCode: "", phone: "", email: "" }); setOpen(true); }}>Edit</Button>}
              {canDelete && <Button variant="destructive" size="sm" onClick={() => confirm(`Delete ${r.name}?`) && del.mutate(r.id)}>Delete</Button>}
            </div>
          )},
        ]} />
      )}
      <FormSheet open={open} onOpenChange={setOpen} title={editing ? "Edit Office" : "Create Office"} onSubmit={() => save.mutate()} loading={save.isPending}>
        <FormField label="Name" name="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <FormField label="Code" name="code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
        <FormField label="Type" name="type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} placeholder="headquarters, branch..." />
        <FormField label="Address" name="address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="City" name="city" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <FormField label="State" name="state" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Country" name="country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          <FormField label="Postal code" name="postalCode" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} />
        </div>
        <FormField label="Phone" name="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
      </FormSheet>
    </div>
  );
}
