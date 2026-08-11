"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { ErrorState } from "@/components/admin/admin-states";

type RequirePermissionProps = {
  /** User must have at least one of these permissions */
  anyOf: string[];
  children: ReactNode;
  message?: string;
};

/**
 * Page-level RBAC gate. Prefer pairing with `enabled: canView` on React Query
 * so unauthorized clients never hit the API.
 */
export function RequirePermission({
  anyOf,
  children,
  message = "You do not have permission to view this page.",
}: RequirePermissionProps) {
  const { hasAnyPermission, loading } = useAuth();

  if (loading) return null;

  if (!hasAnyPermission(...anyOf)) {
    return <ErrorState message={message} />;
  }

  return <>{children}</>;
}
