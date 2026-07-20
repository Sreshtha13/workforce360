"use client";

import {
  Building2,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminNav, filterNavByPermissions } from "@/lib/navigation";
import { dashboardGrid } from "@/lib/design-system";
import { ActiveEmployees } from "@/components/dashboard/active-employees";
import { AdminShortcuts } from "@/components/dashboard/admin-shortcuts";
import { MetricStatCard } from "@/components/dashboard/metric-stat-card";
import {
  AttendanceSummary,
  HiringOverview,
  LeaveOverview,
} from "@/components/dashboard/overview-widgets";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { WelcomeHero } from "@/components/dashboard/welcome-hero";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const visibleAdmin = filterNavByPermissions(adminNav, user.permissions);
  const roleNames = user.roles.map((r) => r.name).join(", ") || "No roles assigned";

  return (
    <div className="dashboard-canvas -mx-2 rounded-2xl px-2 py-2 md:-mx-4 md:px-4">
      <div className={dashboardGrid}>
        <WelcomeHero user={user} adminItems={visibleAdmin} />

        <MetricStatCard
          className="lg:col-span-3"
          delayClass="[animation-delay:50ms]"
          title="Your roles"
          value={String(user.roles.length)}
          description={roleNames}
          icon={Users}
          trend={{ value: "Stable", direction: "neutral" }}
          chartColor="indigo"
          chartData={[1, 1, 2, 2, user.roles.length, user.roles.length, user.roles.length]}
        />
        <MetricStatCard
          className="lg:col-span-3"
          delayClass="[animation-delay:100ms]"
          title="Permissions"
          value={String(user.permissions.length)}
          description={`Access to ${user.permissions.length} backend-enforced permissions`}
          icon={Shield}
          trend={{ value: "+0%", direction: "up" }}
          chartColor="emerald"
          chartData={[8, 10, 12, 14, user.permissions.length, user.permissions.length, user.permissions.length]}
        />
        <MetricStatCard
          className="lg:col-span-3"
          delayClass="[animation-delay:150ms]"
          title="Account status"
          value="Active"
          description={user.email}
          icon={UserCheck}
          trend={{ value: "Verified", direction: "up" }}
          chartColor="blue"
        />
        <MetricStatCard
          className="lg:col-span-3"
          delayClass="[animation-delay:200ms]"
          title="Departments"
          value="—"
          description="Organization structure preview"
          icon={Building2}
          trend={{ value: "Preview", direction: "neutral" }}
          chartColor="amber"
          chartData={[3, 4, 4, 5, 5, 6, 6]}
        />

        <ActiveEmployees
          user={user}
          canViewUsers={visibleAdmin.some((item) => item.href === "/admin/users")}
        />
        <PendingApprovals permissionCount={user.permissions.length} />

        <AttendanceSummary />
        <LeaveOverview />
        <HiringOverview />

        <RecentActivity />
        <QuickActions adminItems={visibleAdmin} />

        <AdminShortcuts items={visibleAdmin} />
      </div>
    </div>
  );
}
