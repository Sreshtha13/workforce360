"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2 } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, LoadingState, ErrorState } from "@/components/admin/admin-states";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PortalPayslipsPage() {
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["portal", "payslips"],
    queryFn: async () => {
      const res = await apiClient.portal.listPayslips();
      return res.data ?? [];
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => apiClient.portal.downloadPayslip(id),
    onMutate: (id) => setDownloadingId(id),
    onSettled: () => setDownloadingId(null),
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to download payslip");
    },
  });

  if (query.isLoading) return <LoadingState message="Loading your payslips..." />;
  if (query.isError) {
    return <ErrorState message="Failed to load payslips." onRetry={() => query.refetch()} />;
  }

  const payslips = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payslips"
        description="View and download your monthly payslips. Only your own published payslips are ever shown here."
      />

      {error && <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />}

      {payslips.length === 0 ? (
        <EmptyState
          title="No payslips yet"
          description="Your payslips will appear here once payroll has been processed and paid for a pay period."
          icon={FileText}
        />
      ) : (
        <div className="space-y-3">
          {payslips.map((payslip) => (
            <div
              key={payslip.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/50 shadow-inner ring-1 ring-white/20 dark:bg-white/5 dark:ring-white/10">
                  <FileText className="size-5 text-brand-700 dark:text-brand-300" aria-hidden />
                </div>
                <div>
                  <p className="font-medium">
                    {MONTH_NAMES[payslip.month - 1] ?? payslip.month} {payslip.year}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payslip.file?.originalName ?? "Payslip"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => downloadMutation.mutate(payslip.id)}
                disabled={downloadingId === payslip.id}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/70 disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/20"
              >
                {downloadingId === payslip.id ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-4" aria-hidden />
                )}
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
