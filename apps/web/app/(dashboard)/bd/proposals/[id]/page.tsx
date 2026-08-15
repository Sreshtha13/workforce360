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
import type { ProposalStatus } from "@/types/bd";

const STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  UNDER_REVIEW: "Under Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  REVISED: "Revised",
};

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const query = useQuery({
    queryKey: ["bd", "proposals", id],
    queryFn: async () => (await apiClient.bd.proposals.get(id)).data,
  });

  const updateMutation = useMutation({
    mutationFn: (status: ProposalStatus) => apiClient.bd.proposals.update(id, { status }),
    onSuccess: () => query.refetch(),
  });

  if (query.isLoading) return <LoadingState message="Loading proposal..." />;
  if (query.isError || !query.data) {
    return <ErrorState message="Proposal not found." onRetry={() => query.refetch()} />;
  }

  const proposal = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={proposal.title}
        description={proposal.lead?.title ?? "Proposal details"}
        actions={
          <Button variant="outline" onClick={() => router.push("/bd/proposals")}>
            Back to proposals
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <Badge>{STATUS_LABELS[proposal.status]}</Badge>
        <Select
          value={proposal.status}
          onValueChange={(v) => updateMutation.mutate(v as ProposalStatus)}
        >
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
          <h3 className="font-semibold">Content</h3>
          {proposal.description && <p>{proposal.description}</p>}
          {proposal.content && (
            <p className="text-muted-foreground whitespace-pre-wrap">{proposal.content}</p>
          )}
          {proposal.amount && (
            <p className="font-medium">
              {proposal.currency} {parseFloat(proposal.amount).toLocaleString()}
            </p>
          )}
        </section>
        <section className="rounded-xl border p-5">
          <EntityAttachments entityId={proposal.id} title="Proposal attachments" />
        </section>
      </div>
    </div>
  );
}
