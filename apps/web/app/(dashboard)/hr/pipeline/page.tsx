"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { FileText, Mail, MapPin, Phone } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { getAllowedPipelineTransitions } from "@/lib/pipeline-stage";
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

function latestInterview(app: JobApplication) {
  const interviews = app.interviews ?? [];
  if (interviews.length === 0) return null;
  return [...interviews].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  )[0];
}

function display(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export default function HrPipelinePage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUpdate = hasPermission("application.update");
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
        description="Forward-only workflow: Applied → Screening → Interview → Offer → Hired. Rejection is always available."
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
                  const interview = latestInterview(app);
                  const moveTargets = canUpdate
                    ? getAllowedPipelineTransitions(app.status, canOverride)
                    : [];
                  const candidateId = app.candidate?.id;
                  const email = display(app.candidate?.email);
                  const phone = display(app.candidate?.phone);
                  const location = display(app.jobPosting?.location);
                  const department = display(app.jobPosting?.department?.name);
                  const resumeName = display(app.candidate?.resumeFile?.originalName);
                  const interviewer = interview?.interviewer
                    ? `${interview.interviewer.firstName} ${interview.interviewer.lastName}`.trim()
                    : null;

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

                      <p className="mt-0.5 text-xs font-medium text-foreground/80">
                        {app.jobPosting?.title ?? "No position"}
                      </p>

                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {email && (
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="size-3 shrink-0" />
                            {email}
                          </p>
                        )}
                        {phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="size-3 shrink-0" />
                            {phone}
                          </p>
                        )}
                        {department && <p>Dept: {department}</p>}
                        {location && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="size-3 shrink-0" />
                            {location}
                          </p>
                        )}
                        <p>Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                        {resumeName && (
                          <p className="flex items-center gap-1.5 truncate">
                            <FileText className="size-3 shrink-0" />
                            {resumeName}
                          </p>
                        )}
                        {interviewer && <p>Recruiter: {interviewer}</p>}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary">{PIPELINE_LABELS[app.status]}</Badge>
                        {interview?.status && (
                          <Badge variant="outline">Interview: {interview.status}</Badge>
                        )}
                        {app.candidate?.resumeFile && (
                          <Badge variant="outline">Resume</Badge>
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
