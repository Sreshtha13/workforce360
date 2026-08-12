"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { SearchBar } from "@/components/design-system/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Client, CreateClientInput } from "@/types/phase4";

const EMPTY_FORM: CreateClientInput = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  billingAddress: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  taxId: "",
  notes: "",
};

export default function FinanceClientsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState<CreateClientInput>(EMPTY_FORM);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["finance", "clients", search],
    queryFn: async () => {
      const res = await apiClient.finance.clients.list(search ? { search } : undefined);
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.finance.clients.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setFeedback("Client created.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to create client"),
  });

  const updateMutation = useMutation({
    mutationFn: () => apiClient.finance.clients.update(editClient!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
      setEditClient(null);
      setForm(EMPTY_FORM);
      setFeedback("Client updated.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to update client"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.finance.clients.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "clients"] });
      setFeedback("Client removed.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to remove client"),
  });

  if (query.isLoading) return <LoadingState message="Loading clients..." />;
  if (query.isError) return <ErrorState message="Failed to load clients." onRetry={() => query.refetch()} />;

  const clients = query.data ?? [];

  function openEdit(client: Client) {
    setEditClient(client);
    setForm({
      name: client.name,
      companyName: client.companyName ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      billingAddress: client.billingAddress ?? "",
      city: client.city ?? "",
      state: client.state ?? "",
      country: client.country ?? "",
      postalCode: client.postalCode ?? "",
      taxId: client.taxId ?? "",
      notes: client.notes ?? "",
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Clients"
        description="Manage client accounts billed through invoices."
        actionLabel={hasPermission("client.manage") ? "Add client" : undefined}
        onAction={hasPermission("client.manage") ? () => setCreateOpen(true) : undefined}
      />

      {feedback && <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add a client to start creating invoices."
          actionLabel={hasPermission("client.manage") ? "Add client" : undefined}
          onAction={hasPermission("client.manage") ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
            >
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="text-sm text-muted-foreground">
                  {client.companyName ?? client.email ?? "No additional details"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={client.status === "ACTIVE" ? "success" : "soft"}>{client.status}</Badge>
                {hasPermission("client.manage") && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openEdit(client)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(client.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Remove
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSheet
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setForm(EMPTY_FORM);
        }}
        title="Add client"
        onSubmit={() => createMutation.mutate()}
        loading={createMutation.isPending}
      >
        <ClientFormFields form={form} setForm={setForm} />
      </FormSheet>

      <FormSheet
        open={!!editClient}
        onOpenChange={(open) => {
          if (!open) {
            setEditClient(null);
            setForm(EMPTY_FORM);
          }
        }}
        title="Edit client"
        onSubmit={() => updateMutation.mutate()}
        loading={updateMutation.isPending}
      >
        <ClientFormFields form={form} setForm={setForm} />
        <FormSelect
          name="status"
          label="Status"
          value={(form as { status?: string }).status ?? "ACTIVE"}
          onChange={(v) => setForm({ ...form, status: v } as CreateClientInput & { status: string })}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />
      </FormSheet>
    </div>
  );
}

function ClientFormFields({
  form,
  setForm,
}: {
  form: CreateClientInput;
  setForm: (form: CreateClientInput) => void;
}) {
  return (
    <>
      <FormField name="name" label="Client name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
      <FormField
        name="companyName"
        label="Company name"
        value={form.companyName ?? ""}
        onChange={(v) => setForm({ ...form, companyName: v })}
      />
      <FormField name="email" label="Email" type="email" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} />
      <FormField name="phone" label="Phone" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
      <FormField
        name="billingAddress"
        label="Billing address"
        value={form.billingAddress ?? ""}
        onChange={(v) => setForm({ ...form, billingAddress: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField name="city" label="City" value={form.city ?? ""} onChange={(v) => setForm({ ...form, city: v })} />
        <FormField name="state" label="State" value={form.state ?? ""} onChange={(v) => setForm({ ...form, state: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField name="country" label="Country" value={form.country ?? ""} onChange={(v) => setForm({ ...form, country: v })} />
        <FormField
          name="postalCode"
          label="Postal code"
          value={form.postalCode ?? ""}
          onChange={(v) => setForm({ ...form, postalCode: v })}
        />
      </div>
      <FormField name="taxId" label="Tax ID" value={form.taxId ?? ""} onChange={(v) => setForm({ ...form, taxId: v })} />
      <FormTextarea name="notes" label="Notes" value={form.notes ?? ""} onChange={(v) => setForm({ ...form, notes: v })} />
    </>
  );
}
