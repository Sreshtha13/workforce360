"use client";

import { useQuery } from "@tanstack/react-query";
import { Link2, CheckCircle2, Circle, Clock } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ErrorState, LoadingState } from "@/components/admin/admin-states";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Badge } from "@/components/ui/badge";
import type { IntegrationInfo } from "@/types/admin";

function statusIcon(status: IntegrationInfo["status"]) {
  if (status === "active") return <CheckCircle2 className="size-5 text-emerald-600" />;
  if (status === "coming_soon") return <Clock className="size-5 text-muted-foreground" />;
  return <Circle className="size-5 text-amber-500" />;
}

function statusLabel(status: IntegrationInfo["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "configured":
      return "Configured";
    case "not_configured":
      return "Not configured";
    case "coming_soon":
      return "Coming soon";
  }
}

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
  const mvp = items.filter((i) => i.category === "mvp");
  const future = items.filter((i) => i.category === "future");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Integrations"
        description="MVP integrations are backend-mediated. The frontend never holds integration secrets."
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">MVP integrations</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mvp.map((item) => (
            <GlassCard key={item.id} className="p-5">
              <div className="flex items-start gap-3">
                {statusIcon(item.status)}
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <Badge variant={item.status === "active" ? "default" : "secondary"} className="mt-3">
                    {statusLabel(item.status)}
                  </Badge>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Future connectors (post-MVP)</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {future.map((item) => (
            <GlassCard key={item.id} className="p-5">
              <div className="flex items-start gap-3">
                <Link2 className="mt-0.5 size-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <Badge variant="secondary" className="mt-3">Coming soon</Badge>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>
    </div>
  );
}
