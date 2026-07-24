"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";

export default function JobDetailPage() {
  const params = useParams<{ slug: string }>();
  const query = useQuery({
    queryKey: ["careers", "job", params.slug],
    queryFn: async () => {
      const res = await apiClient.careers.getJob(params.slug);
      return res.data!;
    },
  });

  if (query.isLoading) return <LoadingState message="Loading role..." />;
  if (query.isError || !query.data) return <ErrorState message="Job not found." />;

  const job = query.data;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">
          ← All roles
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">{job.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {[job.location, job.employmentType, job.department?.name].filter(Boolean).join(" · ")}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">About the role</h2>
        <p className="whitespace-pre-wrap text-muted-foreground">{job.description}</p>
      </section>

      {job.requirements && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Requirements</h2>
          <p className="whitespace-pre-wrap text-muted-foreground">{job.requirements}</p>
        </section>
      )}

      <Link
        href={`/careers/${job.slug}/apply`}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Apply for this role
      </Link>
    </div>
  );
}
