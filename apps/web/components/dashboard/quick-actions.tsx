import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/dashboard/glass-card";

type QuickActionsProps = {
  adminItems: NavItem[];
  className?: string;
};

export function QuickActions({ adminItems, className }: QuickActionsProps) {
  const actions = adminItems.slice(0, 5).map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    description: `Manage ${item.label.toLowerCase()}`,
  }));

  return (
    <GlassCard className={cn(fadeInUp, "flex flex-col lg:col-span-4", className)}>
      <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
        <h2 className="text-lg font-semibold tracking-tight">Quick actions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jump to administration modules you can access
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {actions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60">
              <ArrowUpRight className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No admin actions available</p>
            <p className="text-xs text-muted-foreground">
              Permissions will unlock shortcuts here as your role expands.
            </p>
          </div>
        ) : (
          actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/40 dark:hover:bg-white/5"
                render={<Link href={action.href} />}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/50 ring-1 ring-white/20 dark:bg-white/5 dark:ring-white/10">
                  <Icon className="size-4 text-brand-700 dark:text-brand-300" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{action.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
              </Button>
            );
          })
        )}
      </div>
    </GlassCard>
  );
}
