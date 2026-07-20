import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/design-system";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Administration",
  users: "Users",
  roles: "Roles",
  permissions: "Permissions",
  departments: "Departments",
  teams: "Teams",
  designations: "Designations",
  offices: "Offices",
  "employee-types": "Employee Types",
  "employment-statuses": "Employment Statuses",
};

export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: "Home", href: "/dashboard" }];

  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    const label = routeLabels[segment] ?? segment.replace(/-/g, " ");
    const isLast = segment === segments[segments.length - 1];
    items.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      href: isLast ? undefined : path,
    });
  }

  return items;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className={cn(iconSize.sm, "text-muted-foreground/60")} aria-hidden />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                {index === 0 && <Home className={iconSize.sm} aria-hidden />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                className={cn(
                  "font-medium",
                  isLast ? "text-foreground" : "text-muted-foreground",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
