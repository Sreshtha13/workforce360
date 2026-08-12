"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, FileText, Receipt, Wallet } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { MetricStatCard } from "@/components/dashboard/metric-stat-card";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Badge } from "@/components/ui/badge";
import { invoiceStatusVariant, formatMoney } from "@/lib/phase4-status";

export default function FinanceDashboardPage() {
  const query = useQuery({
    queryKey: ["finance", "dashboard"],
    queryFn: async () => {
      const res = await apiClient.finance.getDashboard();
      return res.data!;
    },
  });

  if (query.isLoading) return <LoadingState message="Loading finance dashboard..." />;
  if (query.isError) {
    return <ErrorState message="Failed to load finance dashboard." onRetry={() => query.refetch()} />;
  }

  const data = query.data!;
  const totalInvoiced = data.invoicesByStatus.reduce((sum, row) => sum + row.totalAmount, 0);
  const totalPaid = data.invoicesByStatus.reduce((sum, row) => sum + row.amountPaid, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Finance dashboard"
        description="Accounts receivable, invoicing, and reimbursements overview."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard
          title="Outstanding receivables"
          value={formatMoney(data.outstandingReceivables)}
          description="Unpaid balance across all invoices"
          icon={Wallet}
        />
        <MetricStatCard
          title="Total invoiced"
          value={formatMoney(totalInvoiced)}
          description="Across all invoice statuses"
          icon={FileText}
        />
        <MetricStatCard
          title="Total collected"
          value={formatMoney(totalPaid)}
          description="Payments applied to invoices"
          icon={CreditCard}
        />
        <MetricStatCard
          title="Pending reimbursements"
          value={String(data.pendingReimbursements)}
          description="Awaiting review"
          icon={Receipt}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <GlassCard className="lg:col-span-5">
          <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
            <h2 className="text-lg font-semibold tracking-tight">Invoices by status</h2>
          </div>
          <ul className="space-y-2 p-6">
            {data.invoicesByStatus.length === 0 && (
              <li className="text-sm text-muted-foreground">No invoices yet.</li>
            )}
            {data.invoicesByStatus.map((row) => (
              <li
                key={row.status}
                className="flex items-center justify-between rounded-lg bg-white/30 px-3 py-2 text-sm dark:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <Badge variant={invoiceStatusVariant(row.status)}>{row.status}</Badge>
                  <span className="text-muted-foreground">{row.count}</span>
                </span>
                <span className="font-medium tabular-nums">{formatMoney(row.totalAmount)}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="lg:col-span-7">
          <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
            <h2 className="text-lg font-semibold tracking-tight">Recent invoices</h2>
          </div>
          <ul className="divide-y divide-white/10 dark:divide-white/5">
            {data.recentInvoices.length === 0 && (
              <li className="p-6 text-sm text-muted-foreground">No invoices yet.</li>
            )}
            {data.recentInvoices.map((invoice) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                <div>
                  <Link href={`/finance/invoices/${invoice.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                    {invoice.invoiceNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">{invoice.client?.name ?? "—"}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium tabular-nums">{formatMoney(Number(invoice.totalAmount), invoice.currency)}</p>
                  <Badge variant={invoiceStatusVariant(invoice.status)} className="mt-1">
                    {invoice.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-6 pb-6 pt-2">
            <Link href="/finance/invoices" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
              View all invoices →
            </Link>
          </div>
        </GlassCard>
      </div>

      {data.paymentsByProvider.length > 0 && (
        <GlassCard>
          <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
            <h2 className="text-lg font-semibold tracking-tight">Payments by provider</h2>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.paymentsByProvider.map((row) => (
              <div key={`${row.provider}-${row.status}`} className="rounded-xl bg-white/30 p-4 dark:bg-white/5">
                <p className="text-sm font-medium">{row.provider}</p>
                <p className="text-xs text-muted-foreground">{row.status} · {row.count} payment(s)</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(row.totalAmount)}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
