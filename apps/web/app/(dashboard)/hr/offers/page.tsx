"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobApplication, OfferLetter, PipelineStatus } from "@/types/phase2";

const OFFER_ELIGIBLE_STATUSES: PipelineStatus[] = ["SCREENING", "INTERVIEW", "OFFER"];

const OFFER_TEMPLATES = [
  {
    id: "standard",
    label: "Standard Offer",
    content:
      "We are pleased to offer you a full-time position at Workforce 360. This offer outlines your role, compensation, start date, and key terms of employment. Please review and respond by the stated deadline.",
  },
  {
    id: "internship",
    label: "Internship Offer",
    content:
      "We are pleased to offer you an internship at Workforce 360. This internship offer covers your assignment, stipend (if applicable), duration, mentor, and expectations. Please confirm your acceptance to proceed with onboarding.",
  },
  {
    id: "contract",
    label: "Contract Offer",
    content:
      "We are pleased to offer you a fixed-term contract position at Workforce 360. This contract offer details the engagement period, rate or salary, deliverables, and termination terms. Please review carefully before accepting.",
  },
] as const;

const DEFAULT_CONTENT = OFFER_TEMPLATES[0].content;

export default function HrOffersPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string>("standard");
  const [form, setForm] = useState({
    applicationId: "",
    salary: "",
    startDate: "",
    content: DEFAULT_CONTENT,
  });

  const canCreate = hasPermission("offer.create");

  const offersQuery = useQuery({
    queryKey: ["hr", "offers"],
    queryFn: async () => {
      const res = await apiClient.hr.listOffers();
      return res.data ?? [];
    },
  });

  const applicationsQuery = useQuery({
    queryKey: ["hr", "applications", "offer-eligible"],
    queryFn: async () => {
      const res = await apiClient.recruitment.listApplications();
      const all = res.data ?? [];
      return all.filter((a) =>
        OFFER_ELIGIBLE_STATUSES.includes(a.status as PipelineStatus),
      );
    },
    enabled: sheetOpen,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.recruitment.createOffer({
        applicationId: form.applicationId,
        salary: form.salary ? Number(form.salary) : undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        content: form.content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "offers"] });
      setSheetOpen(false);
      setForm({ applicationId: "", salary: "", startDate: "", content: DEFAULT_CONTENT });
      setTemplateId("standard");
      setFormError(null);
      setFeedback("Offer letter created.");
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to create offer");
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => apiClient.recruitment.sendOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "offers"] });
      setFeedback("Offer sent to candidate.");
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to send offer");
    },
  });

  function handleSubmit() {
    if (!form.applicationId.trim()) {
      setFormError("Please select an application.");
      return;
    }
    if (!form.content.trim()) {
      setFormError("Offer content is required.");
      return;
    }
    setFormError(null);
    createMutation.mutate();
  }

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = OFFER_TEMPLATES.find((t) => t.id === id);
    if (template) {
      setForm((prev) => ({ ...prev, content: template.content }));
    }
  }

  if (offersQuery.isLoading) return <LoadingState message="Loading offers..." />;
  if (offersQuery.isError) {
    return (
      <ErrorState message="Failed to load offers." onRetry={() => offersQuery.refetch()} />
    );
  }

  const applications = (applicationsQuery.data ?? []) as JobApplication[];
  const offers = (offersQuery.data ?? []) as (OfferLetter & {
    application?: JobApplication;
  })[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Offer management"
        description="Generate and send offer letters to candidates."
        actionLabel={canCreate ? "Create offer" : undefined}
        onAction={canCreate ? () => setSheetOpen(true) : undefined}
      />

      {feedback && (
        <AlertBanner
          variant="success"
          message={feedback}
          onDismiss={() => setFeedback(null)}
        />
      )}
      {error && (
        <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
      )}

      {offers.length === 0 ? (
        <EmptyState
          title="No offer letters yet"
          description="Create an offer for a candidate in screening, interview, or offer stage."
          actionLabel={canCreate ? "Create offer" : undefined}
          onAction={canCreate ? () => setSheetOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {offer.application?.candidate?.firstName}{" "}
                    {offer.application?.candidate?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {offer.application?.jobPosting?.title}
                  </p>
                  {offer.salary && (
                    <p className="mt-1 text-sm">
                      {offer.currency} {offer.salary}
                      {offer.startDate &&
                        ` · Start ${new Date(offer.startDate).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{offer.status}</Badge>
                  {hasPermission("offer.update") && offer.status === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendMutation.mutate(offer.id)}
                      disabled={sendMutation.isPending}
                    >
                      Send
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{offer.content}</p>
            </div>
          ))}
        </div>
      )}

      <FormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setFormError(null);
        }}
        title="Create offer letter"
        onSubmit={handleSubmit}
        loading={createMutation.isPending}
        submitLabel="Create"
      >
        {formError && <AlertBanner variant="error" message={formError} />}
        <FormSelect
          name="applicationId"
          label="Application"
          value={form.applicationId}
          onChange={(v) => setForm({ ...form, applicationId: v })}
          options={applications.map((a) => ({
            value: a.id,
            label: `${a.candidate?.firstName} ${a.candidate?.lastName} — ${a.jobPosting?.title} (${a.status})`,
          }))}
          placeholder={
            applicationsQuery.isLoading
              ? "Loading applications..."
              : applications.length === 0
                ? "No eligible applications"
                : "Select application"
          }
          required
          error={!form.applicationId && formError ? formError : undefined}
        />
        <FormSelect
          name="template"
          label="Offer template"
          value={templateId}
          onChange={applyTemplate}
          options={OFFER_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
          placeholder="Select template"
        />
        <FormField
          name="salary"
          label="Salary"
          type="number"
          value={form.salary}
          onChange={(v) => setForm({ ...form, salary: v })}
        />
        <FormField
          name="startDate"
          label="Start date"
          type="date"
          value={form.startDate}
          onChange={(v) => setForm({ ...form, startDate: v })}
        />
        <FormTextarea
          name="content"
          label="Offer content"
          value={form.content}
          onChange={(v) => setForm({ ...form, content: v })}
          rows={6}
          required
        />
      </FormSheet>
    </div>
  );
}
