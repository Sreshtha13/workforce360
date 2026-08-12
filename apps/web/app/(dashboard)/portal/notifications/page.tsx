"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/ticket-sla";
import type { AppNotification } from "@/types/notifications";
import { NOTIFICATION_CATEGORIES } from "@/types/notifications";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormSelect } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PortalNotificationsPage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("");
  const [unreadOnly, setUnreadOnly] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["notifications", category, unreadOnly],
    queryFn: async () =>
      (await apiClient.notifications.list({
        category: category || undefined,
        unreadOnly: unreadOnly === "true",
      })).data ?? [],
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setFeedback("Marked as read.");
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to mark read"),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiClient.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setFeedback("All notifications marked as read.");
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to mark all read"),
  });

  if (query.isLoading) return <LoadingState message="Loading notifications..." />;
  if (query.isError) {
    return (
      <ErrorState message="Failed to load notifications." onRetry={() => query.refetch()} />
    );
  }

  const items = (query.data ?? []) as AppNotification[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications"
        description="Alerts across tickets, approvals, HR, and system events."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            Mark all read
          </Button>
          <Link
            href="/portal/notification-preferences"
            className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
          >
            Preferences
          </Link>
        </div>
      </AdminPageHeader>

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <div className="flex flex-wrap gap-4">
        <div className="w-48">
          <FormSelect
            label="Category"
            name="category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "", label: "All categories" },
              ...NOTIFICATION_CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>
        <div className="w-40">
          <FormSelect
            label="Filter"
            name="unreadOnly"
            value={unreadOnly}
            onChange={setUnreadOnly}
            options={[
              { value: "", label: "All" },
              { value: "true", label: "Unread only" },
            ]}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You are all caught up."
          icon={Bell}
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border border-white/20 p-4 dark:bg-white/5 ${
                n.isRead ? "bg-white/30" : "bg-white/50"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.isRead && <Badge variant="info">Unread</Badge>}
                    {n.category && <Badge variant="outline">{n.category}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(n.createdAt)}
                  </p>
                  {n.link && (
                    <Link href={n.link} className="text-sm text-brand-700 underline dark:text-brand-300">
                      Open related item
                    </Link>
                  )}
                </div>
                {!n.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={markReadMutation.isPending}
                    onClick={() => markReadMutation.mutate(n.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
