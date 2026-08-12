"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { MetricStatCard } from "@/components/dashboard/metric-stat-card";

export default function PortalDashboardPage() {
  const query = useQuery({
    queryKey: ["portal", "dashboard"],
    queryFn: async () => {
      const res = await apiClient.portal.getDashboard();
      return res.data!;
    },
  });

  const payslipsQuery = useQuery({
    queryKey: ["portal", "payslips"],
    queryFn: async () => {
      const res = await apiClient.portal.listPayslips();
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading employee portal..." />;
  if (query.isError) return <ErrorState message="Failed to load portal." onRetry={() => query.refetch()} />;

  const data = query.data!;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Employee portal"
        description={
          data.employee
            ? `Welcome back. Employee ID: ${data.employee.employeeCode}`
            : "Complete onboarding to unlock full portal features."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard title="Notifications" value={String(data.unreadNotifications)} description="Unread items" icon={Bell} />
        <MetricStatCard title="Support tickets" value={String(data.openTickets)} description="Open or in progress" icon={Bell} />
        <MetricStatCard title="Lifecycle" value={data.employee?.lifecycleState ?? "—"} description="Current employee state" icon={Bell} />
        <MetricStatCard
          title="Payslips"
          value={String(payslipsQuery.data?.length ?? 0)}
          description="Available to view/download"
          icon={Bell}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/portal/profile" className="rounded-2xl border border-white/20 bg-white/50 p-5 hover:bg-white/70 dark:bg-white/5">
          <h3 className="font-medium">My profile</h3>
          <p className="mt-1 text-sm text-muted-foreground">View and edit your personal details.</p>
        </Link>
        <Link href="/portal/payslips" className="rounded-2xl border border-white/20 bg-white/50 p-5 hover:bg-white/70 dark:bg-white/5">
          <h3 className="font-medium">Payslips</h3>
          <p className="mt-1 text-sm text-muted-foreground">View and download your monthly payslips.</p>
        </Link>
        <div className="rounded-2xl border border-dashed border-white/20 p-5">
          <h3 className="font-medium">Attendance & leave</h3>
          <p className="mt-1 text-sm text-muted-foreground">Coming in a later phase.</p>
        </div>
        <div className="rounded-2xl border border-dashed border-white/20 p-5">
          <h3 className="font-medium">Timesheets</h3>
          <p className="mt-1 text-sm text-muted-foreground">Coming in a later phase.</p>
        </div>
      </div>
    </div>
  );
}
