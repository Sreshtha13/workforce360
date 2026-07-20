"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  getApiErrorMessage,
  parseApiFieldErrors,
  scrollToFirstFieldError,
} from "@/lib/form-validation";
import {
  ACCOUNT_STATUS_HELPER,
  accountStatusBadgeVariant,
  EMPLOYMENT_STATUS_HELPER,
  USER_ACCOUNT_STATUSES,
  USER_ACCOUNT_STATUS_LABELS,
} from "@/lib/user-status";
import { validateUserForm, type UserFormValues } from "@/lib/user-form-validation";
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
import { useToast } from "@/components/providers/toast-provider";
import { SearchBar } from "@/components/design-system/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  employeeId?: string;
  department?: { id: string; name: string; managerId?: string | null };
  designation?: { id: string; name: string };
  office?: { id: string; name: string };
  employeeType?: { id: string; name: string };
  employmentStatus?: { id: string; name: string };
  manager?: { id: string; firstName: string; lastName: string; email: string };
  managedDepartments?: { id: string; name: string }[];
  userRoles: { role: { id: string; name: string } }[];
};

type LookupOption = { value: string; label: string };

const emptyForm: UserFormValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  employeeId: "",
  status: "active",
  departmentId: "",
  designationId: "",
  officeId: "",
  employeeTypeId: "",
  employmentStatusId: "",
};

