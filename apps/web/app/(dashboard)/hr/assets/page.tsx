"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Asset } from "@/types/phase2";

export default function HrAssetsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", tag: "", category: "", serialNumber: "", notes: "" });

  const query = useQuery({
    queryKey: ["hr", "assets"],
    queryFn: async () => {
      const res = await apiClient.hr.listAssets();
      return res.data ?? [];
    },
  });

  const employeesQuery = useQuery({
    queryKey: ["hr", "employees", "all"],
    queryFn: async () => {
      const res = await apiClient.hr.listEmployees();
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.hr.createAsset(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "assets"] });
      setCreateOpen(false);
      setForm({ name: "", tag: "", category: "", serialNumber: "", notes: "" });
      setFeedback("Asset created.");
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to create asset");
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => apiClient.hr.assignAsset(selectedAssetId, assignEmployeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "assets"] });
      setAssignOpen(false);
      setFeedback("Asset assigned.");
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to assign asset");
    },
  });

  if (query.isLoading) return <LoadingState message="Loading assets..." />;
  if (query.isError) return <ErrorState message="Failed to load assets." />;

  const assets = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Asset management"
        description="Track and assign company assets to employees."
        actionLabel={hasPermission("asset.create") ? "Add asset" : undefined}
        onAction={hasPermission("asset.create") ? () => setCreateOpen(true) : undefined}
      >
        {hasPermission("asset.update") && (
          <Button variant="outline" onClick={() => setAssignOpen(true)}>
            Assign asset
          </Button>
        )}
      </AdminPageHeader>

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <div className="space-y-3">
        {assets.map((asset: Asset) => (
          <div key={asset.id} className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{asset.name}</p>
                <p className="text-sm text-muted-foreground">{asset.tag}</p>
              </div>
              <Badge variant="secondary">{asset.status}</Badge>
            </div>
          </div>
        ))}
      </div>

      <FormSheet open={createOpen} onOpenChange={setCreateOpen} title="Create asset" onSubmit={() => createMutation.mutate()} loading={createMutation.isPending}>
        <FormField name="name" label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <FormField name="tag" label="Asset tag" value={form.tag} onChange={(v) => setForm({ ...form, tag: v })} required />
        <FormField name="category" label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        <FormField name="serialNumber" label="Serial number" value={form.serialNumber} onChange={(v) => setForm({ ...form, serialNumber: v })} />
        <FormTextarea name="notes" label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
      </FormSheet>

      <FormSheet open={assignOpen} onOpenChange={setAssignOpen} title="Assign asset" onSubmit={() => assignMutation.mutate()} loading={assignMutation.isPending}>
        <div className="space-y-2">
          <Label htmlFor="assetId">Asset</Label>
          <select
            id="assetId"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
          >
            <option value="">Select asset</option>
            {assets.filter((a) => a.status === "AVAILABLE").map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee</Label>
          <select
            id="employeeId"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={assignEmployeeId}
            onChange={(e) => setAssignEmployeeId(e.target.value)}
          >
            <option value="">Select employee</option>
            {(employeesQuery.data ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.user?.firstName} {e.user?.lastName} ({e.employeeCode})
              </option>
            ))}
          </select>
        </div>
      </FormSheet>
    </div>
  );
}
