"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { uploadFileViaPresign } from "@/lib/upload";
import type { CompanyPolicy, PolicyAssignment, PolicyAcknowledgementReport } from "@/types/phase2";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, AlertBanner } from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type PolicyForm = { title: string; description: string; version: string };

const emptyForm: PolicyForm = { title: "", description: "", version: "1.0" };

const ASSIGN_TARGET_OPTIONS = [
  { value: "ALL", label: "All employees" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "TEAM", label: "Team" },
  { value: "USER", label: "Specific user" },
];

function assignmentLabel(a: PolicyAssignment): string {
  switch (a.targetType) {
    case "ALL":
      return "All employees";
    case "USER":
      return a.user ? `${a.user.firstName} ${a.user.lastName}` : "User";
    case "DEPARTMENT":
      return a.department?.name ?? "Department";
    case "TEAM":
      return a.team?.name ?? "Team";
    default:
      return a.targetType;
  }
}

export default function HrPoliciesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<CompanyPolicy | null>(null);
  const [assignFamilyId, setAssignFamilyId] = useState<string | null>(null);
  const [ackPolicy, setAckPolicy] = useState<CompanyPolicy | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<PolicyForm>(emptyForm);
  const [assignForm, setAssignForm] = useState({
    targetType: "ALL",
    departmentId: "",
    teamId: "",
    userId: "",
  });

  const canCreate = hasPermission("policy.create");
  const canUpdate = hasPermission("policy.update");
  const canView = hasPermission("policy.read") || canCreate || canUpdate;

  const query = useQuery({
    queryKey: ["hr", "policies"],
    queryFn: async () => (await apiClient.hr.listPolicies()).data ?? [],
    enabled: canView,
  });

  const departmentsQuery = useQuery({
    queryKey: ["policy-departments"],
    queryFn: async () => (await apiClient.organization.departments.list()).data ?? [],
    enabled: canView && assignFamilyId !== null,
  });

  const teamsQuery = useQuery({
    queryKey: ["policy-teams"],
    queryFn: async () => (await apiClient.organization.teams.list()).data ?? [],
    enabled: canView && assignFamilyId !== null,
  });

  const usersQuery = useQuery({
    queryKey: ["policy-users"],
    queryFn: async () => (await apiClient.users.list()).data ?? [],
    enabled: canView && assignFamilyId !== null,
  });

  const assignmentsQuery = useQuery({
    queryKey: ["hr", "policy-assignments", assignFamilyId],
    queryFn: async () => {
      if (!assignFamilyId) return [];
      return (await apiClient.hr.listPolicyAssignments(assignFamilyId)).data ?? [];
    },
    enabled: canView && assignFamilyId !== null,
  });

  const ackQuery = useQuery({
    queryKey: ["hr", "policy-ack", ackPolicy?.id],
    queryFn: async () => {
      if (!ackPolicy) return null;
      return (await apiClient.hr.getPolicyAcknowledgements(ackPolicy.id)).data ?? null;
    },
    enabled: canView && ackPolicy !== null,
  });

  const invalidatePolicies = () => {
    queryClient.invalidateQueries({ queryKey: ["hr", "policies"] });
  };

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
      invalidatePolicies();
      setCreateOpen(false);
      setFile(null);
      setForm(emptyForm);
      setFeedback("Policy draft created.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to create policy"),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editPolicy) throw new Error("No policy selected");
      let fileId: string | null | undefined;
      if (file) {
        const uploaded = await uploadFileViaPresign(file, "POLICY");
        fileId = uploaded.id;
      }
      return apiClient.hr.updatePolicy(editPolicy.id, { ...form, fileId });
    },
    onSuccess: () => {
      invalidatePolicies();
      setEditPolicy(null);
      setFile(null);
      setForm(emptyForm);
      setFeedback("Draft updated.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to update policy"),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiClient.hr.publishPolicy(id),
    onSuccess: () => {
      invalidatePolicies();
      setFeedback("Policy published.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to publish policy"),
  });

  const versionMutation = useMutation({
    mutationFn: (id: string) => apiClient.hr.createPolicyVersion(id),
    onSuccess: () => {
      invalidatePolicies();
      setFeedback("New draft version created.");
      setError(null);
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to create new version"),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!assignFamilyId) throw new Error("No policy family selected");
      return apiClient.hr.assignPolicy({
        familyId: assignFamilyId,
        targetType: assignForm.targetType as PolicyAssignment["targetType"],
        departmentId: assignForm.departmentId || undefined,
        teamId: assignForm.teamId || undefined,
        userId: assignForm.userId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "policy-assignments", assignFamilyId] });
      setAssignForm({ targetType: "ALL", departmentId: "", teamId: "", userId: "" });
      setFeedback("Assignment added.");
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "Failed to assign policy"),
  });

  const removeAssignMutation = useMutation({
    mutationFn: (assignmentId: string) => apiClient.hr.removePolicyAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr", "policy-assignments", assignFamilyId] });
      setFeedback("Assignment removed.");
    },
  });

  const openEdit = (policy: CompanyPolicy) => {
    setEditPolicy(policy);
    setForm({
      title: policy.title,
      description: policy.description ?? "",
      version: policy.version,
    });
    setFile(null);
  };

  if (!canView) {
    return <ErrorState message="You do not have permission to view policies." />;
  }
  if (query.isLoading) return <LoadingState message="Loading policies..." />;
  if (query.isError) return <ErrorState message="Failed to load policies." onRetry={() => query.refetch()} />;

  const policies = (query.data ?? []) as CompanyPolicy[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Policy management"
        description="Create drafts, publish versions, assign to audiences, and track acknowledgements."
        actionLabel={hasPermission("policy.create") ? "New policy" : undefined}
        onAction={hasPermission("policy.create") ? () => setCreateOpen(true) : undefined}
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      {policies.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/20 p-8 text-center text-sm text-muted-foreground">
          No policies yet. Create a draft, assign it after publishing, and track employee acknowledgements.
        </p>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/40 p-4 dark:bg-white/5"
            >
              <div>
                <p className="font-medium">{policy.title}</p>
                <p className="text-sm text-muted-foreground">
                  v{policy.version}
                  {policy.file && ` · ${policy.file.originalName}`}
                  {policy._count?.acknowledgements != null &&
                    policy.status === "PUBLISHED" &&
                    ` · ${policy._count.acknowledgements} acknowledged`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{policy.status}</Badge>
                {hasPermission("policy.update") && policy.status === "DRAFT" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openEdit(policy)}>
                      Edit draft
                    </Button>
                    <Button
                      size="sm"
                      disabled={publishMutation.isPending}
                      onClick={() => publishMutation.mutate(policy.id)}
                    >
                      Publish
                    </Button>
                  </>
                )}
                {hasPermission("policy.create") && policy.status === "PUBLISHED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={versionMutation.isPending}
                    onClick={() => versionMutation.mutate(policy.id)}
                  >
                    New version
                  </Button>
                )}
                {hasPermission("policy.update") && policy.familyId && (
                  <Button size="sm" variant="outline" onClick={() => setAssignFamilyId(policy.familyId!)}>
                    Assign
                  </Button>
                )}
                {hasPermission("policy.read") && policy.status === "PUBLISHED" && (
                  <Button size="sm" variant="ghost" onClick={() => setAckPolicy(policy)}>
                    Acknowledgements
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create policy"
        onSubmit={() => createMutation.mutate()}
        loading={createMutation.isPending}
        submitLabel="Create draft"
      >
        <FormField name="title" label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <FormField name="version" label="Version" value={form.version} onChange={(v) => setForm({ ...form, version: v })} />
        <FormTextarea name="description" label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <div className="space-y-2">
          <Label htmlFor="policyFile">Policy document (optional)</Label>
          <Input id="policyFile" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </FormSheet>

      <FormSheet
        open={editPolicy !== null}
        onOpenChange={(open) => !open && setEditPolicy(null)}
        title="Edit draft"
        onSubmit={() => updateMutation.mutate()}
        loading={updateMutation.isPending}
        submitLabel="Save draft"
      >
        <FormField name="title" label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <FormField name="version" label="Version" value={form.version} onChange={(v) => setForm({ ...form, version: v })} />
        <FormTextarea name="description" label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <div className="space-y-2">
          <Label htmlFor="policyFileEdit">Replace document (optional)</Label>
          <Input id="policyFileEdit" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </FormSheet>

      <Sheet open={assignFamilyId !== null} onOpenChange={(open) => !open && setAssignFamilyId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Policy assignments</SheetTitle>
            <SheetDescription>
              Employees must be assigned before they see this policy in the portal.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <FormSelect
              label="Target audience"
              name="targetType"
              value={assignForm.targetType}
              onChange={(v) => setAssignForm({ ...assignForm, targetType: v })}
              options={ASSIGN_TARGET_OPTIONS}
            />
            {assignForm.targetType === "DEPARTMENT" && (
              <FormSelect
                label="Department"
                name="departmentId"
                value={assignForm.departmentId}
                onChange={(v) => setAssignForm({ ...assignForm, departmentId: v })}
                options={(departmentsQuery.data ?? []).map((d: { id: string; name: string }) => ({
                  value: d.id,
                  label: d.name,
                }))}
                required
              />
            )}
            {assignForm.targetType === "TEAM" && (
              <FormSelect
                label="Team"
                name="teamId"
                value={assignForm.teamId}
                onChange={(v) => setAssignForm({ ...assignForm, teamId: v })}
                options={(teamsQuery.data ?? []).map((t: { id: string; name: string }) => ({
                  value: t.id,
                  label: t.name,
                }))}
                required
              />
            )}
            {assignForm.targetType === "USER" && (
              <FormSelect
                label="User"
                name="userId"
                value={assignForm.userId}
                onChange={(v) => setAssignForm({ ...assignForm, userId: v })}
                options={(usersQuery.data ?? []).map(
                  (u: { id: string; firstName: string; lastName: string; email: string }) => ({
                    value: u.id,
                    label: `${u.firstName} ${u.lastName} (${u.email})`,
                  }),
                )}
                required
              />
            )}
            <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>
              Add assignment
            </Button>

            <div className="space-y-2 border-t border-white/10 pt-4">
              <p className="text-sm font-medium">Current assignments</p>
              {(assignmentsQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No assignments yet.</p>
              ) : (
                (assignmentsQuery.data ?? []).map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span>{assignmentLabel(a)}</span>
                    {hasPermission("policy.update") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAssignMutation.mutate(a.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={ackPolicy !== null} onOpenChange={(open) => !open && setAckPolicy(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Acknowledgements</SheetTitle>
            <SheetDescription>
              {ackPolicy?.title} v{ackPolicy?.version}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {ackQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <p className="text-sm">
                  {(ackQuery.data as PolicyAcknowledgementReport | null)?.summary.acknowledgedCount ?? 0}{" "}
                  employees acknowledged
                </p>
                {((ackQuery.data as PolicyAcknowledgementReport | null)?.acknowledgements ?? []).map((ack) => (
                  <div key={ack.id} className="text-sm">
                    <span className="font-medium">
                      {ack.user.firstName} {ack.user.lastName}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {new Date(ack.acknowledgedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
