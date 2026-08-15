"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { EntityAttachments } from "@/components/pm/entity-attachments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BidStatus } from "@/types/bd";

const STATUS_LABELS: Record<BidStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export default function BidDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const query = useQuery({
    queryKey: ["bd", "bids", id],
    queryFn: async () => (await apiClient.bd.bids.get(id)).data,
  });

  const updateMutation = useMutation({
    mutationFn: (status: BidStatus) => apiClient.bd.bids.update(id, { status }),
    onSuccess: () => query.refetch(),
  });

  if (query.isLoading) return <LoadingState message="Loading bid..." />;
  if (query.isError || !query.data) {
    return <ErrorState message="Bid not found." onRetry={() => query.refetch()} />;
  }

  const bid = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={bid.title}
        description={bid.lead?.title ?? "Bid details"}
        actions={
          <Button variant="outline" onClick={() => router.push("/bd/bids")}>
            Back to bids
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <Badge>{STATUS_LABELS[bid.status]}</Badge>
        <Select value={bid.status} onValueChange={(v) => updateMutation.mutate(v as BidStatus)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border p-5 space-y-2 text-sm">
          <h3 className="font-semibold">Details</h3>
          {bid.amount && (
            <p>
              Amount: {bid.currency} {parseFloat(bid.amount).toLocaleString()}
            </p>
          )}
          {bid.deadline && <p>Deadline: {bid.deadline.slice(0, 10)}</p>}
          {bid.description && <p className="text-muted-foreground">{bid.description}</p>}
        </section>
        <section className="rounded-xl border p-5">
          <EntityAttachments entityId={bid.id} title="Bid attachments" />
        </section>
      </div>
    </div>
  );
}
