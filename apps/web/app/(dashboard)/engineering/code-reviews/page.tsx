"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Plus, GitPullRequest } from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CodeReviewsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pullRequestUrl, setPullRequestUrl] = useState("");
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["engineering", "code-reviews"],
    queryFn: async () => {
      const res = await apiClient.engineering.codeReviews.list({});
      return res.data ?? [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["pm", "projects"],
    queryFn: async () => {
      const res = await apiClient.pm.projects.list({});
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.engineering.codeReviews.create({
        projectId,
        title,
        description,
        pullRequestUrl,
        reviewerId: "me",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engineering", "code-reviews"] });
      setIsOpen(false);
      setProjectId("");
      setTitle("");
      setDescription("");
      setPullRequestUrl("");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Code Reviews</h1>
          <p className="text-muted-foreground">Track pull request reviews and approvals</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Request Review
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Request Code Review</SheetTitle>
              <SheetDescription>Submit a pull request for review</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">Select project</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pull Request URL</Label>
                <Input value={pullRequestUrl} onChange={(e) => setPullRequestUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!projectId || !title || createMutation.isPending}
                className="w-full"
              >
                Submit for Review
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            All Code Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/engineering/code-reviews/${review.id}`}
                        className="font-medium hover:underline"
                      >
                        {review.title}
                      </Link>
                      <Badge variant={review.status === "APPROVED" ? "default" : "secondary"}>
                        {review.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {review.project?.name} • By {review.author?.firstName} {review.author?.lastName} •{" "}
                      {formatDate(review.requestedAt)}
                    </p>
                    {review.pullRequestUrl && (
                      <a
                        href={review.pullRequestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View PR
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No code reviews yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
