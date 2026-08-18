"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { ProjectMilestones } from "@/components/pm/project-milestones";
import { GlassCard } from "@/components/dashboard/glass-card";

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);

  const projectQuery = useQuery({
    queryKey: ["pm", "projects", projectId],
    queryFn: async () => {
      const res = await apiClient.pm.projects.get(projectId);
      return res.data;
    },
  });

  const reportQuery = useQuery({
    queryKey: ["pm", "projects", projectId, "report"],
    queryFn: async () => {
      const res = await apiClient.pm.projects.getReport(projectId);
      return res.data;
    },
    refetchInterval: 30_000,
  });

  if (projectQuery.isLoading) return <LoadingState message="Loading project..." />;
  if (projectQuery.isError || !projectQuery.data) {
    return <ErrorState message="Failed to load project." onRetry={() => projectQuery.refetch()} />;
  }

  const project = projectQuery.data;
  const summary = reportQuery.data?.summary;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={project.name}
        description={project.description ?? "Project overview"}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/pm/projects/${projectId}/board`}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
            >
              Open board
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{project.status}</Badge>
        {project.code && <Badge variant="outline">{project.code}</Badge>}
        {project.budget && (
          <Badge variant="outline">
            Budget: {project.currency} {parseFloat(project.budget).toLocaleString()}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Tasks</p>
          <p className="text-2xl font-semibold tabular-nums">{summary?.totalTasks ?? project._count?.tasks ?? 0}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Completion</p>
          <p className="text-2xl font-semibold tabular-nums">{summary?.completionPercentage ?? 0}%</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Hours logged</p>
          <p className="text-2xl font-semibold tabular-nums">{summary?.totalActualHours?.toFixed(1) ?? "0"}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Budget spent</p>
          <p className="text-2xl font-semibold tabular-nums">
            {summary?.totalBudgetSpent != null
              ? `${project.currency} ${summary.totalBudgetSpent.toLocaleString()}`
              : "—"}
          </p>
        </GlassCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border p-5 space-y-2">
          <h3 className="font-semibold">Details</h3>
          {project.manager && (
            <p className="text-sm">
              Manager: {project.manager.firstName} {project.manager.lastName}
            </p>
          )}
          {project.clientName && <p className="text-sm">Client: {project.clientName}</p>}
          {project.lead && (
            <p className="text-sm">
              Source lead:{" "}
              <Link href={`/bd/leads/${project.lead.id}`} className="text-brand-700 hover:underline">
                {project.lead.title}
              </Link>
            </p>
          )}
          {project.startDate && (
            <p className="text-sm text-muted-foreground">
              {project.startDate.slice(0, 10)}
              {project.endDate ? ` → ${project.endDate.slice(0, 10)}` : ""}
            </p>
          )}
        </section>

        {summary && (
          <section className="rounded-xl border p-5 space-y-2">
            <h3 className="font-semibold">Task breakdown</h3>
            {Object.entries(summary.tasksByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span>{status.replace(/_/g, " ")}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
            ))}
          </section>
        )}
      </div>

      <ProjectMilestones projectId={projectId} />
    </div>
  );
}
