"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  adminNav,
  candidateNav,
  filterNavByPermissions,
  bdNav,
  engineeringNav,
  financeNav,
  hrNav,
  mainNav,
  payrollNav,
  pmNav,
  portalNav,
  reportsNav,
} from "@/lib/navigation";
import { glass, iconSize, motion } from "@/lib/design-system";
import { typographyScale } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { Breadcrumbs, buildBreadcrumbs } from "@/components/design-system/breadcrumbs";
import { ThemeToggle } from "@/components/design-system/theme-toggle";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [hrExpanded, setHrExpanded] = useState(true);
  const [financeExpanded, setFinanceExpanded] = useState(true);
  const [payrollExpanded, setPayrollExpanded] = useState(true);
  const [reportsExpanded, setReportsExpanded] = useState(true);
  const [bdExpanded, setBdExpanded] = useState(true);
  const [pmExpanded, setPmExpanded] = useState(true);
  const [engineeringExpanded, setEngineeringExpanded] = useState(true);
  const [portalExpanded, setPortalExpanded] = useState(true);

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => (await apiClient.notifications.unreadCount()).data?.count ?? 0,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  if (!user) return null;

  const navUser = { permissions: user.permissions, roles: user.roles };
  const visibleMain = filterNavByPermissions(mainNav, navUser);
  const visibleCandidate = filterNavByPermissions(candidateNav, navUser);
  const visibleHr = filterNavByPermissions(hrNav, navUser);
  const visibleFinance = filterNavByPermissions(financeNav, navUser);
  const visiblePayroll = filterNavByPermissions(payrollNav, navUser);
  const visibleReports = filterNavByPermissions(reportsNav, navUser);
  const visibleBd = filterNavByPermissions(bdNav, navUser);
  const visiblePm = filterNavByPermissions(pmNav, navUser);
  const visibleEngineering = filterNavByPermissions(engineeringNav, navUser);
  const visiblePortal = filterNavByPermissions(portalNav, navUser);
  const visibleAdmin = filterNavByPermissions(adminNav, navUser);
  const breadcrumbs = buildBreadcrumbs(pathname);
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
  const unreadCount = unreadQuery.data ?? 0;

  const sidebar = (
    <>
      <div className="flex shrink-0 items-center gap-3 px-4 py-5">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-sm font-bold text-white shadow-lg shadow-brand-600/25 ring-1 ring-white/20">
          W
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight">Workforce 360</p>
          <p className={cn(typographyScale.caption.className, "truncate")}>
            Enterprise HR Platform
          </p>
        </div>
      </div>

      <Separator className="bg-white/10 dark:bg-white/5" />

      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain p-3"
        aria-label="Modules"
      >
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

        {visibleCandidate.length > 0 &&
          visibleCandidate.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}

        {visibleHr.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setHrExpanded((v) => !v)}
              className={cn(
                typographyScale.overline.className,
                "flex w-full items-center justify-between px-2 py-2 text-sidebar-foreground/70",
              )}
            >
              HR & Recruitment
              <ChevronDown
                className={cn(
                  iconSize.sm,
                  "transition-transform",
                  hrExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {hrExpanded &&
              visibleHr.map((item) => (
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

        {visibleFinance.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setFinanceExpanded((v) => !v)}
              className={cn(
                typographyScale.overline.className,
                "flex w-full items-center justify-between px-2 py-2 text-sidebar-foreground/70",
              )}
            >
              Finance
              <ChevronDown
                className={cn(
                  iconSize.sm,
                  "transition-transform",
                  financeExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {financeExpanded &&
              visibleFinance.map((item) => (
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

        {visiblePayroll.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setPayrollExpanded((v) => !v)}
              className={cn(
                typographyScale.overline.className,
                "flex w-full items-center justify-between px-2 py-2 text-sidebar-foreground/70",
              )}
            >
              Payroll
              <ChevronDown
                className={cn(
                  iconSize.sm,
                  "transition-transform",
                  payrollExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {payrollExpanded &&
              visiblePayroll.map((item) => (
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

        {visibleReports.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setReportsExpanded((v) => !v)}
              className={cn(
                typographyScale.overline.className,
                "flex w-full items-center justify-between px-2 py-2 text-sidebar-foreground/70",
              )}
            >
              Reports
              <ChevronDown
                className={cn(
                  iconSize.sm,
                  "transition-transform",
                  reportsExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {reportsExpanded &&
              visibleReports.map((item) => (
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

        {visibleBd.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setBdExpanded((v) => !v)}
              className={cn(
                typographyScale.overline.className,
                "flex w-full items-center justify-between px-2 py-2 text-sidebar-foreground/70",
              )}
            >
              Business Development
              <ChevronDown
                className={cn(
                  iconSize.sm,
                  "transition-transform",
                  bdExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {bdExpanded &&
              visibleBd.map((item) => (
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

        {visiblePm.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setPmExpanded((v) => !v)}
              className={cn(
                typographyScale.overline.className,
                "flex w-full items-center justify-between px-2 py-2 text-sidebar-foreground/70",
              )}
            >
              Project Management
              <ChevronDown
                className={cn(
                  iconSize.sm,
                  "transition-transform",
                  pmExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {pmExpanded &&
              visiblePm.map((item) => (
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

        {visibleEngineering.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setEngineeringExpanded((v) => !v)}
              className={cn(
                typographyScale.overline.className,
                "flex w-full items-center justify-between px-2 py-2 text-sidebar-foreground/70",
              )}
            >
              Engineering
              <ChevronDown
                className={cn(
                  iconSize.sm,
                  "transition-transform",
                  engineeringExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {engineeringExpanded &&
              visibleEngineering.map((item) => (
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

        {visiblePortal.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setPortalExpanded((v) => !v)}
              className={cn(
                typographyScale.overline.className,
                "flex w-full items-center justify-between px-2 py-2 text-sidebar-foreground/70",
              )}
            >
              Employee Portal
              <ChevronDown
                className={cn(
                  iconSize.sm,
                  "transition-transform",
                  portalExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {portalExpanded &&
              visiblePortal.map((item) => (
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

        {visibleAdmin.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setAdminExpanded((v) => !v)}
              className={cn(
                typographyScale.overline.className,
                "flex w-full items-center justify-between px-2 py-2 text-sidebar-foreground/70",
              )}
            >
              Administration
              <ChevronDown
                className={cn(
                  iconSize.sm,
                  "transition-transform",
                  adminExpanded ? "rotate-0" : "-rotate-90",
                )}
              />
            </button>
            {adminExpanded &&
              visibleAdmin.map((item) => (
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

      <div className="shrink-0 border-t border-white/10 p-3 dark:border-white/5">
        <div className="flex items-center gap-3 rounded-xl bg-white/30 p-3 dark:bg-white/5">
          <Avatar size="sm">
            <AvatarFallback className="bg-brand-100 text-xs font-semibold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className={cn(typographyScale.caption.className, "truncate")}>{user.email}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-canvas flex h-dvh overflow-hidden p-3 gap-3">
      <aside
        className={cn(
          "hidden w-[272px] shrink-0 overflow-hidden md:flex md:min-h-0 md:flex-col",
          glass.nav,
          "rounded-2xl",
        )}
        aria-label="Primary"
      >
        {sidebar}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
        <header
          className={cn(
            "z-40 flex h-14 shrink-0 items-center gap-3 rounded-2xl px-4 md:px-6",
            glass.nav,
            motion.fadeInDown,
          )}
        >
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="outline" size="icon-sm" className="md:hidden" />}
            >
              <Menu className={iconSize.md} />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex h-full min-h-0 flex-col overflow-hidden">{sidebar}</div>
            </SheetContent>
          </Sheet>

          <div className="hidden min-w-0 flex-1 flex-col gap-0.5 sm:flex">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          <GlobalSearch />

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />

            <Link
              href="/portal/notifications"
              aria-label={
                unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : "Notifications"
              }
              className="relative inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Bell className={iconSize.md} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

            <div className="hidden items-center gap-2 sm:flex">
              <Avatar size="sm">
                <AvatarFallback className="bg-brand-100 text-xs font-semibold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
                <LogOut className={iconSize.sm} />
                Logout
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={logout} className="sm:hidden">
              Logout
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-6 lg:p-8">
          {children}
        </main>
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
        "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
        active
          ? "bg-white/60 font-medium text-foreground shadow-sm ring-1 ring-white/20 dark:bg-white/10 dark:ring-white/10"
          : "text-muted-foreground hover:bg-white/40 hover:text-foreground dark:hover:bg-white/5",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600 dark:bg-brand-400"
        />
      )}
      <Icon
        className={cn(
          iconSize.md,
          "shrink-0 transition-colors",
          active ? "text-brand-700 dark:text-brand-300" : "opacity-70 group-hover:opacity-100",
        )}
      />
      {label}
    </Link>
  );
}
