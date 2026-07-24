"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState, AlertBanner } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  if (query.isError || !query.data) return <ErrorState message="Could not load profile." />;

  const profile = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My profile"
        description="View and edit your own employee data. Changes are ownership-checked on the backend."
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="max-w-xl space-y-4 rounded-2xl border border-white/20 bg-white/50 p-6 dark:bg-white/5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={profile.user.email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        {profile.employee && (
          <>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Emergency contact name</Label>
              <Input
                id="emergencyContactName"
                value={form.emergencyContactName}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
              <Input
                id="emergencyContactPhone"
                value={form.emergencyContactPhone}
                onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
              />
            </div>
          </>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
