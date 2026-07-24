"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { uploadFileViaPresign } from "@/lib/upload";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, AlertBanner } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HrPoliciesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", description: "", version: "1.0" });

  const query = useQuery({
    queryKey: ["hr", "policies"],
    queryFn: async () => {
      const res = await apiClient.hr.listPolicies();
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let fileId: string | undefined;
      if (file) {
        const uploaded = await uploadFileViaPresign(file, "POLICY");
        fileId = uploaded.id;
      }
      return apiClient.hr.createPolicy({ ...form, fileId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "policies"] });
      setSheetOpen(false);
      setFile(null);
      setForm({ title: "", description: "", version: "1.0" });
      setFeedback("Policy created.");
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to create policy");
    },
  });

  if (query.isLoading) return <LoadingState message="Loading policies..." />;
  if (query.isError) return <ErrorState message="Failed to load policies." />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Policy management"
        description="Upload and publish company policies."
        actionLabel={hasPermission("policy.create") ? "New policy" : undefined}
        onAction={hasPermission("policy.create") ? () => setSheetOpen(true) : undefined}
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <div className="space-y-3">
        {(query.data ?? []).map((policy) => (
          <div key={policy.id} className="flex items-center justify-between rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
            <div>
              <p className="font-medium">{policy.title}</p>
              <p className="text-sm text-muted-foreground">
                v{policy.version}
                {policy.file && ` · ${policy.file.originalName}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{policy.status}</Badge>
              {hasPermission("policy.update") && policy.status !== "PUBLISHED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    apiClient.hr.publishPolicy(policy.id).then(() => {
                      query.refetch();
                      setFeedback("Policy published.");
                    })
                  }
                >
                  Publish
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Create policy"
        onSubmit={() => createMutation.mutate()}
        loading={createMutation.isPending}
        submitLabel="Create"
      >
        <FormField name="title" label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <FormField name="version" label="Version" value={form.version} onChange={(v) => setForm({ ...form, version: v })} />
        <FormTextarea name="description" label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <div className="space-y-2">
          <Label htmlFor="policyFile">Policy document (optional)</Label>
          <Input id="policyFile" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </FormSheet>
    </div>
  );
}
