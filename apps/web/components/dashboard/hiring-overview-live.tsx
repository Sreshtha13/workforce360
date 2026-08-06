"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/dashboard/glass-card";
import { MiniChart } from "@/components/dashboard/mini-chart";
import { PIPELINE_LABELS, type PipelineStatus } from "@/types/phase2";

type HiringOverviewProps = {
  className?: string;
  openJobs?: number;
  pipeline?: { status: PipelineStatus; _count: { _all: number } }[];
  loading?: boolean;
};

export function HiringOverview({
  className,
  openJobs = 0,
  pipeline = [],
  loading,
}: HiringOverviewProps) {
  const countFor = (status: PipelineStatus) =>
    pipeline.find((s) => s.status === status)?._count._all ?? 0;

  const stages: PipelineStatus[] = ["APPLIED", "INTERVIEW", "OFFER"];
  const stageCounts = stages.map(countFor);
  const maxCount = Math.max(...stageCounts, 0);

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
        <Link href="/hr/pipeline">
          <Badge variant="outline" className="cursor-pointer text-[10px] hover:bg-white/50">
            View pipeline
          </Badge>
        </Link>
      </div>

      <div className="space-y-4 px-6 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tabular-nums">{loading ? "—" : openJobs}</p>
            <p className="text-xs text-muted-foreground">Open positions</p>
          </div>
          <MiniChart
            data={
              openJobs === 0
                ? [0, 0, 0, 0, 0, 0, 0]
                : [1, 2, openJobs, openJobs, openJobs, openJobs, openJobs]
            }
            color="indigo"
            className="h-10 w-24"
          />
        </div>

        <div className="space-y-2">
          {stages.map((stage) => {
            const count = countFor(stage);
            // Zero values must render as 0% width (not a fake minimum bar).
            const width = maxCount === 0 || count === 0 ? "0%" : `${(count / maxCount) * 100}%`;
            return (
              <div key={stage} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{PIPELINE_LABELS[stage]}</span>
                  <span className="font-medium tabular-nums">{loading ? "—" : count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/40 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500/60 to-indigo-400/40 transition-[width]"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
