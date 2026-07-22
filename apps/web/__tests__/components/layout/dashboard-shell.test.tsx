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

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "admin@example.com",
      firstName: "Jane",
      lastName: "Doe",
      roles: [],
      permissions: ["user.read", "department.create"],
    },
    logout: mockLogout,
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
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Modules" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Users/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Departments/i })).toBeInTheDocument();
  });

  it("calls logout when logout is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>,
    );

    await user.click(screen.getByRole("button", { name: "Logout" }));
    expect(mockLogout).toHaveBeenCalledOnce();
  });
});
