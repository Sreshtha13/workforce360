"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import type { Asset } from "@/types/phase2";

export default function PortalAssetsPage() {
  const query = useQuery({
    queryKey: ["portal", "assets"],
    queryFn: async () => {
      const res = await apiClient.portal.listMyAssets();
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading your assets..." />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="My assets" description="Assets assigned to you by HR." />
      <div className="space-y-3">
        {(query.data as Asset[] ?? []).map((asset) => (
          <div key={asset.id} className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{asset.name}</p>
                <p className="text-sm text-muted-foreground">{asset.tag}</p>
              </div>
              <Badge variant="secondary">{asset.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
