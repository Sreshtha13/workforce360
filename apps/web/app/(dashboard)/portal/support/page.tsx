"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BookOpen, LifeBuoy } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { uploadFileViaPresign } from "@/lib/upload";
import {
  formatDateTime,
  priorityLabel,
  slaCountdown,
  ticketDisplayNumber,
} from "@/lib/ticket-sla";
import type { SupportTicket } from "@/types/phase2";
import type { KnowledgeBaseArticle } from "@/types/helpdesk";
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
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

function authorLabel(message: NonNullable<SupportTicket["messages"]>[number]): string {
  if (message.authorType === "SYSTEM") return "System";
  if (message.author) return `${message.author.firstName} ${message.author.lastName}`;
  return message.authorType === "STAFF" ? "Support team" : "You";
}

export default function PortalSupportPage() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("IT");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [kbSearch, setKbSearch] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
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

  const kbQuery = useQuery({
    queryKey: ["helpdesk", "kb", "portal", kbSearch],
    queryFn: async () =>
      (await apiClient.helpdesk.listKb({
        publishedOnly: true,
        search: kbSearch.trim() || undefined,
      })).data ?? [],
  });

  const articleQuery = useQuery({
    queryKey: ["helpdesk", "kb", selectedArticleId],
    queryFn: async () => {
      if (!selectedArticleId) return null;
      return (await apiClient.helpdesk.getKb(selectedArticleId)).data ?? null;
    },
    enabled: selectedArticleId !== null,
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
        priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        ...(fileId ? { attachmentFileId: fileId } : {}),
      });
    },
    onSuccess: () => {
      setSubject("");
      setCategory("IT");
      setPriority("MEDIUM");
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

  const articles = useMemo(
    () => (kbQuery.data ?? []) as KnowledgeBaseArticle[],
    [kbQuery.data],
  );

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
  const selectedArticle = articleQuery.data as KnowledgeBaseArticle | null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Support"
        description="Search the knowledge base, submit a ticket, and track SLA on your requests."
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <section className="space-y-3 rounded-2xl border border-white/20 bg-white/50 p-6 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          <h3 className="font-medium">Knowledge base</h3>
        </div>
        <Input
          placeholder="Search articles..."
          value={kbSearch}
          onChange={(e) => setKbSearch(e.target.value)}
        />
        {kbQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Searching...</p>
        ) : articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No published articles match your search.</p>
        ) : (
          <ul className="space-y-2">
            {articles.slice(0, 8).map((article) => (
              <li key={article.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-white/10 bg-white/30 px-3 py-2 text-left text-sm hover:bg-white/50 dark:bg-white/5"
                  onClick={() => setSelectedArticleId(article.id)}
                >
                  <span className="font-medium">{article.title}</span>
                  {article.category && (
                    <span className="ml-2 text-xs text-muted-foreground">{article.category}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

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
          onChange={setPriority}
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
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/15 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Ticket #</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">SLA</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const resolution = slaCountdown(
                    ticket.resolutionDueAt,
                    ticket.resolvedAt ?? ticket.closedAt,
                  );
                  return (
                    <tr
                      key={ticket.id}
                      className="cursor-pointer border-b border-white/10 last:border-0 hover:bg-white/30"
                      onClick={() => setSelectedId(ticket.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {ticketDisplayNumber(ticket)}
                      </td>
                      <td className="px-4 py-3">{ticket.subject}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{ticket.status}</Badge>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {priorityLabel(ticket.priority)}
                      </td>
                      <td className="px-4 py-3">
                        {resolution ? (
                          <Badge variant={resolution.overdue ? "destructive" : "outline"}>
                            {resolution.label}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(ticket.createdAt)}
                      </td>
                    </tr>
                  );
                })}
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
              {selected
                ? `#${ticketDisplayNumber(selected)} · ${selected.status}`
                : ""}
            </SheetDescription>
          </SheetHeader>
          {detailQuery.isLoading || !selected ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {priorityLabel(selected.priority)}
                </Badge>
                {(() => {
                  const first = slaCountdown(
                    selected.firstResponseDueAt,
                    selected.firstRespondedAt,
                  );
                  const resolution = slaCountdown(
                    selected.resolutionDueAt,
                    selected.resolvedAt ?? selected.closedAt,
                  );
                  return (
                    <>
                      {first && (
                        <Badge variant={first.overdue ? "destructive" : "warning"}>
                          Response: {first.label}
                        </Badge>
                      )}
                      {resolution && (
                        <Badge variant={resolution.overdue ? "destructive" : "warning"}>
                          Resolution: {resolution.label}
                        </Badge>
                      )}
                    </>
                  );
                })()}
              </div>

              {(selected.messages ?? []).map((message) => (
                <div
                  key={message.id}
                  className="rounded-lg border border-white/10 bg-white/30 p-3 text-sm dark:bg-white/5"
                >
                  <div className="mb-1 flex justify-between gap-2 text-xs text-muted-foreground">
                    <span>{authorLabel(message)}</span>
                    <span>{formatDateTime(message.createdAt)}</span>
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

      <Sheet
        open={selectedArticleId !== null}
        onOpenChange={(open) => !open && setSelectedArticleId(null)}
      >
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedArticle?.title ?? "Article"}</SheetTitle>
            <SheetDescription>{selectedArticle?.category ?? "Knowledge base"}</SheetDescription>
          </SheetHeader>
          {articleQuery.isLoading || !selectedArticle ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="mt-6 space-y-3 text-sm whitespace-pre-wrap">
              {selectedArticle.content}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
