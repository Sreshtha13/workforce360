"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState } from "@/components/admin/admin-states";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateBudgetEntryInput } from "@/types/pm";

export default function ProjectBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateBudgetEntryInput>({
    projectId,
    category: "",
    amount: 0,
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const projectQuery = useQuery({
    queryKey: ["pm", "projects", projectId],
    queryFn: async () => (await apiClient.pm.projects.get(projectId)).data,
  });

  const reportQuery = useQuery({
    queryKey: ["pm", "projects", projectId, "report"],
    queryFn: async () => (await apiClient.pm.projects.getReport(projectId)).data,
    refetchInterval: 30_000,
  });

  const budgetQuery = useQuery({
    queryKey: ["pm", "budget", projectId],
    queryFn: async () => {
      const res = await apiClient.pm.budget.list(projectId);
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBudgetEntryInput) => apiClient.pm.budget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm", "budget", projectId] });
      queryClient.invalidateQueries({ queryKey: ["pm", "projects", projectId, "report"] });
      setOpen(false);
      setForm({
        projectId,
        category: "",
        amount: 0,
        description: "",
        date: new Date().toISOString().slice(0, 10),
      });
    },
  });

  if (projectQuery.isLoading) return <LoadingState message="Loading budget..." />;

  const project = projectQuery.data;
  const summary = reportQuery.data?.summary;
  const budgetTotal = project?.budget ? parseFloat(project.budget) : null;
  const spent = summary?.totalBudgetSpent ?? 0;
  const remaining = summary?.budgetRemaining;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${project?.name ?? "Project"} — Budget`}
        description="Track expenses against project budget."
        actions={<Button onClick={() => setOpen(true)}>Log expense</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Budget</p>
          <p className="text-2xl font-semibold tabular-nums">
            {budgetTotal != null ? `${project?.currency} ${budgetTotal.toLocaleString()}` : "—"}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Spent</p>
          <p className="text-2xl font-semibold tabular-nums text-orange-600">
            {project?.currency} {spent.toLocaleString()}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p
            className={`text-2xl font-semibold tabular-nums ${
              remaining != null && remaining < 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {remaining != null ? `${project?.currency} ${remaining.toLocaleString()}` : "—"}
          </p>
        </GlassCard>
      </div>

      {budgetTotal != null && budgetTotal > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Budget utilization</span>
            <span className="tabular-nums">{Math.round((spent / budgetTotal) * 100)}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${spent > budgetTotal ? "bg-red-500" : "bg-brand-600"}`}
              style={{ width: `${Math.min(100, (spent / budgetTotal) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(budgetQuery.data ?? []).map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="px-4 py-3">{entry.date.slice(0, 10)}</td>
                <td className="px-4 py-3">{entry.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{entry.description ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {parseFloat(entry.amount).toLocaleString()}
                </td>
              </tr>
            ))}
            {(budgetQuery.data ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No expenses logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Log expense</SheetTitle>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <div className="space-y-2">
              <Label>Category *</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Log expense"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
