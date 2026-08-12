"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { SearchBar } from "@/components/design-system/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { salaryRevisionStatusVariant, formatMoney } from "@/lib/phase4-status";
import type { RequestSalaryRevisionInput, SalaryRevision } from "@/types/phase4";

const EMPTY_REQUEST_FORM: RequestSalaryRevisionInput = {
  employeeId: "",
  proposedBasic: 0,
  proposedHra: 0,
  proposedConveyanceAllowance: 0,
  proposedMedicalAllowance: 0,
  proposedSpecialAllowance: 0,
  proposedOtherAllowances: 0,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  reason: "",
  approverIds: [],
};

export default function SalaryRevisionsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewTarget, setReviewTarget] = useState<SalaryRevision | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewNotes, setReviewNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [requestOpen, setRequestOpen] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [approverId, setApproverId] = useState("");
  const [requestForm, setRequestForm] = useState<RequestSalaryRevisionInput>(EMPTY_REQUEST_FORM);

  const query = useQuery({
    queryKey: ["payroll", "salary-revisions", statusFilter],
    queryFn: async () => {
      const res = await apiClient.payroll.salaryRevisions.list(statusFilter ? { status: statusFilter } : undefined);
      return res.data ?? [];
    },
  });

  const employeesQuery = useQuery({
    queryKey: ["hr", "employees", "all"],
    queryFn: async () => {
      const res = await apiClient.hr.listEmployees();
      return res.data ?? [];
    },
    enabled: requestOpen,
  });

  const usersQuery = useQuery({
    queryKey: ["users", "approvers"],
    queryFn: async () => {
      const res = await apiClient.users.list();
      return (res.data ?? []).filter((u) =>
        u.userRoles.some((ur) => ["super_admin", "admin", "payroll"].includes(ur.role.code ?? "")),
      );
    },
    enabled: requestOpen,
  });

  const filteredEmployees = useMemo(() => {
    const employees = employeesQuery.data ?? [];
    const q = employeeFilter.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.user?.firstName, e.user?.lastName, e.employeeCode, e.user?.email].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [employeesQuery.data, employeeFilter]);

  function numField(name: keyof RequestSalaryRevisionInput, value: string) {
    setRequestForm({ ...requestForm, [name]: Number(value || 0) });
  }

  const requestMutation = useMutation({
    mutationFn: () => apiClient.payroll.salaryRevisions.request({ ...requestForm, approverIds: [approverId] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "salary-revisions"] });
      setRequestOpen(false);
      setRequestForm(EMPTY_REQUEST_FORM);
      setApproverId("");
      setEmployeeFilter("");
      setFeedback("Salary revision requested.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to request salary revision"),
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewDecision === "APPROVE"
        ? apiClient.payroll.salaryRevisions.approve(reviewTarget!.id, reviewNotes || undefined)
        : apiClient.payroll.salaryRevisions.reject(reviewTarget!.id, reviewNotes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll", "salary-revisions"] });
      queryClient.invalidateQueries({ queryKey: ["payroll", "salary-structures"] });
      setReviewTarget(null);
      setReviewNotes("");
      setFeedback(`Salary revision ${reviewDecision === "APPROVE" ? "approved" : "rejected"}.`);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to review salary revision"),
  });

  if (query.isLoading) return <LoadingState message="Loading salary revisions..." />;
  if (query.isError) return <ErrorState message="Failed to load salary revisions." onRetry={() => query.refetch()} />;

  const revisions = query.data ?? [];
  const canApprove = hasPermission("salary_revision.approve");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Salary revisions"
        description="Requested raises awaiting approval. Approving generates a new versioned salary structure automatically."
        actionLabel={hasPermission("salary_revision.request") ? "Request revision" : undefined}
        onAction={hasPermission("salary_revision.request") ? () => setRequestOpen(true) : undefined}
      />

      {feedback && <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      <div className="flex flex-wrap items-center gap-2">
        {["", "PENDING", "APPROVED", "REJECTED"].map((status) => (
          <Button
            key={status || "all"}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status || "All"}
          </Button>
        ))}
      </div>

      {revisions.length === 0 ? (
        <EmptyState title="No salary revisions" description="Revision requests will appear here." />
      ) : (
        <div className="space-y-3">
          {revisions.map((rev) => {
            const proposedGross =
              rev.proposedBasic +
              rev.proposedHra +
              rev.proposedConveyanceAllowance +
              rev.proposedMedicalAllowance +
              rev.proposedSpecialAllowance +
              rev.proposedOtherAllowances;
            return (
              <div
                key={rev.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
              >
                <div>
                  <p className="font-medium">
                    {rev.employee?.user ? `${rev.employee.user.firstName} ${rev.employee.user.lastName}` : rev.employeeId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {rev.reason} · Effective {new Date(rev.effectiveFrom).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm">
                    Proposed gross: <span className="font-medium tabular-nums">{formatMoney(proposedGross)}</span>
                  </p>
                  <Badge variant={salaryRevisionStatusVariant(rev.status)}>{rev.status}</Badge>
                  {canApprove && rev.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setReviewTarget(rev);
                          setReviewDecision("APPROVE");
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReviewTarget(rev);
                          setReviewDecision("REJECT");
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormSheet
        open={!!reviewTarget}
        onOpenChange={(open) => {
          if (!open) {
            setReviewTarget(null);
            setReviewNotes("");
          }
        }}
        title={reviewDecision === "APPROVE" ? "Approve salary revision" : "Reject salary revision"}
        onSubmit={() => reviewMutation.mutate()}
        loading={reviewMutation.isPending}
        destructive={reviewDecision === "REJECT"}
        submitLabel={reviewDecision === "APPROVE" ? "Approve" : "Reject"}
      >
        <FormTextarea name="reviewNotes" label="Notes" value={reviewNotes} onChange={setReviewNotes} />
      </FormSheet>

      <FormSheet
        open={requestOpen}
        onOpenChange={(open) => {
          setRequestOpen(open);
          if (!open) {
            setRequestForm(EMPTY_REQUEST_FORM);
            setApproverId("");
            setEmployeeFilter("");
          }
        }}
        title="Request salary revision"
        onSubmit={() => {
          if (!requestForm.employeeId || !approverId || !requestForm.reason.trim()) {
            setError("Select an employee, an approver, and provide a reason.");
            return;
          }
          requestMutation.mutate();
        }}
        loading={requestMutation.isPending}
        size="wide"
      >
        <SearchBar value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} placeholder="Filter employees..." />
        <FormSelect
          name="employeeId"
          label="Employee"
          value={requestForm.employeeId}
          onChange={(v) => setRequestForm({ ...requestForm, employeeId: v })}
          options={filteredEmployees.map((e) => ({
            value: e.id,
            label: `${e.user?.firstName ?? ""} ${e.user?.lastName ?? ""} — ${e.employeeCode}`.trim(),
          }))}
          placeholder={employeesQuery.isLoading ? "Loading employees..." : "Select employee"}
          required
        />
        <FormField
          name="effectiveFrom"
          label="Effective from"
          type="date"
          value={requestForm.effectiveFrom}
          onChange={(v) => setRequestForm({ ...requestForm, effectiveFrom: v })}
          required
        />

        <p className="text-sm font-medium">Proposed earnings</p>
        <div className="grid grid-cols-3 gap-3">
          <FormField name="proposedBasic" label="Basic" type="number" value={String(requestForm.proposedBasic)} onChange={(v) => numField("proposedBasic", v)} required />
          <FormField name="proposedHra" label="HRA" type="number" value={String(requestForm.proposedHra)} onChange={(v) => numField("proposedHra", v)} />
          <FormField name="proposedConveyanceAllowance" label="Conveyance" type="number" value={String(requestForm.proposedConveyanceAllowance)} onChange={(v) => numField("proposedConveyanceAllowance", v)} />
          <FormField name="proposedMedicalAllowance" label="Medical" type="number" value={String(requestForm.proposedMedicalAllowance)} onChange={(v) => numField("proposedMedicalAllowance", v)} />
          <FormField name="proposedSpecialAllowance" label="Special" type="number" value={String(requestForm.proposedSpecialAllowance)} onChange={(v) => numField("proposedSpecialAllowance", v)} />
          <FormField name="proposedOtherAllowances" label="Other" type="number" value={String(requestForm.proposedOtherAllowances)} onChange={(v) => numField("proposedOtherAllowances", v)} />
        </div>

        <FormTextarea
          name="reason"
          label="Reason"
          value={requestForm.reason}
          onChange={(v) => setRequestForm({ ...requestForm, reason: v })}
          required
        />

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
    </div>
  );
}
