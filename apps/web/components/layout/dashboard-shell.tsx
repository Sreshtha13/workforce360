"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminNav, filterNavByPermissions, mainNav } from "@/lib/navigation";
import { typographyScale } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const permissions = user.permissions;
  const visibleMain = filterNavByPermissions(mainNav, permissions);
  const visibleAdmin = filterNavByPermissions(adminNav, permissions);

  const sidebar = (
    <>
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
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Modules">
        {visibleMain.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}

        {visibleAdmin.length > 0 && (
          <div className="mt-4">
            <p
              className={cn(
                typographyScale.label.className,
                "px-2 py-2 text-sidebar-foreground/70",
              )}
            >
              Administration
            </p>
            {visibleAdmin.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </div>
        )}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <p className={typographyScale.caption.className}>Phase 1 foundation</p>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50 via-background to-background">
      <aside
        className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col"
        aria-label="Primary"
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="outline" size="icon-sm" className="md:hidden" />}
            >
              <Menu className="size-4" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
                {sidebar}
              </div>
            </SheetContent>
          </Sheet>

          <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search modules, users, departments..."
              className="pl-9"
              disabled
              aria-label="Global search (coming soon)"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon-sm" disabled aria-label="Notifications (coming soon)">
              <Bell className="size-4" />
            </Button>

            <div className="hidden text-right sm:block">
              <p className={typographyScale.caption.className}>Signed in as</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800"
              aria-hidden
            >
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0 opacity-80" />
      {label}
    </Link>
  );
}
