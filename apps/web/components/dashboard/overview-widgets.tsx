"use client";

import { Clock } from "lucide-react";
import type { AdminDashboard } from "@/types/phase2";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/dashboard/glass-card";

type AttendanceSummaryProps = {
  data?: AdminDashboard["attendance"];
  className?: string;
};

export function AttendanceSummary({ data, className }: AttendanceSummaryProps) {
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
          Not enabled
        </Badge>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-6">
        <p className="text-sm text-muted-foreground">
          {data?.message ??
            "Attendance tracking is not yet enabled. Data will appear here once the module ships."}
        </p>
      </div>
    </GlassCard>
  );
}

export function LeaveOverview({
  data,
  className,
}: {
  data?: AdminDashboard["leave"];
  className?: string;
}) {
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
          Not enabled
        </Badge>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-6">
        <p className="text-sm text-muted-foreground">
          {data?.message ??
            "Leave management is not yet enabled. Request counts will appear here once the module ships."}
        </p>
      </div>
    </GlassCard>
  );
}
