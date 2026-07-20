/**
 * Workforce 360 Design Tokens
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
    info: "oklch(0.55 0.12 240)",
  },
} as const;

/** 8px-based spacing scale */
export const spacingScale = {
  xs: "2",   // 8px
  sm: "3",   // 12px
  md: "4",   // 16px
  lg: "6",   // 24px
  xl: "8",   // 32px
  page: "p-4 md:p-6 lg:p-8",
  section: "space-y-8",
  stack: "space-y-4",
  gutter: "gap-6 lg:gap-8",
} as const;

export const typographyScale = {
  display: {
    className: "text-3xl font-bold tracking-tight md:text-4xl",
    size: "1.875rem / 2.25rem",
  },
  pageTitle: {
    className: "text-2xl font-bold tracking-tight md:text-[2rem] md:leading-tight",
    size: "1.5rem / 2rem",
  },
  sectionTitle: {
    className: "text-xl font-semibold tracking-tight",
    size: "1.25rem / 1.75rem",
  },
  cardTitle: {
    className: "text-base font-semibold leading-none tracking-tight",
    size: "1rem / 1.25rem",
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
  label: {
    className: "text-sm font-medium leading-none",
    size: "0.875rem / 1rem",
  },
  caption: {
    className: "text-xs leading-normal text-muted-foreground",
    size: "0.75rem / 1rem",
  },
  helper: {
    className: "text-xs leading-normal text-muted-foreground",
    size: "0.75rem / 1rem",
  },
  overline: {
    className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
    size: "0.75rem / 1rem",
  },
} as const;

export const radiusScale = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
} as const;

export const motionScale = {
  fast: "150ms",
  normal: "300ms",
  slow: "500ms",
} as const;
