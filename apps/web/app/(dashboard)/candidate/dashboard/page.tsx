"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { PIPELINE_LABELS, type PipelineStatus } from "@/types/phase2";

export default function CandidateDashboardPage() {
  const query = useQuery({
    queryKey: ["candidate", "me"],
    queryFn: async () => {
      const res = await apiClient.recruitment.getMyProfile();
      return res.data!;
    },
  });

  if (query.isLoading) return <LoadingState message="Loading your applications..." />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        message="Could not load candidate profile. Register via Careers to apply."
        onRetry={() => query.refetch()}
      />
    );
  }

  const candidate = query.data;
  const applications = candidate.applications ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Candidate dashboard"
        description={`Track applications and onboarding tasks for ${candidate.firstName} ${candidate.lastName}.`}
      >
        <Link href="/careers" className="text-sm font-medium text-brand-600 hover:underline">
          Browse open roles
        </Link>
      </AdminPageHeader>

      <div className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5">
        <p className="text-sm text-muted-foreground">Overall pipeline status</p>
        <div className="mt-2 flex items-center gap-3">
          <Badge>{PIPELINE_LABELS[candidate.pipelineStatus as PipelineStatus]}</Badge>
          {candidate.resumeFile && (
            <span className="text-sm text-muted-foreground">Resume: {candidate.resumeFile.originalName}</span>
          )}
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState title="No applications yet" description="Apply to an open role from the careers page." />
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div key={app.id} className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{app.jobPosting?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Applied {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">{PIPELINE_LABELS[app.status as PipelineStatus]}</Badge>
              </div>

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
