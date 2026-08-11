"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, AlertBanner } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LIFECYCLE_LABELS,
  LIFECYCLE_STATES,
  type EmployeeLifecycleState,
} from "@/types/phase2";
import { useState } from "react";

export default function HrEmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const query = useQuery({
    queryKey: ["hr", "employee", params.id],
    queryFn: async () => {
      const res = await apiClient.hr.getEmployee(params.id);
      return res.data!;
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: (state: EmployeeLifecycleState) =>
      apiClient.hr.updateLifecycle(params.id, state, notes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "employee", params.id] });
      setFeedback("Lifecycle state updated.");
      setNotes("");
    },
    onError: (err) => {
      setFeedback(err instanceof ApiClientError ? err.message : "Update failed");
    },
  });

  if (query.isLoading) return <LoadingState message="Loading employee..." />;
  if (query.isError || !query.data) return <ErrorState message="Employee not found." />;

  const employee = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${employee.user?.firstName} ${employee.user?.lastName}`}
        description={`${employee.employeeCode} · ${employee.user?.email}`}
      />

      {feedback && <AlertBanner variant="info" message={feedback} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5">
          <h3 className="font-medium">Employee master</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Lifecycle</dt>
              <dd>
                <Badge>{LIFECYCLE_LABELS[employee.lifecycleState as EmployeeLifecycleState]}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Department</dt>
              <dd>{employee.user?.department?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Designation</dt>
              <dd>{employee.user?.designation?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Hired</dt>
              <dd>{new Date(employee.hiredAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5">
          <h3 className="font-medium">Lifecycle transitions</h3>
          <textarea
            className="mt-3 w-full rounded-lg border border-white/20 bg-background/60 p-2 text-sm"
            placeholder="Optional notes for this transition"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {LIFECYCLE_STATES.filter((s) => s !== employee.lifecycleState).map((state) => (
              <Button
                key={state}
                size="sm"
                variant="outline"
                onClick={() => lifecycleMutation.mutate(state)}
              >
                → {LIFECYCLE_LABELS[state]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {(employee.assignedAssets ?? []).length > 0 && (
        <section className="space-y-3">
          <h3 className="font-medium">Assigned assets</h3>
          {employee.assignedAssets!.map((asset) => (
            <div key={asset.id} className="rounded-xl border border-white/20 bg-white/40 p-3 text-sm dark:bg-white/5">
              {asset.name} · {asset.tag}
            </div>
          ))}
        </section>
      )}

      {(employee.lifecycleEvents ?? []).length > 0 && (
        <section className="space-y-3">
          <h3 className="font-medium">Lifecycle history</h3>
          {employee.lifecycleEvents!.map((event) => (
            <div key={event.id} className="rounded-xl border border-white/20 bg-white/40 p-3 text-sm dark:bg-white/5">
              {event.fromState ? `${event.fromState} → ` : ""}
              {event.toState}
              {event.notes && ` — ${event.notes}`}
              <span className="ml-2 text-muted-foreground">
                {new Date(event.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
