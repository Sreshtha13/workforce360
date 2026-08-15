"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const query = useQuery({
    queryKey: ["bd", "contacts", id],
    queryFn: async () => {
      const res = await apiClient.bd.contacts.get(id);
      return res.data;
    },
  });

  if (query.isLoading) return <LoadingState message="Loading contact..." />;
  if (query.isError || !query.data) {
    return <ErrorState message="Contact not found." onRetry={() => query.refetch()} />;
  }

  const contact = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        description={contact.company ?? contact.designation ?? "Contact details"}
        actions={
          <Button variant="outline" onClick={() => router.push("/bd/contacts")}>
            Back to contacts
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border p-5 space-y-2 text-sm">
          <h3 className="font-semibold">Contact info</h3>
          <p>Email: {contact.email ?? "—"}</p>
          <p>Phone: {contact.phone ?? "—"}</p>
          <p>Company: {contact.company ?? "—"}</p>
          <p>Designation: {contact.designation ?? "—"}</p>
          {contact.linkedInUrl && (
            <p>
              LinkedIn:{" "}
              <a href={contact.linkedInUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                Profile
              </a>
            </p>
          )}
        </section>
        <section className="rounded-xl border p-5 space-y-2 text-sm">
          <h3 className="font-semibold">Activity</h3>
          <p>{contact._count?.leads ?? 0} leads</p>
          <p>{contact._count?.communications ?? 0} communications</p>
          {contact.notes && <p className="text-muted-foreground mt-2">{contact.notes}</p>}
        </section>
      </div>
    </div>
  );
}
