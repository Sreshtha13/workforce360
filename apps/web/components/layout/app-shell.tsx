import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { typographyScale } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  title?: string;
};

/**
 * Base application chrome — sidebar + header placeholders.
 * Real navigation / RBAC-aware menus land in later phases.
 */
export function AppShell({ children, title = "Workforce 360" }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50 via-background to-background">
      <aside
        className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col"
        aria-label="Primary"
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-sm font-semibold text-white">
            W
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              Workforce 360
            </p>
            <p className={cn(typographyScale.caption.className, "truncate")}>
              ERP
            </p>
          </div>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Modules">
          <p className={cn(typographyScale.label.className, "px-2 py-2")}>
            Navigation
          </p>
          <div className="rounded-md border border-dashed border-sidebar-border px-3 py-8 text-center">
            <p className={typographyScale.caption.className}>
              Sidebar nav placeholder — modules arrive in later phases.
            </p>
          </div>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className={typographyScale.caption.className}>Phase 0 foundation</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <div>
            <p className={typographyScale.label.className}>Workspace</p>
            <h1 className={typographyScale.subtitle.className}>{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className={typographyScale.caption.className}>Signed in as</p>
              <p className="text-sm font-medium">Placeholder User</p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800"
              aria-hidden
            >
              PU
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
