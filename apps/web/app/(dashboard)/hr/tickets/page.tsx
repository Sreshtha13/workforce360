"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { SupportTicket } from "@/types/phase2";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Headphones } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_FOR_EMPLOYEE", label: "Waiting for employee" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const STATUS_UPDATE_OPTIONS = STATUS_OPTIONS.filter((o) => o.value);

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
  return message.authorType === "STAFF" ? "Staff" : "Employee";
}

export default function HrTicketsPage() {
  const { hasPermission, user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission("ticket.manage");
  const canView = hasPermission("ticket.read") || canManage;

  const listQuery = useQuery({
    queryKey: ["hr", "tickets", statusFilter],
    queryFn: async () =>
      (await apiClient.hr.listTickets({ status: statusFilter || undefined })).data ?? [],
    enabled: canView,
  });

  const detailQuery = useQuery({
    queryKey: ["hr", "tickets", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      return (await apiClient.hr.getTicket(selectedId)).data ?? null;
    },
    enabled: canView && selectedId !== null,
  });

  const staffUsersQuery = useQuery({
    queryKey: ["ticket-assignees"],
    queryFn: async () => (await apiClient.users.list()).data ?? [],
    enabled: canManage && selectedId !== null,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["hr", "tickets"] });
  };

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) => {
      if (!selectedId) throw new Error("No ticket");
      return apiClient.hr.assignTicket(selectedId, assignedToId);
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["hr", "tickets", selectedId] });
      setFeedback("Ticket assignment updated.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Assign failed"),
  });

  const statusMutation = useMutation({
    mutationFn: (status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_EMPLOYEE" | "RESOLVED" | "CLOSED") => {
      if (!selectedId) throw new Error("No ticket");
      return apiClient.hr.updateTicketStatus(selectedId, status);
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["hr", "tickets", selectedId] });
      setFeedback("Status updated.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Status update failed"),
  });

  const replyMutation = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error("No ticket");
      return apiClient.hr.replyToTicket(selectedId, { body: replyBody, setWaiting: true });
    },
    onSuccess: () => {
      setReplyBody("");
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["hr", "tickets", selectedId] });
      setFeedback("Reply sent.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Reply failed"),
  });

  const assigneeOptions = useMemo(() => {
    const users = staffUsersQuery.data ?? [];
    return [
      { value: "", label: "Unassigned" },
      ...users.map((u: { id: string; firstName: string; lastName: string; email: string }) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName} (${u.email})`,
      })),
    ];
  }, [staffUsersQuery.data]);

  if (!canView) {
    return <ErrorState message="You do not have permission to view support tickets." />;
  }

  if (listQuery.isLoading) return <LoadingState message="Loading tickets..." />;
  if (listQuery.isError) {
    return <ErrorState message="Failed to load tickets." onRetry={() => listQuery.refetch()} />;
  }

  const tickets = (listQuery.data ?? []) as SupportTicket[];
  const selected = detailQuery.data as SupportTicket | null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Support tickets"
        description="Assign, reply, and resolve employee help-desk tickets."
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <div className="max-w-xs">
        <FormSelect
          label="Filter by status"
          name="statusFilter"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="No tickets"
          description="Employee-submitted tickets will appear here."
          icon={Headphones}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/20 bg-white/40 dark:bg-white/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/15 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Requester</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium">Updated</th>
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.user
                      ? `${ticket.user.firstName} ${ticket.user.lastName}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{ticket.status}</Badge>
                  </td>
                  <td className="px-4 py-3 capitalize">{ticket.priority}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.assignedTo
                      ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                      : "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(ticket.updatedAt ?? ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{selected?.subject ?? "Ticket"}</SheetTitle>
            <SheetDescription>
              {selected ? `#${shortTicketId(selected.id)} · ${selected.category ?? "General"}` : ""}
            </SheetDescription>
          </SheetHeader>

          {detailQuery.isLoading || !selected ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading ticket...</p>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{selected.status}</Badge>
                <Badge variant="outline" className="capitalize">
                  {selected.priority}
                </Badge>
              </div>

              {canManage && (
                <div className="space-y-3 rounded-xl border border-white/15 p-3">
                  <FormSelect
                    label="Assignee"
                    name="assignee"
                    value={selected.assignedTo?.id ?? ""}
                    onChange={(v) => assignMutation.mutate(v || null)}
                    options={assigneeOptions}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={assignMutation.isPending}
                      onClick={() => assignMutation.mutate(user?.id ?? null)}
                    >
                      Assign to me
                    </Button>
                  </div>
                  <FormSelect
                    label="Status"
                    name="status"
                    value={selected.status}
                    onChange={(v) =>
                      statusMutation.mutate(
                        v as "OPEN" | "IN_PROGRESS" | "WAITING_FOR_EMPLOYEE" | "RESOLVED" | "CLOSED",
                      )
                    }
                    options={STATUS_UPDATE_OPTIONS}
                  />
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium">Conversation</p>
                {(selected.messages ?? []).map((message) => (
                  <div
                    key={message.id}
                    className="rounded-lg border border-white/10 bg-white/30 p-3 text-sm dark:bg-white/5"
                  >
                    <div className="mb-1 flex justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {authorLabel(message)} · {message.authorType}
                      </span>
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.body}</p>
                  </div>
                ))}
              </div>

              {canManage && selected.status !== "CLOSED" && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <FormTextarea
                    label="Reply"
                    name="reply"
                    value={replyBody}
                    onChange={setReplyBody}
                    rows={4}
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
