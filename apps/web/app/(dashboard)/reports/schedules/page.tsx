"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type {
  CreateReportScheduleInput,
  ReportFormat,
  ReportFrequency,
  ReportSchedule,
  ReportType,
} from "@/types/reports";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const emptyForm = {
  name: "",
  reportType: "EXECUTIVE" as ReportType,
  format: "CSV" as ReportFormat,
  frequency: "WEEKLY" as ReportFrequency,
  dayOfPeriod: "",
  hourUtc: "8",
  recipients: "",
  isActive: "true",
};

export default function ReportSchedulesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ReportSchedule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission("report.schedule.manage");

  const listQuery = useQuery({
    queryKey: ["reports", "schedules"],
    queryFn: async () => (await apiClient.reports.listSchedules()).data ?? [],
    enabled: canManage,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const recipients = form.recipients
        .split(/[,;\s]+/)
        .map((e) => e.trim())
        .filter(Boolean);
      const payload: CreateReportScheduleInput = {
        name: form.name.trim(),
        reportType: form.reportType,
        format: form.format,
        frequency: form.frequency,
        dayOfPeriod: form.dayOfPeriod ? Number(form.dayOfPeriod) : null,
        hourUtc: Number(form.hourUtc) || 8,
        recipients,
        isActive: form.isActive === "true",
      };
      if (editing) {
        return apiClient.reports.updateSchedule(editing.id, payload);
      }
      return apiClient.reports.createSchedule(payload);
    },
    onSuccess: () => {
      setSheetOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback(editing ? "Schedule updated." : "Schedule created.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["reports", "schedules"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to save schedule"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.reports.deleteSchedule(id),
    onSuccess: () => {
      setFeedback("Schedule deleted.");
      queryClient.invalidateQueries({ queryKey: ["reports", "schedules"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to delete"),
  });

  const runDueMutation = useMutation({
    mutationFn: () => apiClient.reports.runDue(),
    onSuccess: (res) => {
      const processed = res.data?.processed ?? 0;
      const errors = res.data?.errors?.length ?? 0;
      setFeedback(
        errors > 0
          ? `Processed ${processed} schedule(s) with ${errors} error(s).`
          : `Processed ${processed} due schedule(s).`,
      );
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["reports", "schedules"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to run due schedules"),
  });

  if (!canManage) {
    return <ErrorState message="You do not have permission to manage report schedules." />;
  }
  if (listQuery.isLoading) return <LoadingState message="Loading schedules..." />;
  if (listQuery.isError) {
    return (
      <ErrorState message="Failed to load schedules." onRetry={() => listQuery.refetch()} />
    );
  }

  const items = listQuery.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (row: ReportSchedule) => {
    setEditing(row);
    setForm({
      name: row.name,
      reportType: row.reportType,
      format: row.format,
      frequency: row.frequency,
      dayOfPeriod: row.dayOfPeriod != null ? String(row.dayOfPeriod) : "",
      hourUtc: String(row.hourUtc),
      recipients: row.recipients.join(", "),
      isActive: row.isActive ? "true" : "false",
    });
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Report schedules"
        description="Automate recurring report delivery to email recipients."
        actionLabel="Add schedule"
        onAction={openCreate}
      >
        <Button
          variant="outline"
          disabled={runDueMutation.isPending}
          onClick={() => runDueMutation.mutate()}
        >
          {runDueMutation.isPending ? "Running…" : "Run due now"}
        </Button>
      </AdminPageHeader>

      {feedback && (
        <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />
      )}
      {error && (
        <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No schedules"
          description="Create a schedule to email reports on a cadence."
          actionLabel="Add schedule"
          onAction={openCreate}
        />
      ) : (
        <DataTable
          data={items}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "type", header: "Type", render: (r) => r.reportType },
            {
              key: "cadence",
              header: "Cadence",
              render: (r) => `${r.frequency} · ${r.format} · ${r.hourUtc}:00 UTC`,
            },
            {
              key: "recipients",
              header: "Recipients",
              render: (r) => r.recipients.join(", "),
            },
            {
              key: "active",
              header: "Status",
              render: (r) => (
                <Badge variant={r.isActive ? "success" : "warning"}>
                  {r.isActive ? "Active" : "Paused"}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (r) => (
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      confirm(`Delete schedule "${r.name}"?`) && deleteMutation.mutate(r.id)
                    }
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit schedule" : "Create schedule"}
        description="Recipients are comma-separated email addresses."
        onSubmit={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
      >
        <FormField
          label="Name"
          name="name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <FormSelect
          label="Report type"
          name="reportType"
          value={form.reportType}
          onChange={(v) => setForm({ ...form, reportType: v as ReportType })}
          options={[
            "EXECUTIVE",
            "ATTENDANCE",
            "LEAVE",
            "RECRUITMENT",
            "INVOICE",
            "PAYROLL",
            "PROJECT",
          ].map((t) => ({ value: t, label: t }))}
        />
        <FormSelect
          label="Format"
          name="format"
          value={form.format}
          onChange={(v) => setForm({ ...form, format: v as ReportFormat })}
          options={[
            { value: "CSV", label: "CSV" },
            { value: "PDF", label: "PDF" },
          ]}
        />
        <FormSelect
          label="Frequency"
          name="frequency"
          value={form.frequency}
          onChange={(v) => setForm({ ...form, frequency: v as ReportFrequency })}
          options={[
            { value: "DAILY", label: "Daily" },
            { value: "WEEKLY", label: "Weekly" },
            { value: "MONTHLY", label: "Monthly" },
          ]}
        />
        <FormField
          label="Day of period"
          name="dayOfPeriod"
          value={form.dayOfPeriod}
          onChange={(v) => setForm({ ...form, dayOfPeriod: v })}
          helperText="Weekly: 0–6 (Sun–Sat). Monthly: 1–28."
        />
        <FormField
          label="Hour (UTC)"
          name="hourUtc"
          type="number"
          value={form.hourUtc}
          onChange={(v) => setForm({ ...form, hourUtc: v })}
        />
        <FormTextarea
          label="Recipients"
          name="recipients"
          value={form.recipients}
          onChange={(v) => setForm({ ...form, recipients: v })}
          required
          helperText="Comma-separated emails"
        />
        <FormSelect
          label="Active"
          name="isActive"
          value={form.isActive}
          onChange={(v) => setForm({ ...form, isActive: v })}
          options={[
            { value: "true", label: "Active" },
            { value: "false", label: "Paused" },
          ]}
        />
      </FormSheet>
    </div>
  );
}
