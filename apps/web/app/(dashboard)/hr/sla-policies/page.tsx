"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Timer } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { TicketPriority, UpsertSlaPolicyInput } from "@/types/helpdesk";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const emptyForm = {
  name: "",
  priority: "MEDIUM" as TicketPriority,
  firstResponseMinutes: "240",
  resolutionMinutes: "1440",
  escalateAfterMinutes: "",
  isActive: "true",
};

export default function SlaPoliciesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canManage = hasPermission("ticket.manage");

  const listQuery = useQuery({
    queryKey: ["helpdesk", "sla"],
    queryFn: async () => (await apiClient.helpdesk.listSlaPolicies()).data ?? [],
    enabled: canManage,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload: UpsertSlaPolicyInput = {
        name: form.name.trim() || `${form.priority} SLA`,
        priority: form.priority,
        firstResponseMinutes: Number(form.firstResponseMinutes),
        resolutionMinutes: Number(form.resolutionMinutes),
        escalateAfterMinutes: form.escalateAfterMinutes
          ? Number(form.escalateAfterMinutes)
          : null,
        isActive: form.isActive === "true",
      };
      return apiClient.helpdesk.upsertSlaPolicy(payload);
    },
    onSuccess: async () => {
      setOpen(false);
      setForm(emptyForm);
      setFeedback("SLA policy saved.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["helpdesk", "sla"] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to save SLA policy");
    },
  });

  if (!canManage) {
    return <ErrorState message="You need ticket.manage to edit SLA policies." />;
  }
  if (listQuery.isLoading) return <LoadingState message="Loading SLA policies..." />;
  if (listQuery.isError) {
    return (
      <ErrorState message="Could not load SLA policies." onRetry={() => listQuery.refetch()} />
    );
  }

  const policies = listQuery.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="SLA Policies"
        description="First-response and resolution targets by ticket priority"
        actionLabel="Upsert policy"
        onAction={() => {
          setForm(emptyForm);
          setOpen(true);
        }}
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      {policies.length === 0 ? (
        <EmptyState
          icon={Timer}
          title="No SLA policies"
          description="Seed defaults apply after migration; upsert to customize."
        />
      ) : (
        <div className="divide-y rounded-2xl border border-white/20 bg-white/40 dark:bg-white/5">
          {policies.map((policy) => (
            <div key={policy.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium">{policy.name}</div>
                <div className="text-sm text-muted-foreground">
                  First response: {policy.firstResponseMinutes}m · Resolution:{" "}
                  {policy.resolutionMinutes}m
                  {policy.escalateAfterMinutes
                    ? ` · Escalate after: ${policy.escalateAfterMinutes}m`
                    : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info">{policy.priority}</Badge>
                <Badge variant={policy.isActive ? "success" : "soft"}>
                  {policy.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setForm({
                      name: policy.name,
                      priority: policy.priority,
                      firstResponseMinutes: String(policy.firstResponseMinutes),
                      resolutionMinutes: String(policy.resolutionMinutes),
                      escalateAfterMinutes: policy.escalateAfterMinutes
                        ? String(policy.escalateAfterMinutes)
                        : "",
                      isActive: policy.isActive ? "true" : "false",
                    });
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSheet
        open={open}
        onOpenChange={setOpen}
        title="SLA policy"
        description="One active policy per priority (upsert by priority)."
        onSubmit={() => upsertMutation.mutate()}
        loading={upsertMutation.isPending}
      >
        <FormField
          label="Name"
          name="name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
        <FormSelect
          label="Priority"
          name="priority"
          value={form.priority}
          onChange={(v) => setForm((f) => ({ ...f, priority: v as TicketPriority }))}
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
          required
        />
        <FormField
          label="First response (minutes)"
          name="firstResponseMinutes"
          type="number"
          value={form.firstResponseMinutes}
          onChange={(v) => setForm((f) => ({ ...f, firstResponseMinutes: v }))}
          required
        />
        <FormField
          label="Resolution (minutes)"
          name="resolutionMinutes"
          type="number"
          value={form.resolutionMinutes}
          onChange={(v) => setForm((f) => ({ ...f, resolutionMinutes: v }))}
          required
        />
        <FormField
          label="Escalate after (minutes, optional)"
          name="escalateAfterMinutes"
          type="number"
          value={form.escalateAfterMinutes}
          onChange={(v) => setForm((f) => ({ ...f, escalateAfterMinutes: v }))}
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
