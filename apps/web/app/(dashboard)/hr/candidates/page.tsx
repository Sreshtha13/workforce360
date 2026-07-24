"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { PIPELINE_LABELS, type PipelineStatus } from "@/types/phase2";

export default function HrCandidatesPage() {
  const query = useQuery({
    queryKey: ["hr", "candidates"],
    queryFn: async () => {
      const res = await apiClient.recruitment.listCandidates();
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading candidates..." />;
  if (query.isError) return <ErrorState message="Failed to load candidates." onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Candidates" description="All applicants and their current pipeline status." />

      <DataTable
        columns={[
          { key: "name", header: "Name", render: (row) => `${row.firstName} ${row.lastName}` },
          { key: "email", header: "Email", render: (row) => row.email },
          {
            key: "status",
            header: "Status",
            render: (row) => <Badge>{PIPELINE_LABELS[row.pipelineStatus as PipelineStatus]}</Badge>,
          },
          {
            key: "applications",
            header: "Applications",
            render: (row) => row.applications?.length ?? 0,
          },
        ]}
        data={query.data ?? []}
        rowKey={(row) => row.id}
      />
    </div>
  );
}
