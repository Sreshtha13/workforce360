import { prisma } from "../lib/prisma";
import type { Prisma, AttendanceStatus } from "@prisma/client";

export class AttendanceRepository {
  async createShift(data: Prisma.ShiftUncheckedCreateInput) {
    return prisma.shift.create({ data });
  }

  async findShiftById(id: string) {
    return prisma.shift.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findShiftByCode(code: string) {
    return prisma.shift.findFirst({
      where: { code, deletedAt: null },
    });
  }

  async findManyShifts(where?: Prisma.ShiftWhereInput) {
    return prisma.shift.findMany({
      where: { ...where, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async updateShift(id: string, data: Prisma.ShiftUncheckedUpdateInput) {
    return prisma.shift.update({
      where: { id },
      data,
    });
  }

  async softDeleteShift(id: string) {
    return prisma.shift.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createHoliday(data: Prisma.HolidayUncheckedCreateInput) {
    return prisma.holiday.create({ data });
  }

  async findHolidayById(id: string) {
    return prisma.holiday.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findManyHolidays(where?: Prisma.HolidayWhereInput) {
    return prisma.holiday.findMany({
      where: { ...where, deletedAt: null },
      orderBy: { date: "asc" },
    });
  }

  async findHolidaysByDateRange(from: Date, to: Date) {
    return prisma.holiday.findMany({
      where: {
        date: { gte: from, lte: to },
        deletedAt: null,
      },
      orderBy: { date: "asc" },
    });
  }

  async updateHoliday(id: string, data: Prisma.HolidayUncheckedUpdateInput) {
    return prisma.holiday.update({
      where: { id },
      data,
    });
  }

  async softDeleteHoliday(id: string) {
    return prisma.holiday.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createAttendanceRecord(data: Prisma.AttendanceRecordUncheckedCreateInput) {
    return prisma.attendanceRecord.create({ data });
  }

  async findAttendanceRecord(employeeId: string, date: Date) {
    return prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        date,
        deletedAt: null,
      },
      include: { shift: true },
    });
  }

  async findAttendanceRecordById(id: string) {
    return prisma.attendanceRecord.findFirst({
      where: { id, deletedAt: null },
      include: { shift: true },
    });
  }

  async findManyAttendanceRecords(where?: Prisma.AttendanceRecordWhereInput) {
    return prisma.attendanceRecord.findMany({
      where: { ...where, deletedAt: null },
      include: { shift: true },
      orderBy: { date: "desc" },
    });
  }

  async updateAttendanceRecord(id: string, data: Prisma.AttendanceRecordUncheckedUpdateInput) {
    return prisma.attendanceRecord.update({
      where: { id },
      data,
    });
  }

  async upsertAttendanceRecord(
    employeeId: string,
    date: Date,
    data: Prisma.AttendanceRecordUncheckedCreateInput,
    updateData: Prisma.AttendanceRecordUncheckedUpdateInput
  ) {
    return prisma.attendanceRecord.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date,
        },
      },
      create: data,
      update: updateData,
    });
  }

  async createAttendanceCorrectionRequest(data: Prisma.AttendanceCorrectionRequestUncheckedCreateInput) {
    return prisma.attendanceCorrectionRequest.create({ data });
  }

  async findAttendanceCorrectionRequestById(id: string) {
    return prisma.attendanceCorrectionRequest.findFirst({
      where: { id, deletedAt: null },
      include: { attendanceRecord: true, approvalRequest: true },
    });
  }

  async findManyAttendanceCorrectionRequests(where?: Prisma.AttendanceCorrectionRequestWhereInput) {
    return prisma.attendanceCorrectionRequest.findMany({
      where: { ...where, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateAttendanceCorrectionRequest(id: string, data: Prisma.AttendanceCorrectionRequestUncheckedUpdateInput) {
    return prisma.attendanceCorrectionRequest.update({
      where: { id },
      data,
    });
  }

  async countAttendanceByStatus(employeeId: string, from: Date, to: Date, status: string) {
    return prisma.attendanceRecord.count({
      where: {
        employeeId,
        date: { gte: from, lte: to },
        status: status as AttendanceStatus,
        deletedAt: null,
      },
    });
  }
}
