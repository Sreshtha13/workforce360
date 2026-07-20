import { Building2, Clock, UserCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/dashboard/glass-card";
import { MiniChart } from "@/components/dashboard/mini-chart";

type AttendanceSummaryProps = {
  className?: string;
};

export function AttendanceSummary({ className }: AttendanceSummaryProps) {
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
          Preview
        </Badge>
      </div>

      <div className="space-y-4 px-6 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tabular-nums">94%</p>
            <p className="text-xs text-muted-foreground">Present rate</p>
          </div>
          <MiniChart
            data={[88, 91, 89, 93, 92, 94, 94]}
            color="blue"
            className="h-10 w-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/40 p-3 ring-1 ring-white/20 dark:bg-white/5 dark:ring-white/10">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserCheck className="size-3.5" />
              On time
            </div>
            <p className="mt-1 text-lg font-semibold tabular-nums">—</p>
          </div>
          <div className="rounded-xl bg-white/40 p-3 ring-1 ring-white/20 dark:bg-white/5 dark:ring-white/10">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              Remote
            </div>
            <p className="mt-1 text-lg font-semibold tabular-nums">—</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function LeaveOverview({ className }: AttendanceSummaryProps) {
  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col lg:col-span-4", className)}>
      <div className="flex items-start justify-between p-6 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-semibold">Leave overview</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Pending &amp; approved</p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Preview
        </Badge>
      </div>

      <div className="space-y-4 px-6 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tabular-nums">—</p>
            <p className="text-xs text-muted-foreground">Requests this week</p>
          </div>
          <MiniChart
            data={[2, 4, 3, 5, 4, 6, 5]}
            color="amber"
            className="h-10 w-24"
          />
        </div>

        <div className="space-y-2">
          {[
            { label: "Approved", value: "—", tone: "text-emerald-600" },
            { label: "Pending", value: "—", tone: "text-amber-600" },
            { label: "Declined", value: "—", tone: "text-rose-600" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg bg-white/30 px-3 py-2 text-sm dark:bg-white/5"
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span className={cn("font-semibold tabular-nums", row.tone)}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export function HiringOverview({ className }: AttendanceSummaryProps) {
  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col lg:col-span-4", className)}>
      <div className="flex items-start justify-between p-6 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold">Hiring overview</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Open roles &amp; pipeline</p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Preview
        </Badge>
      </div>

      <div className="space-y-4 px-6 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tabular-nums">—</p>
            <p className="text-xs text-muted-foreground">Open positions</p>
          </div>
          <MiniChart
            data={[3, 5, 4, 7, 6, 8, 7]}
            color="indigo"
            className="h-10 w-24"
          />
        </div>

        <div className="space-y-2">
          {[
            { stage: "Applied", count: "—" },
            { stage: "Interview", count: "—" },
            { stage: "Offer", count: "—" },
          ].map((stage) => (
            <div key={stage.stage} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{stage.stage}</span>
                <span className="font-medium tabular-nums">{stage.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/40 dark:bg-white/10">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500/60 to-indigo-400/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
