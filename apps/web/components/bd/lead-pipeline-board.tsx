"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/bd";

type LeadPipelineBoardProps = {
  columns: LeadStatus[];
  columnLabels: Record<LeadStatus, string>;
  columnColors: Record<LeadStatus, string>;
  grouped: Record<LeadStatus, Lead[]>;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  leadHref?: (leadId: string) => string;
};

export function LeadPipelineBoard({
  columns,
  columnLabels,
  columnColors,
  grouped,
  onStatusChange,
  leadHref = (id) => `/bd/leads/${id}`,
}: LeadPipelineBoardProps) {
  const router = useRouter();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);

  const handleDrop = (status: LeadStatus) => {
    if (!draggedId) return;
    onStatusChange(draggedId, status);
    setDraggedId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((status) => (
        <div
          key={status}
          className={cn(
            "flex-shrink-0 w-80 rounded-lg border bg-card transition-shadow",
            dragOverColumn === status && "ring-2 ring-brand-500 shadow-md",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverColumn(status);
          }}
          onDragLeave={() => setDragOverColumn((prev) => (prev === status ? null : prev))}
          onDrop={() => handleDrop(status)}
        >
          <div className={`px-4 py-3 rounded-t-lg ${columnColors[status]}`}>
            <h3 className="font-semibold">
              {columnLabels[status]}
              <span className="ml-2 text-sm font-normal">({grouped[status].length})</span>
            </h3>
          </div>
          <div className="p-2 space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
            {grouped[status].map((lead) => (
              <div
                key={lead.id}
                draggable
                onDragStart={(e) => {
                  setDraggedId(lead.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", lead.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverColumn(null);
                }}
                className={cn(
                  "p-3 rounded-lg border bg-background hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing",
                  draggedId === lead.id && "opacity-50",
                )}
              >
                <button
                  type="button"
                  className="font-medium mb-1 text-left w-full hover:underline"
                  onClick={() => router.push(leadHref(lead.id))}
                >
                  {lead.title}
                </button>
                {lead.companyName && (
                  <p className="text-sm text-muted-foreground mb-2">{lead.companyName}</p>
                )}
                {lead.value && (
                  <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                    {lead.currency} {parseFloat(lead.value).toLocaleString()}
                  </p>
                )}
                {lead.assignedTo && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                  </p>
                )}
              </div>
            ))}
            {grouped[status].length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Drop leads here</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
