"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { invoiceStatusVariant, paymentStatusVariant, formatMoney } from "@/lib/phase4-status";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [approverId, setApproverId] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const query = useQuery({
    queryKey: ["finance", "invoices", invoiceId],
    queryFn: async () => {
      const res = await apiClient.finance.invoices.get(invoiceId);
      return res.data!;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["users", "approvers"],
    queryFn: async () => {
      const res = await apiClient.users.list();
      return (res.data ?? []).filter((u) =>
        u.userRoles.some((ur) => ["super_admin", "admin", "finance"].includes(ur.role.code ?? "")),
      );
    },
    enabled: submitOpen,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
  }

  const submitMutation = useMutation({
    mutationFn: () => apiClient.finance.invoices.submitForApproval(invoiceId, [approverId]),
    onSuccess: () => {
      invalidate();
      setSubmitOpen(false);
      setApproverId("");
      setFeedback("Invoice submitted for approval.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to submit for approval"),
  });

  const approveMutation = useMutation({
    mutationFn: () => apiClient.finance.invoices.approve(invoiceId),
    onSuccess: () => {
      invalidate();
      setFeedback("Invoice approved.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to approve invoice"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiClient.finance.invoices.reject(invoiceId, rejectNotes),
    onSuccess: () => {
      invalidate();
      setRejectOpen(false);
      setRejectNotes("");
      setFeedback("Invoice rejected.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to reject invoice"),
  });

  const sendMutation = useMutation({
    mutationFn: () => apiClient.finance.invoices.send(invoiceId),
    onSuccess: () => {
      invalidate();
      setFeedback("Invoice sent to client.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to send invoice"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.finance.invoices.cancel(invoiceId),
    onSuccess: () => {
      invalidate();
      setFeedback("Invoice cancelled.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to cancel invoice"),
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      apiClient.finance.payments.recordManual({
        invoiceId,
        amount: Number(paymentAmount || 0),
        currency: query.data?.currency ?? "USD",
        method: paymentMethod || undefined,
        notes: paymentNotes || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setPaymentOpen(false);
      setPaymentAmount("");
      setPaymentMethod("");
      setPaymentNotes("");
      setFeedback("Payment recorded.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to record payment"),
  });

  if (query.isLoading) return <LoadingState message="Loading invoice..." />;
  if (query.isError) return <ErrorState message="Failed to load invoice." onRetry={() => query.refetch()} />;

  const invoice = query.data!;
  const amountDue = Number(invoice.totalAmount) - Number(invoice.amountPaid);
  const canManage = hasPermission("invoice.manage");
  const canApprove = hasPermission("invoice.approve");
  const canRecordPayment = hasPermission("payment.manage");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={invoice.invoiceNumber}
        description={`Billed to ${invoice.client?.name ?? "—"} · Issued ${formatDate(invoice.issueDate)} · Due ${formatDate(invoice.dueDate)}`}
      >
        <Badge variant={invoiceStatusVariant(invoice.status)} className="text-sm">
          {invoice.status}
        </Badge>
      </AdminPageHeader>

      {feedback && <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      <div className="flex flex-wrap gap-2">
        {canManage && invoice.status === "DRAFT" && (
          <Button onClick={() => setSubmitOpen(true)}>Submit for approval</Button>
        )}
        {canApprove && invoice.status === "PENDING_APPROVAL" && (
          <>
            <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
              Approve
            </Button>
            <Button variant="outline" onClick={() => setRejectOpen(true)}>
              Reject
            </Button>
          </>
        )}
        {canManage && ["DRAFT", "APPROVED"].includes(invoice.status) && (
          <Button variant="outline" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
            Send to client
          </Button>
        )}
        {canRecordPayment && !["PAID", "CANCELLED", "DRAFT"].includes(invoice.status) && amountDue > 0 && (
          <Button variant="outline" onClick={() => setPaymentOpen(true)}>
            Record payment
          </Button>
        )}
        {canManage && !["PAID", "CANCELLED"].includes(invoice.status) && (
          <Button variant="ghost" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
            Cancel invoice
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <GlassCard className="lg:col-span-8">
          <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
            <h2 className="text-lg font-semibold tracking-tight">Line items</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-muted-foreground dark:border-white/5">
                <th className="px-6 py-2">Description</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Unit price</th>
                <th className="px-6 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="px-6 py-2">{item.description}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(Number(item.unitPrice), invoice.currency)}</td>
                  <td className="px-6 py-2 text-right tabular-nums">{formatMoney(Number(item.amount), invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 p-6 pt-4 text-right text-sm">
            <p>Subtotal: <span className="font-medium">{formatMoney(Number(invoice.subtotal), invoice.currency)}</span></p>
            <p>Tax: <span className="font-medium">{formatMoney(Number(invoice.taxAmount), invoice.currency)}</span></p>
            <p>Discount: <span className="font-medium">-{formatMoney(Number(invoice.discountAmount), invoice.currency)}</span></p>
            <p className="text-base font-semibold">Total: {formatMoney(Number(invoice.totalAmount), invoice.currency)}</p>
            <p className="text-emerald-700 dark:text-emerald-400">Paid: {formatMoney(Number(invoice.amountPaid), invoice.currency)}</p>
            <p className="font-semibold">Amount due: {formatMoney(amountDue, invoice.currency)}</p>
          </div>
          {invoice.notes && (
            <div className="border-t border-white/10 p-6 text-sm text-muted-foreground dark:border-white/5">{invoice.notes}</div>
          )}
        </GlassCard>

        <div className="space-y-4 lg:col-span-4">
          <GlassCard>
            <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
              <h2 className="text-lg font-semibold tracking-tight">Payments</h2>
            </div>
            <ul className="divide-y divide-white/10 dark:divide-white/5">
              {(invoice.payments ?? []).length === 0 && (
                <li className="p-6 text-sm text-muted-foreground">No payments recorded yet.</li>
              )}
              {(invoice.payments ?? []).map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-2 px-6 py-3 text-sm">
                  <div>
                    <p className="font-medium">{formatMoney(Number(payment.amount), payment.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.provider} · {formatDate(payment.paidAt ?? payment.createdAt)}
                    </p>
                  </div>
                  <Badge variant={paymentStatusVariant(payment.status)}>{payment.status}</Badge>
                </li>
              ))}
            </ul>
          </GlassCard>

          {invoice.approvalRequest && (
            <GlassCard>
              <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
                <h2 className="text-lg font-semibold tracking-tight">Approval</h2>
              </div>
              <div className="p-6 text-sm">
                <Badge variant={invoiceStatusVariant(invoice.approvalRequest.status)}>{invoice.approvalRequest.status}</Badge>
                <ul className="mt-3 space-y-2">
                  {(invoice.approvalRequest.steps ?? []).map((step) => (
                    <li key={step.id} className="flex items-center justify-between text-muted-foreground">
                      <span>Approver</span>
                      <Badge variant="outline">{step.status}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

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
        title="Reject invoice"
        onSubmit={() => {
          if (!rejectNotes.trim()) {
            setError("Provide a reason for rejection.");
            return;
          }
          rejectMutation.mutate();
        }}
        loading={rejectMutation.isPending}
        destructive
        submitLabel="Reject"
      >
        <FormTextarea name="rejectNotes" label="Reason" value={rejectNotes} onChange={setRejectNotes} required />
      </FormSheet>

      <FormSheet
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        title="Record payment"
        description={`Amount due: ${formatMoney(amountDue, invoice.currency)}`}
        onSubmit={() => {
          if (!paymentAmount || Number(paymentAmount) <= 0) {
            setError("Enter a valid payment amount.");
            return;
          }
          paymentMutation.mutate();
        }}
        loading={paymentMutation.isPending}
      >
        <FormField name="amount" label="Amount" type="number" value={paymentAmount} onChange={setPaymentAmount} required />
        <FormField name="method" label="Method (e.g. bank transfer)" value={paymentMethod} onChange={setPaymentMethod} />
        <FormTextarea name="notes" label="Notes" value={paymentNotes} onChange={setPaymentNotes} />
      </FormSheet>
    </div>
  );
}
