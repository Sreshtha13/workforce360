import { describe, it, expect } from "vitest";
import {
  calculateSlaDueDates,
  generateTicketNumber,
  normalizeTicketPriority,
} from "../lib/ticket-sla";

describe("ticket SLA helpers", () => {
  it("calculates first response and resolution due dates from minutes", () => {
    const createdAt = new Date("2026-08-12T10:00:00.000Z");
    const dues = calculateSlaDueDates(createdAt, {
      firstResponseMinutes: 60,
      resolutionMinutes: 480,
    });

    expect(dues.firstResponseDueAt.toISOString()).toBe("2026-08-12T11:00:00.000Z");
    expect(dues.resolutionDueAt.toISOString()).toBe("2026-08-12T18:00:00.000Z");
  });

  it("normalizes priority aliases to TicketPriority enum", () => {
    expect(normalizeTicketPriority("high")).toBe("HIGH");
    expect(normalizeTicketPriority("URGENT")).toBe("URGENT");
    expect(normalizeTicketPriority("critical")).toBe("URGENT");
    expect(normalizeTicketPriority(undefined)).toBe("MEDIUM");
  });

  it("generates TKT-YYYYMMDD-xxxx ticket numbers", () => {
    const n = generateTicketNumber(new Date("2026-08-12T00:00:00Z"), "ab12");
    expect(n).toBe("TKT-20260812-ab12");
  });
});
