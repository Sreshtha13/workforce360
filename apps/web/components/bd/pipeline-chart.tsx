"use client";

import type { PipelineSummary, LeadStatus } from "@/types/bd";

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
  NEW: "bg-gray-500",
  CONTACTED: "bg-blue-500",
  QUALIFIED: "bg-purple-500",
  PROPOSAL_SENT: "bg-yellow-500",
  NEGOTIATION: "bg-orange-500",
  WON: "bg-green-500",
  LOST: "bg-red-500",
};

export function PipelineChart({ data }: { data: PipelineSummary[] }) {
  const maxCount = Math.max(...data.map((d) => d._count._all), 1);

  return (
    <div className="space-y-3">
      {data.map((row) => {
        const width = `${(row._count._all / maxCount) * 100}%`;
        const value = row._sum.value ? parseFloat(row._sum.value) : 0;
        return (
          <div key={row.status} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{STATUS_LABELS[row.status]}</span>
              <span className="text-muted-foreground tabular-nums">
                {row._count._all} leads
                {value > 0 && ` · $${value.toLocaleString()}`}
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${STATUS_COLORS[row.status]}`}
                style={{ width }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
