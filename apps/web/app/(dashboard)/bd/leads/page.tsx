"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadPipelineBoard } from "@/components/bd/lead-pipeline-board";
import type { Lead, LeadStatus, CreateLeadInput } from "@/types/bd";

const LEAD_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];
const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};
const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  CONTACTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  QUALIFIED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  PROPOSAL_SENT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  NEGOTIATION: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  WON: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function BdLeadsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formData, setFormData] = useState<CreateLeadInput>({
    title: "",
    description: "",
    companyName: "",
    value: undefined,
    currency: "USD",
    source: "",
    status: "NEW",
  });
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bd", "leads"],
    queryFn: async () => {
      const res = await apiClient.bd.leads.list();
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLeadInput) => apiClient.bd.leads.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bd", "leads"] });
      setIsSheetOpen(false);
      setFormData({
        title: "",
        description: "",
        companyName: "",
        value: undefined,
        currency: "USD",
        source: "",
        status: "NEW",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      apiClient.bd.leads.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bd", "leads"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (query.isLoading) return <LoadingState message="Loading leads..." />;
  if (query.isError) {
    return <ErrorState message="Failed to load leads." onRetry={() => query.refetch()} />;
  }

  const groupedLeads = LEAD_STATUSES.reduce((acc, status) => {
    acc[status] = (query.data ?? []).filter((lead) => lead.status === status);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads Pipeline"
        description="Track leads from initial contact through to won or lost."
        actions={
          <Button onClick={() => setIsSheetOpen(true)}>
            Add Lead
          </Button>
        }
      />

      <LeadPipelineBoard
        columns={LEAD_STATUSES}
        columnLabels={STATUS_LABELS}
        columnColors={STATUS_COLORS}
        grouped={groupedLeads}
        onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Lead</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="number"
                value={formData.value ?? ""}
                onChange={(e) => setFormData({ ...formData, value: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Lead"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
