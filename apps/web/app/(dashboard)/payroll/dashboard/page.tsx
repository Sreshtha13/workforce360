"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Wallet } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { formatMoney } from "@/lib/phase4-status";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { MetricStatCard } from "@/components/dashboard/metric-stat-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Badge } from "@/components/ui/badge";
import type { PayrollKpis } from "@/types/reports";

export default function PayrollDashboardPage() {
  const query = useQuery({
    queryKey: ["reports", "kpis", "payroll"],
    queryFn: async () => {
      const res = await apiClient.reports.getKpis("payroll");
      return res.data as PayrollKpis;
    },
  });

  if (query.isLoading) return <LoadingState message="Loading payroll dashboard..." />;
  if (query.isError) {
    return (
      <ErrorState message="Failed to load payroll KPIs." onRetry={() => query.refetch()} />
    );
  }

  const data = query.data!;
  const paid = data.byStatus.find((r) => r.status === "PAID" || r.status === "COMPLETED");
  const draft = data.byStatus.find((r) => r.status === "DRAFT");
  const netSum = data.byStatus.reduce(
    (sum, row) => sum + Number(row._sum?.totalNet ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payroll dashboard"
        description="Payroll run volume and status from reporting KPIs."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard
          title="Payroll runs"
          value={String(data.runs)}
          description="Total runs in range"
          icon={FileText}
        />
        <MetricStatCard
          title="Draft / open"
          value={String(draft?._count._all ?? 0)}
          description="Runs still in draft"
          icon={FileText}
        />
        <MetricStatCard
          title="Completed / paid"
          value={String(paid?._count._all ?? 0)}
          description="Finished payroll cycles"
          icon={Wallet}
        />
        <MetricStatCard
          title="Net payroll"
          value={formatMoney(netSum)}
          description="Sum of net across statuses"
          icon={Wallet}
        />
      </div>

      <GlassCard>
        <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
          <h2 className="text-lg font-semibold tracking-tight">Runs by status</h2>
        </div>
        <ul className="space-y-2 p-6">
          {data.byStatus.length === 0 && (
            <li className="text-sm text-muted-foreground">No payroll runs yet.</li>
          )}
          {data.byStatus.map((row) => (
            <li
              key={row.status}
              className="flex items-center justify-between rounded-lg bg-white/30 px-3 py-2 text-sm dark:bg-white/5"
            >
              <span className="flex items-center gap-2">
                <Badge variant="secondary">{row.status}</Badge>
                <span className="text-muted-foreground">{row._count._all}</span>
              </span>
              <span className="font-medium tabular-nums">
                {formatMoney(Number(row._sum?.totalNet ?? 0))}
              </span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
