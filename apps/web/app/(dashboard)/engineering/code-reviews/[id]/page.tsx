"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CodeReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState("");

  const query = useQuery({
    queryKey: ["engineering", "code-reviews", id],
    queryFn: async () => (await apiClient.engineering.codeReviews.get(id)).data,
  });

  const approveMutation = useMutation({
    mutationFn: () => apiClient.engineering.codeReviews.approve(id),
    onSuccess: () => query.refetch(),
  });

  const requestChangesMutation = useMutation({
    mutationFn: () => apiClient.engineering.codeReviews.requestChanges(id, reviewNotes),
    onSuccess: () => query.refetch(),
  });

  if (query.isLoading) return <LoadingState message="Loading code review..." />;
  if (query.isError || !query.data) {
    return <ErrorState message="Code review not found." onRetry={() => query.refetch()} />;
  }

  const review = query.data;
  const isPending = review.status === "PENDING";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={review.title}
        description={review.project?.name ?? "Code review details"}
      >
        <Button variant="outline" onClick={() => router.push("/engineering/code-reviews")}>
          Back to code reviews
        </Button>
      </AdminPageHeader>

      <div className="flex items-center gap-2">
        <Badge>{review.status}</Badge>
        {review.pullRequestUrl && (
          <a
            href={review.pullRequestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Open Pull Request
          </a>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border p-5 space-y-3 text-sm">
          <h3 className="font-semibold">Details</h3>
          <p>
            Author: {review.author?.firstName} {review.author?.lastName}
          </p>
          {review.reviewer && (
            <p>
              Reviewer: {review.reviewer.firstName} {review.reviewer.lastName}
            </p>
          )}
          <p>Requested: {formatDate(review.requestedAt)}</p>
          {review.reviewedAt && <p>Reviewed: {formatDate(review.reviewedAt)}</p>}
          {review.description && <p className="text-muted-foreground">{review.description}</p>}
          {review.reviewNotes && (
            <div>
              <p className="font-medium">Review Notes</p>
              <p className="text-muted-foreground">{review.reviewNotes}</p>
            </div>
          )}
        </section>

        {isPending && (
          <section className="rounded-xl border p-5 space-y-4">
            <h3 className="font-semibold">Submit Review</h3>
            <div className="space-y-2">
              <Label>Review Notes</Label>
              <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={4} />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending || requestChangesMutation.isPending}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => requestChangesMutation.mutate()}
                disabled={approveMutation.isPending || requestChangesMutation.isPending}
              >
                Request Changes
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
