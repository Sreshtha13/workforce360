import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "@/components/admin/data-table";

type Row = { id: string; name: string; email: string };

const columns = [
  { key: "name", header: "Name", render: (row: Row) => row.name },
  { key: "email", header: "Email", render: (row: Row) => row.email },
];

describe("DataTable", () => {
  it("renders empty state when no data", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey={(row) => row.id}
        emptyMessage="No users found"
      />,
    );

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("renders column headers and rows", () => {
    const data: Row[] = [
      { id: "1", name: "Jane Doe", email: "jane@example.com" },
      { id: "2", name: "John Smith", email: "john@example.com" },
    ];

    render(
      <DataTable columns={columns} data={data} rowKey={(row) => row.id} />,
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("uses default empty message", () => {
    render(
      <DataTable columns={columns} data={[]} rowKey={(row) => row.id} />,
    );

    expect(screen.getByText("No records found")).toBeInTheDocument();
  });
});

describe("Admin state components", () => {
  it("AlertBanner renders message and dismiss button", async () => {
    const { AlertBanner } = await import("@/components/admin/admin-states");
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <AlertBanner variant="error" message="Something went wrong" onDismiss={onDismiss} />,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("EmptyState renders title, description, and action", async () => {
    const { EmptyState } = await import("@/components/admin/admin-states");
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        title="No data"
        description="Create your first record"
        actionLabel="Create"
        onAction={onAction}
      />,
    );

    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("Create your first record")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("LoadingState renders default message", async () => {
    const { LoadingState } = await import("@/components/admin/admin-states");
    render(<LoadingState />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("ErrorState renders message and retry button", async () => {
    const { ErrorState } = await import("@/components/admin/admin-states");
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(<ErrorState message="Failed to load" onRetry={onRetry} />);

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
