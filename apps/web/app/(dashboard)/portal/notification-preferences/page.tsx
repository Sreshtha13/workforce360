"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { NotificationCategory, NotificationPreference } from "@/types/notifications";
import { NOTIFICATION_CATEGORIES } from "@/types/notifications";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function NotificationPreferencesPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: async () => (await apiClient.notifications.getPreferences()).data ?? [],
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      category: NotificationCategory;
      inAppEnabled: boolean;
      emailEnabled: boolean;
    }) => apiClient.notifications.updatePreference(data),
    onSuccess: () => {
      setFeedback("Preference updated.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to update preference"),
  });

  if (query.isLoading) return <LoadingState message="Loading preferences..." />;
  if (query.isError) {
    return (
      <ErrorState
        message="Failed to load notification preferences."
        onRetry={() => query.refetch()}
      />
    );
  }

  const prefs = (query.data ?? []) as NotificationPreference[];
  const byCategory = new Map(prefs.map((p) => [p.category, p]));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notification preferences"
        description="Choose which categories deliver in-app and email alerts."
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <div className="overflow-x-auto rounded-2xl border border-white/20 bg-white/40 dark:bg-white/5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/15 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">In-app</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_CATEGORIES.map((category) => {
              const pref = byCategory.get(category);
              const inApp = pref?.inAppEnabled ?? true;
              const email = pref?.emailEnabled ?? true;
              return (
                <tr key={category} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3">
                    <Badge variant="outline">{category}</Badge>
                  </td>
                  <td className="px-4 py-3">{inApp ? "On" : "Off"}</td>
                  <td className="px-4 py-3">{email ? "On" : "Off"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateMutation.isPending}
                        onClick={() =>
                          updateMutation.mutate({
                            category,
                            inAppEnabled: !inApp,
                            emailEnabled: email,
                          })
                        }
                      >
                        Toggle in-app
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updateMutation.isPending}
                        onClick={() =>
                          updateMutation.mutate({
                            category,
                            inAppEnabled: inApp,
                            emailEnabled: !email,
                          })
                        }
                      >
                        Toggle email
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
