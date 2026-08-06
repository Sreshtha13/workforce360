"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { SearchBar } from "@/components/design-system/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/types/phase2";

function employeeLabel(e: {
  employeeCode: string;
  user?: {
    firstName?: string;
    lastName?: string;
    department?: { name: string } | null;
    designation?: { name: string } | null;
  } | null;
}): string {
  const name = `${e.user?.firstName ?? ""} ${e.user?.lastName ?? ""}`.trim() || "Unknown";
  const dept = e.user?.department?.name ?? "No dept";
  const designation = e.user?.designation?.name ?? "No designation";
  return `${name} — ${e.employeeCode} — ${dept} — ${designation}`;
}

export default function HrAssetsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    tag: "",
    category: "",
    serialNumber: "",
    notes: "",
  });

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
    enabled: assignOpen,
  });

  const filteredEmployees = useMemo(() => {
    const employees = employeesQuery.data ?? [];
    const q = employeeFilter.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const haystack = [
        e.user?.firstName,
        e.user?.lastName,
        e.employeeCode,
        e.user?.department?.name,
        e.user?.designation?.name,
        e.user?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [employeesQuery.data, employeeFilter]);

  const createMutation = useMutation({
    mutationFn: () => apiClient.hr.createAsset(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "assets"] });
      setCreateOpen(false);
      setForm({ name: "", tag: "", category: "", serialNumber: "", notes: "" });
      setFeedback("Asset created.");
      setError(null);
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
      setSelectedAssetId("");
      setAssignEmployeeId("");
      setEmployeeFilter("");
      setFeedback("Asset assigned.");
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Failed to assign asset");
    },
  });

  if (query.isLoading) return <LoadingState message="Loading assets..." />;
  if (query.isError) {
    return <ErrorState message="Failed to load assets." onRetry={() => query.refetch()} />;
  }

  const assets = query.data ?? [];
  const availableAssets = assets.filter((a) => a.status === "AVAILABLE");

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

      {feedback && (
        <AlertBanner
          variant="success"
          message={feedback}
          onDismiss={() => setFeedback(null)}
        />
      )}
      {error && (
        <AlertBanner variant="error" message={error} onDismiss={() => setError(null)} />
      )}

      {assets.length === 0 ? (
        <EmptyState
          title="No assets yet"
          description="Add company assets to track assignment and inventory."
          actionLabel={hasPermission("asset.create") ? "Add asset" : undefined}
          onAction={hasPermission("asset.create") ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {assets.map((asset: Asset) => {
            const assignee = asset.employee;
            const assigneeName = assignee
              ? `${assignee.user?.firstName ?? ""} ${assignee.user?.lastName ?? ""}`.trim()
              : null;

            return (
              <div
                key={asset.id}
                className="rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">{asset.tag}</p>
                    {assigneeName ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Assigned to {assigneeName}
                        {assignee?.employeeCode ? ` (${assignee.employeeCode})` : ""}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Unassigned</p>
                    )}
                  </div>
                  <Badge variant="secondary">{asset.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create asset"
        onSubmit={() => createMutation.mutate()}
        loading={createMutation.isPending}
      >
        <FormField
          name="name"
          label="Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <FormField
          name="tag"
          label="Asset tag"
          value={form.tag}
          onChange={(v) => setForm({ ...form, tag: v })}
          required
        />
        <FormField
          name="category"
          label="Category"
          value={form.category}
          onChange={(v) => setForm({ ...form, category: v })}
        />
        <FormField
          name="serialNumber"
          label="Serial number"
          value={form.serialNumber}
          onChange={(v) => setForm({ ...form, serialNumber: v })}
        />
        <FormTextarea
          name="notes"
          label="Notes"
          value={form.notes}
          onChange={(v) => setForm({ ...form, notes: v })}
        />
      </FormSheet>

      <FormSheet
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) {
            setEmployeeFilter("");
            setSelectedAssetId("");
            setAssignEmployeeId("");
          }
        }}
        title="Assign asset"
        onSubmit={() => {
          if (!selectedAssetId || !assignEmployeeId) {
            setError("Select both an asset and an employee.");
            return;
          }
          assignMutation.mutate();
        }}
        loading={assignMutation.isPending}
      >
        <FormSelect
          name="assetId"
          label="Asset"
          value={selectedAssetId}
          onChange={setSelectedAssetId}
          options={availableAssets.map((a) => ({
            value: a.id,
            label: `${a.name} (${a.tag})`,
          }))}
          placeholder={
            availableAssets.length === 0 ? "No available assets" : "Select asset"
          }
          required
        />
        <SearchBar
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          placeholder="Filter employees..."
        />
        <FormSelect
          name="employeeId"
          label="Employee"
          value={assignEmployeeId}
          onChange={setAssignEmployeeId}
          options={filteredEmployees.map((e) => ({
            value: e.id,
            label: employeeLabel(e),
          }))}
          placeholder={
            employeesQuery.isLoading
              ? "Loading employees..."
              : filteredEmployees.length === 0
                ? "No matching employees"
                : "Select employee"
          }
          required
        />
      </FormSheet>
    </div>
  );
}
