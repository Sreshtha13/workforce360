"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlassCard } from "@/components/dashboard/glass-card";

type ActiveEmployeesProps = {
  canViewUsers: boolean;
  className?: string;
};

export function ActiveEmployees({ canViewUsers, className }: ActiveEmployeesProps) {
  const [search, debouncedSearch, setSearch] = useDebouncedValue("", 300);

  const query = useQuery({
    queryKey: ["dashboard", "employees", debouncedSearch],
    queryFn: async () => {
      const res = await apiClient.dashboard.listEmployees(debouncedSearch || undefined);
      return res.data ?? [];
    },
  });

  const employees = query.data ?? [];

  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col overflow-hidden lg:col-span-8", className)}>
      <div className="flex flex-col gap-4 border-b border-white/10 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-brand-700 dark:text-brand-300" />
            <h2 className="text-lg font-semibold tracking-tight">Active employees</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Live directory — account status active, non-deleted users
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search employees..."
            className="border-white/20 bg-white/40 pl-9 backdrop-blur-sm dark:bg-white/5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search employees"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        {query.isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : query.isError ? (
          <p className="p-6 text-sm text-destructive">Failed to load employees.</p>
        ) : employees.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            {debouncedSearch
              ? `No employees match "${debouncedSearch}".`
              : "No active employees found."}
          </p>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-white/40 backdrop-blur-md dark:bg-zinc-900/60">
              <TableRow className="border-white/10 hover:bg-transparent dark:border-white/5">
                <TableHead>Employee</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} className="border-white/10 dark:border-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-brand-100 text-xs font-semibold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
                          {employee.firstName[0]}
                          {employee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {employee.department?.name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {employee.userRoles[0]?.role.name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="success">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canViewUsers ? (
                      <Link
                        href="/admin/users"
                        className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-600 dark:text-brand-300 dark:hover:text-brand-200"
                      >
                        View
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-xs text-muted-foreground dark:border-white/5">
        <span>
          Showing {employees.length} employee{employees.length === 1 ? "" : "s"}
        </span>
        {debouncedSearch && <span>Filtered by &quot;{debouncedSearch}&quot;</span>}
      </div>
    </GlassCard>
  );
}
