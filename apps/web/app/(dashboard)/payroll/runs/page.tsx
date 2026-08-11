"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { payrollRunStatusVariant, formatMoney } from "@/lib/phase4-status";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function defaultPeriod(): { payPeriodStart: string; payPeriodEnd: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { payPeriodStart: start.toISOString().slice(0, 10), payPeriodEnd: end.toISOString().slice(0, 10) };
}

export default function PayrollRunsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [period, setPeriod] = useState(defaultPeriod());

  const query = useQuery({
    queryKey: ["payroll", "runs"],
    queryFn: async () => {
      const res = await apiClient.payroll.runs.list();
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.payroll.runs.create({
        month,
        year,
        payPeriodStart: period.payPeriodStart,
        payPeriodEnd: period.payPeriodEnd,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] });
      setCreateOpen(false);
      setFeedback("Payroll run created as draft.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to create payroll run"),
  });

  if (query.isLoading) return <LoadingState message="Loading payroll runs..." />;
  if (query.isError) return <ErrorState message="Failed to load payroll runs." onRetry={() => query.refetch()} />;

  const runs = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payroll runs"
        description="Run a pay cycle for all active employees with a salary structure."
        actionLabel={hasPermission("payroll_run.manage") ? "New payroll run" : undefined}
        onAction={hasPermission("payroll_run.manage") ? () => setCreateOpen(true) : undefined}
      />

      {feedback && <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      {runs.length === 0 ? (
        <EmptyState
          title="No payroll runs yet"
          description="Create a payroll run for a pay period to get started."
          actionLabel={hasPermission("payroll_run.manage") ? "New payroll run" : undefined}
          onAction={hasPermission("payroll_run.manage") ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/payroll/runs/${run.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/40 p-4 transition-colors hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <div>
                <p className="font-medium">
                  {MONTH_NAMES[run.month - 1] ?? run.month} {run.year}
                </p>
                <p className="text-sm text-muted-foreground">{run.employeeCount} employee(s)</p>
              </div>
              <div className="text-right">
                <p className="font-medium tabular-nums">{formatMoney(Number(run.totalNet))}</p>
                <Badge variant={payrollRunStatusVariant(run.status)} className="mt-1">
                  {run.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      <FormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New payroll run"
        onSubmit={() => createMutation.mutate()}
        loading={createMutation.isPending}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField name="month" label="Month" type="number" value={String(month)} onChange={(v) => setMonth(Number(v || 1))} required />
          <FormField name="year" label="Year" type="number" value={String(year)} onChange={(v) => setYear(Number(v || now.getFullYear()))} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            name="payPeriodStart"
            label="Pay period start"
            type="date"
            value={period.payPeriodStart}
            onChange={(v) => setPeriod({ ...period, payPeriodStart: v })}
            required
          />
          <FormField
            name="payPeriodEnd"
            label="Pay period end"
            type="date"
            value={period.payPeriodEnd}
            onChange={(v) => setPeriod({ ...period, payPeriodEnd: v })}
            required
          />
        </div>
      </FormSheet>
    </div>
  );
}
