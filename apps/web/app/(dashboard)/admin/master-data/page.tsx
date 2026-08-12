"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  KeyRound,
  MapPin,
  Shield,
  Tags,
  UserCheck,
  UsersRound,
  Workflow,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ErrorState, LoadingState } from "@/components/admin/admin-states";
import { GlassCard } from "@/components/dashboard/glass-card";

const LINKS = [
  { href: "/admin/departments", label: "Departments", key: "departments" as const, icon: Building2 },
  { href: "/admin/teams", label: "Teams", key: "teams" as const, icon: UsersRound },
  { href: "/admin/designations", label: "Designations", key: "designations" as const, icon: Briefcase },
  { href: "/admin/offices", label: "Offices", key: "offices" as const, icon: MapPin },
  { href: "/admin/employee-types", label: "Employee types", key: "employeeTypes" as const, icon: Tags },
  {
    href: "/admin/employment-statuses",
    label: "Employment statuses",
    key: "employmentStatuses" as const,
    icon: UserCheck,
  },
  { href: "/admin/roles", label: "Roles", key: "roles" as const, icon: Shield },
  { href: "/admin/permissions", label: "Permissions", key: "permissions" as const, icon: KeyRound },
];

export default function MasterDataHubPage() {
  const { hasAnyPermission } = useAuth();
  const canView = hasAnyPermission("settings.manage", "dashboard.read", "department.read");

  const query = useQuery({
    queryKey: ["admin", "master-data"],
    queryFn: async () => (await apiClient.admin.getMasterData()).data!,
    enabled: canView,
  });

  if (!canView) {
    return <ErrorState message="You do not have permission to view master data." />;
  }
  if (query.isLoading) return <LoadingState message="Loading master data..." />;
  if (query.isError) {
    return (
      <ErrorState message="Failed to load master data." onRetry={() => query.refetch()} />
    );
  }

  const counts = query.data!;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Master data"
        description="Organization reference data hub. Counts come from the admin master-data API."
      />

      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Workflow Builder</h2>
            <p className="text-sm text-muted-foreground">
              Configure multi-step approval workflows for HR, finance, and payroll.
            </p>
          </div>
          <Link
            href="/admin/approval-workflows"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            <Workflow className="size-4" />
            Open approval workflows →
          </Link>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <GlassCard className="h-full p-5 transition-colors hover:bg-white/40 dark:hover:bg-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {counts[item.key]}
                    </p>
                  </div>
                  <Icon className="size-5 text-brand-600 dark:text-brand-400" />
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
