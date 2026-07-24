"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobPosting } from "@/types/phase2";

const emptyForm = {
  title: "",
  description: "",
  requirements: "",
  location: "",
  employmentType: "Full Time",
  status: "DRAFT" as JobPosting["status"],
};

export default function HrJobsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["hr", "jobs"],
    queryFn: async () => {
      const res = await apiClient.recruitment.listJobs();
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.recruitment.createJob(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "jobs"] });
      setSheetOpen(false);
      setForm(emptyForm);
      setFeedback("Job posting created.");
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to create job");
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiClient.recruitment.updateJob(id, { status: "PUBLISHED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "jobs"] });
      setFeedback("Job published to careers page.");
    },
  });

  if (query.isLoading) return <LoadingState message="Loading job postings..." />;
  if (query.isError) return <ErrorState message="Failed to load jobs." onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Job postings"
        description="Create and publish roles on the public careers page."
        actionLabel={hasPermission("job.create") ? "New job" : undefined}
        onAction={hasPermission("job.create") ? () => setSheetOpen(true) : undefined}
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <DataTable
        columns={[
          { key: "title", header: "Title", render: (row) => row.title },
          { key: "status", header: "Status", render: (row) => <Badge variant="secondary">{row.status}</Badge> },
          { key: "location", header: "Location", render: (row) => row.location ?? "—" },
          {
            key: "applications",
            header: "Applications",
            render: (row) => row._count?.applications ?? 0,
          },
          {
            key: "actions",
            header: "",
            render: (row) =>
              hasPermission("job.update") && row.status !== "PUBLISHED" ? (
                <Button size="sm" variant="outline" onClick={() => publishMutation.mutate(row.id)}>
                  Publish
                </Button>
              ) : null,
          },
        ]}
        data={query.data ?? []}
        rowKey={(row) => row.id}
      />

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Create job posting"
        description="Draft jobs can be published to /careers when ready."
        onSubmit={() => createMutation.mutate()}
        loading={createMutation.isPending}
        submitLabel="Create"
      >
        <FormField name="title" label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <FormTextarea name="description" label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={4} />
        <FormTextarea name="requirements" label="Requirements" value={form.requirements} onChange={(v) => setForm({ ...form, requirements: v })} rows={3} />
        <FormField name="location" label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <FormField name="employmentType" label="Employment type" value={form.employmentType} onChange={(v) => setForm({ ...form, employmentType: v })} />
      </FormSheet>
    </div>
  );
}
