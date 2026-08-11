"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { DEFAULT_COMPANY_ID } from "@/lib/constants";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, ErrorState, LoadingState } from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField } from "@/components/admin/form-fields";
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
  city?: string;
  country?: string;
  type?: string;
  isActive: boolean;
  _count?: { users: number };
};

const emptyForm = {
  name: "",
  code: "",
  type: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  phone: "",
  email: "",
};

export default function OfficesPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [assignTarget, setAssignTarget] = useState<Row | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const canCreate = hasPermission("office.create");
  const canUpdate = hasPermission("office.update");
  const canDelete = hasPermission("office.delete");
  const canReadUsers = hasPermission("user.read");
  const canAssignUsers = hasPermission("user.update");
  const canView = hasPermission("office.read") || canCreate || canUpdate || canDelete;

  const query = useQuery({
    queryKey: ["offices"],
    queryFn: async () => (await apiClient.organization.offices.list()).data ?? [],
    enabled: canView,
  });

  const usersQuery = useQuery({
    queryKey: ["office-assign-users", assignTarget?.id],
    queryFn: async () => (await apiClient.users.list()).data ?? [],
    enabled: !!assignTarget && canReadUsers && canView,
  });

  const allUsers = (usersQuery.data ?? []) as User[];

  const assignedUsers = useMemo(() => {
    if (!assignTarget) return [];
    return allUsers.filter((u) => u.office?.id === assignTarget.id);
  }, [allUsers, assignTarget]);

  const searchableUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId ?? "").toLowerCase().includes(q),
    );
  }, [allUsers, userSearch]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        companyId: DEFAULT_COMPANY_ID,
        ...form,
        code: form.code || undefined,
        type: form.type || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        postalCode: form.postalCode || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
      };
      return editing
        ? apiClient.organization.offices.update(editing.id, payload)
        : apiClient.organization.offices.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offices"] });
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
    mutationFn: (id: string) => apiClient.organization.offices.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offices"] });
      setFeedback({ type: "success", message: "Deleted" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!assignTarget || selectedUserIds.length === 0) {
        throw new Error("Select at least one user");
      }
      await Promise.all(
        selectedUserIds.map((userId) =>
          apiClient.users.update(userId, { officeId: assignTarget.id }),
        ),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offices"] });
      qc.invalidateQueries({ queryKey: ["office-assign-users"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      setSelectedUserIds([]);
      setFeedback({ type: "success", message: "Users assigned to office" });
    },
    onError: (e) =>
      setFeedback({
        type: "error",
        message: e instanceof ApiClientError ? e.message : "Assign failed",
      }),
  });

  const openAssign = (row: Row) => {
    setAssignTarget(row);
    setUserSearch("");
    setSelectedUserIds([]);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  if (!canView) {
    return <ErrorState message="You do not have permission to view offices." />;
  }
  if (query.isLoading) return <LoadingState />;
  if (query.isError) {
    return <ErrorState message="Failed to load offices" onRetry={() => query.refetch()} />;
  }
  const rows = (query.data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Offices & Branches"
        description="Office locations for your organization. Assign users to an office from the table actions."
        actionLabel={canCreate ? "Add Office" : undefined}
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
          title="No offices"
          actionLabel={canCreate ? "Create Office" : undefined}
          onAction={canCreate ? () => setOpen(true) : undefined}
        />
      ) : (
        <DataTable
          data={rows}
          rowKey={(r) => r.id}
          columns={[
            { key: "name", header: "Office", render: (r) => r.name },
            { key: "type", header: "Type", render: (r) => r.type ?? "—" },
            {
              key: "location",
              header: "Location",
              render: (r) => [r.city, r.country].filter(Boolean).join(", ") || "—",
            },
            {
              key: "users",
              header: "Users",
              render: (r) => (
                <button
                  type="button"
                  className="text-sm font-medium underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
                  disabled={!canReadUsers && !canAssignUsers}
                  onClick={() => openAssign(r)}
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
                  {(canReadUsers || canAssignUsers) && (
                    <Button variant="outline" size="sm" onClick={() => openAssign(r)}>
                      Assign users
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
                          type: r.type ?? "",
                          address: "",
                          city: r.city ?? "",
                          state: "",
                          country: r.country ?? "",
                          postalCode: "",
                          phone: "",
                          email: "",
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
        title={editing ? "Edit Office" : "Create Office"}
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
        <FormField
          label="Type"
          name="type"
          value={form.type}
          onChange={(v) => setForm({ ...form, type: v })}
          placeholder="headquarters, branch..."
        />
        <FormField
          label="Address"
          name="address"
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="City"
            name="city"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
          />
          <FormField
            label="State"
            name="state"
            value={form.state}
            onChange={(v) => setForm({ ...form, state: v })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Country"
            name="country"
            value={form.country}
            onChange={(v) => setForm({ ...form, country: v })}
          />
          <FormField
            label="Postal code"
            name="postalCode"
            value={form.postalCode}
            onChange={(v) => setForm({ ...form, postalCode: v })}
          />
        </div>
        <FormField
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />
      </FormSheet>

      <Sheet
        open={!!assignTarget}
        onOpenChange={(next) => {
          if (!next) setAssignTarget(null);
        }}
      >
        <SheetContent side="right" className={cn(glass.nav, "w-full border-l-0 sm:max-w-lg")}>
          <SheetHeader className="border-b border-white/10 pb-4 dark:border-white/5">
            <SheetTitle>Assign users — {assignTarget?.name}</SheetTitle>
            <SheetDescription>
              Currently assigned: {assignedUsers.length}. Select users below and assign via
              users.update (officeId). List is filtered client-side.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            {assignedUsers.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Currently assigned</p>
                <ul className="mb-4 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/15 p-2 text-sm">
                  {assignedUsers.map((u) => (
                    <li key={u.id}>
                      {u.firstName} {u.lastName}
                      <span className="text-xs text-muted-foreground"> · {u.email}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <SearchBar
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />

            {usersQuery.isLoading ? (
              <LoadingState message="Loading users..." />
            ) : usersQuery.isError ? (
              <ErrorState message="Failed to load users" onRetry={() => usersQuery.refetch()} />
            ) : searchableUsers.length === 0 ? (
              <EmptyState title="No users found" />
            ) : (
              <ul className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-white/15 p-2">
                {searchableUsers.map((u) => {
                  const alreadyAssigned = u.office?.id === assignTarget?.id;
                  const checked = selectedUserIds.includes(u.id) || alreadyAssigned;
                  return (
                    <li key={u.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white/10",
                          alreadyAssigned && "opacity-70",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border border-input"
                          checked={checked}
                          disabled={alreadyAssigned || !canAssignUsers}
                          onChange={() => toggleUser(u.id)}
                        />
                        <span>
                          <span className="font-medium">
                            {u.firstName} {u.lastName}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {u.email}
                            {alreadyAssigned ? " · already assigned" : ""}
                            {u.office && !alreadyAssigned ? ` · ${u.office.name}` : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            {canAssignUsers && (
              <Button
                className="w-full"
                disabled={selectedUserIds.length === 0 || assignMutation.isPending}
                onClick={() => assignMutation.mutate()}
              >
                {assignMutation.isPending
                  ? "Assigning..."
                  : `Assign ${selectedUserIds.length || ""} user${selectedUserIds.length === 1 ? "" : "s"}`.trim()}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
