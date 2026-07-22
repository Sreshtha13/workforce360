"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertBanner, EmptyState, ErrorState, LoadingState } from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CreateTeamInput, Team, UpdateTeamInput, UserSummary } from "@/types/entities";

type TeamRow = Team & {
  department?: { id: string; name: string };
  lead?: { id: string; firstName: string; lastName: string };
};

const emptyForm = { departmentId: "", name: "", code: "", description: "", leadId: "" };

export default function TeamsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TeamRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canCreate = hasPermission("team.create");
  const canUpdate = hasPermission("team.update");
  const canDelete = hasPermission("team.delete");
  const canReadUsers = hasPermission("user.read");

  const query = useQuery({
    queryKey: ["teams"],
    queryFn: async () => (await apiClient.organization.teams.list()).data ?? [],
  });

  const departmentsQuery = useQuery({
    queryKey: ["team-departments"],
    queryFn: async () => (await apiClient.organization.departments.list()).data ?? [],
  });

  const employeesQuery = useQuery({
    queryKey: ["team-department-employees", form.departmentId],
    queryFn: async () =>
      (
        await apiClient.users.list({
          departmentId: form.departmentId,
          status: "active",
        })
      ).data ?? [],
    enabled: sheetOpen && !!form.departmentId && canReadUsers,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: UpdateTeamInput = {
        departmentId: form.departmentId,
        name: form.name,
        code: form.code || undefined,
        description: form.description || undefined,
        leadId: form.leadId || undefined,
      };
      if (editing) return apiClient.organization.teams.update(editing.id, payload);
      return apiClient.organization.teams.create(payload as CreateTeamInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setSheetOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback({ type: "success", message: "Saved successfully" });
    },
    onError: (err) => setFeedback({ type: "error", message: err instanceof ApiClientError ? err.message : "Save failed" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.organization.teams.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setFeedback({ type: "success", message: "Team deleted" });
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Failed to load teams" onRetry={() => query.refetch()} />;

  const teams = (query.data ?? []) as TeamRow[];
  const deptOptions =
    departmentsQuery.data?.map((d: { id: string; name: string }) => ({
      value: d.id,
      label: d.name,
    })) ?? [];
  const employeeOptions =
    employeesQuery.data?.map((u: UserSummary) => ({
      value: u.id,
      label: `${u.firstName} ${u.lastName}`,
    })) ?? [];

  const handleDepartmentChange = (departmentId: string) => {
    setForm((prev) => ({ ...prev, departmentId, leadId: "" }));
  };

  const openCreateSheet = () => {
    setEditing(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEditSheet = (team: TeamRow) => {
    setEditing(team);
    setForm({
      departmentId: team.department?.id ?? "",
      name: team.name,
      code: team.code ?? "",
      description: team.description ?? "",
      leadId: team.lead?.id ?? "",
    });
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Teams"
        description="Teams belong to departments."
        actionLabel={canCreate ? "Add Team" : undefined}
        onAction={canCreate ? openCreateSheet : undefined}
      />
      {feedback && (
        <AlertBanner
          variant={feedback.type === "error" ? "error" : "success"}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}
      {teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          actionLabel={canCreate ? "Create Team" : undefined}
          onAction={canCreate ? openCreateSheet : undefined}
        />
      ) : (
        <DataTable
          data={teams}
          rowKey={(t) => t.id}
          columns={[
            { key: "name", header: "Team", render: (t) => t.name },
            { key: "dept", header: "Department", render: (t) => t.department?.name ?? "—" },
            { key: "lead", header: "Lead", render: (t) => (t.lead ? `${t.lead.firstName} ${t.lead.lastName}` : "—") },
            { key: "members", header: "Members", render: (t) => t._count?.members ?? 0 },
            {
              key: "status",
              header: "Status",
              render: (t) => (
                <Badge variant={t.isActive ? "success" : "warning"}>{t.isActive ? "Active" : "Inactive"}</Badge>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (t) => (
                <div className="flex justify-end gap-2">
                  {canUpdate && (
                    <Button variant="outline" size="sm" onClick={() => openEditSheet(t)}>
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirm(`Delete ${t.name}?`) && deleteMutation.mutate(t.id)}
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
        title={editing ? "Edit Team" : "Create Team"}
        onSubmit={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
      >
        <FormSelect
          label="Department"
          name="departmentId"
          value={form.departmentId}
          onChange={handleDepartmentChange}
          options={deptOptions}
          required
          helperText={departmentsQuery.isError ? "Failed to load departments" : undefined}
        />
        <FormField label="Name" name="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <FormField label="Code" name="code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
        <FormTextarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <FormSelect
          label="Team lead"
          name="leadId"
          value={form.leadId}
          onChange={(v) => setForm({ ...form, leadId: v })}
          options={employeeOptions}
          disabled={!form.departmentId || !canReadUsers}
          placeholder={!form.departmentId ? "Select a department first" : "Select employee (optional)"}
          helperText={
            !canReadUsers
              ? "You need user.read permission to assign a team lead"
              : form.departmentId && employeesQuery.isLoading
                ? "Loading employees..."
                : form.departmentId && employeeOptions.length === 0
                  ? "No active employees in this department"
                  : undefined
          }
        />
      </FormSheet>
    </div>
  );
}
