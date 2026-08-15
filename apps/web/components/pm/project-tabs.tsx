"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", suffix: "" },
  { label: "Board", suffix: "/board" },
  { label: "Backlog", suffix: "/backlog" },
  { label: "Sprints", suffix: "/sprints" },
  { label: "Team", suffix: "/team" },
  { label: "Budget", suffix: "/budget" },
] as const;

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/pm/projects/${projectId}`;

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-2" aria-label="Project sections">
      {TABS.map((tab) => {
        const href = `${base}${tab.suffix}`;
        const active =
          tab.suffix === ""
            ? pathname === base
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={tab.suffix}
            href={href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
