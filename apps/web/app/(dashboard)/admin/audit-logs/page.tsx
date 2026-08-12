"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { AuditLog } from "@/types/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ErrorState, LoadingState, EmptyState } from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormField } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

export default function AuditLogsPage() {
  const { hasPermission } = useAuth();
  const [userId, setUserId] = useState("");
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [search, debouncedSearch, setSearch] = useDebouncedValue("", 300);

  const canRead = hasPermission("audit.read");

  const query = useQuery({
    queryKey: [
      "audit-logs",
      { userId, entity, action, dateFrom, dateTo, search: debouncedSearch, page },
    ],
    queryFn: async () => {
      const res = await apiClient.audit.list({
        userId: userId || undefined,
        entity: entity || undefined,
        action: action || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize: 25,
      });
      return { items: (res.data ?? []) as AuditLog[], meta: res.meta };
    },
    enabled: canRead,
  });

  if (!canRead) {
    return <ErrorState message="You do not have permission to view audit logs." />;
  }

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;
  const totalPages =
    meta?.totalPages ??
    (meta?.total != null ? Math.ceil(Number(meta.total) / 25) : 1);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit logs"
        description="Searchable trail of create, update, delete, and approval actions."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FormField label="Search" name="search" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="User, entity, action…" />
        <FormField label="User ID" name="userId" value={userId} onChange={(v) => { setUserId(v); setPage(1); }} />
        <FormField label="Entity" name="entity" value={entity} onChange={(v) => { setEntity(v); setPage(1); }} placeholder="user, invoice…" />
        <FormField label="Action" name="action" value={action} onChange={(v) => { setAction(v); setPage(1); }} placeholder="create, update…" />
        <FormField label="Date from" name="dateFrom" type="date" value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} />
        <FormField label="Date to" name="dateTo" type="date" value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} />
      </div>

      {query.isLoading ? (
        <LoadingState message="Loading audit logs..." />
      ) : query.isError ? (
        <ErrorState message="Failed to load audit logs." onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No audit entries" description="Try adjusting filters." />
      ) : (
        <>
          <DataTable
            data={items}
            rowKey={(r) => r.id}
            columns={[
              {
                key: "when",
                header: "When",
                render: (r) =>
                  new Date(r.createdAt || r.timestamp || "").toLocaleString(),
              },
              {
                key: "user",
                header: "User",
                render: (r) =>
                  r.user
                    ? `${r.user.firstName} ${r.user.lastName}`
                    : r.userId ?? "—",
              },
              { key: "action", header: "Action", render: (r) => r.action },
              { key: "entity", header: "Entity", render: (r) => r.entity },
              {
                key: "entityId",
                header: "Entity ID",
                render: (r) => (
                  <span className="font-mono text-xs">{r.entityId ?? "—"}</span>
                ),
              },
            ]}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Page {meta?.page ?? page}
              {meta?.total != null ? ` · ${meta.total} total` : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
