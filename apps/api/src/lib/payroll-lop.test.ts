import { describe, it, expect } from "vitest";
import {
  countWorkingDays,
  daysBetweenInclusive,
  finalizeLop,
  leaveDayKeysInPeriod,
  listWorkingDayKeys,
  lopDaysFromAttendance,
  lopDaysFromUnpaidLeave,
  prorateAmount,
} from "./payroll-lop";

describe("payroll-lop", () => {
  const periodStart = new Date("2024-01-01T00:00:00.000Z");
  const periodEnd = new Date("2024-01-07T00:00:00.000Z"); // Mon–Sun week

  it("counts inclusive calendar days", () => {
    expect(daysBetweenInclusive(periodStart, periodEnd)).toBe(7);
  });

  it("counts Mon–Fri as working days in a week", () => {
    const holidays = new Set<string>();
    expect(countWorkingDays(periodStart, periodEnd, holidays)).toBe(5);
    expect(listWorkingDayKeys(periodStart, periodEnd, holidays)).toHaveLength(5);
  });

  it("excludes holidays from working days", () => {
    const holidays = new Set(["2024-01-01"]); // Monday holiday
    expect(countWorkingDays(periodStart, periodEnd, holidays)).toBe(4);
  });

  it("computes LOP from absent and half-day attendance", () => {
    const workingKeys = listWorkingDayKeys(periodStart, periodEnd, new Set());
    const paidLeave = new Set<string>();
    const lop = lopDaysFromAttendance(
      [
        { date: new Date("2024-01-02T00:00:00.000Z"), status: "ABSENT" },
        { date: new Date("2024-01-03T00:00:00.000Z"), status: "HALF_DAY" },
      ],
      paidLeave,
      workingKeys,
    );
    expect(lop).toBe(1.5);
  });

  it("skips attendance LOP when paid leave covers the day", () => {
    const workingKeys = listWorkingDayKeys(periodStart, periodEnd, new Set());
    const paidLeave = new Set(["2024-01-02"]);
    const lop = lopDaysFromAttendance(
      [{ date: new Date("2024-01-02T00:00:00.000Z"), status: "ABSENT" }],
      paidLeave,
      workingKeys,
    );
    expect(lop).toBe(0);
  });

  it("counts unpaid leave working days", () => {
    const workingKeys = listWorkingDayKeys(periodStart, periodEnd, new Set());
    const unpaidKeys = leaveDayKeysInPeriod(
      [
        {
          startDate: new Date("2024-01-04T00:00:00.000Z"),
          endDate: new Date("2024-01-05T00:00:00.000Z"),
          status: "APPROVED",
          leaveType: { code: "UNPAID", name: "Unpaid" },
        },
      ],
      periodStart,
      periodEnd,
      true,
    );
    expect(lopDaysFromUnpaidLeave(unpaidKeys, workingKeys)).toBe(2);
  });

  it("caps LOP at working days and computes paid days", () => {
    expect(finalizeLop(22, 25)).toEqual({ workingDays: 22, lopDays: 22, paidDays: 0 });
    expect(finalizeLop(22, 3)).toEqual({ workingDays: 22, lopDays: 3, paidDays: 19 });
  });

  it("prorates salary by paid/working ratio", () => {
    expect(prorateAmount(31000, 19, 22)).toBe(26772.73);
    expect(prorateAmount(1000, 22, 22)).toBe(1000);
  });
});
