import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/design-system";
import { GlassCard } from "@/components/dashboard/glass-card";

type AdminShortcutsProps = {
  items: NavItem[];
};

export function AdminShortcuts({ items }: AdminShortcutsProps) {
  if (items.length === 0) return null;

  return (
    <GlassCard className={cn(fadeInUp, "lg:col-span-12")}>
      <div className="border-b border-white/10 p-6 pb-4 dark:border-white/5">
        <h2 className="text-xl font-semibold tracking-tight">Administration</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage organization settings via backend API
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/50 hover:shadow-lg hover:shadow-black/5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/60 ring-1 ring-white/20 transition-transform group-hover:scale-105 dark:bg-white/10 dark:ring-white/10">
                <Icon className="size-4 text-brand-700 dark:text-brand-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-medium">
                  {item.label}
                  <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  Manage {item.label.toLowerCase()} via backend API
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}
