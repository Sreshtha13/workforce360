"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { GlassCard } from "@/components/dashboard/glass-card";
import { PipelineChart } from "@/components/bd/pipeline-chart";
import type { LeadStatus } from "@/types/bd";

const ALL_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export default function BdDashboardPage() {
  const pipelineQuery = useQuery({
    queryKey: ["bd", "pipeline"],
    queryFn: async () => {
      const res = await apiClient.bd.leads.getPipeline();
      return res.data ?? [];
    },
    refetchInterval: 60_000,
  });

  const leadsQuery = useQuery({
    queryKey: ["bd", "leads"],
    queryFn: async () => {
      const res = await apiClient.bd.leads.list();
      return res.data ?? [];
    },
  });

  if (pipelineQuery.isLoading) return <LoadingState message="Loading BD dashboard..." />;
  if (pipelineQuery.isError) {
    return <ErrorState message="Failed to load pipeline." onRetry={() => pipelineQuery.refetch()} />;
  }

  const pipeline = ALL_STATUSES.map((status) => {
    const found = pipelineQuery.data?.find((row) => row.status === status);
    return (
      found ?? {
        status,
        _count: { _all: 0 },
        _sum: { value: null },
      }
    );
  });

  const leads = leadsQuery.data ?? [];
  const totalValue = leads.reduce((sum, l) => sum + (l.value ? parseFloat(l.value) : 0), 0);
  const wonCount = leads.filter((l) => l.status === "WON").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Business Development"
        description="Pipeline metrics and lead analytics."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Total leads</p>
          <p className="text-2xl font-semibold tabular-nums">{leads.length}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Pipeline value</p>
          <p className="text-2xl font-semibold tabular-nums">${totalValue.toLocaleString()}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Won</p>
          <p className="text-2xl font-semibold tabular-nums">{wonCount}</p>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold mb-4">Pipeline funnel</h2>
        <PipelineChart data={pipeline} />
      </GlassCard>
    </div>
  );
}
