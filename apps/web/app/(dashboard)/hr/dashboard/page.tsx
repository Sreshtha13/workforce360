"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Briefcase,
  Cake,
  Calendar,
  ClipboardList,
  Users,
  Workflow,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { hrNav, filterNavByPermissions } from "@/lib/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { MetricStatCard } from "@/components/dashboard/metric-stat-card";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Badge } from "@/components/ui/badge";
import { PIPELINE_LABELS, type PipelineStatus } from "@/types/phase2";

export default function HrDashboardPage() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["hr", "dashboard"],
    queryFn: async () => {
      const res = await apiClient.hr.getDashboard();
      return res.data!;
    },
  });

  const kpisQuery = useQuery({
    queryKey: ["reports", "kpis", "hr"],
    queryFn: async () => {
      const res = await apiClient.reports.getKpis("hr");
      return res.data!;
    },
  });

  const quickActions = useMemo(
    () =>
      filterNavByPermissions(hrNav, user?.permissions ?? []).filter((item) =>
        ["/hr/employees", "/hr/pipeline", "/hr/offers", "/hr/onboarding"].includes(
          item.href,
        ),
      ),
    [user?.permissions],
  );

  if (query.isLoading) return <LoadingState message="Loading HR dashboard..." />;
  if (query.isError) {
    return (
      <ErrorState message="Failed to load HR dashboard." onRetry={() => query.refetch()} />
    );
  }

  const data = query.data!;
  const profile = data.profile;
  const pipelineSummary = data.pipeline ?? [];
  const upcomingInterviews = data.upcomingInterviews ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="HR dashboard"
        description="Recruitment, onboarding, and workforce overview scoped to HR permissions."
      />

      {profile && (
        <div className="rounded-2xl border border-white/15 bg-white/30 p-5 dark:bg-white/5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your profile
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold">
              {profile.firstName} {profile.lastName}
            </p>
            {profile.userRoles?.map((ur) => (
              <Badge key={ur.role.id} variant="secondary">
                {ur.role.name}
              </Badge>
            ))}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.department?.name ?? "No department"} ·{" "}
            {profile.designation?.name ?? "No designation"}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link
              href="/portal/profile"
              className="font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              View my profile
            </Link>
            <Link
              href="/hr/employees"
              className="font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              Employee master
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard
          title="Employees"
          value={String(data.employeeCount)}
          description="Total employee master records"
          icon={Users}
        />
        <MetricStatCard
          title="Active"
          value={String(data.activeEmployees)}
          description="Employees in ACTIVE lifecycle"
          icon={Workflow}
        />
        <MetricStatCard
          title="Onboarding"
          value={String(data.onboardingEmployees)}
          description="Pre-onboarding and onboarding"
          icon={ClipboardList}
        />
        <MetricStatCard
          title="Open jobs"
          value={String(data.openJobs ?? 0)}
          description="Published job postings"
          icon={Briefcase}
        />
        <MetricStatCard
          title="Joining today"
          value={String(data.joiningToday ?? 0)}
          description="Employees with date of joining today"
          icon={Calendar}
        />
        <MetricStatCard
          title="Birthdays"
          value={String(data.birthdays ?? 0)}
          description="Employee birthdays today"
          icon={Cake}
        />
        {kpisQuery.data && "applications" in kpisQuery.data ? (
          <>
            <MetricStatCard
              title="Applications (reports)"
              value={String(kpisQuery.data.applications)}
              description="From reports HR KPIs"
              icon={Users}
            />
            <MetricStatCard
              title="Onboarding (reports)"
              value={String(kpisQuery.data.onboarding)}
              description="Pre-onboarding + onboarding"
              icon={ClipboardList}
            />
          </>
        ) : null}
        <MetricStatCard
          title="Probation"
          value={String(data.probation ?? 0)}
          description="Employees in probation lifecycle"
          icon={Users}
        />
        <MetricStatCard
          title="Interviews"
          value={String(upcomingInterviews.length)}
          description="Scheduled in next 14 days"
          icon={Briefcase}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <PendingApprovals className="lg:col-span-4" data={data.pendingApprovals} />
        <RecentActivity
          className="lg:col-span-8"
          items={data.recentActivity?.map((item) => ({
            id: item.id,
            action: item.action,
            entity: item.entity,
            entityId: null,
            createdAt: item.createdAt,
            actor: item.actor ? { id: "", name: item.actor, email: "" } : null,
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {pipelineSummary.length > 0 && (
          <GlassCard className="lg:col-span-4">
            <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
              <h2 className="text-lg font-semibold tracking-tight">Pipeline summary</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Applications by stage
              </p>
            </div>
            <ul className="space-y-2 p-6">
              {pipelineSummary.map((row) => (
                <li
                  key={row.status}
                  className="flex items-center justify-between rounded-lg bg-white/30 px-3 py-2 text-sm dark:bg-white/5"
                >
                  <span>
                    {PIPELINE_LABELS[row.status as PipelineStatus] ?? row.status}
                  </span>
                  <Badge variant="secondary">{row._count._all}</Badge>
                </li>
              ))}
            </ul>
            <div className="px-6 pb-6">
              <Link
                href="/hr/pipeline"
                className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
              >
                Open pipeline →
              </Link>
            </div>
          </GlassCard>
        )}

        {upcomingInterviews.length > 0 && (
          <GlassCard className="lg:col-span-8">
            <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
              <h2 className="text-lg font-semibold tracking-tight">Upcoming interviews</h2>
              <p className="mt-1 text-sm text-muted-foreground">Next 14 days</p>
            </div>
            <ul className="divide-y divide-white/10 dark:divide-white/5">
              {upcomingInterviews.slice(0, 6).map((interview) => (
                <li key={interview.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {interview.application?.candidate?.firstName}{" "}
                      {interview.application?.candidate?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {interview.application?.jobPosting?.title ?? "Interview"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>{new Date(interview.scheduledAt).toLocaleString()}</p>
                    <Badge variant="outline" className="mt-1">
                      {interview.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-6 pb-6 pt-2">
              <Link
                href="/hr/interviews"
                className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
              >
                View all interviews →
              </Link>
            </div>
          </GlassCard>
        )}

        <QuickActions adminItems={quickActions} className="lg:col-span-4" />
      </div>

      {data.attendance && !data.attendance.available && (
        <GlassCard>
          <div className="p-6">
            <h2 className="text-lg font-semibold tracking-tight">Attendance</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.attendance.message ?? "Attendance data is not available yet."}
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
