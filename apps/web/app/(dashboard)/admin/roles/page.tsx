"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type RoleRow = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  _count?: { userRoles: number; rolePermissions: number };
};

export default function RolesAdminPage() {
  const { hasPermission } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleRow | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canView = hasPermission("role.create") || hasPermission("role.update");

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await apiClient.roles.list();
      return (res.data ?? []) as RoleRow[];
    },
  });

  const permissionsQuery = useQuery({
    queryKey: ["role-permissions", selectedRole?.id],
    enabled: !!selectedRole,
    queryFn: async () => {
      if (!selectedRole) return [];
      const res = await apiClient.roles.getPermissions(selectedRole.id);
      return res.data ?? [];
    },
  });

  if (!canView) {
    return (
      <ErrorState message="You do not have permission to view role management." />
    );
  }

  if (rolesQuery.isLoading) return <LoadingState message="Loading roles..." />;
  if (rolesQuery.isError) {
    return (
      <ErrorState
        message={
          rolesQuery.error instanceof ApiClientError
            ? rolesQuery.error.message
            : "Failed to load roles"
        }
        onRetry={() => rolesQuery.refetch()}
      />
    );
  }

  const roles = rolesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Role Management"
        description="View system roles and their permissions. Full role editing arrives in Phase 11; assignment works now via Users."
      />

      {feedback && (
        <AlertBanner
          variant={feedback.type === "error" ? "error" : "success"}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {roles.length === 0 ? (
        <EmptyState title="No roles found" description="Seed the database to create default roles." />
      ) : (
        <DataTable
          data={roles}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "name",
              header: "Role",
              render: (r) => (
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  )}
                </div>
              ),
            },
            { key: "code", header: "Code", render: (r) => r.code ?? "—" },
            {
              key: "users",
              header: "Users",
              render: (r) => r._count?.userRoles ?? 0,
            },
            {
              key: "permissions",
              header: "Permissions",
              render: (r) => r._count?.rolePermissions ?? 0,
            },
            {
              key: "flags",
              header: "Flags",
              render: (r) => (
                <div className="flex flex-wrap gap-1">
                  {r.isSystem && <Badge variant="secondary">System</Badge>}
                  <Badge variant={r.isActive ? "success" : "warning"}>
                    {r.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              className: "text-right",
              render: (r) => (
                <Button variant="outline" size="sm" onClick={() => setSelectedRole(r)}>
                  View permissions
                </Button>
              ),
            },
          ]}
        />
      )}

      <Sheet open={!!selectedRole} onOpenChange={(open) => !open && setSelectedRole(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedRole?.name}</SheetTitle>
            <SheetDescription>
              Permissions granted to this role (read-only in Phase 1).
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-6">
            {permissionsQuery.isLoading && <LoadingState message="Loading permissions..." />}
            {permissionsQuery.isError && (
              <ErrorState message="Failed to load role permissions" />
            )}
            {permissionsQuery.data && (
              <ul className="space-y-2">
                {permissionsQuery.data.map((rp: any) => (
                  <li
                    key={rp.id}
                    className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{rp.permission?.name ?? rp.permission?.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {rp.permission?.resource}.{rp.permission?.action}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
