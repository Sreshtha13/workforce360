"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { SearchBar } from "@/components/design-system/search-bar";
import { Badge } from "@/components/ui/badge";
import { PIPELINE_LABELS, type PipelineStatus } from "@/types/phase2";

export default function HrCandidatesPage() {
  const [search, debouncedSearch, setSearch] = useDebouncedValue("", 300);

  const query = useQuery({
    queryKey: ["hr", "candidates", debouncedSearch],
    queryFn: async () => {
      const res = await apiClient.recruitment.listCandidates({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading candidates..." />;
  if (query.isError) {
    return <ErrorState message="Failed to load candidates." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Candidates" description="All applicants and their current pipeline status." />

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        containerClassName="max-w-md"
      />

      <DataTable
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => (
              <Link
                href={`/hr/candidates/${row.id}`}
                className="font-medium text-brand-600 hover:underline dark:text-brand-300"
              >
                {row.firstName} {row.lastName}
              </Link>
            ),
          },
          { key: "email", header: "Email", render: (row) => row.email },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge>{PIPELINE_LABELS[row.pipelineStatus as PipelineStatus]}</Badge>
            ),
          },
          {
            key: "applications",
            header: "Applications",
            render: (row) => row.applications?.length ?? 0,
          },
        ]}
        data={query.data ?? []}
        rowKey={(row) => row.id}
        emptyTitle="No candidates found"
        emptyMessage={
          debouncedSearch
            ? "Try a different search term."
            : "Candidates will appear here when they apply to jobs."
        }
      />
    </div>
  );
}
