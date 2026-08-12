"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Workflow } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/ticket-sla";
import type { ApprovalWorkflow } from "@/types/approvals";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const emptyForm = {
  name: "",
  code: "",
  entityType: "",
  description: "",
  isActive: "true",
  levelRoleCode: "",
  escalateAfterHours: "",
};

export default function ApprovalWorkflowsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalWorkflow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission("approval.manage");
  const canView = hasPermission("approval.read") || canManage;

  const listQuery = useQuery({
    queryKey: ["approvals", "workflows"],
    queryFn: async () => (await apiClient.approvals.listWorkflows()).data ?? [],
    enabled: canView,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const levels = form.levelRoleCode.trim()
        ? [
            {
              level: 1,
              approverRoleCode: form.levelRoleCode.trim(),
              escalateAfterHours: form.escalateAfterHours
                ? Number(form.escalateAfterHours)
                : null,
            },
          ]
        : undefined;

      if (editing) {
        return apiClient.approvals.updateWorkflow(editing.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          isActive: form.isActive === "true",
          levels,
        });
      }

      return apiClient.approvals.createWorkflow({
        name: form.name.trim(),
        code: form.code.trim(),
        entityType: form.entityType.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive === "true",
        levels,
      });
    },
    onSuccess: () => {
      setSheetOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback(editing ? "Workflow updated." : "Workflow created.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["approvals", "workflows"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to save workflow"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.approvals.deleteWorkflow(id),
    onSuccess: () => {
      setFeedback("Workflow deleted.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["approvals", "workflows"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to delete workflow"),
  });

  if (!canView) {
    return <ErrorState message="You do not have permission to view approval workflows." />;
  }
  if (listQuery.isLoading) return <LoadingState message="Loading workflows..." />;
  if (listQuery.isError) {
    return (
      <ErrorState message="Failed to load workflows." onRetry={() => listQuery.refetch()} />
    );
  }

  const workflows = (listQuery.data ?? []) as ApprovalWorkflow[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Approval workflows"
        description="Configure multi-level approval workflows by entity type."
        actionLabel={canManage ? "New workflow" : undefined}
        onAction={
          canManage
            ? () => {
                setEditing(null);
                setForm(emptyForm);
                setSheetOpen(true);
              }
            : undefined
        }
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      {workflows.length === 0 ? (
        <EmptyState
          title="No workflows"
          description="Create a workflow to route approvals for leave, invoices, tickets, and more."
          icon={Workflow}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/20 bg-white/40 dark:bg-white/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/15 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Levels</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                {canManage && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf) => (
                <tr key={wf.id} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3 font-medium">{wf.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{wf.code}</td>
                  <td className="px-4 py-3">{wf.entityType}</td>
                  <td className="px-4 py-3">{wf.levels?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge variant={wf.isActive ? "success" : "warning"}>
                      {wf.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(wf.updatedAt)}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(wf);
                            setForm({
                              name: wf.name,
                              code: wf.code,
                              entityType: wf.entityType,
                              description: wf.description ?? "",
                              isActive: wf.isActive ? "true" : "false",
                              levelRoleCode: wf.levels?.[0]?.approverRoleCode ?? "",
                              escalateAfterHours:
                                wf.levels?.[0]?.escalateAfterHours?.toString() ?? "",
                            });
                            setSheetOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(wf.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit workflow" : "New workflow"}
        description="Define the entity type and at least one approval level (by role code)."
        onSubmit={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
      >
        <FormField
          label="Name"
          name="name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          required
        />
        {!editing && (
          <FormField
            label="Code"
            name="code"
            value={form.code}
            onChange={(v) => setForm((f) => ({ ...f, code: v }))}
            required
          />
        )}
        {!editing && (
          <FormField
            label="Entity type"
            name="entityType"
            value={form.entityType}
            onChange={(v) => setForm((f) => ({ ...f, entityType: v }))}
            required
          />
        )}
        <FormTextarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          rows={3}
        />
        <FormField
          label="Level 1 approver role code"
          name="levelRoleCode"
          value={form.levelRoleCode}
          onChange={(v) => setForm((f) => ({ ...f, levelRoleCode: v }))}
        />
        <FormField
          label="Escalate after (hours)"
          name="escalateAfterHours"
          value={form.escalateAfterHours}
          onChange={(v) => setForm((f) => ({ ...f, escalateAfterHours: v }))}
        />
        <FormSelect
          label="Active"
          name="isActive"
          value={form.isActive}
          onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          options={[
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
      </FormSheet>
    </div>
  );
}
