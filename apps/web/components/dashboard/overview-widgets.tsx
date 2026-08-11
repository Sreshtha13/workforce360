"use client";

import { Clock } from "lucide-react";
import type { AdminDashboard } from "@/types/phase2";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/dashboard/glass-card";

type ModuleAvailability = { available: boolean; message?: string };

type AttendanceSummaryProps = {
  data?: AdminDashboard["attendance"] | ModuleAvailability;
  className?: string;
};

/**
 * Renders only when the attendance module is available with real data.
 * When unavailable, returns null so the dashboard does not show placeholder stats.
 */
export function AttendanceSummary({ data, className }: AttendanceSummaryProps) {
  if (!data || data.available !== true) {
    return null;
  }

  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col lg:col-span-4", className)}>
      <div className="flex items-start justify-between p-6 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold">Attendance</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Today&apos;s snapshot</p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Live
        </Badge>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-6">
        <p className="text-sm text-muted-foreground">
          {"message" in data && data.message
            ? data.message
            : "Attendance data will appear here."}
        </p>
      </div>
    </GlassCard>
  );
}

export function LeaveOverview({
  data,
  className,
}: {
  data?: AdminDashboard["leave"] | ModuleAvailability;
  className?: string;
}) {
  if (!data || data.available !== true) {
    return null;
  }

  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col lg:col-span-4", className)}>
      <div className="flex items-start justify-between p-6 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-semibold">Leave overview</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Pending &amp; approved</p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Live
        </Badge>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-6">
        <p className="text-sm text-muted-foreground">
          {"message" in data && data.message
            ? data.message
            : "Leave data will appear here."}
        </p>
      </div>
    </GlassCard>
  );
}

/** Explicit Coming Soon card for unavailable modules (optional use). */
export function ModuleComingSoonCard({
  title,
  message,
  className,
}: {
  title: string;
  message: string;
  className?: string;
}) {
  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col lg:col-span-4", className)}>
      <div className="flex items-start justify-between p-6 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Coming soon
        </Badge>
      </div>
      <div className="flex flex-1 flex-col justify-center px-6 pb-6">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </GlassCard>
  );
}
