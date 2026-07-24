"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, AlertBanner } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PIPELINE_LABELS, PIPELINE_STATUSES, type PipelineStatus } from "@/types/phase2";

export default function HrCandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [action, setAction] = useState<"interview" | "assessment" | "offer" | null>(null);
  const [activeAppId, setActiveAppId] = useState("");
  const [interviewForm, setInterviewForm] = useState({ scheduledAt: "", location: "", meetingLink: "" });
  const [assessmentForm, setAssessmentForm] = useState({ title: "", description: "", dueAt: "" });
  const [offerForm, setOfferForm] = useState({ salary: "", content: "We are pleased to offer you a position..." });

  const query = useQuery({
    queryKey: ["hr", "candidate", params.id],
    queryFn: async () => {
      const res = await apiClient.recruitment.getCandidate(params.id);
      return res.data!;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: PipelineStatus }) =>
      apiClient.recruitment.updateApplicationStatus(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "candidate", params.id] });
      setFeedback("Status updated.");
    },
    onError: (err) => {
      setFeedback(err instanceof ApiClientError ? err.message : "Update failed");
    },
  });

  const interviewMutation = useMutation({
    mutationFn: () =>
      apiClient.recruitment.scheduleInterview({
        applicationId: activeAppId,
        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        location: interviewForm.location || undefined,
        meetingLink: interviewForm.meetingLink || undefined,
      }),
    onSuccess: () => {
      setAction(null);
      setFeedback("Interview scheduled.");
    },
  });

  const assessmentMutation = useMutation({
    mutationFn: () =>
      apiClient.recruitment.assignAssessment({
        applicationId: activeAppId,
        title: assessmentForm.title,
        description: assessmentForm.description || undefined,
        dueAt: assessmentForm.dueAt ? new Date(assessmentForm.dueAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      setAction(null);
      setFeedback("Assessment assigned.");
    },
  });

  const offerMutation = useMutation({
    mutationFn: () =>
      apiClient.recruitment.createOffer({
        applicationId: activeAppId,
        salary: offerForm.salary ? Number(offerForm.salary) : undefined,
        content: offerForm.content,
      }),
    onSuccess: () => {
      setAction(null);
      setFeedback("Offer letter created.");
    },
  });

  if (query.isLoading) return <LoadingState message="Loading candidate..." />;
  if (query.isError || !query.data) return <ErrorState message="Candidate not found." />;

  const candidate = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={`${candidate.firstName} ${candidate.lastName}`} description={candidate.email} />
      {feedback && <AlertBanner variant="info" message={feedback} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5">
          <h3 className="font-medium">Profile</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd>{candidate.phone ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Pipeline</dt><dd><Badge>{PIPELINE_LABELS[candidate.pipelineStatus as PipelineStatus]}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Resume</dt><dd>{candidate.resumeFile?.originalName ?? "—"}</dd></div>
          </dl>
        </div>
        {candidate.employee && (
          <div className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5">
            <h3 className="font-medium">Employee record</h3>
            <p className="mt-2 text-sm">Code: {candidate.employee.employeeCode}</p>
            <p className="text-sm text-muted-foreground">Lifecycle: {candidate.employee.lifecycleState}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Applications</h3>
        {(candidate.applications ?? []).map((app) => (
          <div key={app.id} className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{app.jobPosting?.title}</p>
                <p className="text-sm text-muted-foreground">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
              </div>
              <Badge>{PIPELINE_LABELS[app.status as PipelineStatus]}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {PIPELINE_STATUSES.filter((s) => s !== app.status).map((status) => (
                <Button key={status} size="sm" variant="outline" onClick={() => statusMutation.mutate({ applicationId: app.id, status })}>
                  Move to {PIPELINE_LABELS[status]}
                </Button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {hasPermission("interview.create") && (
                <Button size="sm" variant="secondary" onClick={() => { setActiveAppId(app.id); setAction("interview"); }}>
                  Schedule interview
                </Button>
              )}
              {hasPermission("assessment.create") && (
                <Button size="sm" variant="secondary" onClick={() => { setActiveAppId(app.id); setAction("assessment"); }}>
                  Assign assessment
                </Button>
              )}
              {hasPermission("offer.create") && (
                <Button size="sm" variant="secondary" onClick={() => { setActiveAppId(app.id); setAction("offer"); }}>
                  Create offer
                </Button>
              )}
            </div>
            {(app.interviews ?? []).length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                {app.interviews!.length} interview(s) scheduled
              </div>
            )}
          </div>
        ))}
      </div>

      <FormSheet open={action === "interview"} onOpenChange={(o) => !o && setAction(null)} title="Schedule interview" onSubmit={() => interviewMutation.mutate()} loading={interviewMutation.isPending}>
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Date & time</Label>
          <Input id="scheduledAt" type="datetime-local" value={interviewForm.scheduledAt} onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })} required />
        </div>
        <FormField name="location" label="Location" value={interviewForm.location} onChange={(v) => setInterviewForm({ ...interviewForm, location: v })} />
        <FormField name="meetingLink" label="Meeting link" value={interviewForm.meetingLink} onChange={(v) => setInterviewForm({ ...interviewForm, meetingLink: v })} />
      </FormSheet>

      <FormSheet open={action === "assessment"} onOpenChange={(o) => !o && setAction(null)} title="Assign assessment" onSubmit={() => assessmentMutation.mutate()} loading={assessmentMutation.isPending}>
        <FormField name="title" label="Title" value={assessmentForm.title} onChange={(v) => setAssessmentForm({ ...assessmentForm, title: v })} required />
        <FormTextarea name="description" label="Description" value={assessmentForm.description} onChange={(v) => setAssessmentForm({ ...assessmentForm, description: v })} />
        <FormField name="dueAt" label="Due date" type="date" value={assessmentForm.dueAt} onChange={(v) => setAssessmentForm({ ...assessmentForm, dueAt: v })} />
      </FormSheet>

      <FormSheet open={action === "offer"} onOpenChange={(o) => !o && setAction(null)} title="Create offer" onSubmit={() => offerMutation.mutate()} loading={offerMutation.isPending}>
        <FormField name="salary" label="Salary" type="number" value={offerForm.salary} onChange={(v) => setOfferForm({ ...offerForm, salary: v })} />
        <FormTextarea name="content" label="Offer content" value={offerForm.content} onChange={(v) => setOfferForm({ ...offerForm, content: v })} rows={6} />
      </FormSheet>
    </div>
  );
}