export default function UsersAdminPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [form, setForm] = useState<UserFormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loadingEmployeeId, setLoadingEmployeeId] = useState(false);

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
      const [departments, designations, offices, employeeTypes, employmentStatuses, roles] =
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
        employmentStatuses: employmentStatuses.data ?? [],
        roles: roles.data ?? [],
      };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        employeeId: form.employeeId.trim() || undefined,
        status: form.status,
        departmentId: form.departmentId || undefined,
        designationId: form.designationId || undefined,
        officeId: form.officeId || undefined,
        employeeTypeId: form.employeeTypeId || undefined,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editing) {
        payload.employmentStatusId = form.employmentStatusId || null;
        return apiClient.users.update(editing.id, payload);
      }

      payload.employmentStatusId = form.employmentStatusId || undefined;
      return apiClient.users.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSheetOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFieldErrors({});
      setFeedback({
        type: "success",
        message: editing ? "User updated successfully" : "User signed up successfully",
      });
      toast({
        variant: "success",
        message: editing ? "User updated successfully" : "User signed up successfully",
      });
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, "Save failed");
      const apiFieldErrors =
        err instanceof ApiClientError ? parseApiFieldErrors(err.details) : {};

      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...apiFieldErrors }));
        scrollToFirstFieldError(apiFieldErrors);
      }

      toast({ variant: "error", message });
      setFeedback({ type: "error", message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFeedback({ type: "success", message: "User deleted" });
      toast({ variant: "success", message: "User deleted" });
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, "Delete failed");
      toast({ variant: "error", message });
      setFeedback({ type: "error", message });
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
      toast({ variant: "success", message: "Role assigned" });
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, "Assign role failed");
      toast({ variant: "error", message });
      setFeedback({ type: "error", message });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiClient.users.removeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFeedback({ type: "success", message: "Role removed" });
      toast({ variant: "success", message: "Role removed" });
    },
    onError: (err) => {
      const message = getApiErrorMessage(err, "Remove role failed");
      toast({ variant: "error", message });
      setFeedback({ type: "error", message });
    },
  });

  const lookupOptions = useMemo(() => {
    const l = lookupsQuery.data;
    if (!l) return null;
    const toOptions = (items: { id: string; name: string }[]): LookupOption[] =>
      items.map((item) => ({ value: item.id, label: item.name }));

    return {
      departments: toOptions(l.departments),
      designations: toOptions(l.designations),
      offices: toOptions(l.offices),
      employeeTypes: toOptions(l.employeeTypes),
      employmentStatuses: toOptions(l.employmentStatuses),
      roles: toOptions(l.roles),
    };
  }, [lookupsQuery.data]);

  const prefetchNextEmployeeId = async () => {
    setLoadingEmployeeId(true);
    try {
      const res = await apiClient.users.getNextEmployeeId();
      const employeeId = res.data?.employeeId ?? "";
      setForm((prev) => ({ ...prev, employeeId }));
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to generate employee ID");
      toast({ variant: "error", message });
    } finally {
      setLoadingEmployeeId(false);
    }
  };

  const openCreate = async () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setSheetOpen(true);
    await prefetchNextEmployeeId();
  };

  const openEdit = (user: UserRow) => {
    setEditing(user);
    setFieldErrors({});
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
      officeId: user.office?.id ?? "",
      employeeTypeId: user.employeeType?.id ?? "",
      employmentStatusId: user.employmentStatus?.id ?? "",
    });
    setSheetOpen(true);
  };

  const openAssignRole = (user: UserRow) => {
    setRoleTarget(user);
    setSelectedRoleId("");
    setRoleSheetOpen(true);
  };

  const clearFieldError = (name: string) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = () => {
    const errors = validateUserForm(form, { isEdit: !!editing });
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      scrollToFirstFieldError(errors);
      toast({ variant: "error", message: "Please fix the highlighted fields" });
      return;
    }

    saveMutation.mutate();
  };

  useEffect(() => {
    if (!sheetOpen) {
      setFieldErrors({});
    }
  }, [sheetOpen]);

  if (usersQuery.isLoading) return <LoadingState message="Loading users..." variant="table" />;
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
        description="Create users, manage account status, employment status, and roles."
      >
        <SearchBar
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="w-full sm:w-64"
        />
        {canCreate && (
          <Button onClick={() => void openCreate()} className="gap-1.5">
            <UserPlus className="size-4" aria-hidden />
            Signup
          </Button>
        )}
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
          description="Sign up your first user or adjust your search."
          actionLabel={canCreate ? "Signup" : undefined}
          onAction={canCreate ? () => void openCreate() : undefined}
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
              key: "manager",
              header: "Manager",
              render: (u) =>
                u.manager ? `${u.manager.firstName} ${u.manager.lastName}` : "—",
            },
            {
              key: "deptHead",
              header: "Dept Head",
              render: (u) =>
                u.managedDepartments?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {u.managedDepartments.map((dept) => (
                      <Badge key={dept.id} variant="outline">
                        {dept.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  "—"
                ),
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
              key: "accountStatus",
              header: "Account Status",
              render: (u) => (
                <Badge variant={accountStatusBadgeVariant(u.status)}>
                  {USER_ACCOUNT_STATUS_LABELS[u.status as keyof typeof USER_ACCOUNT_STATUS_LABELS] ??
                    u.status}
                </Badge>
              ),
            },
            {
              key: "employmentStatus",
              header: "Employment Status",
              render: (u) =>
                u.employmentStatus?.name ? (
                  <Badge variant="outline">{u.employmentStatus.name}</Badge>
                ) : (
                  "—"
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
        title={editing ? "Edit User" : "Signup User"}
        description={
          editing
            ? "Update account status (login access) and employment status (work type) separately."
            : "Employee ID is auto-generated. Set account status and employment type before signup."
        }
        onSubmit={handleSubmit}
        loading={saveMutation.isPending || (!editing && loadingEmployeeId)}
        submitLabel={editing ? "Save Changes" : "Signup"}
      >
        {editing && (
          <div className="rounded-xl border border-white/15 bg-white/30 p-4 text-sm dark:bg-white/5">
            <p className="font-medium">Current assignment</p>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Account Status</dt>
                <dd className="font-medium">
                  {USER_ACCOUNT_STATUS_LABELS[
                    form.status as keyof typeof USER_ACCOUNT_STATUS_LABELS
                  ] ?? form.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Employment Status</dt>
                <dd className="font-medium">
                  {lookupOptions?.employmentStatuses.find((o) => o.value === form.employmentStatusId)
                    ?.label ?? "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reporting Manager</dt>
                <dd className="font-medium">
                  {editing.manager
                    ? `${editing.manager.firstName} ${editing.manager.lastName}`
                    : "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Departments Managed</dt>
                <dd className="font-medium">
                  {editing.managedDepartments?.length
                    ? editing.managedDepartments.map((dept) => dept.name).join(", ")
                    : "None"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Reporting manager syncs from the department head when a department is assigned or its manager changes.
            </p>
          </div>
        )}
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(v) => {
            clearFieldError("email");
            setForm({ ...form, email: v });
          }}
          required
          disabled={!!editing}
          error={fieldErrors.email}
        />
        {!editing && (
          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={(v) => {
              clearFieldError("password");
              setForm({ ...form, password: v });
            }}
            required
            error={fieldErrors.password}
          />
        )}
        {editing && (
          <FormField
            label="New Password (optional)"
            name="password"
            type="password"
            value={form.password}
            onChange={(v) => {
              clearFieldError("password");
              setForm({ ...form, password: v });
            }}
            error={fieldErrors.password}
            helperText="Leave blank to keep the current password."
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="First name"
            name="firstName"
            value={form.firstName}
            onChange={(v) => {
              clearFieldError("firstName");
              setForm({ ...form, firstName: v });
            }}
            required
            error={fieldErrors.firstName}
          />
          <FormField
            label="Last name"
            name="lastName"
            value={form.lastName}
            onChange={(v) => {
              clearFieldError("lastName");
              setForm({ ...form, lastName: v });
            }}
            required
            error={fieldErrors.lastName}
          />
        </div>
        <FormField
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={(v) => {
            clearFieldError("phone");
            setForm({ ...form, phone: v });
          }}
          error={fieldErrors.phone}
        />
        {loadingEmployeeId && !editing ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Employee ID<span className="ml-0.5 text-destructive">*</span>
            </p>
            <Skeleton className="h-9 w-full rounded-lg" />
            <p className="text-xs text-muted-foreground">Generating from the latest employee ID...</p>
          </div>
        ) : (
          <FormField
            label="Employee ID"
            name="employeeId"
            value={form.employeeId}
            onChange={(v) => {
              clearFieldError("employeeId");
              setForm({ ...form, employeeId: v });
            }}
            required={!editing}
            disabled
            error={fieldErrors.employeeId}
            helperText={
              editing
                ? "Employee ID cannot be changed after signup."
                : "Auto-generated from the latest employee ID."
            }
          />
        )}
        <FormSelect
          label="Account Status"
          name="status"
          value={form.status}
          onChange={(v) => {
            clearFieldError("status");
            setForm({ ...form, status: v });
          }}
          options={[...USER_ACCOUNT_STATUSES]}
          error={fieldErrors.status}
          helperText={ACCOUNT_STATUS_HELPER}
        />
        {lookupOptions && (
          <>
            <FormSelect
              label="Employment Status"
              name="employmentStatusId"
              value={form.employmentStatusId}
              onChange={(v) => {
                clearFieldError("employmentStatusId");
                setForm({ ...form, employmentStatusId: v });
              }}
              options={lookupOptions.employmentStatuses}
              error={fieldErrors.employmentStatusId}
              helperText={EMPLOYMENT_STATUS_HELPER}
            />
            <FormSelect
              label="Department"
              name="departmentId"
              value={form.departmentId}
              onChange={(v) => {
                clearFieldError("departmentId");
                setForm({ ...form, departmentId: v });
              }}
              options={lookupOptions.departments}
              error={fieldErrors.departmentId}
              helperText="Assigning a department automatically sets the reporting manager from that department's head."
            />
            <FormSelect
              label="Designation"
              name="designationId"
              value={form.designationId}
              onChange={(v) => {
                clearFieldError("designationId");
                setForm({ ...form, designationId: v });
              }}
              options={lookupOptions.designations}
              error={fieldErrors.designationId}
            />
            <FormSelect
              label="Office"
              name="officeId"
              value={form.officeId}
              onChange={(v) => {
                clearFieldError("officeId");
                setForm({ ...form, officeId: v });
              }}
              options={lookupOptions.offices}
              error={fieldErrors.officeId}
            />
            <FormSelect
              label="Employee type"
              name="employeeTypeId"
              value={form.employeeTypeId}
              onChange={(v) => {
                clearFieldError("employeeTypeId");
                setForm({ ...form, employeeTypeId: v });
              }}
              options={lookupOptions.employeeTypes}
              error={fieldErrors.employeeTypeId}
            />
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
