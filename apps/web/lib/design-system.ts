/**
 * Workforce 360 Design System
 * Central source for layout, glass, motion, and surface tokens.
 * CSS variables in globals.css are the runtime source of truth.
 */

import { cn } from "@/lib/utils";

/* ── Glass surfaces (Apple Liquid Glass) ── */

export const glass = {
  panel: cn(
    "rounded-2xl border border-white/15 bg-white/60 shadow-2xl shadow-black/5 ring-1 ring-white/10 backdrop-blur-xl",
    "dark:border-white/10 dark:bg-zinc-900/55 dark:shadow-black/25 dark:ring-white/5",
  ),
  panelSubtle: cn(
    "rounded-xl border border-white/10 bg-white/40 shadow-lg shadow-black/5 ring-1 ring-white/10 backdrop-blur-lg",
    "dark:border-white/5 dark:bg-zinc-900/40 dark:ring-white/5",
  ),
  nav: cn(
    "border border-white/15 bg-white/50 shadow-xl shadow-black/5 ring-1 ring-white/10 backdrop-blur-2xl",
    "dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-black/30 dark:ring-white/5",
  ),
  overlay: "bg-black/20 backdrop-blur-sm dark:bg-black/40",
  interactive: cn(
    "transition-all duration-300 ease-out",
    "hover:-translate-y-0.5 hover:shadow-black/10 hover:scale-[1.01]",
    "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100",
  ),
} as const;

export const glassPanel = glass.panel;
export const glassPanelInteractive = cn(glass.panel, glass.interactive);

/* ── Layout ── */

export const layout = {
  page: cn("mx-auto w-full max-w-[1400px]", "space-y-8"),
  section: "space-y-6",
  stack: "space-y-4",
  grid12: cn(
    "grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-6 lg:grid-cols-12 lg:gap-8",
  ),
  gutter: "gap-6 lg:gap-8",
} as const;

export const dashboardGrid = layout.grid12;

/* ── Canvas backgrounds ── */

export const appCanvas = "app-canvas relative min-h-full";
export const dashboardCanvas = "dashboard-canvas relative min-h-full";

/* ── Motion ── */

export const motion = {
  fadeIn: cn(
    "animate-in fade-in fill-mode-both duration-500",
    "motion-reduce:animate-none",
  ),
  fadeInUp: cn(
    "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
    "motion-reduce:animate-none",
  ),
  fadeInDown: cn(
    "animate-in fade-in slide-in-from-top-2 fill-mode-both duration-400",
    "motion-reduce:animate-none",
  ),
  scaleIn: cn(
    "animate-in fade-in zoom-in-95 fill-mode-both duration-300",
    "motion-reduce:animate-none",
  ),
  stagger: (ms: number) => `[animation-delay:${ms}ms]`,
} as const;

export const fadeInUp = motion.fadeInUp;

/* ── Icon sizing ── */

export const iconSize = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
  xl: "size-6",
} as const;

/* ── Radius ── */

export const radius = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  full: "rounded-full",
} as const;

/* ── Shadows ── */

export const shadow = {
  sm: "shadow-sm shadow-black/5",
  md: "shadow-md shadow-black/5",
  lg: "shadow-lg shadow-black/8",
  xl: "shadow-xl shadow-black/10",
  glass: "shadow-2xl shadow-black/10",
} as const;

/* ── Status surfaces ── */

export const statusSurface = {
  success: cn(
    "border border-emerald-200/60 bg-emerald-50/80 text-emerald-900",
    "dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
  ),
  warning: cn(
    "border border-amber-200/60 bg-amber-50/80 text-amber-900",
    "dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
  ),
  error: cn(
    "border border-rose-200/60 bg-rose-50/80 text-rose-900",
    "dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200",
  ),
  info: cn(
    "border border-blue-200/60 bg-blue-50/80 text-blue-900",
    "dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200",
  ),
} as const;
