"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invoiceStatusVariant, formatMoney } from "@/lib/phase4-status";
import type { InvoiceLineItemInput } from "@/types/phase4";

const EMPTY_LINE_ITEM: InvoiceLineItemInput = { description: "", quantity: 1, unitPrice: 0 };

export default function FinanceInvoicesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [taxAmount, setTaxAmount] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItemInput[]>([{ ...EMPTY_LINE_ITEM }]);

  const query = useQuery({
    queryKey: ["finance", "invoices", statusFilter],
    queryFn: async () => {
      const res = await apiClient.finance.invoices.list(statusFilter ? { status: statusFilter } : undefined);
      return res.data ?? [];
    },
  });

  const clientsQuery = useQuery({
    queryKey: ["finance", "clients", "all"],
    queryFn: async () => {
      const res = await apiClient.finance.clients.list({ status: "ACTIVE" });
      return res.data ?? [];
    },
    enabled: createOpen,
  });

  const total = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return subtotal + Number(taxAmount || 0) - Number(discountAmount || 0);
  }, [lineItems, taxAmount, discountAmount]);

  function resetForm() {
    setClientId("");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setCurrency("USD");
    setTaxAmount("0");
    setDiscountAmount("0");
    setNotes("");
    setLineItems([{ ...EMPTY_LINE_ITEM }]);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.finance.invoices.create({
        clientId,
        issueDate,
        dueDate,
        currency,
        taxAmount: Number(taxAmount || 0),
        discountAmount: Number(discountAmount || 0),
        notes: notes || undefined,
        lineItems: lineItems.filter((li) => li.description.trim().length > 0),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
      setCreateOpen(false);
      resetForm();
      setFeedback("Invoice created as draft.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to create invoice"),
  });

  if (query.isLoading) return <LoadingState message="Loading invoices..." />;
  if (query.isError) return <ErrorState message="Failed to load invoices." onRetry={() => query.refetch()} />;

  const invoices = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Invoices"
        description="Create, approve, send, and track invoice payment status."
        actionLabel={hasPermission("invoice.manage") ? "New invoice" : undefined}
        onAction={hasPermission("invoice.manage") ? () => setCreateOpen(true) : undefined}
      />

      {feedback && <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />}
      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      <div className="flex flex-wrap items-center gap-2">
        {["", "DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"].map(
          (status) => (
            <Button
              key={status || "all"}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status || "All"}
            </Button>
          ),
        )}
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice to bill a client."
          actionLabel={hasPermission("invoice.manage") ? "New invoice" : undefined}
          onAction={hasPermission("invoice.manage") ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/finance/invoices/${invoice.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/40 p-4 transition-colors hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <div>
                <p className="font-medium">{invoice.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {invoice.client?.name ?? "—"} · Due {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium tabular-nums">{formatMoney(Number(invoice.totalAmount), invoice.currency)}</p>
                <Badge variant={invoiceStatusVariant(invoice.status)} className="mt-1">
                  {invoice.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      <FormSheet
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
        title="New invoice"
        description="Invoices are created as drafts. Submit for approval or send once ready."
        onSubmit={() => {
          if (!clientId || !dueDate || lineItems.every((li) => !li.description.trim())) {
            setError("Select a client, due date, and at least one line item.");
            return;
          }
          createMutation.mutate();
        }}
        loading={createMutation.isPending}
        size="wide"
      >
        <FormSelect
          name="clientId"
          label="Client"
          value={clientId}
          onChange={setClientId}
          options={(clientsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          placeholder={clientsQuery.isLoading ? "Loading clients..." : "Select client"}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField name="issueDate" label="Issue date" type="date" value={issueDate} onChange={setIssueDate} required />
          <FormField name="dueDate" label="Due date" type="date" value={dueDate} onChange={setDueDate} required />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField name="currency" label="Currency" value={currency} onChange={setCurrency} required />
          <FormField name="taxAmount" label="Tax amount" type="number" value={taxAmount} onChange={setTaxAmount} />
          <FormField name="discountAmount" label="Discount" type="number" value={discountAmount} onChange={setDiscountAmount} />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Line items</p>
          {lineItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_100px_32px] gap-2">
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => {
                  const next = [...lineItems];
                  next[idx] = { ...next[idx], description: e.target.value };
                  setLineItems(next);
                }}
              />
              <Input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => {
                  const next = [...lineItems];
                  next[idx] = { ...next[idx], quantity: Number(e.target.value || 0) };
                  setLineItems(next);
                }}
              />
              <Input
                type="number"
                placeholder="Unit price"
                value={item.unitPrice}
                onChange={(e) => {
                  const next = [...lineItems];
                  next[idx] = { ...next[idx], unitPrice: Number(e.target.value || 0) };
                  setLineItems(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                disabled={lineItems.length === 1}
              >
                ×
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setLineItems([...lineItems, { ...EMPTY_LINE_ITEM }])}>
            Add line item
          </Button>
        </div>

        <FormTextarea name="notes" label="Notes" value={notes} onChange={setNotes} />

        <div className="rounded-xl bg-white/30 p-3 text-right text-sm font-medium dark:bg-white/5">
          Total: {formatMoney(total, currency)}
        </div>
      </FormSheet>
    </div>
  );
}
