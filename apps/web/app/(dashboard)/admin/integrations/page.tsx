"use client";

import { useQuery } from "@tanstack/react-query";
import { Link2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ErrorState, LoadingState } from "@/components/admin/admin-states";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Badge } from "@/components/ui/badge";

export default function IntegrationsPage() {
  const { hasAnyPermission } = useAuth();
  const canView = hasAnyPermission("settings.manage", "dashboard.read");

  const query = useQuery({
    queryKey: ["admin", "integrations"],
    queryFn: async () => (await apiClient.admin.getIntegrations()).data ?? [],
    enabled: canView,
  });

  if (!canView) {
    return <ErrorState message="You do not have permission to view integrations." />;
  }
  if (query.isLoading) return <LoadingState message="Loading integrations..." />;
  if (query.isError) {
    return (
      <ErrorState message="Failed to load integrations." onRetry={() => query.refetch()} />
    );
  }

  const items = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Integrations"
        description="Third-party connectors will ship in Phase 13. Cards below are placeholders from the API."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <GlassCard key={item.id} className="p-5">
            <div className="flex items-start gap-3">
              <Link2 className="mt-0.5 size-5 text-brand-600 dark:text-brand-400" />
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Coming in Phase {item.phase}
                </p>
                <Badge variant="secondary" className="mt-3">
                  Coming in Phase 13
                </Badge>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
