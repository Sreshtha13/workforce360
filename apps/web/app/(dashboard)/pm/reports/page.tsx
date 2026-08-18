"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/dashboard/glass-card";
import type { ProjectStatus } from "@/types/pm";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function PmReportsPage() {
  const projectsQuery = useQuery({
    queryKey: ["pm", "projects"],
    queryFn: async () => (await apiClient.pm.projects.list()).data ?? [],
  });

  if (projectsQuery.isLoading) return <LoadingState message="Loading projects..." />;
  if (projectsQuery.isError) {
    return <ErrorState message="Failed to load projects." onRetry={() => projectsQuery.refetch()} />;
  }

  const projects = projectsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Project Reports"
        description="Overview of progress and health across all projects."
      />

      {projects.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No projects yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <ProjectReportCard key={project.id} projectId={project.id} name={project.name} status={project.status} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectReportCard({
  projectId,
  name,
  status,
}: {
  projectId: string;
  name: string;
  status: ProjectStatus;
}) {
  const reportQuery = useQuery({
    queryKey: ["pm", "projects", projectId, "report"],
    queryFn: async () => (await apiClient.pm.projects.getReport(projectId)).data,
  });

  const summary = reportQuery.data?.summary;

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/pm/projects/${projectId}`} className="font-semibold text-brand-700 hover:underline">
            {name}
          </Link>
          <Badge variant="secondary" className="ml-2">
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <Link
          href={`/pm/projects/${projectId}`}
          className="text-xs text-muted-foreground hover:underline shrink-0"
        >
          View project
        </Link>
      </div>

      {reportQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading metrics...</p>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Tasks</p>
            <p className="font-semibold tabular-nums">{summary.totalTasks}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Completion</p>
            <p className="font-semibold tabular-nums">{summary.completionPercentage}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Hours logged</p>
            <p className="font-semibold tabular-nums">{summary.totalActualHours?.toFixed(1) ?? "0"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Budget spent</p>
            <p className="font-semibold tabular-nums">
              {summary.totalBudgetSpent != null ? summary.totalBudgetSpent.toLocaleString() : "—"}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No report data available.</p>
      )}
    </GlassCard>
  );
}
