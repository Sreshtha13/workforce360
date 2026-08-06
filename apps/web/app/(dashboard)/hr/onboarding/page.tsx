"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  LoadingState,
  ErrorState,
  AlertBanner,
  EmptyState,
} from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LIFECYCLE_LABELS, type EmployeeLifecycleState } from "@/types/phase2";

export default function HrOnboardingPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
    },
    onError: (err) => {
      setFeedback(null);
      setError(err instanceof ApiClientError ? err.message : "Update failed");
    },
  });

  const checklistMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      apiClient.recruitment.updateChecklist(id, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "applications", "hired-checklist"] });
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Checklist update failed");
    },
  });

  const isLoading = employeesQuery.isLoading || applicationsQuery.isLoading;
  const isError = employeesQuery.isError || applicationsQuery.isError;

  if (isLoading) return <LoadingState message="Loading onboarding..." />;
  if (isError) {
    return (
      <ErrorState
        message="Failed to load onboarding data."
        onRetry={() => {
          employeesQuery.refetch();
          applicationsQuery.refetch();
        }}
      />
    );
  }

  const employees = employeesQuery.data ?? [];
  const applications = applicationsQuery.data ?? [];
  const bothEmpty = employees.length === 0 && applications.length === 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Onboarding workflow"
        description="Track new hires through pre-onboarding checklist and lifecycle transitions."
      />

      {feedback && (
        <AlertBanner
          variant="success"
          message={feedback}
          onDismiss={() => setFeedback(null)}
        />
      )}
      {error && (
        <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
      )}

      {bothEmpty ? (
        <EmptyState
          title="Nothing in onboarding"
          description="Hired candidates and employees in pre-onboarding or onboarding will appear here."
        />
      ) : (
        <>
          <section className="space-y-4">
            <h3 className="font-medium">Employees in onboarding</h3>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No employees currently in pre-onboarding or onboarding.
              </p>
            ) : (
              employees.map((employee) => (
                <div
                  key={employee.id}
                  className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {employee.user?.firstName} {employee.user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{employee.employeeCode}</p>
                    </div>
                    <Badge>
                      {LIFECYCLE_LABELS[employee.lifecycleState as EmployeeLifecycleState]}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {employee.lifecycleState === "PRE_ONBOARDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={lifecycleMutation.isPending}
                        onClick={() =>
                          lifecycleMutation.mutate({ id: employee.id, state: "ONBOARDING" })
                        }
                      >
                        Start onboarding
                      </Button>
                    )}
                    {employee.lifecycleState === "ONBOARDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={lifecycleMutation.isPending}
                        onClick={() =>
                          lifecycleMutation.mutate({ id: employee.id, state: "ACTIVE" })
                        }
                      >
                        Mark active
                      </Button>
                    )}
                    <Link
                      href={`/hr/employees/${employee.id}`}
                      className="self-center text-sm text-brand-600 hover:underline dark:text-brand-300"
                    >
                      View employee
                    </Link>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="space-y-4">
            <h3 className="font-medium">Pre-onboarding checklists</h3>
            {applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hired applications with checklists yet.
              </p>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
                >
                  <p className="font-medium">
                    {app.candidate?.firstName} {app.candidate?.lastName} —{" "}
                    {app.jobPosting?.title}
                  </p>
                  {(app.checklistItems ?? []).length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No checklist items.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {(app.checklistItems ?? []).map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span
                            className={
                              item.isCompleted ? "text-muted-foreground line-through" : ""
                            }
                          >
                            {item.title}
                          </span>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={checklistMutation.isPending}
                            onClick={() =>
                              checklistMutation.mutate({
                                id: item.id,
                                isCompleted: !item.isCompleted,
                              })
                            }
                          >
                            {item.isCompleted ? "Undo" : "Complete"}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
