import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryProvider } from "@/components/providers/query-provider";
import { useQueryClient } from "@tanstack/react-query";

function QueryDefaultsProbe() {
  const client = useQueryClient();
  const defaults = client.getDefaultOptions().queries;
  return (
    <div>
      <span data-testid="stale">{defaults?.staleTime}</span>
      <span data-testid="retry">{defaults?.retry}</span>
      <span data-testid="focus">{String(defaults?.refetchOnWindowFocus)}</span>
    </div>
  );
}

describe("QueryProvider", () => {
  it("renders children", () => {
    render(
      <QueryProvider>
        <div>Child content</div>
      </QueryProvider>,
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("configures QueryClient default options", () => {
    render(
      <QueryProvider>
        <QueryDefaultsProbe />
      </QueryProvider>,
    );

    expect(screen.getByTestId("stale")).toHaveTextContent("30000");
    expect(screen.getByTestId("retry")).toHaveTextContent("1");
    expect(screen.getByTestId("focus")).toHaveTextContent("false");
  });
});
