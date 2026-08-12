"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { SecurityEvent } from "@/types/security";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { FormField, FormSelect } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SecurityEventsPage() {
  const { hasPermission } = useAuth();
  const [userId, setUserId] = useState("");
  const [eventType, setEventType] = useState("");
  const [severity, setSeverity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [search, debouncedSearch, setSearch] = useDebouncedValue("", 300);

  const canRead = hasPermission("security.read");

  const query = useQuery({
    queryKey: [
      "security-events",
      { userId, eventType, severity, dateFrom, dateTo, search: debouncedSearch, page },
    ],
    queryFn: async () => {
      const res = await apiClient.securityEvents.list({
        userId: userId || undefined,
        eventType: eventType || undefined,
        severity: (severity as "INFO" | "WARN" | "CRITICAL") || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize: 25,
      });
      return { items: (res.data ?? []) as SecurityEvent[], meta: res.meta };
    },
    enabled: canRead,
  });

  if (!canRead) {
    return <ErrorState message="You do not have permission to view security events." />;
  }

  const items = query.data?.items ?? [];
  const meta = query.data?.meta;
  const totalPages =
    meta?.totalPages ??
    (meta?.total != null ? Math.ceil(Number(meta.total) / 25) : 1);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Security events"
        description="Failed logins, MFA failures, permission denials, and other security signals."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FormField
          label="Search"
          name="search"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Message or type…"
        />
        <FormField
          label="User ID"
          name="userId"
          value={userId}
          onChange={(v) => {
            setUserId(v);
            setPage(1);
          }}
        />
        <FormField
          label="Event type"
          name="eventType"
          value={eventType}
          onChange={(v) => {
            setEventType(v);
            setPage(1);
          }}
          placeholder="FAILED_LOGIN, MFA_FAILURE…"
        />
        <FormSelect
          label="Severity"
          name="severity"
          value={severity}
          onChange={(v) => {
            setSeverity(v);
            setPage(1);
          }}
          options={[
            { value: "", label: "Any" },
            { value: "INFO", label: "INFO" },
            { value: "WARN", label: "WARN" },
            { value: "CRITICAL", label: "CRITICAL" },
          ]}
        />
        <FormField
          label="Date from"
          name="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(v) => {
            setDateFrom(v);
            setPage(1);
          }}
        />
        <FormField
          label="Date to"
          name="dateTo"
          type="date"
          value={dateTo}
          onChange={(v) => {
            setDateTo(v);
            setPage(1);
          }}
        />
      </div>

      {query.isLoading ? (
        <LoadingState message="Loading security events..." />
      ) : query.isError ? (
        <ErrorState message="Failed to load security events." onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No events" description="Try adjusting filters." />
      ) : (
        <>
          <DataTable
            data={items}
            rowKey={(r) => r.id}
            columns={[
              {
                key: "when",
                header: "When",
                render: (r) => new Date(r.createdAt).toLocaleString(),
              },
              {
                key: "severity",
                header: "Severity",
                render: (r) => (
                  <Badge
                    variant={
                      r.severity === "CRITICAL"
                        ? "destructive"
                        : r.severity === "WARN"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {r.severity}
                  </Badge>
                ),
              },
              { key: "type", header: "Type", render: (r) => r.eventType },
              {
                key: "user",
                header: "User",
                render: (r) =>
                  r.user ? `${r.user.firstName} ${r.user.lastName}` : r.userId ?? "—",
              },
              {
                key: "message",
                header: "Message",
                render: (r) => r.message ?? "—",
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
