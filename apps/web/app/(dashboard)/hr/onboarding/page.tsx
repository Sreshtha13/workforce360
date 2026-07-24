"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, AlertBanner } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LIFECYCLE_LABELS, type EmployeeLifecycleState } from "@/types/phase2";
import { useState } from "react";

export default function HrOnboardingPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const employeesQuery = useQuery({
    queryKey: ["hr", "onboarding-employees"],
    queryFn: async () => {
      const [pre, onb] = await Promise.all([
        apiClient.hr.listEmployees({ lifecycleState: "PRE_ONBOARDING" }),
        apiClient.hr.listEmployees({ lifecycleState: "ONBOARDING" }),
      ]);
      return [...(pre.data ?? []), ...(onb.data ?? [])];
    },
  });

  const applicationsQuery = useQuery({
    queryKey: ["hr", "applications", "hired-checklist"],
    queryFn: async () => {
      const res = await apiClient.recruitment.listApplications({ status: "HIRED" });
      return res.data ?? [];
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: ({ id, state }: { id: string; state: EmployeeLifecycleState }) =>
      apiClient.hr.updateLifecycle(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "onboarding-employees"] });
      setFeedback("Lifecycle updated.");
    },
    onError: (err) => {
      setFeedback(err instanceof ApiClientError ? err.message : "Update failed");
    },
  });

  const checklistMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      apiClient.recruitment.updateChecklist(id, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "applications", "hired-checklist"] });
    },
  });

  if (employeesQuery.isLoading) return <LoadingState message="Loading onboarding..." />;
  if (employeesQuery.isError) return <ErrorState message="Failed to load onboarding data." />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Onboarding workflow"
        description="Track new hires through pre-onboarding checklist and lifecycle transitions."
      />

      {feedback && <AlertBanner variant="info" message={feedback} />}

      <section className="space-y-4">
        <h3 className="font-medium">Employees in onboarding</h3>
        {(employeesQuery.data ?? []).map((employee) => (
          <div key={employee.id} className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {employee.user?.firstName} {employee.user?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{employee.employeeCode}</p>
              </div>
              <Badge>{LIFECYCLE_LABELS[employee.lifecycleState as EmployeeLifecycleState]}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {employee.lifecycleState === "PRE_ONBOARDING" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => lifecycleMutation.mutate({ id: employee.id, state: "ONBOARDING" })}
                >
                  Start onboarding
                </Button>
              )}
              {employee.lifecycleState === "ONBOARDING" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => lifecycleMutation.mutate({ id: employee.id, state: "ACTIVE" })}
                >
                  Mark active
                </Button>
              )}
              <Link href={`/hr/employees/${employee.id}`} className="text-sm text-brand-600 hover:underline self-center">
                View employee
              </Link>
            </div>
          </div>
        ))}
        {(employeesQuery.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No employees currently in onboarding.</p>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-medium">Pre-onboarding checklists</h3>
        {(applicationsQuery.data ?? []).map((app) => (
          <div key={app.id} className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
            <p className="font-medium">
              {app.candidate?.firstName} {app.candidate?.lastName} — {app.jobPosting?.title}
            </p>
            <ul className="mt-3 space-y-2">
              {(app.checklistItems ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span className={item.isCompleted ? "line-through text-muted-foreground" : ""}>{item.title}</span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      checklistMutation.mutate({ id: item.id, isCompleted: !item.isCompleted })
                    }
                  >
                    {item.isCompleted ? "Undo" : "Complete"}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
