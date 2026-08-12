"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileBarChart, Loader2 } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { ReportFormat, ReportPayload, ReportType } from "@/types/reports";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormField } from "@/components/admin/form-fields";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const REPORT_TYPES: { type: ReportType; label: string; description: string }[] = [
  { type: "EXECUTIVE", label: "Executive", description: "Cross-module summary" },
  { type: "ATTENDANCE", label: "Attendance", description: "Attendance records" },
  { type: "LEAVE", label: "Leave", description: "Leave applications" },
  { type: "RECRUITMENT", label: "Recruitment", description: "Jobs & applications" },
  { type: "INVOICE", label: "Invoice", description: "Finance invoices" },
  { type: "PAYROLL", label: "Payroll", description: "Payroll runs & payslips" },
  { type: "PROJECT", label: "Project", description: "Project portfolio" },
];

export default function ReportsHubPage() {
  const { hasPermission } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [previewType, setPreviewType] = useState<ReportType | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRead = hasPermission("report.read");
  const canExport = hasPermission("report.export") || canRead;

  const filters = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const previewQuery = useQuery({
    queryKey: ["reports", "preview", previewType, filters],
    queryFn: async () => {
      const res = await apiClient.reports.getReport(previewType!, filters);
      return res.data as ReportPayload;
    },
    enabled: !!previewType && canRead,
  });

  const exportMutation = useMutation({
    mutationFn: async ({ type, format }: { type: ReportType; format: ReportFormat }) =>
      apiClient.reports.exportReport(type, format, filters),
    onSuccess: (result) => {
      setFeedback(`Downloaded ${result.filename}`);
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Export failed"),
  });

  if (!canRead) {
    return <ErrorState message="You do not have permission to view reports." />;
  }

  const rowCount = Array.isArray(previewQuery.data?.rows)
    ? previewQuery.data.rows.length
    : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reports"
        description="Generate and export operational reports. Filters apply to generate and export actions."
      />

      {feedback && (
        <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />
      )}
      {error && (
        <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Date from"
          name="dateFrom"
          type="date"
          value={dateFrom}
          onChange={setDateFrom}
        />
        <FormField
          label="Date to"
          name="dateTo"
          type="date"
          value={dateTo}
          onChange={setDateTo}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORT_TYPES.map((report) => (
          <GlassCard key={report.type} className="p-5">
            <div className="flex items-start gap-3">
              <FileBarChart className="mt-0.5 size-5 text-brand-600 dark:text-brand-400" />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{report.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewType(report.type)}
                  >
                    Generate
                  </Button>
                  {canExport && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={exportMutation.isPending}
                        onClick={() =>
                          exportMutation.mutate({ type: report.type, format: "CSV" })
                        }
                      >
                        {exportMutation.isPending ? (
                          <Loader2 className="mr-1 size-3.5 animate-spin" />
                        ) : (
                          <Download className="mr-1 size-3.5" />
                        )}
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={exportMutation.isPending}
                        onClick={() =>
                          exportMutation.mutate({ type: report.type, format: "PDF" })
                        }
                      >
                        <Download className="mr-1 size-3.5" />
                        PDF
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {previewType && (
        <GlassCard>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-6 pb-4 dark:border-white/5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Preview · {previewType}
              </h2>
              <p className="text-sm text-muted-foreground">
                Live JSON summary from the reports API
              </p>
            </div>
            <Badge variant="secondary">{previewType}</Badge>
          </div>
          <div className="p-6">
            {previewQuery.isLoading ? (
              <LoadingState message="Generating report..." />
            ) : previewQuery.isError ? (
              <ErrorState
                message="Failed to generate report."
                onRetry={() => previewQuery.refetch()}
              />
            ) : (
              <div className="space-y-3">
                {rowCount != null && (
                  <p className="text-sm text-muted-foreground">{rowCount} row(s)</p>
                )}
                <pre className="max-h-96 overflow-auto rounded-xl bg-black/5 p-4 text-xs dark:bg-white/5">
                  {JSON.stringify(previewQuery.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
