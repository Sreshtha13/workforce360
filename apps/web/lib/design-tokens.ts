/**
 * Starter design tokens for Workforce 360.
 * CSS variables in globals.css are the runtime source; this module
 * documents the scale for TypeScript consumers.
 */

export const colorTokens = {
  brand: {
    50: "oklch(0.97 0.02 210)",
    100: "oklch(0.93 0.03 210)",
    200: "oklch(0.86 0.05 210)",
    300: "oklch(0.76 0.07 210)",
    400: "oklch(0.64 0.09 210)",
    500: "oklch(0.52 0.10 210)",
    600: "oklch(0.44 0.09 210)",
    700: "oklch(0.36 0.08 210)",
    800: "oklch(0.29 0.06 210)",
    900: "oklch(0.22 0.04 210)",
  },
  surface: {
    canvas: "var(--background)",
    raised: "var(--card)",
    muted: "var(--muted)",
    sidebar: "var(--sidebar)",
  },
  text: {
    primary: "var(--foreground)",
    secondary: "var(--muted-foreground)",
    inverse: "var(--primary-foreground)",
  },
  border: {
    default: "var(--border)",
    strong: "var(--ring)",
  },
  status: {
    success: "oklch(0.55 0.14 150)",
    warning: "oklch(0.72 0.14 75)",
    danger: "var(--destructive)",
  },
} as const;

export const typographyScale = {
  display: {
    className: "text-3xl font-semibold tracking-tight md:text-4xl",
    size: "1.875rem / 2.25rem",
  },
  title: {
    className: "text-xl font-semibold tracking-tight md:text-2xl",
    size: "1.25rem / 1.75rem",
  },
  subtitle: {
    className: "text-base font-medium",
    size: "1rem / 1.5rem",
  },
  body: {
    className: "text-sm leading-relaxed",
    size: "0.875rem / 1.25rem",
  },
  caption: {
    className: "text-xs text-muted-foreground",
    size: "0.75rem / 1rem",
  },
  label: {
    className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
    size: "0.75rem / 1rem",
  },
} as const;

export const spacingScale = {
  page: "p-4 md:p-6 lg:p-8",
  section: "space-y-6",
  stack: "space-y-3",
} as const;
