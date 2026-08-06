"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, AlertBanner, EmptyState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PIPELINE_LABELS,
  PIPELINE_STATUSES,
  type JobApplication,
  type PipelineStatus,
} from "@/types/phase2";

function getMoveTargets(
  current: PipelineStatus,
  canOverride: boolean,
): PipelineStatus[] {
  const currentIndex = PIPELINE_STATUSES.indexOf(current);
  const isFinalized = current === "HIRED" || current === "REJECTED";

  if (isFinalized) {
    if (!canOverride) return [];
    return PIPELINE_STATUSES.filter((_, i) => i < currentIndex);
  }

  return PIPELINE_STATUSES.filter((status) => {
    if (status === current) return false;
    const idx = PIPELINE_STATUSES.indexOf(status);
    if (idx > currentIndex) return true; // forward
    if (status === "REJECTED") return true;
    if (canOverride && idx < currentIndex) return true; // backward with override
    return false;
  });
}

function latestInterviewStatus(app: JobApplication): string | null {
  const interviews = app.interviews ?? [];
  if (interviews.length === 0) return null;
  const latest = [...interviews].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  )[0];
  return latest?.status ?? null;
}

export default function HrPipelinePage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canOverride =
    hasPermission("application.override_stage") || isSuperAdmin;

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
  if (query.isError) {
    return <ErrorState message="Failed to load pipeline." onRetry={() => query.refetch()} />;
  }

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

      {applications.length === 0 ? (
        <EmptyState
          title="No applications in pipeline"
          description="Applications will appear here when candidates apply to open jobs."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
          {PIPELINE_STATUSES.map((status) => (
            <div
              key={status}
              className="rounded-2xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{PIPELINE_LABELS[status]}</h3>
                <Badge variant="outline">{grouped[status].length}</Badge>
              </div>
              <div className="space-y-3">
                {grouped[status].map((app) => {
                  const interviewStatus = latestInterviewStatus(app);
                  const moveTargets = getMoveTargets(app.status, canOverride);
                  const candidateId = app.candidate?.id;

                  return (
                    <div
                      key={app.id}
                      className="rounded-xl border border-white/10 bg-background/60 p-3 text-sm"
                    >
                      {candidateId ? (
                        <Link
                          href={`/hr/candidates/${candidateId}`}
                          className="font-medium text-brand-600 hover:underline dark:text-brand-300"
                        >
                          {app.candidate?.firstName} {app.candidate?.lastName}
                        </Link>
                      ) : (
                        <p className="font-medium">
                          {app.candidate?.firstName} {app.candidate?.lastName}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {app.jobPosting?.title ?? "No position"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary">{PIPELINE_LABELS[app.status]}</Badge>
                        {interviewStatus && (
                          <Badge variant="outline">Interview: {interviewStatus}</Badge>
                        )}
                      </div>
                      {moveTargets.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {moveTargets.map((next) => (
                            <Button
                              key={next}
                              size="xs"
                              variant="outline"
                              disabled={statusMutation.isPending}
                              onClick={() =>
                                statusMutation.mutate({ id: app.id, status: next })
                              }
                            >
                              → {PIPELINE_LABELS[next]}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
