"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState } from "@/components/admin/admin-states";

export default function PortalPoliciesPage() {
  const query = useQuery({
    queryKey: ["portal", "policies"],
    queryFn: async () => {
      const res = await apiClient.portal.listPolicies();
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading policies..." />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Company policies" description="Published policies available to all employees." />
      <div className="space-y-3">
        {(query.data ?? []).map((policy) => (
          <div key={policy.id} className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
            <p className="font-medium">{policy.title}</p>
            <p className="text-sm text-muted-foreground">{policy.description ?? "No description"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
