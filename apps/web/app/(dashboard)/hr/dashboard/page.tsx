"use client";

import { useQuery } from "@tanstack/react-query";
import { Briefcase, ClipboardList, Users, Workflow } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { MetricStatCard } from "@/components/dashboard/metric-stat-card";

export default function HrDashboardPage() {
  const query = useQuery({
    queryKey: ["hr", "dashboard"],
    queryFn: async () => {
      const res = await apiClient.hr.getDashboard();
      return res.data!;
    },
  });

  if (query.isLoading) return <LoadingState message="Loading HR dashboard..." />;
  if (query.isError) return <ErrorState message="Failed to load HR dashboard." onRetry={() => query.refetch()} />;

  const data = query.data!;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="HR dashboard" description="Recruitment, onboarding, and workforce overview." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard title="Employees" value={String(data.employeeCount)} description="Total employee master records" icon={Users} />
        <MetricStatCard title="Active" value={String(data.activeEmployees)} description="Employees in ACTIVE lifecycle" icon={Workflow} />
        <MetricStatCard title="Onboarding" value={String(data.onboardingEmployees)} description="Pre-onboarding and onboarding" icon={ClipboardList} />
        <MetricStatCard title="Interviews" value={String(data.upcomingInterviews.length)} description="Scheduled in next 14 days" icon={Briefcase} />
      </div>
    </div>
  );
}
