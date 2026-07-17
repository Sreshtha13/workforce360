"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { adminNav, filterNavByPermissions } from "@/lib/navigation";
import { typographyScale } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const visibleAdmin = filterNavByPermissions(adminNav, user.permissions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={typographyScale.title.className}>Dashboard</h1>
        <p className={cn(typographyScale.body.className, "mt-2 text-muted-foreground")}>
          Welcome back, {user.firstName}! Your workspace is ready.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Your roles"
          value={String(user.roles.length)}
          description={user.roles.map((r) => r.name).join(", ") || "No roles assigned"}
        />
        <StatCard
          title="Permissions"
          value={String(user.permissions.length)}
          description={`Access to ${user.permissions.length} backend-enforced permissions`}
        />
        <StatCard title="Account status" value="Active" description={user.email} />
      </div>

      {visibleAdmin.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className={cn(typographyScale.subtitle.className, "mb-4")}>Administration</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleAdmin.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border border-border bg-background p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <p className="font-medium">{item.label}</p>
                <p className={cn(typographyScale.caption.className, "mt-1 text-muted-foreground")}>
                  Manage {item.label.toLowerCase()} via backend API
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className={cn(typographyScale.label.className, "text-muted-foreground")}>{title}</p>
      <p className={cn(typographyScale.title.className, "mt-2")}>{value}</p>
      <p className={cn(typographyScale.caption.className, "mt-1 text-muted-foreground")}>
        {description}
      </p>
    </div>
  );
}
