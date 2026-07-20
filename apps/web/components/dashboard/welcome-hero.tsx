"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Sparkles,
  UserPlus,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth-context";
import type { NavItem } from "@/lib/navigation";
import { fadeInUp } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/dashboard/glass-card";

type WelcomeHeroProps = {
  user: AuthUser;
  adminItems: NavItem[];
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function WelcomeHero({ user, adminItems }: WelcomeHeroProps) {
  const primaryRole = user.roles[0]?.name ?? "Team Member";
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
  const primaryAction = adminItems[0];

  return (
    <GlassCard
      className={cn(
        fadeInUp,
        "relative overflow-hidden p-0 lg:col-span-12",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/15 via-indigo-500/10 to-emerald-500/10 dark:from-brand-400/20 dark:via-indigo-400/10 dark:to-emerald-400/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-white/20 blur-3xl dark:bg-white/5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-brand-400/20 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4 md:gap-5">
          <Avatar size="lg" className="size-14 ring-2 ring-white/30 dark:ring-white/10">
            <AvatarFallback className="bg-brand-600/90 text-base font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="border-white/20 bg-white/40 text-foreground backdrop-blur-sm dark:bg-white/10"
              >
                <Sparkles className="mr-1 size-3" />
                Workspace ready
              </Badge>
              <Badge variant="outline" className="border-white/30 bg-white/20 dark:bg-white/5">
                {primaryRole}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {getGreeting()}
              </p>
              <h1 className="text-2xl font-bold tracking-tight md:text-[2rem] md:leading-tight">
                Welcome back, {user.firstName}
              </h1>
            </div>

            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Your workforce hub is configured with{" "}
              <span className="font-medium text-foreground">{user.roles.length}</span>{" "}
              {user.roles.length === 1 ? "role" : "roles"} and{" "}
              <span className="font-medium text-foreground">{user.permissions.length}</span>{" "}
              backend-enforced permissions. Account status is active.
            </p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              <time dateTime={new Date().toISOString().split("T")[0]}>
                {formatDate(new Date())}
              </time>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
          {primaryAction ? (
            <Button
              className="shadow-lg shadow-brand-600/20"
              render={<Link href={primaryAction.href} />}
            >
              <UserPlus data-icon="inline-start" />
              {primaryAction.label}
              <ArrowRight data-icon="inline-end" className="opacity-70" />
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="border-white/30 bg-white/30 backdrop-blur-sm dark:bg-white/5"
            disabled
          >
            View profile
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
