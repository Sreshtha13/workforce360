"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, Building2, User } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/design-system";

export function GlobalSearch({ className }: { className?: string }) {
  const { hasPermission } = useAuth();
  const canSearch = hasPermission("dashboard.read");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const searchQuery = useQuery({
    queryKey: ["dashboard", "search", debounced],
    queryFn: async () => {
      const res = await apiClient.dashboard.search(debounced);
      return res.data ?? { employees: [], departments: [] };
    },
    enabled: canSearch && debounced.length >= 2,
  });

  const employees = searchQuery.data?.employees ?? [];
  const departments = searchQuery.data?.departments ?? [];
  const hasResults = employees.length > 0 || departments.length > 0;

  if (!canSearch) {
    return (
      <div className={cn("relative hidden min-w-0 flex-1 sm:block sm:max-w-sm lg:max-w-md", className)}>
        <Search
          className={cn(
            iconSize.md,
            "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground",
          )}
        />
        <Input
          placeholder="Search requires user.read permission"
          className="border-white/20 bg-white/40 pl-9 dark:bg-white/5"
          disabled
          aria-label="Global search unavailable"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative hidden min-w-0 flex-1 sm:block sm:max-w-sm lg:max-w-md", className)}
    >
      <Search
        className={cn(
          iconSize.md,
          "pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground",
        )}
      />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search employees, departments..."
        className="border-white/20 bg-white/40 pl-9 dark:bg-white/5"
        aria-label="Global search"
        aria-expanded={open}
        aria-controls="global-search-results"
      />

      {open && debounced.length >= 2 && (
        <div
          id="global-search-results"
          className="absolute top-full z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-white/20 bg-background/95 p-2 shadow-lg backdrop-blur-md dark:border-white/10"
          role="listbox"
        >
          {searchQuery.isLoading && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>
          )}
          {searchQuery.isError && (
            <p className="px-3 py-2 text-sm text-destructive">Search failed. Try again.</p>
          )}
          {!searchQuery.isLoading && !searchQuery.isError && !hasResults && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No matches for “{debounced}”.</p>
          )}

          {employees.length > 0 && (
            <div className="mb-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Employees
              </p>
              {employees.map((emp) => (
                <Link
                  key={emp.id}
                  href={`/admin/users`}
                  role="option"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white/50 dark:hover:bg-white/10"
                >
                  <User className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    {emp.firstName} {emp.lastName}
                    {emp.employeeId ? ` · ${emp.employeeId}` : ""}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {emp.department?.name ?? emp.email}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {departments.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Departments
              </p>
              {departments.map((dept) => (
                <Link
                  key={dept.id}
                  href="/admin/departments"
                  role="option"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white/50 dark:hover:bg-white/10"
                >
                  <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {dept.name}
                    {dept.code ? ` (${dept.code})` : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
