"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { NotificationTemplate } from "@/types/admin";
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
  code: "",
  name: "",
  channel: "EMAIL",
  subject: "",
  body: "",
  description: "",
  isActive: "true",
};

export default function NotificationTemplatesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission("template.manage");

  const listQuery = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => (await apiClient.notificationTemplates.list()).data ?? [],
    enabled: canManage,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return apiClient.notificationTemplates.update(editing.id, {
          name: form.name.trim(),
          channel: form.channel,
          subject: form.subject.trim() || undefined,
          body: form.body,
          description: form.description.trim() || undefined,
          isActive: form.isActive === "true",
        });
      }
      return apiClient.notificationTemplates.create({
        code: form.code.trim(),
        name: form.name.trim(),
        channel: form.channel,
        subject: form.subject.trim() || undefined,
        body: form.body,
        description: form.description.trim() || undefined,
        isActive: form.isActive === "true",
      });
    },
    onSuccess: () => {
      setSheetOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback(editing ? "Template updated." : "Template created.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to save template"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.notificationTemplates.delete(id),
    onSuccess: () => {
      setFeedback("Template deleted.");
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to delete"),
  });

  if (!canManage) {
    return <ErrorState message="You do not have permission to manage templates." />;
  }
  if (listQuery.isLoading) return <LoadingState message="Loading templates..." />;
  if (listQuery.isError) {
    return (
      <ErrorState message="Failed to load templates." onRetry={() => listQuery.refetch()} />
    );
  }

  const items = listQuery.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (row: NotificationTemplate) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      channel: row.channel,
      subject: row.subject ?? "",
      body: row.body,
      description: row.description ?? "",
      isActive: row.isActive ? "true" : "false",
    });
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notification templates"
        description="Email and in-app message templates. Use {{variable}} placeholders in body/subject."
        actionLabel="Add template"
        onAction={openCreate}
      />

      {feedback && (
        <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />
      )}
      {error && (
        <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No templates"
          description="Create a notification template to customize outbound messages."
          actionLabel="Add template"
          onAction={openCreate}
        />
      ) : (
        <DataTable
          data={items}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "name",
              header: "Template",
              render: (r) => (
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{r.code}</p>
                </div>
              ),
            },
            { key: "channel", header: "Channel", render: (r) => r.channel },
            {
              key: "active",
              header: "Status",
              render: (r) => (
                <Badge variant={r.isActive ? "success" : "warning"}>
                  {r.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (r) => (
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      confirm(`Delete template "${r.name}"?`) && deleteMutation.mutate(r.id)
                    }
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit template" : "Create template"}
        description="Code is immutable after create."
        onSubmit={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
        size="wide"
      >
        {!editing && (
          <FormField
            label="Code"
            name="code"
            value={form.code}
            onChange={(v) => setForm({ ...form, code: v })}
            required
            helperText="Stable key, e.g. leave.approved"
          />
        )}
        <FormField
          label="Name"
          name="name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <FormSelect
          label="Channel"
          name="channel"
          value={form.channel}
          onChange={(v) => setForm({ ...form, channel: v })}
          options={[
            { value: "EMAIL", label: "Email" },
            { value: "IN_APP", label: "In-app" },
          ]}
        />
        <FormField
          label="Subject"
          name="subject"
          value={form.subject}
          onChange={(v) => setForm({ ...form, subject: v })}
        />
        <FormTextarea
          label="Body"
          name="body"
          value={form.body}
          onChange={(v) => setForm({ ...form, body: v })}
          required
        />
        <FormTextarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <FormSelect
          label="Active"
          name="isActive"
          value={form.isActive}
          onChange={(v) => setForm({ ...form, isActive: v })}
          options={[
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
      </FormSheet>
    </div>
  );
}
