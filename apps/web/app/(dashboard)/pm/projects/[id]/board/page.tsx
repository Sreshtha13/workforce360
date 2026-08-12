"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Task, TaskStatus, TaskPriority, CreateTaskInput } from "@/types/pm";

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
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-green-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export default function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
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
    queryFn: async () => {
      const res = await apiClient.pm.projects.get(projectId);
      return res.data;
    },
  });

  const tasksQuery = useQuery({
    queryKey: ["pm", "tasks", { projectId }],
    queryFn: async () => {
      const res = await apiClient.pm.tasks.list({ projectId });
      return res.data ?? [];
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

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      apiClient.pm.tasks.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm", "tasks"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (projectQuery.isLoading || tasksQuery.isLoading) {
    return <LoadingState message="Loading project board..." />;
  }
  if (projectQuery.isError || tasksQuery.isError) {
    return <ErrorState message="Failed to load project board." onRetry={() => tasksQuery.refetch()} />;
  }

  const project = projectQuery.data;
  const groupedTasks = TASK_STATUSES.reduce((acc, status) => {
    acc[status] = (tasksQuery.data ?? []).filter((task) => task.status === status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${project?.name} - Kanban Board`}
        description={project?.description ?? "Manage tasks in Kanban view"}
        actions={
          <Button onClick={() => setIsSheetOpen(true)}>
            Add Task
          </Button>
        }
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <div
            key={status}
            className="flex-shrink-0 w-80 rounded-lg border bg-card"
          >
            <div className={`px-4 py-3 rounded-t-lg ${STATUS_COLORS[status]}`}>
              <h3 className="font-semibold">
                {STATUS_LABELS[status]}
                <span className="ml-2 text-sm font-normal">
                  ({groupedTasks[status].length})
                </span>
              </h3>
            </div>
            <div className="p-2 space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
              {groupedTasks[status].map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border bg-background hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.href = `/pm/tasks/${task.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium flex-1">{task.title}</h4>
                    <div className={`w-2 h-2 rounded-full ml-2 mt-1 ${PRIORITY_COLORS[task.priority]}`} title={task.priority} />
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    {task.assignee && (
                      <span className="text-muted-foreground">
                        {task.assignee.firstName} {task.assignee.lastName}
                      </span>
                    )}
                    {task.estimatedHours && (
                      <Badge variant="outline" className="text-xs">
                        {task.estimatedHours}h
                      </Badge>
                    )}
                  </div>
                  {task._count && (task._count.comments > 0 || task._count.timeEntries > 0) && (
                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                      {task._count.comments > 0 && <span>💬 {task._count.comments}</span>}
                      {task._count.timeEntries > 0 && <span>⏱️ {task._count.timeEntries}</span>}
                    </div>
                  )}
                </div>
              ))}
              {groupedTasks[status].length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tasks
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Task</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
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
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                value={formData.estimatedHours ?? ""}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
