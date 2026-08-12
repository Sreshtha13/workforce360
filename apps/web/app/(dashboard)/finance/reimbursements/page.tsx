"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reimbursementStatusVariant, formatMoney } from "@/lib/phase4-status";
import type { Reimbursement } from "@/types/phase4";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export default function FinanceReimbursementsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewTarget, setReviewTarget] = useState<Reimbursement | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["finance", "reimbursements", statusFilter],
    queryFn: async () => {
      const res = await apiClient.finance.reimbursements.list(statusFilter ? { status: statusFilter } : undefined);
      return res.data ?? [];
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["finance", "reimbursements"] });
  }

  const reviewMutation = useMutation({
    mutationFn: () =>
      apiClient.finance.reimbursements.review(reviewTarget!.id, {
        status: reviewDecision,
        reviewNotes: reviewNotes || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setReviewTarget(null);
      setReviewNotes("");
      setFeedback(`Reimbursement ${reviewDecision === "APPROVED" ? "approved" : "rejected"}.`);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to review reimbursement"),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => apiClient.finance.reimbursements.markPaid(id),
    onSuccess: () => {
      invalidate();
      setFeedback("Reimbursement marked as paid.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to mark as paid"),
  });

  if (query.isLoading) return <LoadingState message="Loading reimbursements..." />;
  if (query.isError) return <ErrorState message="Failed to load reimbursements." onRetry={() => query.refetch()} />;

  const reimbursements = query.data ?? [];
  const canReview = hasPermission("reimbursement.review");

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Employee reimbursements" description="Review and pay out employee expense claims." />

      {feedback && <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      <div className="flex flex-wrap items-center gap-2">
        {["", "PENDING", "APPROVED", "REJECTED", "PAID"].map((status) => (
          <Button
            key={status || "all"}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status || "All"}
          </Button>
        ))}
      </div>

      {reimbursements.length === 0 ? (
        <EmptyState title="No reimbursements" description="Employee expense claims will appear here." />
      ) : (
        <div className="space-y-3">
          {reimbursements.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
            >
              <div>
                <p className="font-medium">
                  {r.employee?.user ? `${r.employee.user.firstName} ${r.employee.user.lastName}` : r.employeeId} — {r.category}
                </p>
                <p className="text-sm text-muted-foreground">
                  {r.description} · {formatDate(r.expenseDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-medium tabular-nums">{formatMoney(Number(r.amount), r.currency)}</p>
                <Badge variant={reimbursementStatusVariant(r.status)}>{r.status}</Badge>
                {canReview && r.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        setReviewTarget(r);
                        setReviewDecision("APPROVED");
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReviewTarget(r);
                        setReviewDecision("REJECTED");
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {canReview && r.status === "APPROVED" && (
                  <Button size="sm" variant="outline" onClick={() => markPaidMutation.mutate(r.id)} disabled={markPaidMutation.isPending}>
                    Mark paid
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSheet
        open={!!reviewTarget}
        onOpenChange={(open) => {
          if (!open) {
            setReviewTarget(null);
            setReviewNotes("");
          }
        }}
        title={reviewDecision === "APPROVED" ? "Approve reimbursement" : "Reject reimbursement"}
        onSubmit={() => reviewMutation.mutate()}
        loading={reviewMutation.isPending}
        destructive={reviewDecision === "REJECTED"}
        submitLabel={reviewDecision === "APPROVED" ? "Approve" : "Reject"}
      >
        <FormTextarea name="reviewNotes" label="Notes" value={reviewNotes} onChange={setReviewNotes} />
      </FormSheet>
    </div>
  );
}
