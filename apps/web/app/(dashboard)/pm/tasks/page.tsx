"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskPriority, TaskStatus } from "@/types/pm";

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export default function MyTasksPage() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["pm", "tasks", "my", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await apiClient.pm.tasks.list({ assigneeId: user.id });
      return res.data ?? [];
    },
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });

  if (!user) {
    return <ErrorState message="Sign in to view your tasks." />;
  }

  if (query.isLoading) return <LoadingState message="Loading your tasks..." />;
  if (query.isError) {
    return <ErrorState message="Failed to load tasks." onRetry={() => query.refetch()} />;
  }

  const tasks = (query.data ?? []).filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const doneTasks = (query.data ?? []).filter((t) => t.status === "DONE");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My Tasks"
        description="Tasks assigned to you across all projects."
      />

      <TaskSection title="Active" tasks={tasks} emptyMessage="No active tasks assigned to you." />
      <TaskSection title="Recently completed" tasks={doneTasks.slice(0, 10)} emptyMessage="No completed tasks yet." />
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  emptyMessage,
}: {
  title: string;
  tasks: Task[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-muted/50"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/pm/tasks/${task.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {task.title}
                  </Link>
                  <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                  <Badge variant="outline">{STATUS_LABELS[task.status]}</Badge>
                </div>
                {task.project && (
                  <Link
                    href={`/pm/projects/${task.projectId}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {task.project.name}
                  </Link>
                )}
              </div>
              {task.dueDate && (
                <span className="text-xs text-muted-foreground shrink-0">
                  Due {task.dueDate.slice(0, 10)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
