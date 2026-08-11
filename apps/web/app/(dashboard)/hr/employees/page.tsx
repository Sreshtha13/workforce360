"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { FormSelect } from "@/components/admin/form-fields";
import { SearchBar } from "@/components/design-system/search-bar";
import { Badge } from "@/components/ui/badge";
import {
  LIFECYCLE_LABELS,
  LIFECYCLE_STATES,
  type EmployeeLifecycleState,
} from "@/types/phase2";
import { useState } from "react";

export default function HrEmployeesPage() {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const [search, debouncedSearch, setSearch] = useDebouncedValue("", 300);
  const [lifecycle, setLifecycle] = useState("ALL");
  const canView = hasPermission("employee.read");
  const isDeveloperScoped = Boolean(
    user?.roles?.some((r) => r.code === "developer") &&
      !isSuperAdmin &&
      !hasPermission("employee.update"),
  );

  const query = useQuery({
    queryKey: ["hr", "employees", debouncedSearch, lifecycle],
    queryFn: async () => {
      const res = await apiClient.hr.listEmployees({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(lifecycle !== "ALL" ? { lifecycleState: lifecycle } : {}),
      });
      return res.data ?? [];
    },
    enabled: canView,
  });

  if (!canView) {
    return <ErrorState message="You do not have permission to view employees." />;
  }
  if (query.isLoading) return <LoadingState message="Loading employees..." />;
  if (query.isError) {
    return <ErrorState message="Failed to load employees." onRetry={() => query.refetch()} />;
  }

  const rows = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Employee master"
        description={
          isDeveloperScoped
            ? "Team-scoped employee list — limited to colleagues on your teams."
            : "Canonical employee records linked to user accounts and hired candidates."
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or employee code..."
          containerClassName="max-w-md flex-1"
        />
        <div className="w-full sm:w-56">
          <FormSelect
            name="lifecycle"
            label="Lifecycle"
            value={lifecycle}
            onChange={setLifecycle}
            options={[
              { value: "ALL", label: "All lifecycles" },
              ...LIFECYCLE_STATES.map((s) => ({
                value: s,
                label: LIFECYCLE_LABELS[s],
              })),
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={[
          { key: "employeeCode", header: "Employee ID", render: (row) => row.employeeCode },
          {
            key: "name",
            header: "Name",
            render: (row) =>
              `${row.user?.firstName ?? ""} ${row.user?.lastName ?? ""}`.trim() || "—",
          },
          { key: "email", header: "Email", render: (row) => row.user?.email ?? "—" },
          {
            key: "department",
            header: "Department",
            render: (row) => row.user?.department?.name ?? "—",
          },
          {
            key: "lifecycle",
            header: "Lifecycle",
            render: (row) => (
              <Badge variant="secondary">
                {LIFECYCLE_LABELS[row.lifecycleState as EmployeeLifecycleState] ??
                  row.lifecycleState}
              </Badge>
            ),
          },
          {
            key: "view",
            header: "",
            render: (row) => (
              <Link
                href={`/hr/employees/${row.id}`}
                className="text-sm text-brand-600 hover:underline dark:text-brand-300"
              >
                View
              </Link>
            ),
          },
        ]}
        data={rows}
        rowKey={(row) => row.id}
        emptyTitle="No employees found"
        emptyMessage={
          debouncedSearch || lifecycle !== "ALL"
            ? "Try adjusting search or lifecycle filter."
            : isDeveloperScoped
              ? "No teammates found. Join a team to see colleagues here."
              : "Employee records appear after candidates are hired."
        }
      />
    </div>
  );
}
