import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const mockLogout = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/dashboard/global-search", () => ({
  GlobalSearch: () => <div data-testid="global-search" />,
}));

vi.mock("@/components/design-system/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "admin@example.com",
      firstName: "Jane",
      lastName: "Doe",
      roles: [{ id: "r1", name: "Administrator", code: "admin" }],
      permissions: ["user.read", "department.create", "portal.read"],
    },
    logout: mockLogout,
    hasPermission: (permission: string) =>
      ["user.read", "department.create", "portal.read"].includes(permission),
    hasAnyPermission: (...permissions: string[]) =>
      permissions.some((p) =>
        ["user.read", "department.create", "portal.read"].includes(p),
      ),
    isSuperAdmin: false,
  }),
}));

describe("DashboardShell", () => {
  it("renders user info and navigation for authenticated user", () => {
    render(
      <DashboardShell>
        <div>Dashboard content</div>
      </DashboardShell>,
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.getAllByText("admin@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("JD").length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: "Modules" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Users/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Departments/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /My Applications/i })).not.toBeInTheDocument();
  });

  it("calls logout when logout is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>,
    );

    await user.click(screen.getAllByRole("button", { name: "Logout" })[0]);
    expect(mockLogout).toHaveBeenCalledOnce();
  });
});
