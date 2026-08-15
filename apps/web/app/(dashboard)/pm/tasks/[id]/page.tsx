"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskComments } from "@/components/pm/task-comments";
import { TaskTimeTracking } from "@/components/pm/task-time-tracking";
import { EntityAttachments } from "@/components/pm/entity-attachments";
import type { TaskStatus } from "@/types/pm";

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const query = useQuery({
    queryKey: ["pm", "tasks", id],
    queryFn: async () => {
      const res = await apiClient.pm.tasks.get(id);
      return res.data;
    },
    refetchInterval: 30_000,
  });

  if (query.isLoading) return <LoadingState message="Loading task..." />;
  if (query.isError || !query.data) {
    return <ErrorState message="Task not found." onRetry={() => query.refetch()} />;
  }

  const task = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={task.title}
        description={task.project?.name ?? "Task details"}
        actions={
          <div className="flex gap-2">
            {task.project && (
              <Link
                href={`/pm/projects/${task.projectId}/board`}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
              >
                Back to board
              </Link>
            )}
            <Button variant="outline" onClick={() => router.back()}>
              Go back
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge>{STATUS_LABELS[task.status]}</Badge>
        <Badge variant="outline">{task.priority}</Badge>
        {task.estimatedHours && <Badge variant="outline">Est. {task.estimatedHours}h</Badge>}
      </div>

      {task.description && (
        <section className="rounded-xl border p-5">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border p-5">
          <TaskTimeTracking task={task} />
        </section>
        <section className="rounded-xl border p-5">
          <TaskComments task={task} />
        </section>
      </div>

      <section className="rounded-xl border p-5">
        <EntityAttachments entityId={task.id} title="Task attachments" />
      </section>
    </div>
  );
}
