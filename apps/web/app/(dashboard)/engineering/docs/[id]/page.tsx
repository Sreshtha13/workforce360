"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const query = useQuery({
    queryKey: ["engineering", "docs", id],
    queryFn: async () => (await apiClient.engineering.documentation.get(id)).data,
  });

  if (query.isLoading) return <LoadingState message="Loading documentation..." />;
  if (query.isError || !query.data) {
    return <ErrorState message="Documentation not found." onRetry={() => query.refetch()} />;
  }

  const doc = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={doc.title} description={doc.category ?? "Technical documentation"}>
        <Button variant="outline" onClick={() => router.push("/engineering/docs")}>
          Back to docs
        </Button>
      </AdminPageHeader>

      <div className="flex items-center gap-2">
        {doc.isPublished ? (
          <Badge className="bg-green-500">Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        )}
        {doc.version && <Badge variant="outline">v{doc.version}</Badge>}
        {doc.project && <Badge variant="outline">{doc.project.name}</Badge>}
      </div>

      <div className="rounded-xl border p-6 space-y-4">
        {doc.description && <p className="text-muted-foreground">{doc.description}</p>}
        {doc.publishedAt && (
          <p className="text-sm text-muted-foreground">
            Published {formatDate(doc.publishedAt)}
          </p>
        )}
        {doc.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Open external documentation
          </a>
        )}
        {doc.content && (
          <article className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {doc.content}
          </article>
        )}
        {doc.createdBy && (
          <p className="text-sm text-muted-foreground">
            Created by {doc.createdBy.firstName} {doc.createdBy.lastName}
          </p>
        )}
      </div>
    </div>
  );
}
