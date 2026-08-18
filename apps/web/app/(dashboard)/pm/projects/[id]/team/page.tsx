"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { AllocateTeamMemberInput } from "@/types/pm";

export default function ProjectTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AllocateTeamMemberInput>({
    projectId,
    userId: "",
    role: "",
    allocatedHours: undefined,
  });

  const projectQuery = useQuery({
    queryKey: ["pm", "projects", projectId],
    queryFn: async () => (await apiClient.pm.projects.get(projectId)).data,
  });

  const teamQuery = useQuery({
    queryKey: ["pm", "team-allocations", { projectId }],
    queryFn: async () => {
      const res = await apiClient.pm.teamAllocations.list({ projectId });
      return res.data ?? [];
    },
  });

  const usersQuery = useQuery({
    queryKey: ["users", "list"],
    queryFn: async () => {
      const res = await apiClient.users.list({ search: "" });
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AllocateTeamMemberInput) => apiClient.pm.teamAllocations.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm", "team-allocations"] });
      setOpen(false);
      setForm({ projectId, userId: "", role: "", allocatedHours: undefined });
    },
  });

  if (projectQuery.isLoading || teamQuery.isLoading) {
    return <LoadingState message="Loading team..." />;
  }

  const allocations = teamQuery.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${projectQuery.data?.name ?? "Project"} — Team`}
        description="Assign team members and allocate hours."
        actions={<Button onClick={() => setOpen(true)}>Add member</Button>}
      />

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Member</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-right font-medium">Allocated hours</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">
                  {row.user
                    ? `${row.user.firstName} ${row.user.lastName}`
                    : row.userId}
                </td>
                <td className="px-4 py-3">{row.role ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.allocatedHours ? parseFloat(row.allocatedHours) : "—"}
                </td>
                <td className="px-4 py-3">{row.joinedAt.slice(0, 10)}</td>
              </tr>
            ))}
            {allocations.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No team members allocated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Allocate team member</SheetTitle>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <div className="space-y-2">
              <Label>User ID *</Label>
              <Input
                list="user-suggestions"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                placeholder="User cuid"
                required
              />
              <datalist id="user-suggestions">
                {(usersQuery.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={form.role ?? ""}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Developer, QA, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Allocated hours</Label>
              <Input
                type="number"
                step="1"
                value={form.allocatedHours ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    allocatedHours: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Allocate member"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
