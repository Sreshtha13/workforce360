"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { JobApplication } from "@/types/phase2";

export default function HrInterviewsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    applicationId: "",
    scheduledAt: "",
    durationMinutes: "60",
    location: "",
    meetingLink: "",
    notes: "",
  });

  const interviewsQuery = useQuery({
    queryKey: ["hr", "interviews"],
    queryFn: async () => {
      const res = await apiClient.hr.listInterviews();
      return res.data ?? [];
    },
  });

  const applicationsQuery = useQuery({
    queryKey: ["hr", "applications", "interview-stage"],
    queryFn: async () => {
      const res = await apiClient.recruitment.listApplications({ status: "INTERVIEW" });
      return res.data ?? [];
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      apiClient.recruitment.scheduleInterview({
        applicationId: form.applicationId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        location: form.location || undefined,
        meetingLink: form.meetingLink || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "interviews"] });
      setSheetOpen(false);
      setFeedback("Interview scheduled.");
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to schedule interview");
    },
  });

  if (interviewsQuery.isLoading) return <LoadingState message="Loading interviews..." />;
  if (interviewsQuery.isError) return <ErrorState message="Failed to load interviews." />;

  const applications = (applicationsQuery.data ?? []) as JobApplication[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Interview management"
        description="Schedule and track candidate interviews."
        actionLabel={hasPermission("interview.create") ? "Schedule interview" : undefined}
        onAction={hasPermission("interview.create") ? () => setSheetOpen(true) : undefined}
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <div className="space-y-3">
        {(interviewsQuery.data ?? []).map((interview) => (
          <div key={interview.id} className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {interview.application?.candidate?.firstName} {interview.application?.candidate?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{interview.application?.jobPosting?.title}</p>
                <p className="mt-1 text-sm">
                  {new Date(interview.scheduledAt).toLocaleString()} · {interview.durationMinutes} min
                </p>
                {interview.location && <p className="text-sm text-muted-foreground">{interview.location}</p>}
                {interview.meetingLink && (
                  <a href={interview.meetingLink} className="text-sm text-brand-600 hover:underline" target="_blank" rel="noreferrer">
                    Join meeting
                  </a>
                )}
              </div>
              <Badge variant="secondary">{interview.status}</Badge>
            </div>
          </div>
        ))}
        {(interviewsQuery.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No interviews scheduled yet.</p>
        )}
      </div>

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Schedule interview"
        onSubmit={() => scheduleMutation.mutate()}
        loading={scheduleMutation.isPending}
        submitLabel="Schedule"
      >
        <FormSelect
          name="applicationId"
          label="Application"
          value={form.applicationId}
          onChange={(v) => setForm({ ...form, applicationId: v })}
          options={applications.map((a) => ({
            value: a.id,
            label: `${a.candidate?.firstName} ${a.candidate?.lastName} — ${a.jobPosting?.title}`,
          }))}
          placeholder="Select application"
        />
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Date & time</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            required
          />
        </div>
        <FormField
          name="durationMinutes"
          label="Duration (minutes)"
          type="number"
          value={form.durationMinutes}
          onChange={(v) => setForm({ ...form, durationMinutes: v })}
        />
        <FormField name="location" label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <FormField name="meetingLink" label="Meeting link" value={form.meetingLink} onChange={(v) => setForm({ ...form, meetingLink: v })} />
        <FormTextarea name="notes" label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={3} />
      </FormSheet>
    </div>
  );
}
