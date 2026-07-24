"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState } from "@/components/admin/admin-states";

export default function PortalNotificationsPage() {
  const query = useQuery({
    queryKey: ["portal", "notifications"],
    queryFn: async () => {
      const res = await apiClient.portal.listNotifications();
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Notifications" description="Your recent alerts and updates." />
      <div className="space-y-3">
        {(query.data ?? []).map((n) => (
          <div key={n.id} className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
            <p className="font-medium">{n.title}</p>
            <p className="text-sm text-muted-foreground">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
