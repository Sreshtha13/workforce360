import {
  Briefcase,
  CalendarOff,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/dashboard/glass-card";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "approval" | "leave" | "hire" | "attendance" | "profile";
};

const activityIcons = {
  approval: CheckCircle2,
  leave: CalendarOff,
  hire: Briefcase,
  attendance: Clock,
  profile: UserCheck,
};

const activityColors = {
  approval: "text-emerald-600 bg-emerald-500/10",
  leave: "text-amber-600 bg-amber-500/10",
  hire: "text-indigo-600 bg-indigo-500/10",
  attendance: "text-blue-600 bg-blue-500/10",
  profile: "text-rose-600 bg-rose-500/10",
};

/** Static preview data — visual placeholder until activity feed API ships */
const previewActivity: ActivityItem[] = [
  {
    id: "1",
    title: "Session verified",
    description: "Authenticated via backend JWT",
    time: "Just now",
    type: "profile",
  },
  {
    id: "2",
    title: "Permissions synced",
    description: "RBAC policies loaded from server",
    time: "Today",
    type: "approval",
  },
  {
    id: "3",
    title: "Workspace initialized",
    description: "Phase 1 foundation modules ready",
    time: "Today",
    type: "hire",
  },
];

type RecentActivityProps = {
  className?: string;
};

export function RecentActivity({ className }: RecentActivityProps) {
  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col lg:col-span-8", className)}>
      <div className="flex items-center justify-between border-b border-white/10 p-6 pb-4 dark:border-white/5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest events across your workspace
          </p>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex">
          Preview
        </Badge>
      </div>

      <ul className="divide-y divide-white/10 dark:divide-white/5">
        {previewActivity.map((item) => {
          const Icon = activityIcons[item.type];
          const colorClass = activityColors[item.type];

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
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              </div>
              <time className="shrink-0 text-xs text-muted-foreground">{item.time}</time>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-white/10 p-4 dark:border-white/5">
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/5"
        >
          <FileText className="size-4" />
          View full activity log (coming soon)
        </button>
      </div>
    </GlassCard>
  );
}
