"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/ticket-sla";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ApprovalDelegationsPage() {
  const { hasPermission, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [delegateId, setDelegateId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canDelegate = hasPermission("approval.delegate") || hasPermission("approval.manage");

  const listQuery = useQuery({
    queryKey: ["approvals", "delegations"],
    queryFn: async () => (await apiClient.approvals.listDelegations()).data ?? [],
    enabled: canDelegate,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("Not signed in");
      return apiClient.approvals.createDelegation({
        delegatorId: user.id,
        delegateId: delegateId.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        reason: reason.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setOpen(false);
      setDelegateId("");
      setStartsAt("");
      setEndsAt("");
      setReason("");
      setFeedback(
        "Delegation created. Approvals assigned to you will route to the delegate while active.",
      );
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["approvals", "delegations"] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to create delegation");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.approvals.deleteDelegation(id),
    onSuccess: async () => {
      setFeedback("Delegation ended.");
      await queryClient.invalidateQueries({ queryKey: ["approvals", "delegations"] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to end delegation");
    },
  });

  if (!canDelegate) {
    return <ErrorState message="You need approval.delegate to manage delegations." />;
  }
  if (listQuery.isLoading) return <LoadingState message="Loading delegations..." />;
  if (listQuery.isError) {
    return (
      <ErrorState message="Could not load delegations." onRetry={() => listQuery.refetch()} />
    );
  }

  const rows = listQuery.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Approval Delegations"
        description={`Delegate your approval queue while OOO. Signed in as ${user?.email ?? "—"}.`}
        actionLabel="New delegation"
        onAction={() => setOpen(true)}
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      {rows.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No delegations"
          description="Create a window so another user can act on your pending approvals."
        />
      ) : (
        <div className="divide-y rounded-2xl border border-white/20 bg-white/40 dark:bg-white/5">
          {rows.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium">
                  → {d.delegate?.firstName} {d.delegate?.lastName}{" "}
                  <span className="text-muted-foreground">
                    ({d.delegate?.email ?? d.delegateId})
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(d.startsAt)} → {formatDateTime(d.endsAt)}
                  {d.reason ? ` · ${d.reason}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={d.isActive ? "success" : "soft"}>
                  {d.isActive ? "Active" : "Inactive"}
                </Badge>
                {d.isActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(d.id)}
                    disabled={deleteMutation.isPending}
                  >
                    End
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSheet
        open={open}
        onOpenChange={setOpen}
        title="New delegation"
        description="Paste the delegate user ID (from Admin → Users). Dates are local; stored as ISO."
        onSubmit={() => createMutation.mutate()}
        loading={createMutation.isPending}
      >
        <FormField
          label="Delegate user ID"
          name="delegateId"
          value={delegateId}
          onChange={setDelegateId}
          required
        />
        <FormField
          label="Starts at (YYYY-MM-DD or ISO)"
          name="startsAt"
          value={startsAt}
          onChange={setStartsAt}
          placeholder="2026-08-12T09:00:00"
          required
        />
        <FormField
          label="Ends at (YYYY-MM-DD or ISO)"
          name="endsAt"
          value={endsAt}
          onChange={setEndsAt}
          placeholder="2026-08-20T18:00:00"
          required
        />
        <FormTextarea label="Reason" name="reason" value={reason} onChange={setReason} />
      </FormSheet>
    </div>
  );
}
