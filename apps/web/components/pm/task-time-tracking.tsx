"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Task } from "@/types/pm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TaskTimeTracking({ task }: { task: Task }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState("");

  const entriesQuery = useQuery({
    queryKey: ["pm", "time-entries", { taskId: task.id }],
    queryFn: async () => {
      const res = await apiClient.pm.timeEntries.list({ taskId: task.id });
      return res.data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.pm.timeEntries.create({
        taskId: task.id,
        userId: user!.id,
        hours: parseFloat(hours),
        date,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      setHours("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["pm", "time-entries", { taskId: task.id }] });
      queryClient.invalidateQueries({ queryKey: ["pm", "tasks", task.id] });
    },
  });

  const totalHours = (entriesQuery.data ?? []).reduce(
    (sum, entry) => sum + parseFloat(entry.hours || "0"),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Time tracking</h3>
        <span className="text-sm text-muted-foreground">{totalHours.toFixed(1)}h logged</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="time-hours">Hours</Label>
          <Input
            id="time-hours"
            type="number"
            step="0.25"
            min="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="2.5"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="time-date">Date</Label>
          <Input
            id="time-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1 sm:col-span-1">
          <Label htmlFor="time-desc">Note</Label>
          <Textarea
            id="time-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={1}
            placeholder="Optional"
          />
        </div>
      </div>
      <Button
        size="sm"
        disabled={!hours || !user || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Logging..." : "Log time"}
      </Button>

      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {(entriesQuery.data ?? []).map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>
              {entry.user
                ? `${entry.user.firstName} ${entry.user.lastName}`
                : "User"}{" "}
              — {entry.description || "No note"}
            </span>
            <span className="tabular-nums font-medium">
              {parseFloat(entry.hours).toFixed(1)}h · {entry.date.slice(0, 10)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
