"use client";

import {
  Building2,
  Briefcase,
  MapPin,
  Shield,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { adminNav, filterNavByPermissions } from "@/lib/navigation";
import { dashboardGrid } from "@/lib/design-system";
import { ActiveEmployees } from "@/components/dashboard/active-employees";
import { AdminShortcuts } from "@/components/dashboard/admin-shortcuts";
import { MetricStatCard } from "@/components/dashboard/metric-stat-card";
import {
  AttendanceSummary,
  LeaveOverview,
} from "@/components/dashboard/overview-widgets";
import { HiringOverview } from "@/components/dashboard/hiring-overview-live";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { WelcomeHero } from "@/components/dashboard/welcome-hero";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  const canViewDashboard = hasPermission("user.read");

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: async () => {
      const res = await apiClient.dashboard.getAdmin();
      return res.data!;
    },
    enabled: !!user && canViewDashboard,
  });

  if (!user) return null;

  const visibleAdmin = filterNavByPermissions(adminNav, user.permissions);
  const stats = dashboardQuery.data?.stats;
  const loading = dashboardQuery.isLoading;

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

        <AttendanceSummary data={dashboardQuery.data?.attendance} />
        <LeaveOverview data={dashboardQuery.data?.leave} />
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
