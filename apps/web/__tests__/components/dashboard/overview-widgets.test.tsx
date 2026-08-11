import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AttendanceSummary,
  LeaveOverview,
  ModuleComingSoonCard,
} from "@/components/dashboard/overview-widgets";

describe("overview widgets availability", () => {
  it("hides AttendanceSummary when module is unavailable", () => {
    const { container } = render(
      <AttendanceSummary data={{ available: false, message: "Not enabled" }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("hides LeaveOverview when module is unavailable", () => {
    const { container } = render(
      <LeaveOverview data={{ available: false, message: "Not enabled" }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders Coming Soon card with explicit messaging", () => {
    render(
      <ModuleComingSoonCard
        title="Attendance"
        message="Attendance tracking is not yet enabled."
      />,
    );
    expect(screen.getByText("Attendance")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByText(/not yet enabled/i)).toBeInTheDocument();
  });
});
