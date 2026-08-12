"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { paymentStatusVariant, formatMoney } from "@/lib/phase4-status";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function FinancePaymentsPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const query = useQuery({
    queryKey: ["finance", "payments", statusFilter],
    queryFn: async () => {
      const res = await apiClient.finance.payments.list(statusFilter ? { status: statusFilter } : undefined);
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading payments..." />;
  if (query.isError) return <ErrorState message="Failed to load payments." onRetry={() => query.refetch()} />;

  const payments = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Payments" description="All payments recorded manually or captured via Stripe/Razorpay." />

      <div className="flex flex-wrap items-center gap-2">
        {["", "PENDING", "SUCCEEDED", "FAILED", "REFUNDED"].map((status) => (
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

      {payments.length === 0 ? (
        <EmptyState title="No payments yet" description="Payments will appear here once recorded or captured." />
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
            >
              <div>
                <p className="font-medium">{formatMoney(Number(payment.amount), payment.currency)}</p>
                <p className="text-sm text-muted-foreground">
                  {payment.provider}
                  {payment.invoice ? (
                    <>
                      {" · "}
                      <Link href={`/finance/invoices/${payment.invoiceId}`} className="text-brand-700 hover:underline dark:text-brand-300">
                        {payment.invoice.invoiceNumber}
                      </Link>
                    </>
                  ) : null}
                  {" · "}
                  {formatDate(payment.paidAt ?? payment.createdAt)}
                </p>
              </div>
              <Badge variant={paymentStatusVariant(payment.status)}>{payment.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
