"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, AlertBanner } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PortalSupportPage() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ticketsQuery = useQuery({
    queryKey: ["portal", "tickets"],
    queryFn: async () => {
      const res = await apiClient.portal.listTickets();
      return res.data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: () => apiClient.portal.createTicket({ subject, description }),
    onSuccess: () => {
      setSubject("");
      setDescription("");
      setFeedback("Ticket submitted.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["portal", "tickets"] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to submit ticket");
    },
  });

  if (ticketsQuery.isLoading) return <LoadingState message="Loading support..." />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Support" description="Basic help desk ticket form (full Help Desk in Phase 8)." />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="max-w-xl space-y-4 rounded-2xl border border-white/20 bg-white/50 p-6 dark:bg-white/5"
      >
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button type="submit" disabled={mutation.isPending}>Submit ticket</Button>
      </form>

      <div className="space-y-3">
        <h3 className="font-medium">My tickets</h3>
        {(ticketsQuery.data ?? []).map((ticket) => (
          <div key={ticket.id} className="rounded-xl border border-white/20 bg-white/40 p-4 text-sm dark:bg-white/5">
            <p className="font-medium">{ticket.subject}</p>
            <p className="text-muted-foreground">{ticket.status} · {new Date(ticket.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
