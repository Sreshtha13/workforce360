"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { LoadingState, ErrorState, EmptyState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";

export default function CareersPage() {
  const query = useQuery({
    queryKey: ["careers", "jobs"],
    queryFn: async () => {
      const res = await apiClient.careers.listJobs();
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading open roles..." />;
  if (query.isError) return <ErrorState message="Could not load job listings." onRetry={() => query.refetch()} />;

  const jobs = query.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Open roles</h1>
        <p className="mt-2 text-muted-foreground">
          Join Workforce 360. Apply in minutes — create a candidate account, upload your resume, and track your
          application status.
        </p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState title="No open roles" description="Check back soon for new opportunities." />
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/careers/${job.slug}`}
              className="rounded-2xl border border-white/20 bg-white/50 p-6 transition hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{job.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[job.location, job.employmentType, job.department?.name].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Badge variant="secondary">Apply</Badge>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
