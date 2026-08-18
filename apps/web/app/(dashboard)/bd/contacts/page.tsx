"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { SearchBar } from "@/components/design-system/search-bar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateContactInput } from "@/types/bd";

export default function BdContactsPage() {
  const [search, debouncedSearch, setSearch] = useDebouncedValue("", 300);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formData, setFormData] = useState<CreateContactInput>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    designation: "",
    linkedInUrl: "",
    notes: "",
  });
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bd", "contacts", debouncedSearch],
    queryFn: async () => {
      const res = await apiClient.bd.contacts.list({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateContactInput) => apiClient.bd.contacts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bd", "contacts"] });
      setIsSheetOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        designation: "",
        linkedInUrl: "",
        notes: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (query.isLoading) return <LoadingState message="Loading contacts..." />;
  if (query.isError) {
    return <ErrorState message="Failed to load contacts." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contacts"
        description="Manage client contacts and relationships."
        actions={
          <Button onClick={() => setIsSheetOpen(true)}>
            Add Contact
          </Button>
        }
      />

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email, or company..."
        containerClassName="max-w-md"
      />

      <DataTable
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => (
              <Link
                href={`/bd/contacts/${row.id}`}
                className="font-medium text-brand-600 hover:underline dark:text-brand-300"
              >
                {row.firstName} {row.lastName}
              </Link>
            ),
          },
          { key: "email", header: "Email", render: (row) => row.email || "—" },
          { key: "company", header: "Company", render: (row) => row.company || "—" },
          { key: "designation", header: "Designation", render: (row) => row.designation || "—" },
          {
            key: "leads",
            header: "Leads",
            render: (row) => row._count?.leads ?? 0,
          },
          {
            key: "communications",
            header: "Communications",
            render: (row) => row._count?.communications ?? 0,
          },
        ]}
        data={query.data ?? []}
        rowKey={(row) => row.id}
        emptyTitle="No contacts found"
        emptyMessage={
          debouncedSearch
            ? "Try a different search term."
            : "Add contacts to start tracking your client relationships."
        }
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Contact</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedInUrl">LinkedIn URL</Label>
              <Input
                id="linkedInUrl"
                type="url"
                value={formData.linkedInUrl}
                onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Contact"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
