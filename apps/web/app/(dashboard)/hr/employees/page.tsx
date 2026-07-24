"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";

export default function HrEmployeesPage() {
  const query = useQuery({
    queryKey: ["hr", "employees"],
    queryFn: async () => {
      const res = await apiClient.hr.listEmployees();
      return res.data ?? [];
    },
  });

  if (query.isLoading) return <LoadingState message="Loading employees..." />;
  if (query.isError) return <ErrorState message="Failed to load employees." onRetry={() => query.refetch()} />;

  const rows = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Employee master"
        description="Canonical employee records linked to user accounts and hired candidates."
      />

      <DataTable
        columns={[
          { key: "employeeCode", header: "Employee ID", render: (row) => row.employeeCode },
          {
            key: "name",
            header: "Name",
            render: (row) => `${row.user?.firstName ?? ""} ${row.user?.lastName ?? ""}`.trim(),
          },
          { key: "email", header: "Email", render: (row) => row.user?.email },
          { key: "department", header: "Department", render: (row) => row.user?.department?.name ?? "—" },
          {
            key: "lifecycle",
            header: "Lifecycle",
            render: (row) => <Badge variant="secondary">{row.lifecycleState}</Badge>,
          },
          {
            key: "view",
            header: "",
            render: (row) => (
              <Link href={`/hr/employees/${row.id}`} className="text-sm text-brand-600 hover:underline">
                View
              </Link>
            ),
          },
        ]}
        data={rows}
        rowKey={(row) => row.id}
      />
    </div>
  );
}
