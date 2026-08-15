"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { SearchBar } from "@/components/design-system/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateProposalInput, Proposal, ProposalStatus } from "@/types/bd";

const STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  UNDER_REVIEW: "Under Review",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  REVISED: "Revised",
};

export default function ProposalsPage() {
  const searchParams = useSearchParams();
  const leadIdFilter = searchParams.get("leadId") ?? undefined;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateProposalInput>({
    leadId: leadIdFilter ?? "",
    title: "",
    currency: "USD",
    status: "DRAFT",
  });

  const leadsQuery = useQuery({
    queryKey: ["bd", "leads"],
    queryFn: async () => (await apiClient.bd.leads.list()).data ?? [],
  });

  const proposalsQuery = useQuery({
    queryKey: ["bd", "proposals", leadIdFilter],
    queryFn: async () => {
      const res = await apiClient.bd.proposals.list({ leadId: leadIdFilter });
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProposalInput) => apiClient.bd.proposals.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bd", "proposals"] });
      setOpen(false);
      setForm({ leadId: leadIdFilter ?? "", title: "", currency: "USD", status: "DRAFT" });
    },
  });

  const filtered = (proposalsQuery.data ?? []).filter(
    (p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.lead?.title?.toLowerCase().includes(search.toLowerCase()),
  );

  if (proposalsQuery.isLoading) return <LoadingState message="Loading proposals..." />;
  if (proposalsQuery.isError) {
    return <ErrorState message="Failed to load proposals." onRetry={() => proposalsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Proposals"
        description="Create and track client proposals."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Proposal
          </Button>
        }
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search proposals..." />

      <div className="space-y-3">
        {filtered.map((proposal: Proposal) => (
          <Link
            key={proposal.id}
            href={`/bd/proposals/${proposal.id}`}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{proposal.title}</p>
                <Badge variant="secondary">{STATUS_LABELS[proposal.status]}</Badge>
              </div>
              {proposal.lead && (
                <p className="text-sm text-muted-foreground">Lead: {proposal.lead.title}</p>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No proposals found</p>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create proposal</SheetTitle>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <div className="space-y-2">
              <Label>Lead *</Label>
              <Select value={form.leadId} onValueChange={(v) => setForm({ ...form, leadId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  {(leadsQuery.data ?? []).map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || !form.leadId}>
              {createMutation.isPending ? "Creating..." : "Create proposal"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
