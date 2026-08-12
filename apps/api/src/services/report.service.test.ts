import { describe, expect, it } from "vitest";
import { computeNextRunAt } from "../services/report.service";

describe("computeNextRunAt", () => {
  it("schedules the next daily hour after from", () => {
    const from = new Date(Date.UTC(2026, 0, 1, 10, 0, 0));
    const next = computeNextRunAt("DAILY", 8, null, from);
    expect(next.toISOString()).toBe("2026-01-02T08:00:00.000Z");
  });

  it("schedules weekly on target weekday", () => {
    // 2026-01-01 is Thursday (4). Target Monday (1).
    const from = new Date(Date.UTC(2026, 0, 1, 10, 0, 0));
    const next = computeNextRunAt("WEEKLY", 8, 1, from);
    expect(next.getUTCDay()).toBe(1);
    expect(next.getUTCHours()).toBe(8);
  });
});
