"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { FileText, Linkedin } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { getAllowedPipelineTransitions } from "@/lib/pipeline-stage";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, AlertBanner } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PIPELINE_LABELS,
  type CandidateStatusHistoryEntry,
  type PipelineStatus,
} from "@/types/phase2";

function display(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5">
      <h3 className="font-medium">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function historyStageLabel(entry: CandidateStatusHistoryEntry): string {
  const after = entry.after as { status?: string } | null;
  const before = entry.before as { status?: string } | null;
  const from = before?.status ? PIPELINE_LABELS[before.status as PipelineStatus] ?? before.status : "?";
  const to = after?.status ? PIPELINE_LABELS[after.status as PipelineStatus] ?? after.status : "?";
  return `${from} → ${to}`;
}

export default function HrCandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const { hasPermission, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [action, setAction] = useState<"interview" | "assessment" | "offer" | null>(null);
  const [activeAppId, setActiveAppId] = useState("");
  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: "",
    location: "",
    meetingLink: "",
  });
  const [assessmentForm, setAssessmentForm] = useState({
    title: "",
    description: "",
    dueAt: "",
  });
  const [offerForm, setOfferForm] = useState({
    salary: "",
    content: "We are pleased to offer you a position...",
  });

  const canUpdate = hasPermission("application.update");
  const canOverride =
    hasPermission("application.override_stage") || isSuperAdmin;

  const query = useQuery({
    queryKey: ["hr", "candidate", params.id],
    queryFn: async () => {
      const res = await apiClient.recruitment.getCandidate(params.id);
      return res.data!;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: PipelineStatus;
    }) => apiClient.recruitment.updateApplicationStatus(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "candidate", params.id] });
      queryClient.invalidateQueries({ queryKey: ["hr", "pipeline"] });
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
      queryClient.invalidateQueries({ queryKey: ["hr", "candidate", params.id] });
      setFeedback("Interview scheduled.");
    },
  });

  const assessmentMutation = useMutation({
    mutationFn: () =>
      apiClient.recruitment.assignAssessment({
        applicationId: activeAppId,
        title: assessmentForm.title,
        description: assessmentForm.description || undefined,
        dueAt: assessmentForm.dueAt
          ? new Date(assessmentForm.dueAt).toISOString()
          : undefined,
      }),
    onSuccess: () => {
      setAction(null);
      queryClient.invalidateQueries({ queryKey: ["hr", "candidate", params.id] });
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
      queryClient.invalidateQueries({ queryKey: ["hr", "candidate", params.id] });
      setFeedback("Offer letter created.");
    },
  });

  if (query.isLoading) return <LoadingState message="Loading candidate..." />;
  if (query.isError || !query.data) return <ErrorState message="Candidate not found." />;

  const candidate = query.data;
  const applications = candidate.applications ?? [];
  const statusHistory = candidate.statusHistory ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${candidate.firstName} ${candidate.lastName}`}
        description={candidate.email}
      />
      {feedback && <AlertBanner variant="info" message={feedback} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Personal information">
          <dl className="space-y-2">
            <InfoRow
              label="Name"
              value={`${candidate.firstName} ${candidate.lastName}`.trim()}
            />
            <InfoRow label="Email" value={display(candidate.email)} />
            <InfoRow label="Phone" value={display(candidate.phone)} />
            {candidate.linkedInUrl && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">LinkedIn</dt>
                <dd>
                  <a
                    href={candidate.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-300"
                  >
                    <Linkedin className="size-3.5" />
                    Profile
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </Section>

        <Section title="Recruitment summary">
          <dl className="space-y-2">
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">Current stage</dt>
              <dd>
                <Badge>
                  {PIPELINE_LABELS[candidate.pipelineStatus as PipelineStatus]}
                </Badge>
              </dd>
            </div>
            <InfoRow
              label="Applications"
              value={String(applications.length)}
            />
            {candidate.notes && (
              <div className="pt-2 text-sm">
                <p className="text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{candidate.notes}</p>
              </div>
            )}
          </dl>
        </Section>

        <Section title="Documents">
          {candidate.resumeFile ? (
            <p className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-muted-foreground" />
              <span>
                Resume: <span className="font-medium">{candidate.resumeFile.originalName}</span>
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No resume uploaded.</p>
          )}
          {applications.some((app) => app.coverLetter) && (
            <div className="space-y-2 pt-2">
              {applications
                .filter((app) => app.coverLetter)
                .map((app) => (
                  <div key={app.id} className="rounded-lg border border-border/60 p-3 text-sm">
                    <p className="font-medium">
                      Cover letter — {app.jobPosting?.title ?? "Application"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                      {app.coverLetter}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </Section>

        {candidate.employee && (
          <Section title="Employee record">
            <InfoRow label="Employee code" value={candidate.employee.employeeCode} />
            <InfoRow label="Lifecycle" value={candidate.employee.lifecycleState} />
          </Section>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Applications</h3>
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          applications.map((app) => {
            const moveTargets = canUpdate
              ? getAllowedPipelineTransitions(app.status, canOverride)
              : [];
            const latestInterview = [...(app.interviews ?? [])].sort(
              (a, b) =>
                new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
            )[0];

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-white/20 bg-white/50 p-5 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{app.jobPosting?.title ?? "Untitled role"}</p>
                    <p className="text-sm text-muted-foreground">
                      Applied {formatDate(app.appliedAt)}
                    </p>
                  </div>
                  <Badge>{PIPELINE_LABELS[app.status as PipelineStatus]}</Badge>
                </div>

                <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                  <InfoRow
                    label="Department"
                    value={display(app.jobPosting?.department?.name)}
                  />
                  <InfoRow
                    label="Designation"
                    value={display(app.jobPosting?.designation?.name)}
                  />
                  <InfoRow
                    label="Location"
                    value={display(app.jobPosting?.location)}
                  />
                  <InfoRow
                    label="Employment type"
                    value={display(app.jobPosting?.employmentType)}
                  />
                  {latestInterview?.interviewer && (
                    <InfoRow
                      label="Interviewer"
                      value={`${latestInterview.interviewer.firstName} ${latestInterview.interviewer.lastName}`.trim()}
                    />
                  )}
                  {app.statusNotes && (
                    <div className="sm:col-span-2 text-sm">
                      <p className="text-muted-foreground">Status notes</p>
                      <p className="mt-1">{app.statusNotes}</p>
                    </div>
                  )}
                </dl>

                {moveTargets.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {moveTargets.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        disabled={statusMutation.isPending}
                        onClick={() =>
                          statusMutation.mutate({ applicationId: app.id, status })
                        }
                      >
                        Move to {PIPELINE_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {hasPermission("interview.create") && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setActiveAppId(app.id);
                        setAction("interview");
                      }}
                    >
                      Schedule interview
                    </Button>
                  )}
                  {hasPermission("assessment.create") && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setActiveAppId(app.id);
                        setAction("assessment");
                      }}
                    >
                      Assign assessment
                    </Button>
                  )}
                  {hasPermission("offer.create") && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setActiveAppId(app.id);
                        setAction("offer");
                      }}
                    >
                      Create offer
                    </Button>
                  )}
                </div>

                {(app.interviews ?? []).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Interviews</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {app.interviews!.map((interview) => (
                        <li key={interview.id}>
                          {formatDate(interview.scheduledAt)} · {interview.status}
                          {interview.notes ? ` · ${interview.notes}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(app.assessments ?? []).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Assessments</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {app.assessments!.map((assessment) => (
                        <li key={assessment.id}>
                          {assessment.title}
                          {assessment.score != null ? ` · score ${assessment.score}` : ""}
                          {assessment.dueAt
                            ? ` · due ${new Date(assessment.dueAt).toLocaleDateString()}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(app.offerLetters ?? []).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Offers</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {app.offerLetters!.map((offer) => (
                        <li key={offer.id}>
                          {offer.status}
                          {offer.salary != null
                            ? ` · ${offer.salary} ${offer.currency ?? ""}`.trim()
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(app.checklistItems ?? []).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Pre-onboarding checklist</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {app.checklistItems!.map((item) => (
                        <li key={item.id}>
                          {item.isCompleted ? "✓" : "○"} {item.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {statusHistory.length > 0 && (
        <Section title="Recruitment history">
          <ul className="space-y-2">
            {statusHistory.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm"
              >
                <span>{historyStageLabel(entry)}</span>
                <span className="text-xs text-muted-foreground">
                  {entry.actor?.name ?? "System"} · {formatDate(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <FormSheet
        open={action === "interview"}
        onOpenChange={(o) => !o && setAction(null)}
        title="Schedule interview"
        onSubmit={() => interviewMutation.mutate()}
        loading={interviewMutation.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Date & time</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            value={interviewForm.scheduledAt}
            onChange={(e) =>
              setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })
            }
            required
          />
        </div>
        <FormField
          name="location"
          label="Location"
          value={interviewForm.location}
          onChange={(v) => setInterviewForm({ ...interviewForm, location: v })}
        />
        <FormField
          name="meetingLink"
          label="Meeting link"
          value={interviewForm.meetingLink}
          onChange={(v) => setInterviewForm({ ...interviewForm, meetingLink: v })}
        />
      </FormSheet>

      <FormSheet
        open={action === "assessment"}
        onOpenChange={(o) => !o && setAction(null)}
        title="Assign assessment"
        onSubmit={() => assessmentMutation.mutate()}
        loading={assessmentMutation.isPending}
      >
        <FormField
          name="title"
          label="Title"
          value={assessmentForm.title}
          onChange={(v) => setAssessmentForm({ ...assessmentForm, title: v })}
          required
        />
        <FormTextarea
          name="description"
          label="Description"
          value={assessmentForm.description}
          onChange={(v) => setAssessmentForm({ ...assessmentForm, description: v })}
        />
        <FormField
          name="dueAt"
          label="Due date"
          type="date"
          value={assessmentForm.dueAt}
          onChange={(v) => setAssessmentForm({ ...assessmentForm, dueAt: v })}
        />
      </FormSheet>

      <FormSheet
        open={action === "offer"}
        onOpenChange={(o) => !o && setAction(null)}
        title="Create offer"
        onSubmit={() => offerMutation.mutate()}
        loading={offerMutation.isPending}
      >
        <FormField
          name="salary"
          label="Salary"
          type="number"
          value={offerForm.salary}
          onChange={(v) => setOfferForm({ ...offerForm, salary: v })}
        />
        <FormTextarea
          name="content"
          label="Offer content"
          value={offerForm.content}
          onChange={(v) => setOfferForm({ ...offerForm, content: v })}
          rows={6}
        />
      </FormSheet>
    </div>
  );
}
