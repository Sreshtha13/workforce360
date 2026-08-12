"use client";

import {
  Building2,
  Briefcase,
  DollarSign,
  FolderKanban,
  MapPin,
  Shield,
  UserCheck,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { adminNav, filterNavByPermissions } from "@/lib/navigation";
import { dashboardGrid } from "@/lib/design-system";
import { formatMoney } from "@/lib/phase4-status";
import { ActiveEmployees } from "@/components/dashboard/active-employees";
import { AdminShortcuts } from "@/components/dashboard/admin-shortcuts";
import { MetricStatCard } from "@/components/dashboard/metric-stat-card";
import {
  AttendanceSummary,
  LeaveOverview,
  ModuleComingSoonCard,
} from "@/components/dashboard/overview-widgets";
import { HiringOverview } from "@/components/dashboard/hiring-overview-live";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { WelcomeHero } from "@/components/dashboard/welcome-hero";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExecutiveKpis } from "@/types/reports";

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  const canViewDashboard = hasPermission("dashboard.read");
  const canViewReports =
    hasPermission("report.read") ||
    hasPermission("dashboard.executive.read") ||
    canViewDashboard;

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: async () => {
      const res = await apiClient.dashboard.getAdmin();
      return res.data!;
    },
    enabled: !!user && canViewDashboard,
  });

  const kpisQuery = useQuery({
    queryKey: ["reports", "kpis", "executive"],
    queryFn: async () => {
      const res = await apiClient.reports.getKpis("executive");
      return res.data as ExecutiveKpis;
    },
    enabled: !!user && canViewReports,
  });

  if (!user) return null;

  const visibleAdmin = filterNavByPermissions(adminNav, {
    permissions: user.permissions,
    roles: user.roles,
  });
  const stats = dashboardQuery.data?.stats;
  const loading = dashboardQuery.isLoading;
  const exec = kpisQuery.data;

  return (
    <div className="dashboard-canvas -mx-2 rounded-2xl px-2 py-2 md:-mx-4 md:px-4">
      <div className={dashboardGrid}>
        <WelcomeHero user={user} adminItems={visibleAdmin} />

        {loading ? (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl lg:col-span-3" />
            ))}
          </>
        ) : canViewDashboard && stats ? (
          <>
            <MetricStatCard
              className="lg:col-span-3"
              delayClass="[animation-delay:50ms]"
              title="Total employees"
              value={String(stats.totalEmployees)}
              description={`${stats.totalUsers} total user accounts`}
              icon={Users}
              trend={{ value: "Live", direction: "neutral" }}
              chartColor="blue"
            />
            <MetricStatCard
              className="lg:col-span-3"
              delayClass="[animation-delay:75ms]"
              title="Active employees"
              value={String(stats.activeEmployees)}
              description={`${stats.inactiveEmployees} inactive employees`}
              icon={UserCheck}
              trend={{ value: "Live", direction: "up" }}
              chartColor="emerald"
            />
            <MetricStatCard
              className="lg:col-span-3"
              delayClass="[animation-delay:100ms]"
              title="Departments"
              value={String(stats.departments)}
              description={
                dashboardQuery.data?.departmentBreakdown.length
                  ? `${dashboardQuery.data.departmentBreakdown.reduce((s, d) => s + d.employeeCount, 0)} employees assigned`
                  : "Organization structure"
              }
              icon={Building2}
              trend={{ value: "Live", direction: "neutral" }}
              chartColor="amber"
            />
            <MetricStatCard
              className="lg:col-span-3"
              delayClass="[animation-delay:125ms]"
              title="Teams"
              value={String(stats.teams)}
              description={`${stats.designations} designations · ${stats.offices} offices`}
              icon={UsersRound}
              trend={{ value: "Live", direction: "neutral" }}
              chartColor="blue"
            />
            <MetricStatCard
              className="lg:col-span-3"
              delayClass="[animation-delay:150ms]"
              title="Designations"
              value={String(stats.designations)}
              description="Active job titles"
              icon={Briefcase}
              trend={{ value: "Live", direction: "neutral" }}
              chartColor="indigo"
            />
            <MetricStatCard
              className="lg:col-span-3"
              delayClass="[animation-delay:175ms]"
              title="Offices"
              value={String(stats.offices)}
              description="Locations & branches"
              icon={MapPin}
              trend={{ value: "Live", direction: "neutral" }}
              chartColor="amber"
            />
            <MetricStatCard
              className="lg:col-span-3"
              delayClass="[animation-delay:200ms]"
              title="Pending approvals"
              value={String(dashboardQuery.data?.pendingApprovals.total ?? 0)}
              description="Onboarding, offers & pipeline"
              icon={Shield}
              trend={{ value: "Live", direction: "neutral" }}
              chartColor="indigo"
            />
            <MetricStatCard
              className="lg:col-span-3"
              delayClass="[animation-delay:225ms]"
              title="Your permissions"
              value={String(user.permissions.length)}
              description="Backend-enforced access grants"
              icon={Shield}
              trend={{ value: "Verified", direction: "up" }}
              chartColor="indigo"
            />
          </>
        ) : (
          <>
            <MetricStatCard
              className="lg:col-span-6"
              title="Limited dashboard view"
              value="—"
              description="You need user.read permission to view organization statistics."
              icon={Users}
            />
          </>
        )}

        {exec && !kpisQuery.isLoading ? (
          <>
            <MetricStatCard
              className="lg:col-span-3"
              title="Open jobs"
              value={String(exec.hr.openJobs)}
              description={`${exec.hr.applications} applications · ${exec.hr.onboarding} onboarding`}
              icon={Briefcase}
              chartColor="blue"
            />
            <MetricStatCard
              className="lg:col-span-3"
              title="AR outstanding"
              value={formatMoney(exec.finance.arOutstanding)}
              description={`${exec.finance.invoiceCount} invoices · ${formatMoney(exec.finance.revenueCollected)} collected`}
              icon={DollarSign}
              chartColor="amber"
            />
            <MetricStatCard
              className="lg:col-span-3"
              title="Payroll runs"
              value={String(exec.payroll.runs)}
              description="Across current filter window"
              icon={Wallet}
              chartColor="emerald"
            />
            <MetricStatCard
              className="lg:col-span-3"
              title="Active projects"
              value={String(exec.project.active)}
              description={`${exec.project.total} total projects`}
              icon={FolderKanban}
              chartColor="indigo"
            />
          </>
        ) : null}

        {canViewDashboard && dashboardQuery.isError ? (
          <div className="lg:col-span-12 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load dashboard statistics.{" "}
            <button type="button" className="underline" onClick={() => dashboardQuery.refetch()}>
              Retry
            </button>
          </div>
        ) : null}

        {canViewDashboard && !loading && dashboardQuery.data && !dashboardQuery.data.departmentBreakdown.length ? (
          <div className="lg:col-span-12 rounded-2xl border border-white/10 bg-white/20 p-4 text-sm text-muted-foreground dark:bg-white/5">
            No departments yet.{" "}
            <Link href="/admin/departments" className="font-medium text-brand-700 hover:underline dark:text-brand-300">
              Create a department
            </Link>{" "}
            to see the department breakdown.
          </div>
        ) : null}

        {canViewDashboard && dashboardQuery.data?.departmentBreakdown.length ? (
          <div className="lg:col-span-12 rounded-2xl border border-white/10 bg-white/20 p-4 dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Employees by department</h3>
              <Link
                href="/admin/departments"
                className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
              >
                Manage departments
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {dashboardQuery.data.departmentBreakdown.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between rounded-xl bg-white/40 px-3 py-2 text-sm dark:bg-white/5"
                >
                  <span className="truncate font-medium">{dept.name}</span>
                  <span className="tabular-nums text-muted-foreground">{dept.employeeCount}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <ActiveEmployees
          canViewUsers={visibleAdmin.some((item) => item.href === "/admin/users")}
        />
        <PendingApprovals
          data={dashboardQuery.data?.pendingApprovals}
          loading={loading}
        />

        {dashboardQuery.data?.attendance?.available ? (
          <AttendanceSummary data={dashboardQuery.data.attendance} />
        ) : canViewDashboard && !loading ? (
          <ModuleComingSoonCard
            title="Attendance"
            message="Attendance tracking is not yet enabled. Live metrics will appear here when the module ships."
          />
        ) : null}
        {dashboardQuery.data?.leave?.available ? (
          <LeaveOverview data={dashboardQuery.data.leave} />
        ) : canViewDashboard && !loading ? (
          <ModuleComingSoonCard
            title="Leave overview"
            message="Leave management is not yet enabled. Request counts will appear here when the module ships."
          />
        ) : null}
        <HiringOverview
          openJobs={dashboardQuery.data?.hiring.openJobs}
          pipeline={dashboardQuery.data?.hiring.pipeline}
          loading={loading}
        />

        <RecentActivity
          items={dashboardQuery.data?.recentActivity}
          loading={loading}
        />
        <QuickActions adminItems={visibleAdmin} />

        <AdminShortcuts items={visibleAdmin} />
      </div>
    </div>
  );
}
