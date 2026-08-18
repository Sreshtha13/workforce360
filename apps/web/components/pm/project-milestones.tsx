"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreateMilestoneInput, Milestone } from "@/types/pm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function ProjectMilestones({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateMilestoneInput>({
    projectId,
    title: "",
    description: "",
    dueDate: "",
  });
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pm", "milestones", { projectId }],
    queryFn: async () => {
      const res = await apiClient.pm.milestones.list({ projectId });
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMilestoneInput) => apiClient.pm.milestones.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm", "milestones"] });
      setOpen(false);
      setForm({ projectId, title: "", description: "", dueDate: "" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (milestone: Milestone) =>
      apiClient.pm.milestones.update(milestone.id, {
        completedAt: milestone.completedAt ? null : new Date().toISOString(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pm", "milestones"] }),
  });

  const milestones = query.data ?? [];

  return (
    <section className="rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Milestones</h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Add milestone
        </Button>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading milestones...</p>
      ) : milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">No milestones defined yet.</p>
      ) : (
        <ul className="space-y-2">
          {milestones.map((milestone) => (
            <li
              key={milestone.id}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <div className="space-y-0.5">
                <p className="font-medium">{milestone.title}</p>
                {milestone.dueDate && (
                  <p className="text-xs text-muted-foreground">Due {milestone.dueDate.slice(0, 10)}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {milestone._count && (
                  <Badge variant="outline">{milestone._count.tasks} tasks</Badge>
                )}
                <Badge variant={milestone.completedAt ? "default" : "secondary"}>
                  {milestone.completedAt ? "Done" : "Open"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={completeMutation.isPending}
                  onClick={() => completeMutation.mutate(milestone)}
                >
                  {milestone.completedAt ? "Reopen" : "Complete"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New milestone</SheetTitle>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate({
                ...form,
                dueDate: form.dueDate || undefined,
                description: form.description || undefined,
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="ms-title">Title</Label>
              <Input
                id="ms-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-due">Due date</Label>
              <Input
                id="ms-due"
                type="date"
                value={form.dueDate ?? ""}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ms-desc">Description</Label>
              <Textarea
                id="ms-desc"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create milestone"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </section>
  );
}
