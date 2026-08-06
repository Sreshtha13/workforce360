"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, History, Package } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  LoadingState,
  ErrorState,
  AlertBanner,
  EmptyState,
} from "@/components/admin/admin-states";
import { FormField } from "@/components/admin/form-fields";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/types/phase2";

function display(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "N/A";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/20 bg-white/50 p-6 dark:bg-white/5">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function PortalProfilePage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const query = useQuery({
    queryKey: ["portal", "profile"],
    queryFn: async () => {
      const res = await apiClient.portal.getProfile();
      return res.data!;
    },
  });

  useEffect(() => {
    if (!query.data) return;
    setForm({
      firstName: query.data.user.firstName,
      lastName: query.data.user.lastName,
      phone: query.data.user.phone ?? "",
      emergencyContactName: query.data.employee?.emergencyContactName ?? "",
      emergencyContactPhone: query.data.employee?.emergencyContactPhone ?? "",
    });
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: () => apiClient.portal.updateProfile(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "profile"] });
      setFeedback("Profile updated.");
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Update failed");
      setFeedback(null);
    },
  });

  if (query.isLoading) return <LoadingState message="Loading profile..." />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        message="Could not load profile."
        onRetry={() => query.refetch()}
      />
    );
  }

  const { user, employee } = query.data;
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const employmentStatus = user.employmentStatus?.name ?? null;
  const teams =
    user.teamMemberships
      ?.map((m) => m.team?.name)
      .filter((name): name is string => Boolean(name)) ?? [];
  const assignedAssets: Asset[] = employee?.assignedAssets ?? [];
  const managerName = user.manager
    ? `${user.manager.firstName} ${user.manager.lastName}`.trim()
    : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My profile"
        description="View your employment details and update personal contact information."
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <section className="rounded-2xl border border-white/20 bg-white/50 p-6 dark:bg-white/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar size="lg" className="size-16 ring-2 ring-white/30 dark:ring-white/10">
            {user.avatar ? <AvatarImage src={user.avatar} alt={fullName} /> : null}
            <AvatarFallback className="bg-brand-600/90 text-lg font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold">{fullName}</h2>
              {employmentStatus && (
                <Badge variant="secondary">{employmentStatus}</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Employee ID: {display(user.employeeId)}</span>
              <span>Employee Code: {display(employee?.employeeCode)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Personal information">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Email" value={display(user.email)} />
            <InfoRow label="Phone" value={display(user.phone)} />
            <InfoRow label="Date of birth" value={formatDate(user.dateOfBirth)} />
            <InfoRow label="Address" value="N/A" />
            <InfoRow
              label="Emergency contact"
              value={
                employee?.emergencyContactName || employee?.emergencyContactPhone
                  ? `${display(employee?.emergencyContactName)} · ${display(employee?.emergencyContactPhone)}`
                  : "N/A"
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="Professional information">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Department" value={display(user.department?.name)} />
            <InfoRow label="Designation" value={display(user.designation?.name)} />
            <InfoRow label="Reporting manager" value={display(managerName)} />
            <InfoRow label="Employee type" value={display(user.employeeType?.name)} />
            <InfoRow label="Office" value={display(user.office?.name)} />
            <InfoRow label="Work location" value={display(user.office?.name)} />
            {teams.length > 0 && (
              <InfoRow label="Team" value={teams.join(", ")} />
            )}
            <InfoRow
              label="Date of joining"
              value={formatDate(user.dateOfJoining ?? employee?.hiredAt)}
            />
            <InfoRow label="Lifecycle" value={display(employee?.lifecycleState)} />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Documents summary">
          <EmptyState
            title="No documents yet"
            description="Personal documents will appear here when available."
            icon={FileText}
            className="border-0 bg-transparent py-8 shadow-none ring-0"
          />
        </SectionCard>

        <SectionCard title="Assets assigned">
          {assignedAssets.length === 0 ? (
            <EmptyState
              title="No assets assigned"
              description="Assets assigned to you by HR will show here."
              icon={Package}
              className="border-0 bg-transparent py-8 shadow-none ring-0"
            />
          ) : (
            <ul className="space-y-3">
              {assignedAssets.map((asset) => (
                <li
                  key={asset.id}
                  className="rounded-xl border border-white/15 bg-white/40 px-3 py-2 text-sm dark:bg-white/5"
                >
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-muted-foreground">
                    {[asset.tag, asset.category, asset.serialNumber]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent activity">
          <EmptyState
            title="No recent activity"
            description="Profile and employment activity will appear here."
            icon={History}
            className="border-0 bg-transparent py-8 shadow-none ring-0"
          />
        </SectionCard>
      </div>

      <SectionCard title="Edit profile">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="max-w-xl space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="First name"
              name="firstName"
              value={form.firstName}
              onChange={(v) => setForm({ ...form, firstName: v })}
              required
            />
            <FormField
              label="Last name"
              name="lastName"
              value={form.lastName}
              onChange={(v) => setForm({ ...form, lastName: v })}
              required
            />
          </div>
          <FormField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          {employee && (
            <>
              <FormField
                label="Emergency contact name"
                name="emergencyContactName"
                value={form.emergencyContactName}
                onChange={(v) => setForm({ ...form, emergencyContactName: v })}
              />
              <FormField
                label="Emergency contact phone"
                name="emergencyContactPhone"
                value={form.emergencyContactPhone}
                onChange={(v) => setForm({ ...form, emergencyContactPhone: v })}
              />
            </>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </SectionCard>
    </div>
  );
}
