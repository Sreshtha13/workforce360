import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp, glassPanelInteractive } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { MiniChart } from "@/components/dashboard/mini-chart";

type MetricStatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  chartColor?: "blue" | "emerald" | "amber" | "rose" | "indigo";
  chartData?: number[];
  className?: string;
  delayClass?: string;
};

export function MetricStatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  chartColor = "blue",
  chartData,
  className,
  delayClass,
}: MetricStatCardProps) {
  const TrendIcon = trend?.direction === "down" ? TrendingDown : TrendingUp;

  return (
    <div
      className={cn(
        glassPanelInteractive,
        fadeInUp,
        "group flex flex-col gap-4 p-5 md:p-6",
        delayClass,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-white/50 shadow-inner ring-1 ring-white/20 dark:bg-white/5 dark:ring-white/10">
          <Icon className="size-5 text-brand-700 dark:text-brand-300" aria-hidden />
        </div>
        {trend && trend.direction !== "neutral" && (
          <Badge
            variant={trend.direction === "up" ? "success" : "destructive"}
            className="gap-1 border-0 bg-white/50 dark:bg-white/10"
          >
            <TrendIcon className="size-3" aria-hidden />
            {trend.value}
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <div className="mt-auto h-8 w-full opacity-80 transition-opacity group-hover:opacity-100">
        <MiniChart data={chartData} color={chartColor} className="h-full w-full" />
      </div>
    </div>
  );
}
