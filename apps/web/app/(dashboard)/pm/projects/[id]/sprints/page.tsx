"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateSprintInput, SprintStatus } from "@/types/pm";

const STATUS_LABELS: Record<SprintStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function ProjectSprintsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateSprintInput>({
    projectId,
    name: "",
    goal: "",
    status: "PLANNING",
  });

  const projectQuery = useQuery({
    queryKey: ["pm", "projects", projectId],
    queryFn: async () => (await apiClient.pm.projects.get(projectId)).data,
  });

  const sprintsQuery = useQuery({
    queryKey: ["pm", "sprints", { projectId }],
    queryFn: async () => {
      const res = await apiClient.pm.sprints.list({ projectId });
      return res.data ?? [];
    },
    refetchInterval: 30_000,
  });

  const tasksQuery = useQuery({
    queryKey: ["pm", "tasks", { projectId }],
    queryFn: async () => {
      const res = await apiClient.pm.tasks.list({ projectId });
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSprintInput) => apiClient.pm.sprints.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm", "sprints"] });
      setOpen(false);
      setForm({ projectId, name: "", goal: "", status: "PLANNING" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ taskId, sprintId }: { taskId: string; sprintId: string }) =>
      apiClient.pm.tasks.update(taskId, { sprintId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pm", "tasks"] }),
  });

  if (projectQuery.isLoading || sprintsQuery.isLoading) {
    return <LoadingState message="Loading sprints..." />;
  }

  const project = projectQuery.data;
  const sprints = sprintsQuery.data ?? [];
  const backlogTasks = (tasksQuery.data ?? []).filter((t) => !t.sprintId);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${project?.name ?? "Project"} — Sprints`}
        description="Plan sprints and assign backlog tasks."
        actions={<Button onClick={() => setOpen(true)}>New sprint</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {sprints.map((sprint) => {
          const sprintTasks = (tasksQuery.data ?? []).filter((t) => t.sprintId === sprint.id);
          return (
            <section key={sprint.id} className="rounded-xl border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Link href={`/pm/sprints/${sprint.id}`} className="font-semibold hover:underline">
                  {sprint.name}
                </Link>
                <Badge variant="secondary">{STATUS_LABELS[sprint.status]}</Badge>
              </div>
              {sprint.goal && <p className="text-sm text-muted-foreground">{sprint.goal}</p>}
              <p className="text-xs text-muted-foreground">
                {sprint.startDate?.slice(0, 10) ?? "—"} → {sprint.endDate?.slice(0, 10) ?? "—"}
              </p>
              <p className="text-sm font-medium">{sprintTasks.length} tasks</p>
              <ul className="space-y-1 text-sm">
                {sprintTasks.map((task) => (
                  <li key={task.id}>
                    <Link href={`/pm/tasks/${task.id}`} className="text-brand-700 hover:underline">
                      {task.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="rounded-xl border p-5">
        <h3 className="font-semibold mb-3">Backlog (unassigned)</h3>
        {backlogTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">All tasks are assigned to sprints.</p>
        ) : (
          <ul className="space-y-2">
            {backlogTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-2 text-sm">
                <Link href={`/pm/tasks/${task.id}`} className="text-brand-700 hover:underline">
                  {task.title}
                </Link>
                {sprints.length > 0 && (
                  <Select
                    onValueChange={(sprintId) => assignMutation.mutate({ taskId: task.id, sprintId })}
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue placeholder="Add to sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      {sprints.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create sprint</SheetTitle>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Goal</Label>
              <Textarea
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="date"
                  value={form.startDate ?? ""}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="date"
                  value={form.endDate ?? ""}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create sprint"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
