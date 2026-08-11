"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { uploadFileViaPresign } from "@/lib/upload";
import type { SupportTicket } from "@/types/phase2";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  LoadingState,
  ErrorState,
  AlertBanner,
  EmptyState,
} from "@/components/admin/admin-states";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const CATEGORY_OPTIONS = [
  { value: "IT", label: "IT" },
  { value: "HR", label: "HR" },
  { value: "Facilities", label: "Facilities" },
  { value: "Payroll", label: "Payroll" },
  { value: "Other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function shortTicketId(id: string): string {
  return id.slice(-8).toUpperCase();
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function authorLabel(message: NonNullable<SupportTicket["messages"]>[number]): string {
  if (message.authorType === "SYSTEM") return "System";
  if (message.author) return `${message.author.firstName} ${message.author.lastName}`;
  return message.authorType === "STAFF" ? "Support team" : "You";
}

export default function PortalSupportPage() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("IT");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ticketsQuery = useQuery({
    queryKey: ["portal", "tickets"],
    queryFn: async () => {
      const res = await apiClient.portal.listTickets();
      return res.data ?? [];
    },
  });

  const detailQuery = useQuery({
    queryKey: ["portal", "tickets", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      return (await apiClient.portal.getTicket(selectedId)).data ?? null;
    },
    enabled: selectedId !== null,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      let fileId: string | undefined;
      if (attachment) {
        const uploaded = await uploadFileViaPresign(attachment, "OTHER");
        fileId = uploaded.id;
      }

      return apiClient.portal.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        ...(fileId ? { attachmentFileId: fileId } : {}),
      });
    },
    onSuccess: () => {
      setSubject("");
      setCategory("IT");
      setPriority("medium");
      setDescription("");
      setAttachment(null);
      setFeedback("Ticket submitted.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["portal", "tickets"] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to submit ticket");
      setFeedback(null);
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("No ticket");
      return apiClient.portal.replyToTicket(selectedId, { body: replyBody.trim() });
    },
    onSuccess: () => {
      setReplyBody("");
      setFeedback("Reply sent.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["portal", "tickets"] });
      queryClient.invalidateQueries({ queryKey: ["portal", "tickets", selectedId] });
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to send reply");
      setFeedback(null);
    },
  });

  if (ticketsQuery.isLoading) return <LoadingState message="Loading support..." />;
  if (ticketsQuery.isError) {
    return (
      <ErrorState
        message="Could not load your support tickets."
        onRetry={() => ticketsQuery.refetch()}
      />
    );
  }

  const tickets = (ticketsQuery.data ?? []) as SupportTicket[];
  const selected = detailQuery.data as SupportTicket | null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Support"
        description="Submit a help desk ticket and track replies from your team."
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="max-w-xl space-y-4 rounded-2xl border border-white/20 bg-white/50 p-6 dark:bg-white/5"
      >
        <FormField
          label="Subject"
          name="subject"
          value={subject}
          onChange={setSubject}
          required
        />
        <FormSelect
          label="Category"
          name="category"
          value={category}
          onChange={setCategory}
          options={CATEGORY_OPTIONS}
          required
        />
        <FormSelect
          label="Priority"
          name="priority"
          value={priority}
          onChange={(v) => setPriority(v as "low" | "medium" | "high")}
          options={PRIORITY_OPTIONS}
          required
        />
        <FormTextarea
          label="Description"
          name="description"
          value={description}
          onChange={setDescription}
          rows={4}
          required
        />
        <div className="space-y-2">
          <Label htmlFor="attachment">Attachment</Label>
          <Input
            id="attachment"
            type="file"
            onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Optional. Files are uploaded securely; a reference is stored with your ticket.
          </p>
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Submitting..." : "Submit ticket"}
        </Button>
      </form>

      <div className="space-y-3">
        <h3 className="font-medium">My tickets</h3>
        {tickets.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            description="Submit a ticket above and it will appear in this list."
            icon={LifeBuoy}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/20 bg-white/40 dark:bg-white/5">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/15 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Ticket ID</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Latest reply</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="cursor-pointer border-b border-white/10 last:border-0 hover:bg-white/30"
                    onClick={() => setSelectedId(ticket.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{shortTicketId(ticket.id)}</td>
                    <td className="px-4 py-3">{ticket.subject}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{ticket.status}</Badge>
                    </td>
                    <td className="px-4 py-3 capitalize">{ticket.priority}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket.latestReply?.trim() || "No replies yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.subject ?? "Ticket"}</SheetTitle>
            <SheetDescription>
              {selected ? `#${shortTicketId(selected.id)} · ${selected.status}` : ""}
            </SheetDescription>
          </SheetHeader>
          {detailQuery.isLoading || !selected ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="mt-6 space-y-4">
              {(selected.messages ?? []).map((message) => (
                <div
                  key={message.id}
                  className="rounded-lg border border-white/10 bg-white/30 p-3 text-sm dark:bg-white/5"
                >
                  <div className="mb-1 flex justify-between gap-2 text-xs text-muted-foreground">
                    <span>{authorLabel(message)}</span>
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
              ))}

              {selected.status !== "CLOSED" && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <FormTextarea
                    label="Add a reply"
                    name="reply"
                    value={replyBody}
                    onChange={setReplyBody}
                    rows={3}
                  />
                  <Button
                    disabled={!replyBody.trim() || replyMutation.isPending}
                    onClick={() => replyMutation.mutate()}
                  >
                    Send reply
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
