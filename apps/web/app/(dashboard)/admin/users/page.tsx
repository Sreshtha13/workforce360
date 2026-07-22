"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CreateUserInput,
  Department,
  Designation,
  EmployeeType,
  EmploymentStatus,
  Office,
  Role,
  UpdateUserInput,
  User,
} from "@/types/entities";

type UserRow = User;
type UserStatus = NonNullable<UpdateUserInput["status"]>;

const emptyForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  employeeId: "",
  status: "active" as UserStatus,
  departmentId: "",
  designationId: "",
  officeId: "",
  employeeTypeId: "",
  employmentStatusId: "",
};

export default function UsersAdminPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canCreate = hasPermission("user.create");
  const canUpdate = hasPermission("user.update");
  const canDelete = hasPermission("user.delete");
  const canAssignRole = hasPermission("user.assign_role");

  const usersQuery = useQuery({
    queryKey: ["users", search],
    queryFn: async () => {
      const res = await apiClient.users.list(search ? { search } : undefined);
      return res.data ?? [];
    },
  });

  const lookupsQuery = useQuery({
    queryKey: ["user-form-lookups"],
    queryFn: async () => {
      const [departments, designations, offices, employeeTypes, statuses, roles] =
        await Promise.all([
          apiClient.organization.departments.list(),
          apiClient.organization.designations.list(),
          apiClient.organization.offices.list(),
          apiClient.organization.employeeTypes.list(),
          apiClient.organization.employmentStatuses.list(),
          apiClient.roles.list(),
        ]);
      return {
        departments: departments.data ?? [],
        designations: designations.data ?? [],
        offices: offices.data ?? [],
        employeeTypes: employeeTypes.data ?? [],
        statuses: statuses.data ?? [],
        roles: roles.data ?? [],
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateUserInput & UpdateUserInput = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        employeeId: form.employeeId || undefined,
        status: form.status,
        departmentId: form.departmentId || undefined,
        designationId: form.designationId || undefined,
        officeId: form.officeId || undefined,
        employeeTypeId: form.employeeTypeId || undefined,
        employmentStatusId: form.employmentStatusId || undefined,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editing) {
        return apiClient.users.update(editing.id, payload);
      }
      if (!form.password) {
        throw new Error("Password is required for new users");
      }
      return apiClient.users.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSheetOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback({ type: "success", message: editing ? "User updated" : "User created" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Save failed",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFeedback({ type: "success", message: "User deleted" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Delete failed",
      });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async () => {
      if (!roleTarget || !selectedRoleId) throw new Error("Select a role");
      return apiClient.users.assignRole(roleTarget.id, selectedRoleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setRoleSheetOpen(false);
      setRoleTarget(null);
      setSelectedRoleId("");
      setFeedback({ type: "success", message: "Role assigned" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Assign role failed",
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiClient.users.removeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFeedback({ type: "success", message: "Role removed" });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err instanceof ApiClientError ? err.message : "Remove role failed",
      });
    },
  });

  const lookupOptions = useMemo(() => {
    const l = lookupsQuery.data;
    if (!l) return null;
    return {
      departments: l.departments.map((d: Department) => ({ value: d.id, label: d.name })),
      designations: l.designations.map((d: Designation) => ({ value: d.id, label: d.name })),
      offices: l.offices.map((o: Office) => ({ value: o.id, label: o.name })),
      employeeTypes: l.employeeTypes.map((t: EmployeeType) => ({ value: t.id, label: t.name })),
      statuses: l.statuses.map((s: EmploymentStatus) => ({ value: s.id, label: s.name })),
      roles: l.roles.map((r: Role) => ({ value: r.id, label: r.name })),
    };
  }, [lookupsQuery.data]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setEditing(user);
    setForm({
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      employeeId: user.employeeId ?? "",
      status: user.status,
      departmentId: user.department?.id ?? "",
      designationId: user.designation?.id ?? "",
      officeId: "",
      employeeTypeId: "",
      employmentStatusId: "",
    });
    setSheetOpen(true);
  };

  const openAssignRole = (user: UserRow) => {
    setRoleTarget(user);
    setSelectedRoleId("");
    setRoleSheetOpen(true);
  };

  if (usersQuery.isLoading) return <LoadingState message="Loading users..." />;
  if (usersQuery.isError) {
    return (
      <ErrorState
        message={
          usersQuery.error instanceof Error
            ? usersQuery.error.message
            : "Failed to load users"
        }
        onRetry={() => usersQuery.refetch()}
      />
    );
  }

  const users = (usersQuery.data ?? []) as UserRow[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Create users, manage status, and assign roles."
        actionLabel={canCreate ? "Add User" : undefined}
        onAction={canCreate ? openCreate : undefined}
      >
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
      </AdminPageHeader>

      {feedback && (
        <AlertBanner
          variant={feedback.type === "error" ? "error" : "success"}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Create your first user or adjust your search."
          actionLabel={canCreate ? "Add User" : undefined}
          onAction={canCreate ? openCreate : undefined}
        />
      ) : (
        <DataTable
          data={users}
          rowKey={(u) => u.id}
          columns={[
            {
              key: "name",
              header: "User",
              render: (u) => (
                <div>
                  <p className="font-medium">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              ),
            },
            {
              key: "employeeId",
              header: "Employee ID",
              render: (u) => u.employeeId ?? "—",
            },
            {
              key: "department",
              header: "Department",
              render: (u) => u.department?.name ?? "—",
            },
            {
              key: "roles",
              header: "Roles",
              render: (u) => (
                <div className="flex flex-wrap gap-1">
                  {u.userRoles?.length
                    ? u.userRoles.map((ur) => (
                        <Badge key={ur.role.id} variant="secondary">
                          {ur.role.name}
                        </Badge>
                      ))
                    : "—"}
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (u) => (
                <Badge
                  variant={
                    u.status === "active"
                      ? "success"
                      : u.status === "suspended"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {u.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (u) => (
                <div className="flex justify-end gap-2">
                  {canAssignRole && (
                    <Button variant="outline" size="sm" onClick={() => openAssignRole(u)}>
                      Roles
                    </Button>
                  )}
                  {canUpdate && (
                    <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete ${u.firstName} ${u.lastName}?`)) {
                          deleteMutation.mutate(u.id);
                        }
                      }}
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
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit User" : "Create User"}
        description="User data is saved via the backend API only."
        onSubmit={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
      >
        <FormField label="Email" name="email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required disabled={!!editing} />
        {!editing && (
          <FormField label="Password" name="password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
        )}
        {editing && (
          <FormField label="New Password (optional)" name="password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" name="firstName" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
          <FormField label="Last name" name="lastName" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
        </div>
        <FormField label="Phone" name="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <FormField label="Employee ID" name="employeeId" value={form.employeeId} onChange={(v) => setForm({ ...form, employeeId: v })} />
        <FormSelect label="Status" name="status" value={form.status} onChange={(v) => setForm({ ...form, status: v as UserStatus })} options={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "suspended", label: "Suspended" },
        ]} />
        {lookupOptions && (
          <>
            <FormSelect label="Department" name="departmentId" value={form.departmentId} onChange={(v) => setForm({ ...form, departmentId: v })} options={lookupOptions.departments} />
            <FormSelect label="Designation" name="designationId" value={form.designationId} onChange={(v) => setForm({ ...form, designationId: v })} options={lookupOptions.designations} />
            <FormSelect label="Office" name="officeId" value={form.officeId} onChange={(v) => setForm({ ...form, officeId: v })} options={lookupOptions.offices} />
            <FormSelect label="Employee type" name="employeeTypeId" value={form.employeeTypeId} onChange={(v) => setForm({ ...form, employeeTypeId: v })} options={lookupOptions.employeeTypes} />
            <FormSelect label="Employment status" name="employmentStatusId" value={form.employmentStatusId} onChange={(v) => setForm({ ...form, employmentStatusId: v })} options={lookupOptions.statuses} />
          </>
        )}
      </FormSheet>

      <FormSheet
        open={roleSheetOpen}
        onOpenChange={setRoleSheetOpen}
        title="Assign Role"
        description={roleTarget ? `${roleTarget.firstName} ${roleTarget.lastName}` : undefined}
        onSubmit={() => assignRoleMutation.mutate()}
        loading={assignRoleMutation.isPending}
        submitLabel="Assign Role"
      >
        {roleTarget && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Current roles</p>
              <div className="flex flex-wrap gap-2">
                {roleTarget.userRoles?.length ? (
                  roleTarget.userRoles.map((ur) => (
                    <Badge key={ur.role.id} variant="secondary" className="gap-2">
                      {ur.role.name}
                      {canAssignRole && (
                        <button
                          type="button"
                          className="text-xs underline"
                          onClick={() =>
                            removeRoleMutation.mutate({
                              userId: roleTarget.id,
                              roleId: ur.role.id,
                            })
                          }
                        >
                          remove
                        </button>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
              </div>
            </div>
            {lookupOptions && (
              <FormSelect
                label="Add role"
                name="roleId"
                value={selectedRoleId}
                onChange={setSelectedRoleId}
                options={lookupOptions.roles}
                required
              />
            )}
          </div>
        )}
      </FormSheet>
    </div>
  );
}
