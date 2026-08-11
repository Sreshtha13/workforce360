"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { canAccessCandidateApplications } from "@/lib/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PIPELINE_LABELS, type PipelineStatus } from "@/types/phase2";

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const isApplicant = canAccessCandidateApplications(user);

  const query = useQuery({
    queryKey: ["candidate", "me"],
    queryFn: async () => {
      const res = await apiClient.recruitment.getMyProfile();
      return res.data!;
    },
    retry: false,
    enabled: isApplicant,
  });

  if (!isApplicant) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="My applications"
          description="Applicant tracking for open roles."
        />
        <ErrorState message="This area is only available to candidates. Super Admin and internal staff accounts do not use the applicant workflow." />
      </div>
    );
  }

  if (query.isLoading) return <LoadingState message="Loading your applications..." />;

  if (query.isError) {
    const status = query.error instanceof ApiClientError ? query.error.status : null;
    const code =
      query.error instanceof ApiClientError ? query.error.code : null;

    if (status === 403 || code === "FEATURE_UNAVAILABLE") {
      return (
        <div className="space-y-6">
          <AdminPageHeader
            title="My applications"
            description="Applicant tracking for open roles."
          />
          <ErrorState
            message={
              query.error instanceof ApiClientError
                ? query.error.message
                : "You are not authorized to access candidate applications."
            }
          />
        </div>
      );
    }

    const isNotFound = status === 404;
    if (isNotFound) {
      return (
        <div className="space-y-6">
          <AdminPageHeader
            title="My applications"
            description="Track job applications and pre-onboarding tasks."
          />
          <EmptyState
            title="No candidate profile yet"
            description="Apply to an open role from the careers page to create your candidate profile and track applications here."
            actionLabel="Browse careers"
            onAction={() => {
              window.location.href = "/careers";
            }}
          />
        </div>
      );
    }
    return (
      <ErrorState
        message="Could not load your applications."
        onRetry={() => query.refetch()}
      />
    );
  }

  if (!query.data) {
    return (
      <EmptyState
        title="No applications"
        description="Apply to an open role from the careers page."
        actionLabel="Browse careers"
        onAction={() => {
          window.location.href = "/careers";
        }}
      />
    );
  }

  const candidate = query.data;
  const applications = candidate.applications ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My applications"
        description={`Track applications and onboarding tasks for ${candidate.firstName} ${candidate.lastName}.`}
      >
        <Link href="/careers">
          <Button variant="outline" size="sm">
            Browse open roles
          </Button>
        </Link>
      </AdminPageHeader>

      <div className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5">
        <p className="text-sm text-muted-foreground">Overall pipeline status</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge>{PIPELINE_LABELS[candidate.pipelineStatus as PipelineStatus]}</Badge>
          {candidate.resumeFile && (
            <span className="text-sm text-muted-foreground">
              Resume: {candidate.resumeFile.originalName}
            </span>
          )}
          <span className="text-sm text-muted-foreground">{candidate.email}</span>
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Apply to an open role from the careers page to get started."
          actionLabel="Browse careers"
          onAction={() => {
            window.location.href = "/careers";
          }}
        />
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{app.jobPosting?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Applied {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">
                  {PIPELINE_LABELS[app.status as PipelineStatus]}
                </Badge>
              </div>

              {app.interviews && app.interviews.length > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Latest interview:{" "}
                  {new Date(app.interviews[0].scheduledAt).toLocaleString()} ·{" "}
                  {app.interviews[0].status}
                </div>
              )}

              {app.checklistItems && app.checklistItems.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Pre-onboarding checklist</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {app.checklistItems.map((item) => (
                      <li key={item.id}>
                        {item.isCompleted ? "✓" : "○"} {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
