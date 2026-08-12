"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { payrollRunStatusVariant, formatMoney } from "@/lib/phase4-status";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PayrollRunDetailPage() {
  const params = useParams<{ id: string }>();
  const runId = params.id;
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [approverId, setApproverId] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const query = useQuery({
    queryKey: ["payroll", "runs", runId],
    queryFn: async () => {
      const res = await apiClient.payroll.runs.get(runId);
      return res.data!;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["users", "approvers"],
    queryFn: async () => {
      const res = await apiClient.users.list();
      return (res.data ?? []).filter((u) =>
        u.userRoles.some((ur) => ["super_admin", "admin", "payroll"].includes(ur.role.code ?? "")),
      );
    },
    enabled: submitOpen,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] });
  }

  const calculateMutation = useMutation({
    mutationFn: () => apiClient.payroll.runs.calculate(runId),
    onSuccess: (res) => {
      invalidate();
      const skipped = res.data?.skippedEmployeeIds.length ?? 0;
      setFeedback(
        skipped > 0
          ? `Payroll calculated. ${skipped} active employee(s) skipped (no active salary structure).`
          : "Payroll calculated for all active employees.",
      );
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to calculate payroll run"),
  });

  const submitMutation = useMutation({
    mutationFn: () => apiClient.payroll.runs.submitForApproval(runId, [approverId]),
    onSuccess: () => {
      invalidate();
      setSubmitOpen(false);
      setApproverId("");
      setFeedback("Payroll run submitted for approval.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to submit for approval"),
  });

  const approveMutation = useMutation({
    mutationFn: () => apiClient.payroll.runs.approve(runId),
    onSuccess: () => {
      invalidate();
      setFeedback("Payroll run approved.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to approve payroll run"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiClient.payroll.runs.reject(runId, rejectNotes || undefined),
    onSuccess: () => {
      invalidate();
      setRejectOpen(false);
      setRejectNotes("");
      setFeedback("Payroll run sent back to draft.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to reject payroll run"),
  });

  const processMutation = useMutation({
    mutationFn: () => apiClient.payroll.runs.process(runId),
    onSuccess: () => {
      invalidate();
      setFeedback("Payslips generated for all employees in this run.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to process payroll run"),
  });

  const markPaidMutation = useMutation({
    mutationFn: () => apiClient.payroll.runs.markPaid(runId),
    onSuccess: () => {
      invalidate();
      setFeedback("Payroll marked as paid — payslips are now visible to employees in the portal.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to mark payroll run as paid"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.payroll.runs.cancel(runId),
    onSuccess: () => {
      invalidate();
      setFeedback("Payroll run cancelled.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to cancel payroll run"),
  });

  if (query.isLoading) return <LoadingState message="Loading payroll run..." />;
  if (query.isError) return <ErrorState message="Failed to load payroll run." onRetry={() => query.refetch()} />;

  const run = query.data!;
  const canManage = hasPermission("payroll_run.manage");
  const canApprove = hasPermission("payroll_run.approve");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${MONTH_NAMES[run.month - 1] ?? run.month} ${run.year} payroll`}
        description={`Pay period: ${new Date(run.payPeriodStart).toLocaleDateString()} – ${new Date(run.payPeriodEnd).toLocaleDateString()}`}
      >
        <Badge variant={payrollRunStatusVariant(run.status)} className="text-sm">
          {run.status}
        </Badge>
      </AdminPageHeader>

      {feedback && <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      <div className="flex flex-wrap gap-2">
        {canManage && run.status === "DRAFT" && (
          <Button onClick={() => calculateMutation.mutate()} disabled={calculateMutation.isPending}>
            {run.items.length > 0 ? "Recalculate" : "Calculate"}
          </Button>
        )}
        {canManage && run.status === "DRAFT" && run.items.length > 0 && (
          <Button variant="outline" onClick={() => setSubmitOpen(true)}>
            Submit for approval
          </Button>
        )}
        {canApprove && run.status === "PENDING_APPROVAL" && (
          <>
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
              Approve
            </Button>
            <Button variant="outline" onClick={() => setRejectOpen(true)}>
              Reject
            </Button>
          </>
        )}
        {canManage && run.status === "APPROVED" && (
          <Button onClick={() => processMutation.mutate()} disabled={processMutation.isPending}>
            Process (generate payslips)
          </Button>
        )}
        {canManage && run.status === "PROCESSED" && (
          <Button onClick={() => markPaidMutation.mutate()} disabled={markPaidMutation.isPending}>
            Mark as paid (publish payslips)
          </Button>
        )}
        {canManage && ["DRAFT", "PENDING_APPROVAL"].includes(run.status) && (
          <Button variant="ghost" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
            Cancel run
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Employees</p>
          <p className="text-2xl font-semibold tabular-nums">{run.employeeCount}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Total gross</p>
          <p className="text-2xl font-semibold tabular-nums">{formatMoney(Number(run.totalGross))}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Total net</p>
          <p className="text-2xl font-semibold tabular-nums">{formatMoney(Number(run.totalNet))}</p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
          <h2 className="text-lg font-semibold tracking-tight">Employees in this run</h2>
        </div>
        {run.items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No line items yet. Calculate the run to include all active employees with a salary structure.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-muted-foreground dark:border-white/5">
                <th className="px-6 py-2">Employee</th>
                <th className="px-3 py-2 text-right">Gross</th>
                <th className="px-3 py-2 text-right">Deductions</th>
                <th className="px-3 py-2 text-right">Net</th>
                <th className="px-6 py-2 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody>
              {run.items.map((item) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="px-6 py-2">
                    {item.employee?.user ? `${item.employee.user.firstName} ${item.employee.user.lastName}` : item.employeeId}
                    <span className="ml-1 text-xs text-muted-foreground">({item.employee?.employeeCode})</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(Number(item.grossSalary))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(Number(item.totalDeductions))}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{formatMoney(Number(item.netSalary))}</td>
                  <td className="px-6 py-2 text-right">
                    {item.payslip ? (
                      <Badge variant={item.payslip.status === "PUBLISHED" ? "success" : "info"}>{item.payslip.status}</Badge>
                    ) : (
                      <Badge variant="soft">Not generated</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      <FormSheet
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Submit for approval"
        onSubmit={() => {
          if (!approverId) {
            setError("Select an approver.");
            return;
          }
          submitMutation.mutate();
        }}
        loading={submitMutation.isPending}
      >
        <FormSelect
          name="approverId"
          label="Approver"
          value={approverId}
          onChange={setApproverId}
          options={(usersQuery.data ?? []).map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))}
          placeholder={usersQuery.isLoading ? "Loading users..." : "Select approver"}
          required
        />
      </FormSheet>

      <FormSheet
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject payroll run"
        description="The run will be sent back to draft for revision."
        onSubmit={() => rejectMutation.mutate()}
        loading={rejectMutation.isPending}
        destructive
        submitLabel="Reject"
      >
        <FormTextarea name="rejectNotes" label="Notes (optional)" value={rejectNotes} onChange={setRejectNotes} />
      </FormSheet>
    </div>
  );
}
