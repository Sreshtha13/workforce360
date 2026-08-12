"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { SystemSetting } from "@/types/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { GlassCard } from "@/components/dashboard/glass-card";
import { Button } from "@/components/ui/button";

export default function SystemSettingsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission("settings.manage");

  const listQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await apiClient.settings.list()).data ?? [],
    enabled: canManage,
  });

  useEffect(() => {
    if (listQuery.data) {
      const next: Record<string, string> = {};
      for (const row of listQuery.data) {
        next[row.key] = row.value;
      }
      setDraft(next);
    }
  }, [listQuery.data]);

  const byCategory = useMemo(() => {
    const map = new Map<string, SystemSetting[]>();
    for (const row of listQuery.data ?? []) {
      const cat = row.category || "general";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(row);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [listQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const settings = (listQuery.data ?? []).map((row) => ({
        key: row.key,
        value: draft[row.key] ?? row.value,
        category: row.category,
        description: row.description ?? undefined,
        isSecret: row.isSecret,
      }));
      return apiClient.settings.upsert({ settings });
    },
    onSuccess: () => {
      setFeedback("Settings saved.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to save settings"),
  });

  if (!canManage) {
    return <ErrorState message="You do not have permission to manage system settings." />;
  }
  if (listQuery.isLoading) return <LoadingState message="Loading settings..." />;
  if (listQuery.isError) {
    return (
      <ErrorState message="Failed to load settings." onRetry={() => listQuery.refetch()} />
    );
  }

  const items = listQuery.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System settings"
        description="Organization-wide configuration grouped by category."
        actionLabel={items.length ? "Save changes" : undefined}
        onAction={items.length ? () => saveMutation.mutate() : undefined}
      />

      <p className="text-sm text-muted-foreground">
        Need workflows? Open the{" "}
        <Link
          href="/admin/approval-workflows"
          className="font-medium text-brand-700 hover:underline dark:text-brand-300"
        >
          Workflow Builder
        </Link>
        .
      </p>

      {feedback && (
        <AlertBanner variant="success" message={feedback} onDismiss={() => setFeedback(null)} />
      )}
      {error && (
        <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No settings seeded"
          description="Run API seeds to populate default system settings."
        />
      ) : (
        <div className="space-y-6">
          {byCategory.map(([category, rows]) => (
            <GlassCard key={category}>
              <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
                <h2 className="text-lg font-semibold capitalize tracking-tight">{category}</h2>
              </div>
              <div className="space-y-4 p-6">
                {rows.map((row) =>
                  (row.value?.length ?? 0) > 80 || row.key.includes("html") ? (
                    <FormTextarea
                      key={row.id}
                      label={row.key}
                      name={row.key}
                      value={draft[row.key] ?? ""}
                      onChange={(v) => setDraft((d) => ({ ...d, [row.key]: v }))}
                      helperText={row.description ?? undefined}
                      disabled={row.isSecret && row.value === "********"}
                    />
                  ) : (
                    <FormField
                      key={row.id}
                      label={row.key}
                      name={row.key}
                      type={row.isSecret ? "password" : "text"}
                      value={draft[row.key] ?? ""}
                      onChange={(v) => setDraft((d) => ({ ...d, [row.key]: v }))}
                      helperText={row.description ?? undefined}
                      disabled={row.isSecret && row.value === "********"}
                    />
                  ),
                )}
              </div>
            </GlassCard>
          ))}
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
