"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/ticket-sla";
import type { Announcement } from "@/types/notifications";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const emptyForm = {
  title: "",
  body: "",
  audience: "ALL",
  expiresAt: "",
};

export default function AnnouncementsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission("announcement.manage");

  const listQuery = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await apiClient.notifications.listAnnouncements()).data ?? [],
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      apiClient.notifications.createAnnouncement({
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience.trim() || "ALL",
        expiresAt: form.expiresAt.trim() || undefined,
      }),
    onSuccess: () => {
      setSheetOpen(false);
      setForm(emptyForm);
      setFeedback("Announcement created.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to create announcement"),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiClient.notifications.publishAnnouncement(id),
    onSuccess: () => {
      setFeedback("Announcement published.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to publish"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.notifications.deleteAnnouncement(id),
    onSuccess: () => {
      setFeedback("Announcement deleted.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to delete"),
  });

  if (!canManage) {
    return <ErrorState message="You do not have permission to manage announcements." />;
  }
  if (listQuery.isLoading) return <LoadingState message="Loading announcements..." />;
  if (listQuery.isError) {
    return (
      <ErrorState
        message="Failed to load announcements."
        onRetry={() => listQuery.refetch()}
      />
    );
  }

  const items = (listQuery.data ?? []) as Announcement[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Announcements"
        description="Create and publish company-wide or targeted announcements."
        actionLabel="New announcement"
        onAction={() => {
          setForm(emptyForm);
          setSheetOpen(true);
        }}
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      {items.length === 0 ? (
        <EmptyState
          title="No announcements"
          description="Create an announcement to notify employees."
          icon={Megaphone}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/20 bg-white/40 dark:bg-white/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/15 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Audience</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {item.body}
                    </div>
                  </td>
                  <td className="px-4 py-3">{item.audience}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(item.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.publishedAt ? "success" : "warning"}>
                      {item.publishedAt ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!item.publishedAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => publishMutation.mutate(item.id)}
                        >
                          Publish
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="New announcement"
        description="Draft an announcement, then publish when ready."
        onSubmit={() => createMutation.mutate()}
        loading={createMutation.isPending}
      >
        <FormField
          label="Title"
          name="title"
          value={form.title}
          onChange={(v) => setForm((f) => ({ ...f, title: v }))}
          required
        />
        <FormTextarea
          label="Body"
          name="body"
          value={form.body}
          onChange={(v) => setForm((f) => ({ ...f, body: v }))}
          rows={6}
          required
        />
        <FormField
          label="Audience"
          name="audience"
          value={form.audience}
          onChange={(v) => setForm((f) => ({ ...f, audience: v }))}
        />
        <FormField
          label="Expires at (ISO datetime, optional)"
          name="expiresAt"
          value={form.expiresAt}
          onChange={(v) => setForm((f) => ({ ...f, expiresAt: v }))}
        />
        <p className="text-xs text-muted-foreground">
          Example: 2026-12-31T23:59:00.000Z
        </p>
      </FormSheet>
    </div>
  );
}
