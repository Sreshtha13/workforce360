import { AlertCircle, ArrowRight, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/dashboard/glass-card";

type PendingApprovalsProps = {
  permissionCount: number;
  className?: string;
};

export function PendingApprovals({ permissionCount, className }: PendingApprovalsProps) {
  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col lg:col-span-4", className)}>
      <div className="flex items-start justify-between border-b border-white/10 p-6 pb-4 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold tracking-tight">Pending approvals</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Items awaiting your review
          </p>
        </div>
        <Badge variant="warning" className="tabular-nums">
          0
        </Badge>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="relative">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <AlertCircle className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            ✓
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">You&apos;re all caught up</p>
          <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
            Approval workflows will appear here when modules are enabled. You have{" "}
            {permissionCount} active permissions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          disabled
        >
          View approval queue
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </GlassCard>
  );
}
