"use client";

import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import type { Asset } from "@/types/phase2";

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PortalAssetsPage() {
  const query = useQuery({
    queryKey: ["portal", "assets"],
    queryFn: async () => {
      const res = await apiClient.portal.listMyAssets();
      return (res.data ?? []) as Asset[];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading your assets..." />;
  if (query.isError) {
    return (
      <ErrorState
        message="Could not load your assets."
        onRetry={() => query.refetch()}
      />
    );
  }

  const assets = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="My assets" description="Assets assigned to you by HR." />

      {assets.length === 0 ? (
        <EmptyState
          title="No assets assigned"
          description="When HR assigns equipment or assets to you, they will appear here."
          icon={Package}
        />
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => {
            const assignedDate = formatDate(asset.assignedAt);
            return (
              <div
                key={asset.id}
                className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">Tag: {asset.tag}</p>
                    {asset.category && (
                      <p className="text-sm text-muted-foreground">
                        Category: {asset.category}
                      </p>
                    )}
                    {asset.serialNumber && (
                      <p className="text-sm text-muted-foreground">
                        Serial: {asset.serialNumber}
                      </p>
                    )}
                    {assignedDate && (
                      <p className="text-sm text-muted-foreground">
                        Assigned: {assignedDate}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">{asset.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
