"use client";

import { use } from "react";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateTaskInput, Task, TaskPriority } from "@/types/pm";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export default function ProjectBacklogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTaskInput>({
    projectId,
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
  });
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ["pm", "projects", projectId],
    queryFn: async () => (await apiClient.pm.projects.get(projectId)).data,
  });

  const tasksQuery = useQuery({
    queryKey: ["pm", "tasks", { projectId, backlog: true }],
    queryFn: async () => {
      const res = await apiClient.pm.tasks.list({ projectId });
      return (res.data ?? []).filter((t) => !t.sprintId && t.status !== "DONE" && t.status !== "CANCELLED");
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskInput) => apiClient.pm.tasks.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm", "tasks"] });
      setIsSheetOpen(false);
      setFormData({
        projectId,
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
      });
    },
  });

  if (projectQuery.isLoading || tasksQuery.isLoading) {
    return <LoadingState message="Loading backlog..." />;
  }
  if (projectQuery.isError || tasksQuery.isError) {
    return <ErrorState message="Failed to load backlog." onRetry={() => tasksQuery.refetch()} />;
  }

  const project = projectQuery.data;
  const tasks = tasksQuery.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${project?.name ?? "Project"} — Backlog`}
        description="Unscheduled tasks not yet assigned to a sprint."
        actions={
          <Button onClick={() => setIsSheetOpen(true)}>Add task</Button>
        }
      />

      {tasks.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No backlog items. Create a task to get started.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task: Task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/pm/tasks/${task.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {task.title}
                  </Link>
                  <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                  <Badge variant="outline">{task.status.replace(/_/g, " ")}</Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {task.assignee && (
                    <span>
                      {task.assignee.firstName} {task.assignee.lastName}
                    </span>
                  )}
                  {task.estimatedHours && <span>Est. {task.estimatedHours}h</span>}
                </div>
              </div>
              <Link
                href={`/pm/projects/${projectId}/sprints`}
                className="text-xs text-brand-700 hover:underline shrink-0"
              >
                Assign to sprint
              </Link>
            </div>
          ))}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add backlog task</SheetTitle>
          </SheetHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }}
            className="mt-6 space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v as TaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description ?? ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create task"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
