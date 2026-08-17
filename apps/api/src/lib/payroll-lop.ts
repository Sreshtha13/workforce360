import { prisma } from "./prisma";

/** Count calendar days inclusive of both endpoints. */
export function daysBetweenInclusive(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Monday–Friday, excluding configured holidays. */
export function countWorkingDays(
  periodStart: Date,
  periodEnd: Date,
  holidayDates: Set<string>,
): number {
  let count = 0;
  const cursor = new Date(periodStart);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(periodEnd);
  end.setUTCHours(0, 0, 0, 0);

  while (cursor <= end) {
    const day = cursor.getUTCDay();
    const key = toDateKey(cursor);
    if (day !== 0 && day !== 6 && !holidayDates.has(key)) {
      count += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

/** Enumerate working-day keys (YYYY-MM-DD) in the pay period. */
export function listWorkingDayKeys(
  periodStart: Date,
  periodEnd: Date,
  holidayDates: Set<string>,
): string[] {
  const keys: string[] = [];
  const cursor = new Date(periodStart);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(periodEnd);
  end.setUTCHours(0, 0, 0, 0);

  while (cursor <= end) {
    const day = cursor.getUTCDay();
    const key = toDateKey(cursor);
    if (day !== 0 && day !== 6 && !holidayDates.has(key)) {
      keys.push(key);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function isDateInRange(dateKey: string, start: Date, end: Date): boolean {
  const d = parseDateKey(dateKey).getTime();
  const s = new Date(start);
  s.setUTCHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setUTCHours(0, 0, 0, 0);
  return d >= s.getTime() && d <= e.getTime();
}

/** Build a set of date keys covered by approved leave applications. */
export function leaveDayKeysInPeriod(
  applications: Array<{
    startDate: Date;
    endDate: Date;
    status: string;
    policy: { leaveType: string };
  }>,
  periodStart: Date,
  periodEnd: Date,
  unpaidOnly: boolean,
): Set<string> {
  const keys = new Set<string>();
  for (const app of applications) {
    if (app.status !== "APPROVED") continue;
    if (unpaidOnly && app.policy.leaveType !== "UNPAID") continue;
    if (!unpaidOnly && app.policy.leaveType === "UNPAID") continue;

    const cursor = new Date(app.startDate);
    cursor.setUTCHours(0, 0, 0, 0);
    const end = new Date(app.endDate);
    end.setUTCHours(0, 0, 0, 0);

    while (cursor <= end) {
      const key = toDateKey(cursor);
      if (isDateInRange(key, periodStart, periodEnd)) {
        keys.add(key);
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return keys;
}

export type AttendanceLopInput = {
  date: Date;
  status: string;
};

/**
 * LOP from attendance: ABSENT = 1 day, HALF_DAY = 0.5 day.
 * Days covered by approved paid leave are excluded to avoid double-counting.
 */
export function lopDaysFromAttendance(
  records: AttendanceLopInput[],
  paidLeaveDayKeys: Set<string>,
  workingDayKeys: string[],
): number {
  const workingSet = new Set(workingDayKeys);
  let lop = 0;

  for (const record of records) {
    const key = toDateKey(record.date);
    if (!workingSet.has(key)) continue;
    if (paidLeaveDayKeys.has(key)) continue;

    if (record.status === "ABSENT") {
      lop += 1;
    } else if (record.status === "HALF_DAY") {
      lop += 0.5;
    }
  }
  return lop;
}

/** Unpaid leave working days in the pay period. */
export function lopDaysFromUnpaidLeave(
  unpaidLeaveDayKeys: Set<string>,
  workingDayKeys: string[],
): number {
  const workingSet = new Set(workingDayKeys);
  let count = 0;
  for (const key of unpaidLeaveDayKeys) {
    if (workingSet.has(key)) count += 1;
  }
  return count;
}

export type EmployeeLopResult = {
  workingDays: number;
  lopDays: number;
  paidDays: number;
};

export function finalizeLop(workingDays: number, lopDays: number): EmployeeLopResult {
  const roundedLop = Math.round(lopDays * 2) / 2;
  const cappedLop = Math.min(roundedLop, workingDays);
  return {
    workingDays,
    lopDays: cappedLop,
    paidDays: Math.max(0, workingDays - cappedLop),
  };
}

/** Prorate a monthly salary component by paid/working days. */
export function prorateAmount(amount: number, paidDays: number, workingDays: number): number {
  if (workingDays <= 0) return 0;
  return Math.round((amount * paidDays) / workingDays * 100) / 100;
}

export type BatchLopParams = {
  employeeIds: string[];
  periodStart: Date;
  periodEnd: Date;
};

/** Batch-compute LOP for active employees in a payroll run. */
export async function computeBatchEmployeeLop(
  params: BatchLopParams,
): Promise<Map<string, EmployeeLopResult>> {
  const { employeeIds, periodStart, periodEnd } = params;
  const result = new Map<string, EmployeeLopResult>();

  if (employeeIds.length === 0) return result;

  // Holiday calendar not yet in Prisma schema — exclude weekends only for now.
  const holidayDates = new Set<string>();
  const workingDayKeys = listWorkingDayKeys(periodStart, periodEnd, holidayDates);
  const workingDays = workingDayKeys.length;

  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds }, deletedAt: null },
    select: { id: true, userId: true },
  });
  const userIdByEmployee = new Map(employees.map((e) => [e.id, e.userId]));
  const userIds = employees.map((e) => e.userId);

  const [attendanceRecords, leaveApplications] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: {
        userId: { in: userIds },
        date: { gte: periodStart, lte: periodEnd },
        deletedAt: null,
        status: { in: ["ABSENT", "HALF_DAY"] },
      },
      select: { userId: true, date: true, status: true },
    }),
    prisma.leaveApplication.findMany({
      where: {
        userId: { in: userIds },
        status: "APPROVED",
        deletedAt: null,
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      select: {
        userId: true,
        startDate: true,
        endDate: true,
        status: true,
        policy: { select: { leaveType: true } },
      },
    }),
  ]);

  const attendanceByUser = new Map<string, AttendanceLopInput[]>();
  for (const row of attendanceRecords) {
    const list = attendanceByUser.get(row.userId) ?? [];
    list.push({ date: row.date, status: row.status });
    attendanceByUser.set(row.userId, list);
  }

  const leaveByUser = new Map<string, typeof leaveApplications>();
  for (const row of leaveApplications) {
    const list = leaveByUser.get(row.userId) ?? [];
    list.push(row);
    leaveByUser.set(row.userId, list);
  }

  for (const employeeId of employeeIds) {
    const userId = userIdByEmployee.get(employeeId);
    if (!userId) {
      result.set(employeeId, { workingDays, lopDays: 0, paidDays: workingDays });
      continue;
    }

    const userLeaves = leaveByUser.get(userId) ?? [];
    const paidLeaveKeys = leaveDayKeysInPeriod(userLeaves, periodStart, periodEnd, false);
    const unpaidLeaveKeys = leaveDayKeysInPeriod(userLeaves, periodStart, periodEnd, true);

    const attendanceLop = lopDaysFromAttendance(
      attendanceByUser.get(userId) ?? [],
      paidLeaveKeys,
      workingDayKeys,
    );
    const unpaidLop = lopDaysFromUnpaidLeave(unpaidLeaveKeys, workingDayKeys);

    result.set(employeeId, finalizeLop(workingDays, attendanceLop + unpaidLop));
  }

  return result;
}
