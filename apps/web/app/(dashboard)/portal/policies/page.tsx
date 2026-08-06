"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/admin/admin-states";

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

export default function PortalPoliciesPage() {
  const query = useQuery({
    queryKey: ["portal", "policies"],
    queryFn: async () => {
      const res = await apiClient.portal.listPolicies();
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading policies..." />;
  if (query.isError) {
    return (
      <ErrorState
        message="Could not load company policies."
        onRetry={() => query.refetch()}
      />
    );
  }

  const policies = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Company policies"
        description="Published policies available to all employees."
      />

      {policies.length === 0 ? (
        <EmptyState
          title="No policies published"
          description="Published company policies will appear here."
          icon={BookOpen}
        />
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => {
            const published = formatDate(policy.publishedAt);
            return (
              <div
                key={policy.id}
                className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{policy.title}</p>
                  <p className="text-xs text-muted-foreground">v{policy.version}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {policy.description?.trim() || "No description"}
                </p>
                {published && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Published: {published}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
