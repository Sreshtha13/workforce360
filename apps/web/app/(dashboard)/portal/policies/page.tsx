"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  AlertBanner,
} from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CompanyPolicy } from "@/types/phase2";

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
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["portal", "policies"],
    queryFn: async () => {
      const res = await apiClient.portal.listPolicies();
      return res.data ?? [];
    },
  });

  const ackMutation = useMutation({
    mutationFn: (policyId: string) => apiClient.portal.acknowledgePolicy(policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "policies"] });
      setFeedback("Policy acknowledged.");
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to acknowledge policy");
      setFeedback(null);
    },
  });

  if (query.isLoading) return <LoadingState message="Loading policies..." />;
  if (query.isError) {
    return (
      <ErrorState
        message="Could not load assigned policies."
        onRetry={() => query.refetch()}
      />
    );
  }

  const policies = (query.data ?? []) as CompanyPolicy[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Company policies"
        description="Policies assigned to you. Acknowledge each published version to confirm you have read it."
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      {policies.length === 0 ? (
        <EmptyState
          title="No policies assigned"
          description="When HR assigns company policies to you, they will appear here."
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
                  <div>
                    <p className="font-medium">{policy.title}</p>
                    <p className="text-xs text-muted-foreground">v{policy.version}</p>
                  </div>
                  {policy.acknowledged ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Acknowledged
                    </Badge>
                  ) : (
                    <Badge variant="warning">Pending acknowledgement</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {policy.description?.trim() || "No description"}
                </p>
                {published && (
                  <p className="mt-2 text-xs text-muted-foreground">Published: {published}</p>
                )}
                {policy.acknowledged && policy.acknowledgedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    You acknowledged on {formatDate(policy.acknowledgedAt)}
                  </p>
                )}
                {!policy.acknowledged && (
                  <Button
                    size="sm"
                    className="mt-3"
                    disabled={ackMutation.isPending}
                    onClick={() => ackMutation.mutate(policy.id)}
                  >
                    I have read and acknowledge this policy
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
