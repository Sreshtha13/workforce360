"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReleaseStatus } from "@/types/engineering";
import { Rocket } from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const query = useQuery({
    queryKey: ["engineering", "releases", id],
    queryFn: async () => (await apiClient.engineering.releases.get(id)).data,
  });

  const deployMutation = useMutation({
    mutationFn: () => apiClient.engineering.releases.deploy(id),
    onSuccess: () => query.refetch(),
  });

  const rollbackMutation = useMutation({
    mutationFn: () => apiClient.engineering.releases.rollback(id),
    onSuccess: () => query.refetch(),
  });

  if (query.isLoading) return <LoadingState message="Loading release..." />;
  if (query.isError || !query.data) {
    return <ErrorState message="Release not found." onRetry={() => query.refetch()} />;
  }

  const release = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${release.name} (v${release.version})`}
        description={release.project?.name ?? "Release details"}
      >
        {release.status === ReleaseStatus.STAGING && (
          <Button onClick={() => deployMutation.mutate()} disabled={deployMutation.isPending}>
            <Rocket className="mr-2 h-4 w-4" />
            Deploy
          </Button>
        )}
        {release.status === ReleaseStatus.RELEASED && (
          <Button
            variant="outline"
            onClick={() => rollbackMutation.mutate()}
            disabled={rollbackMutation.isPending}
          >
            Rollback
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/engineering/releases")}>
          Back to releases
        </Button>
      </AdminPageHeader>

      <div className="flex items-center gap-2">
        <Badge>{release.status}</Badge>
        <Badge variant="outline">{release.type}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border p-5 space-y-3 text-sm">
          <h3 className="font-semibold">Release Info</h3>
          {release.description && <p className="text-muted-foreground">{release.description}</p>}
          {release.releaseDate && <p>Planned date: {formatDate(release.releaseDate)}</p>}
          {release.deployedAt && <p>Deployed: {formatDate(release.deployedAt)}</p>}
          {release.deployedBy && (
            <p>
              Deployed by: {release.deployedBy.firstName} {release.deployedBy.lastName}
            </p>
          )}
          {release.tagName && <p>Tag: {release.tagName}</p>}
          {release.commitHash && <p>Commit: {release.commitHash}</p>}
          {release.buildNumber && <p>Build: {release.buildNumber}</p>}
        </section>

        {release.releaseNotes && (
          <section className="rounded-xl border p-5 space-y-3 text-sm">
            <h3 className="font-semibold">Release Notes</h3>
            <pre className="whitespace-pre-wrap text-muted-foreground">{release.releaseNotes}</pre>
          </section>
        )}
      </div>

      {release.testCases && release.testCases.length > 0 && (
        <section className="rounded-xl border p-5 space-y-3">
          <h3 className="font-semibold">Linked Test Cases ({release.testCases.length})</h3>
          <ul className="space-y-2 text-sm">
            {release.testCases.map((tc) => (
              <li key={tc.id} className="flex items-center gap-2">
                <span>{tc.title}</span>
                <Badge variant="outline">{tc.status}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
