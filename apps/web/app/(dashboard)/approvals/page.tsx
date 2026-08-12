"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/ticket-sla";
import type { ApprovalRequest } from "@/types/approvals";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Tab = "pending" | "history";

function statusVariant(status: string) {
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED" || status === "CANCELLED") return "destructive" as const;
  return "warning" as const;
}

export default function ApprovalsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAction = hasPermission("approval.action");
  const canView =
    hasPermission("approval.read") ||
    canAction ||
    hasPermission("approval.manage");

  const pendingQuery = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: async () => (await apiClient.approvals.getPending()).data ?? [],
    enabled: canView,
  });

  const historyQuery = useQuery({
    queryKey: ["approvals", "history"],
    queryFn: async () => (await apiClient.approvals.list()).data ?? [],
    enabled: canView && tab === "history",
  });

  const detailQuery = useQuery({
    queryKey: ["approvals", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      return (await apiClient.approvals.getById(selectedId)).data ?? null;
    },
    enabled: selectedId !== null,
  });

  const historyDetailQuery = useQuery({
    queryKey: ["approvals", selectedId, "actions"],
    queryFn: async () => {
      if (!selectedId) return [];
      return (await apiClient.approvals.getHistory(selectedId)).data ?? [];
    },
    enabled: selectedId !== null,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["approvals"] });
  };

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error("No request");
      return apiClient.approvals.approve(selectedId, notes.trim() || undefined);
    },
    onSuccess: () => {
      setNotes("");
      setSelectedId(null);
      setFeedback("Approved.");
      setError(null);
      invalidate();
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Approve failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error("No request");
      if (!notes.trim()) throw new Error("Rejection notes are required");
      return apiClient.approvals.reject(selectedId, notes.trim());
    },
    onSuccess: () => {
      setNotes("");
      setSelectedId(null);
      setFeedback("Rejected.");
      setError(null);
      invalidate();
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Reject failed"),
  });

  if (!canView) {
    return <ErrorState message="You do not have permission to view approvals." />;
  }

  const listLoading = tab === "pending" ? pendingQuery.isLoading : historyQuery.isLoading;
  const listError = tab === "pending" ? pendingQuery.isError : historyQuery.isError;
  const rows =
    tab === "pending"
      ? ((pendingQuery.data ?? []) as ApprovalRequest[])
      : ((historyQuery.data ?? []) as ApprovalRequest[]);

  if (listLoading) return <LoadingState message="Loading approvals..." />;
  if (listError) {
    return (
      <ErrorState
        message="Failed to load approvals."
        onRetry={() =>
          tab === "pending" ? pendingQuery.refetch() : historyQuery.refetch()
        }
      />
    );
  }

  const selected = detailQuery.data as ApprovalRequest | null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Approvals"
        description="Review pending requests and browse approval history."
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <div className="flex max-w-xs gap-2">
        <FormSelect
          label="View"
          name="tab"
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          options={[
            { value: "pending", label: "Pending inbox" },
            { value: "history", label: "All / history" },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={tab === "pending" ? "No pending approvals" : "No approval history"}
          description={
            tab === "pending"
              ? "Requests assigned to you will appear here."
              : "Approval requests will appear here once created."
          }
          icon={ClipboardCheck}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/20 bg-white/40 dark:bg-white/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/15 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((req) => (
                <tr
                  key={req.id}
                  className="cursor-pointer border-b border-white/10 last:border-0 hover:bg-white/30"
                  onClick={() => setSelectedId(req.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{req.entityType}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {req.entityId.slice(0, 12)}…
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {req.currentLevel}/{req.totalLevels}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(req.dueAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(req.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.entityType ?? "Approval"}</SheetTitle>
            <SheetDescription>
              {selected
                ? `${selected.status} · Level ${selected.currentLevel}/${selected.totalLevels}`
                : ""}
            </SheetDescription>
          </SheetHeader>

          {detailQuery.isLoading || !selected ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-white/10 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Entity ID:</span>{" "}
                  <span className="font-mono text-xs">{selected.entityId}</span>
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {formatDateTime(selected.createdAt)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Steps</p>
                {(selected.steps ?? []).map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
                  >
                    <span>Level {step.level}</span>
                    <Badge variant={statusVariant(step.status)}>{step.status}</Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">History</p>
                {(historyDetailQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No actions yet.</p>
                ) : (
                  (historyDetailQuery.data ?? []).map((action) => (
                    <div
                      key={action!.id}
                      className="rounded-lg border border-white/10 px-3 py-2 text-sm"
                    >
                      <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {action!.actionType} · L{action!.level}
                        </span>
                        <span>{formatDateTime(action!.timestamp)}</span>
                      </div>
                      {action!.notes && <p className="mt-1">{action!.notes}</p>}
                    </div>
                  ))
                )}
              </div>

              {canAction && selected.status === "PENDING" && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <FormTextarea
                    label="Notes (required to reject)"
                    name="notes"
                    value={notes}
                    onChange={setNotes}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => approveMutation.mutate()}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      disabled={
                        !notes.trim() ||
                        approveMutation.isPending ||
                        rejectMutation.isPending
                      }
                      onClick={() => rejectMutation.mutate()}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
