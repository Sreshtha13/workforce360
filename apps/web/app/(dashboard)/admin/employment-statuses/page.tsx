"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, ErrorState, LoadingState } from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormTextarea } from "@/components/admin/form-fields";
import { SearchBar } from "@/components/design-system/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { glass } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { User } from "@/types/entities";

type Row = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  _count?: { users: number };
};

const emptyForm = { name: "", code: "", description: "" };

export default function EmploymentStatusesPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [usersSheetTarget, setUsersSheetTarget] = useState<Row | null>(null);
  const [usersSearch, setUsersSearch] = useState("");

  const canCreate = hasPermission("employment_status.create");
  const canUpdate = hasPermission("employment_status.update");
  const canDelete = hasPermission("employment_status.delete");
  const canReadUsers = hasPermission("user.read");
  const canView =
    hasPermission("employment_status.read") || canCreate || canUpdate || canDelete;

  const query = useQuery({
    queryKey: ["employment-statuses"],
    queryFn: async () => (await apiClient.organization.employmentStatuses.list()).data ?? [],
    enabled: canView,
  });

  const usersQuery = useQuery({
    queryKey: ["employment-status-users", usersSheetTarget?.id],
    queryFn: async () => (await apiClient.users.list()).data ?? [],
    enabled: !!usersSheetTarget && canReadUsers && canView,
  });

  const assignedUsers = useMemo(() => {
    if (!usersSheetTarget) return [];
    const users = (usersQuery.data ?? []) as User[];
    const matched = users.filter((u) => u.employmentStatus?.id === usersSheetTarget.id);
    const q = usersSearch.trim().toLowerCase();
    if (!q) return matched;
    return matched.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId ?? "").toLowerCase().includes(q),
    );
  }, [usersQuery.data, usersSheetTarget, usersSearch]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        code: form.code || undefined,
        description: form.description || undefined,
      };
      return editing
        ? apiClient.organization.employmentStatuses.update(editing.id, payload)
        : apiClient.organization.employmentStatuses.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employment-statuses"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback({ type: "success", message: "Saved" });
    },
    onError: (e) =>
      setFeedback({
        type: "error",
        message: e instanceof ApiClientError ? e.message : "Save failed",
      }),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiClient.organization.employmentStatuses.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employment-statuses"] });
      setFeedback({ type: "success", message: "Deleted" });
    },
  });

  const openAssignedUsers = (row: Row) => {
    setUsersSheetTarget(row);
    setUsersSearch("");
  };

  if (!canView) {
    return <ErrorState message="You do not have permission to view employment statuses." />;
  }
  if (query.isLoading) return <LoadingState />;
  if (query.isError) {
    return (
      <ErrorState message="Failed to load employment statuses" onRetry={() => query.refetch()} />
    );
  }
  const rows = (query.data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Employment Statuses"
        description="Workforce status such as Active, On Probation, On Leave, Notice Period, Suspended, or Terminated — not contract type (see Employee Types for Full Time, Part Time, Contract, Intern)."
        actionLabel={canCreate ? "Add Employment Status" : undefined}
        onAction={
          canCreate
            ? () => {
                setEditing(null);
                setForm(emptyForm);
                setOpen(true);
              }
            : undefined
        }
      />
      {feedback && (
        <AlertBanner
          variant={feedback.type === "error" ? "error" : "success"}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}
      {rows.length === 0 ? (
        <EmptyState
          title="No employment statuses"
          description="Create statuses that reflect where someone is in the workforce lifecycle."
          actionLabel={canCreate ? "Create" : undefined}
          onAction={canCreate ? () => setOpen(true) : undefined}
        />
      ) : (
        <DataTable
          data={rows}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "code", header: "Code", render: (r) => r.code ?? "—" },
            {
              key: "users",
              header: "Users",
              render: (r) => (
                <button
                  type="button"
                  className="text-sm font-medium underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
                  disabled={!canReadUsers}
                  onClick={() => openAssignedUsers(r)}
                  title={canReadUsers ? "View assigned users" : "Requires user.read permission"}
                >
                  {r._count?.users ?? 0}
                </button>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <Badge variant={r.isActive ? "success" : "warning"}>
                  {r.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (r) => (
                <div className="flex justify-end gap-2">
                  {canReadUsers && (
                    <Button variant="outline" size="sm" onClick={() => openAssignedUsers(r)}>
                      View users
                    </Button>
                  )}
                  {canUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(r);
                        setForm({
                          name: r.name,
                          code: r.code ?? "",
                          description: r.description ?? "",
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirm(`Delete ${r.name}?`) && del.mutate(r.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
      <FormSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Employment Status" : "Create Employment Status"}
        description="Employment status is workforce state (Active, On Leave, etc.), not contract nature."
        onSubmit={() => save.mutate()}
        loading={save.isPending}
      >
        <FormField
          label="Name"
          name="name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <FormField
          label="Code"
          name="code"
          value={form.code}
          onChange={(v) => setForm({ ...form, code: v })}
        />
        <FormTextarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
      </FormSheet>

      <Sheet
        open={!!usersSheetTarget}
        onOpenChange={(next) => {
          if (!next) setUsersSheetTarget(null);
        }}
      >
        <SheetContent side="right" className={cn(glass.nav, "w-full border-l-0 sm:max-w-lg")}>
          <SheetHeader className="border-b border-white/10 pb-4 dark:border-white/5">
            <SheetTitle>Assigned users</SheetTitle>
            <SheetDescription>
              Users with employment status &quot;{usersSheetTarget?.name}&quot;. Filtered
              client-side (users.list has no employmentStatusId filter).
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <SearchBar
              placeholder="Search assigned users..."
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
            />
            {usersQuery.isLoading ? (
              <LoadingState message="Loading users..." />
            ) : usersQuery.isError ? (
              <ErrorState message="Failed to load users" onRetry={() => usersQuery.refetch()} />
            ) : assignedUsers.length === 0 ? (
              <EmptyState
                title="No users assigned"
                description="Assign this status from User Management."
              />
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-white/15">
                {assignedUsers.map((u) => (
                  <li key={u.id} className="px-3 py-2.5 text-sm">
                    <p className="font-medium">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.email}
                      {u.employeeId ? ` · ${u.employeeId}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
