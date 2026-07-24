"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JobApplication, OfferLetter } from "@/types/phase2";

export default function HrOffersPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    applicationId: "",
    salary: "",
    startDate: "",
    content: "We are pleased to offer you a position at Workforce 360...",
  });

  const offersQuery = useQuery({
    queryKey: ["hr", "offers"],
    queryFn: async () => {
      const res = await apiClient.hr.listOffers();
      return res.data ?? [];
    },
  });

  const applicationsQuery = useQuery({
    queryKey: ["hr", "applications", "offer-stage"],
    queryFn: async () => {
      const res = await apiClient.recruitment.listApplications({ status: "OFFER" });
      return res.data ?? [];
    },
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
    },
  });

  if (offersQuery.isLoading) return <LoadingState message="Loading offers..." />;
  if (offersQuery.isError) return <ErrorState message="Failed to load offers." />;

  const applications = (applicationsQuery.data ?? []) as JobApplication[];
  const offers = (offersQuery.data ?? []) as (OfferLetter & {
    application?: JobApplication;
  })[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Offer management"
        description="Generate and send offer letters to candidates."
        actionLabel={hasPermission("offer.create") ? "Create offer" : undefined}
        onAction={hasPermission("offer.create") ? () => setSheetOpen(true) : undefined}
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <div className="space-y-3">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {offer.application?.candidate?.firstName} {offer.application?.candidate?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{offer.application?.jobPosting?.title}</p>
                {offer.salary && (
                  <p className="mt-1 text-sm">
                    {offer.currency} {offer.salary}
                    {offer.startDate && ` · Start ${new Date(offer.startDate).toLocaleDateString()}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{offer.status}</Badge>
                {hasPermission("offer.update") && offer.status === "DRAFT" && (
                  <Button size="sm" variant="outline" onClick={() => sendMutation.mutate(offer.id)}>
                    Send
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{offer.content}</p>
          </div>
        ))}
        {offers.length === 0 && <p className="text-sm text-muted-foreground">No offer letters yet.</p>}
      </div>

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Create offer letter"
        onSubmit={() => createMutation.mutate()}
        loading={createMutation.isPending}
        submitLabel="Create"
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
        <FormField name="salary" label="Salary" type="number" value={form.salary} onChange={(v) => setForm({ ...form, salary: v })} />
        <FormField name="startDate" label="Start date" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
        <FormTextarea name="content" label="Offer content" value={form.content} onChange={(v) => setForm({ ...form, content: v })} rows={6} />
      </FormSheet>
    </div>
  );
}
