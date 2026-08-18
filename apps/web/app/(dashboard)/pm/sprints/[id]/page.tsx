"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { KanbanBoard } from "@/components/pm/kanban-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SprintStatus, Task, TaskStatus } from "@/types/pm";

const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};
const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  IN_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  DONE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function SprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sprintId } = use(params);
  const queryClient = useQueryClient();

  const sprintQuery = useQuery({
    queryKey: ["pm", "sprints", sprintId],
    queryFn: async () => (await apiClient.pm.sprints.get(sprintId)).data,
  });

  const tasksQuery = useQuery({
    queryKey: ["pm", "tasks", { sprintId }],
    queryFn: async () => {
      const res = await apiClient.pm.tasks.list({ sprintId });
      return res.data ?? [];
    },
    enabled: !!sprintId,
    refetchInterval: 30_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, sortOrder }: { id: string; status: TaskStatus; sortOrder?: number }) =>
      apiClient.pm.tasks.update(id, { status, sortOrder }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pm", "tasks"] }),
  });

  if (sprintQuery.isLoading) return <LoadingState message="Loading sprint..." />;
  if (sprintQuery.isError || !sprintQuery.data) {
    return <ErrorState message="Sprint not found." onRetry={() => sprintQuery.refetch()} />;
  }

  const sprint = sprintQuery.data;
  const tasks = tasksQuery.data ?? [];

  const grouped = TASK_STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>,
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={sprint.name}
        description={sprint.goal ?? "Sprint board"}
        actions={
          <div className="flex gap-2">
            <Link href={`/pm/projects/${sprint.projectId}/sprints`}>
              <Button variant="outline">Back to sprints</Button>
            </Link>
            <Link href={`/pm/projects/${sprint.projectId}/board`}>
              <Button variant="outline">Project board</Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{SPRINT_STATUS_LABELS[sprint.status]}</Badge>
        {sprint.startDate && sprint.endDate && (
          <span className="text-sm text-muted-foreground">
            {sprint.startDate.slice(0, 10)} → {sprint.endDate.slice(0, 10)}
          </span>
        )}
        <span className="text-sm text-muted-foreground">{tasks.length} tasks</span>
      </div>

      {tasksQuery.isLoading ? (
        <LoadingState message="Loading sprint tasks..." />
      ) : (
        <KanbanBoard
          columns={TASK_STATUSES}
          columnLabels={STATUS_LABELS}
          columnColors={STATUS_COLORS}
          grouped={grouped}
          onStatusChange={(taskId, status, sortOrder) =>
            updateStatusMutation.mutate({ id: taskId, status, sortOrder })
          }
        />
      )}
    </div>
  );
}
