"use client";

import Link from "next/link";
import {
  Briefcase,
  CalendarOff,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
} from "lucide-react";
import type { AdminDashboard } from "@/types/phase2";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/dashboard/glass-card";

const activityIcons: Record<string, typeof CheckCircle2> = {
  hire_candidate: Briefcase,
  lifecycle_change: UserCheck,
  assign_asset: FileText,
  default: Clock,
};

const activityColors: Record<string, string> = {
  hire_candidate: "text-indigo-600 bg-indigo-500/10",
  lifecycle_change: "text-emerald-600 bg-emerald-500/10",
  assign_asset: "text-blue-600 bg-blue-500/10",
  default: "text-rose-600 bg-rose-500/10",
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

type RecentActivityProps = {
  items?: AdminDashboard["recentActivity"];
  loading?: boolean;
  className?: string;
};

export function RecentActivity({ items = [], loading, className }: RecentActivityProps) {
  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col lg:col-span-8", className)}>
      <div className="flex items-center justify-between border-b border-white/10 p-6 pb-4 dark:border-white/5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">Latest audit log events</p>
        </div>
      </div>

      {loading ? (
        <p className="p-6 text-sm text-muted-foreground">Loading activity...</p>
      ) : items.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">No recent activity recorded yet.</p>
      ) : (
        <ul className="divide-y divide-white/10 dark:divide-white/5">
          {items.map((item) => {
            const Icon = activityIcons[item.action] ?? activityIcons.default;
            const colorClass = activityColors[item.action] ?? activityColors.default;

            return (
              <li
                key={item.id}
                className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-white/30 dark:hover:bg-white/5"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    colorClass,
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {item.action.replace(/_/g, " ")}
                    <span className="font-normal text-muted-foreground"> · {item.entity}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.actor?.name ?? "System"}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(item.createdAt)}
                </time>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-white/10 p-4 dark:border-white/5">
        <Link
          href="/admin/users"
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/30 dark:hover:bg-white/5"
        >
          <FileText className="size-4" />
          View administration
        </Link>
      </div>
    </GlassCard>
  );
}
