"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FolderKanban, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { MetricStatCard } from "@/components/dashboard/metric-stat-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Badge } from "@/components/ui/badge";
import type { ProjectKpis } from "@/types/reports";
import type { Task } from "@/types/pm";

function VelocityChart({ tasks }: { tasks: Task[] }) {
  const done = tasks.filter((t) => t.status === "DONE").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW").length;
  const todo = tasks.filter((t) => t.status === "TODO").length;
  const total = tasks.length || 1;
  const segments = [
    { label: "Done", count: done, color: "bg-green-500" },
    { label: "In progress", count: inProgress, color: "bg-blue-500" },
    { label: "To do", count: todo, color: "bg-gray-400" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-4 rounded-full overflow-hidden">
        {segments.map((s) =>
          s.count > 0 ? (
            <div
              key={s.label}
              className={s.color}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${s.label}: ${s.count}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${s.color}`} />
            {s.label}: <strong className="tabular-nums">{s.count}</strong>
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Velocity proxy: {done} tasks completed of {tasks.length} total (
        {tasks.length ? Math.round((done / tasks.length) * 100) : 0}%)
      </p>
    </div>
  );
}

export default function PmDashboardPage() {
  const router = useRouter();
  const kpiQuery = useQuery({
    queryKey: ["reports", "kpis", "project"],
    queryFn: async () => {
      const res = await apiClient.reports.getKpis("project");
      return res.data as ProjectKpis;
    },
    refetchInterval: 60_000,
  });

  const tasksQuery = useQuery({
    queryKey: ["pm", "tasks", "all"],
    queryFn: async () => {
      const res = await apiClient.pm.tasks.list();
      return res.data ?? [];
    },
    refetchInterval: 60_000,
  });

  if (kpiQuery.isLoading) return <LoadingState message="Loading project dashboard..." />;
  if (kpiQuery.isError) {
    return (
      <ErrorState message="Failed to load project KPIs." onRetry={() => kpiQuery.refetch()} />
    );
  }

  const data = kpiQuery.data!;
  const tasks = tasksQuery.data ?? [];
  const totalHours = tasks.reduce((sum, t) => sum + parseFloat(t.actualHours || "0"), 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Project dashboard"
        description="Portfolio health, velocity, and burndown-style metrics."
        actionLabel="View projects"
        onAction={() => router.push("/pm/projects")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard
          title="Total projects"
          value={String(data.total)}
          description="All non-deleted projects"
          icon={FolderKanban}
        />
        <MetricStatCard
          title="Active / planning"
          value={String(data.active)}
          description="In ACTIVE or PLANNING"
          icon={Briefcase}
        />
        <MetricStatCard
          title="Open tasks"
          value={String(tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length)}
          description="Across all projects"
          icon={CheckCircle2}
        />
        <MetricStatCard
          title="Hours logged"
          value={totalHours.toFixed(1)}
          description="Sum of actual hours on tasks"
          icon={Briefcase}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold tracking-tight mb-4">Task velocity</h2>
          <VelocityChart tasks={tasks} />
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold tracking-tight mb-4">Projects by status</h2>
          <ul className="space-y-2">
            {data.byStatus.length === 0 && (
              <li className="text-sm text-muted-foreground">No projects yet.</li>
            )}
            {data.byStatus.map((row) => (
              <li
                key={row.status}
                className="flex items-center justify-between rounded-lg bg-white/30 px-3 py-2 text-sm dark:bg-white/5"
              >
                <Badge variant="secondary">{row.status}</Badge>
                <span className="tabular-nums font-medium">{row._count._all}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <div className="px-1">
        <Link
          href="/pm/projects"
          className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          Open project list →
        </Link>
      </div>
    </div>
  );
}
