"use client";

import { use } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadCommunications } from "@/components/bd/lead-communications";
import type { LeadStatus } from "@/types/bd";

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const query = useQuery({
    queryKey: ["bd", "leads", id],
    queryFn: async () => {
      const res = await apiClient.bd.leads.get(id);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (status: LeadStatus) => apiClient.bd.leads.update(id, { status }),
    onSuccess: () => query.refetch(),
  });

  if (query.isLoading) return <LoadingState message="Loading lead..." />;
  if (query.isError || !query.data) {
    return <ErrorState message="Lead not found." onRetry={() => query.refetch()} />;
  }

  const lead = query.data;
  const communications = lead.communications ?? [];
  const linkedProject = lead.project;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={lead.title}
        description={lead.companyName ?? "Lead details"}
        actions={
          <Button variant="outline" onClick={() => router.push("/bd/leads")}>
            Back to pipeline
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge>{STATUS_LABELS[lead.status]}</Badge>
        {lead.value && (
          <span className="text-sm font-semibold">
            {lead.currency} {parseFloat(lead.value).toLocaleString()}
          </span>
        )}
        <Select
          value={lead.status}
          onValueChange={(v) => updateMutation.mutate(v as LeadStatus)}
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
        <section className="rounded-xl border p-5 space-y-3">
          <h3 className="font-semibold">Overview</h3>
          {lead.description && <p className="text-sm text-muted-foreground">{lead.description}</p>}
          {lead.source && <p className="text-sm">Source: {lead.source}</p>}
          {lead.expectedCloseDate && (
            <p className="text-sm">Expected close: {lead.expectedCloseDate.slice(0, 10)}</p>
          )}
          {lead.assignedTo && (
            <p className="text-sm">
              Assigned: {lead.assignedTo.firstName} {lead.assignedTo.lastName}
            </p>
          )}
        </section>

        <section className="rounded-xl border p-5 space-y-3">
          <h3 className="font-semibold">Related</h3>
          {lead.contact && (
            <p className="text-sm">
              Contact:{" "}
              <Link href={`/bd/contacts/${lead.contact.id}`} className="text-brand-700 hover:underline">
                {lead.contact.firstName} {lead.contact.lastName}
              </Link>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {lead._count?.bids ?? 0} bids · {lead._count?.proposals ?? 0} proposals
          </p>
          <div className="flex gap-2">
            <Link
              href={`/bd/bids?leadId=${lead.id}`}
              className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted"
            >
              View bids
            </Link>
            <Link
              href={`/bd/proposals?leadId=${lead.id}`}
              className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted"
            >
              View proposals
            </Link>
          </div>
          {linkedProject && (
            <p className="text-sm">
              PM project:{" "}
              <Link href={`/pm/projects/${linkedProject.id}`} className="text-brand-700 hover:underline">
                {linkedProject.name}
              </Link>
            </p>
          )}
        </section>
      </div>

      <LeadCommunications
        leadId={lead.id}
        contactId={lead.contactId}
        communications={communications}
      />
    </div>
  );
}
