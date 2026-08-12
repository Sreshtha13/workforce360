"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FolderKanban } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { MetricStatCard } from "@/components/dashboard/metric-stat-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Badge } from "@/components/ui/badge";
import type { ProjectKpis } from "@/types/reports";

export default function PmDashboardPage() {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["reports", "kpis", "project"],
    queryFn: async () => {
      const res = await apiClient.reports.getKpis("project");
      return res.data as ProjectKpis;
    },
  });

  if (query.isLoading) return <LoadingState message="Loading project dashboard..." />;
  if (query.isError) {
    return (
      <ErrorState message="Failed to load project KPIs." onRetry={() => query.refetch()} />
    );
  }

  const data = query.data!;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Project dashboard"
        description="Portfolio health from reporting KPIs."
        actionLabel="View projects"
        onAction={() => router.push("/pm/projects")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          title="Statuses tracked"
          value={String(data.byStatus.length)}
          description="Distinct project statuses"
          icon={FolderKanban}
        />
      </div>

      <GlassCard>
        <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
          <h2 className="text-lg font-semibold tracking-tight">Projects by status</h2>
        </div>
        <ul className="space-y-2 p-6">
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
        <div className="px-6 pb-6">
          <Link
            href="/pm/projects"
            className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            Open project list →
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
