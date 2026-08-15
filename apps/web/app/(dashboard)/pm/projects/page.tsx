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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProjectStatus, CreateProjectInput } from "@/types/pm";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ON_HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  COMPLETED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function PmProjectsPage() {
  const [search, debouncedSearch, setSearch] = useDebouncedValue("", 300);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: "",
    code: "",
    description: "",
    status: "PLANNING",
    currency: "USD",
  });
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pm", "projects", debouncedSearch],
    queryFn: async () => {
      const res = await apiClient.pm.projects.list({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectInput) => apiClient.pm.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm", "projects"] });
      setIsSheetOpen(false);
      setFormData({
        name: "",
        code: "",
        description: "",
        status: "PLANNING",
        currency: "USD",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (query.isLoading) return <LoadingState message="Loading projects..." />;
  if (query.isError) {
    return <ErrorState message="Failed to load projects." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projects"
        description="Manage all your projects and track their progress."
        actions={
          <Button onClick={() => setIsSheetOpen(true)}>
            New Project
          </Button>
        }
      />

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search projects..."
        containerClassName="max-w-md"
      />

      <DataTable
        columns={[
          {
            key: "name",
            header: "Project",
            render: (row) => (
              <div>
                <Link
                  href={`/pm/projects/${row.id}`}
                  className="font-medium text-brand-600 hover:underline dark:text-brand-300"
                >
                  {row.name}
                </Link>
                {row.code && <p className="text-sm text-muted-foreground">{row.code}</p>}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge className={STATUS_COLORS[row.status as ProjectStatus]}>
                {STATUS_LABELS[row.status as ProjectStatus]}
              </Badge>
            ),
          },
          {
            key: "manager",
            header: "Manager",
            render: (row) => row.manager ? `${row.manager.firstName} ${row.manager.lastName}` : "—",
          },
          {
            key: "client",
            header: "Client",
            render: (row) => row.clientName || "—",
          },
          {
            key: "tasks",
            header: "Tasks",
            render: (row) => row._count?.tasks ?? 0,
          },
          {
            key: "team",
            header: "Team",
            render: (row) => row._count?.teamAllocations ?? 0,
          },
          {
            key: "budget",
            header: "Budget",
            render: (row) => row.budget ? `${row.currency} ${parseFloat(row.budget).toLocaleString()}` : "—",
          },
        ]}
        data={query.data ?? []}
        rowKey={(row) => row.id}
        emptyTitle="No projects found"
        emptyMessage={
          debouncedSearch
            ? "Try a different search term."
            : "Create your first project to get started."
        }
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New Project</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Project Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., PRJ-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planning</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget ?? ""}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
