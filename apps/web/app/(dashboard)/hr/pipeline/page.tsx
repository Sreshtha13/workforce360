"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, AlertBanner } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PIPELINE_LABELS,
  PIPELINE_STATUSES,
  type JobApplication,
  type PipelineStatus,
} from "@/types/phase2";
import { useState } from "react";

export default function HrPipelinePage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["hr", "pipeline"],
    queryFn: async () => {
      const res = await apiClient.recruitment.getPipeline();
      return res.data!;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PipelineStatus }) =>
      apiClient.recruitment.updateApplicationStatus(id, status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["hr", "pipeline"] });
      setFeedback(
        res.data?.employee
          ? "Candidate hired — Employee Master record created and portal access granted."
          : "Application status updated.",
      );
      setError(null);
    },
    onError: (err) => {
      setFeedback(null);
      setError(err instanceof ApiClientError ? err.message : "Update failed");
    },
  });

  if (query.isLoading) return <LoadingState message="Loading recruitment pipeline..." />;
  if (query.isError) return <ErrorState message="Failed to load pipeline." onRetry={() => query.refetch()} />;

  const applications = query.data?.applications ?? [];

  const grouped = PIPELINE_STATUSES.reduce<Record<PipelineStatus, JobApplication[]>>(
    (acc, status) => {
      acc[status] = applications.filter((a) => a.status === status);
      return acc;
    },
    {} as Record<PipelineStatus, JobApplication[]>,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Recruitment pipeline"
        description="Move candidates through Applied → Screening → Interview → Offer → Hired/Rejected."
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        {PIPELINE_STATUSES.map((status) => (
          <div key={status} className="rounded-2xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{PIPELINE_LABELS[status]}</h3>
              <Badge variant="outline">{grouped[status].length}</Badge>
            </div>
            <div className="space-y-3">
              {grouped[status].map((app) => (
                <div key={app.id} className="rounded-xl border border-white/10 bg-background/60 p-3 text-sm">
                  <p className="font-medium">
                    {app.candidate?.firstName} {app.candidate?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{app.jobPosting?.title}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {PIPELINE_STATUSES.filter((s) => s !== app.status).map((next) => (
                      <Button
                        key={next}
                        size="xs"
                        variant="outline"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: app.id, status: next })}
                      >
                        → {PIPELINE_LABELS[next]}
                      </Button>
                    ))}
                  </div>
                  <Link
                    href={`/hr/candidates/${app.candidate?.id}`}
                    className="mt-2 inline-block text-xs text-brand-600 hover:underline"
                  >
                    View candidate
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
