"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, ClipboardList } from "lucide-react";
import type { AdminDashboard } from "@/types/phase2";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/dashboard/glass-card";

type PendingApprovalsProps = {
  data?: AdminDashboard["pendingApprovals"];
  loading?: boolean;
  className?: string;
};

export function PendingApprovals({ data, loading, className }: PendingApprovalsProps) {
  const total = data?.total ?? 0;
  const breakdown = data?.breakdown ?? [];
  const primaryHref = breakdown[0]?.href ?? "/hr/onboarding";

  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col lg:col-span-4", className)}>
      <div className="flex items-start justify-between border-b border-white/10 p-6 pb-4 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold tracking-tight">Pending approvals</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Onboarding, offers, and pipeline items</p>
        </div>
        <Badge variant={total > 0 ? "warning" : "secondary"} className="tabular-nums">
          {loading ? "—" : total}
        </Badge>
      </div>

      {loading ? (
        <p className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Loading...
        </p>
      ) : total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <AlertCircle className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
              No pending onboarding, offers, or pipeline items require action.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 p-6">
          <ul className="space-y-2">
            {breakdown.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-white/30 px-3 py-2 text-sm dark:bg-white/5"
              >
                <span>{item.label}</span>
                <Badge variant="warning">{item.count}</Badge>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-auto" asChild>
            <Link href={primaryHref}>
              View approval queue
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
