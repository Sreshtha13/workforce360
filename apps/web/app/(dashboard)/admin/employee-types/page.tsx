"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatEmployeeType } from "@/lib/employee-type";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, ErrorState, LoadingState } from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
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
  code: string;
  description?: string;
  isActive: boolean;
  _count?: { users: number };
};

const emptyForm = { name: "", code: "", description: "" };

export default function EmployeeTypesPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [usersSheetTarget, setUsersSheetTarget] = useState<Row | null>(null);
  const [usersSearch, setUsersSearch] = useState("");
  const [assignUserId, setAssignUserId] = useState("");

  const canCreate = hasPermission("employee_type.create");
  const canUpdate = hasPermission("employee_type.update");
  const canDelete = hasPermission("employee_type.delete");
  const canReadUsers = hasPermission("user.read");
  const canAssignUsers = hasPermission("user.update");

  const query = useQuery({
    queryKey: ["employee-types"],
    queryFn: async () => (await apiClient.organization.employeeTypes.list()).data ?? [],
  });

  const usersQuery = useQuery({
    queryKey: ["employee-type-users", usersSheetTarget?.id],
    queryFn: async () => (await apiClient.users.list()).data ?? [],
    enabled: !!usersSheetTarget && canReadUsers,
  });

  const allUsers = (usersQuery.data ?? []) as User[];

  const assignedUsers = useMemo(() => {
    if (!usersSheetTarget) return [];
    const matched = allUsers.filter((u) => u.employeeType?.id === usersSheetTarget.id);
    const q = usersSearch.trim().toLowerCase();
    if (!q) return matched;
    return matched.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId ?? "").toLowerCase().includes(q),
    );
  }, [allUsers, usersSheetTarget, usersSearch]);

  const assignableUserOptions = useMemo(() => {
    if (!usersSheetTarget) return [];
    return allUsers
      .filter((u) => u.employeeType?.id !== usersSheetTarget.id)
      .map((u) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName}${u.employeeId ? ` (${u.employeeId})` : ""}`,
      }));
  }, [allUsers, usersSheetTarget]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
      };
      return editing
        ? apiClient.organization.employeeTypes.update(editing.id, payload)
        : apiClient.organization.employeeTypes.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-types"] });
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
    mutationFn: (id: string) => apiClient.organization.employeeTypes.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-types"] });
      setFeedback({ type: "success", message: "Deleted" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!usersSheetTarget || !assignUserId) throw new Error("Select a user");
      return apiClient.users.update(assignUserId, { employeeTypeId: usersSheetTarget.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-types"] });
      qc.invalidateQueries({ queryKey: ["employee-type-users"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      setAssignUserId("");
      setFeedback({ type: "success", message: "Employee type assigned" });
    },
    onError: (e) =>
      setFeedback({
        type: "error",
        message: e instanceof ApiClientError ? e.message : "Assign failed",
      }),
  });

  const openAssignedUsers = (row: Row) => {
    setUsersSheetTarget(row);
    setUsersSearch("");
    setAssignUserId("");
  };

  if (query.isLoading) return <LoadingState />;
  if (query.isError) {
    return <ErrorState message="Failed to load employee types" onRetry={() => query.refetch()} />;
  }
  const rows = (query.data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Employee Types"
        description="Contract nature such as Full Time, Part Time, Contract, or Intern — not workforce status (see Employment Statuses for Active, On Leave, Notice Period, etc.)."
        actionLabel={canCreate ? "Add Type" : undefined}
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
          title="No employee types"
          description="Create types that describe how someone is engaged (FT, PT, Contract, Intern)."
          actionLabel={canCreate ? "Create" : undefined}
          onAction={canCreate ? () => setOpen(true) : undefined}
        />
      ) : (
        <DataTable
          data={rows}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "employeeType",
              header: "Employee Type",
              render: (r) => formatEmployeeType(r),
            },
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
                          code: r.code,
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
                      onClick={() => confirm(`Delete ${formatEmployeeType(r)}?`) && del.mutate(r.id)}
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
        title={editing ? "Edit Employee Type" : "Create Employee Type"}
        description="Employee type is contract nature (FT/PT/Contract), not employment status."
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
          onChange={(v) => setForm({ ...form, code: v.toUpperCase() })}
          required
          helperText="Short unique code shown in tables and dropdowns (e.g. FT, PT)."
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
            <SheetTitle>Assigned employees</SheetTitle>
            <SheetDescription>
              Users with employee type &quot;
              {usersSheetTarget ? formatEmployeeType(usersSheetTarget) : ""}&quot;.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <SearchBar
              placeholder="Search assigned users..."
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
            />
            {canAssignUsers && (
              <div className="space-y-2 rounded-xl border border-white/15 p-3">
                <p className="text-sm font-medium">Quick assign</p>
                <FormSelect
                  label="User"
                  name="assignUserId"
                  value={assignUserId}
                  onChange={setAssignUserId}
                  options={assignableUserOptions}
                  placeholder="Select user to assign..."
                />
                <Button
                  size="sm"
                  disabled={!assignUserId || assignMutation.isPending || usersQuery.isLoading}
                  onClick={() => assignMutation.mutate()}
                >
                  {assignMutation.isPending ? "Assigning..." : "Assign type"}
                </Button>
              </div>
            )}
            {usersQuery.isLoading ? (
              <LoadingState message="Loading users..." />
            ) : usersQuery.isError ? (
              <ErrorState message="Failed to load users" onRetry={() => usersQuery.refetch()} />
            ) : assignedUsers.length === 0 ? (
              <EmptyState
                title="No users assigned"
                description="Use quick assign above or set employee type from User Management."
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
