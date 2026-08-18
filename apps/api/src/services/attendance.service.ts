import type { Prisma, AttendanceStatus, AttendanceCorrectionStatus } from "@prisma/client";
import { AttendanceRepository } from "../repositories/attendance.repository";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";

export class AttendanceService {
  private attendanceRepo = new AttendanceRepository();

  async createShift(data: {
    name: string;
    code?: string;
    startTime: string;
    endTime: string;
    description?: string;
  }, actorId: string) {
    if (data.code) {
      const existing = await this.attendanceRepo.findShiftByCode(data.code);
      if (existing) {
        throw new AppError("DUPLICATE_SHIFT_CODE", "Shift code already exists", 400);
      }
    }

    const shift = await this.attendanceRepo.createShift({
      name: data.name,
      code: data.code,
      startTime: data.startTime,
      endTime: data.endTime,
      description: data.description,
    });

    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "shift",
      entityId: shift.id,
      after: shift,
    });

    return shift;
  }

  async updateShift(id: string, data: Partial<{
    name: string;
    code?: string;
    startTime: string;
    endTime: string;
    description?: string;
    isActive: boolean;
  }>, actorId: string) {
    const existing = await this.attendanceRepo.findShiftById(id);
    if (!existing) {
      throw new AppError("SHIFT_NOT_FOUND", "Shift not found", 404);
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await this.attendanceRepo.findShiftByCode(data.code);
      if (duplicate) {
        throw new AppError("DUPLICATE_SHIFT_CODE", "Shift code already exists", 400);
      }
    }

    const updated = await this.attendanceRepo.updateShift(id, data);

    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "shift",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async deleteShift(id: string, actorId: string) {
    const existing = await this.attendanceRepo.findShiftById(id);
    if (!existing) {
      throw new AppError("SHIFT_NOT_FOUND", "Shift not found", 404);
    }

    await this.attendanceRepo.softDeleteShift(id);

    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "shift",
      entityId: id,
      before: existing,
    });
  }

  async listShifts(filters: { isActive?: boolean }) {
    const where: Prisma.ShiftWhereInput = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    return this.attendanceRepo.findManyShifts(where);
  }

  async getShiftById(id: string) {
    const shift = await this.attendanceRepo.findShiftById(id);
    if (!shift) {
      throw new AppError("SHIFT_NOT_FOUND", "Shift not found", 404);
    }
    return shift;
  }

  async createHoliday(data: {
    name: string;
    date: string;
    description?: string;
    isOptional?: boolean;
  }, actorId: string) {
    const holiday = await this.attendanceRepo.createHoliday({
      name: data.name,
      date: new Date(data.date),
      description: data.description,
      isOptional: data.isOptional ?? false,
    });

    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "holiday",
      entityId: holiday.id,
      after: holiday,
    });

    return holiday;
  }

  async updateHoliday(id: string, data: Partial<{
    name: string;
    date: string;
    description?: string;
    isOptional?: boolean;
  }>, actorId: string) {
    const existing = await this.attendanceRepo.findHolidayById(id);
    if (!existing) {
      throw new AppError("HOLIDAY_NOT_FOUND", "Holiday not found", 404);
    }

    const updateData: Prisma.HolidayUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.date) updateData.date = new Date(data.date);
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isOptional !== undefined) updateData.isOptional = data.isOptional;

    const updated = await this.attendanceRepo.updateHoliday(id, updateData);

    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "holiday",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async deleteHoliday(id: string, actorId: string) {
    const existing = await this.attendanceRepo.findHolidayById(id);
    if (!existing) {
      throw new AppError("HOLIDAY_NOT_FOUND", "Holiday not found", 404);
    }

    await this.attendanceRepo.softDeleteHoliday(id);

    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "holiday",
      entityId: id,
      before: existing,
    });
  }

  async listHolidays(filters: { from?: string; to?: string }) {
    if (filters.from && filters.to) {
      return this.attendanceRepo.findHolidaysByDateRange(
        new Date(filters.from),
        new Date(filters.to)
      );
    }
    return this.attendanceRepo.findManyHolidays();
  }

  async clockIn(employeeId: string, data: {
    date?: string;
    shiftId?: string;
    checkInTime?: string;
  }, actorId: string) {
    const date = data.date ? new Date(data.date) : new Date();
    date.setHours(0, 0, 0, 0);

    const existing = await this.attendanceRepo.findAttendanceRecord(employeeId, date);
    if (existing && existing.checkInTime) {
      throw new AppError("ALREADY_CLOCKED_IN", "Already clocked in for this date", 400);
    }

    const checkInTime = data.checkInTime ? new Date(data.checkInTime) : new Date();

    const record = await this.attendanceRepo.upsertAttendanceRecord(
      employeeId,
      date,
      {
        employeeId,
        date,
        status: "PRESENT",
        shiftId: data.shiftId,
        checkInTime,
      },
      {
        checkInTime,
        status: "PRESENT",
        shiftId: data.shiftId,
      }
    );

    await writeAuditLog({
      userId: actorId,
      action: "clock_in",
      entity: "attendance_record",
      entityId: record.id,
      after: record,
    });

    return record;
  }

  async clockOut(employeeId: string, data: {
    date?: string;
    checkOutTime?: string;
  }, actorId: string) {
    const date = data.date ? new Date(data.date) : new Date();
    date.setHours(0, 0, 0, 0);

    const existing = await this.attendanceRepo.findAttendanceRecord(employeeId, date);
    if (!existing || !existing.checkInTime) {
      throw new AppError("NOT_CLOCKED_IN", "Must clock in before clocking out", 400);
    }

    if (existing.checkOutTime) {
      throw new AppError("ALREADY_CLOCKED_OUT", "Already clocked out for this date", 400);
    }

    const checkOutTime = data.checkOutTime ? new Date(data.checkOutTime) : new Date();
    const workHours = (checkOutTime.getTime() - existing.checkInTime.getTime()) / (1000 * 60 * 60);

    const updated = await this.attendanceRepo.updateAttendanceRecord(existing.id, {
      checkOutTime,
      workHours,
    });

    await writeAuditLog({
      userId: actorId,
      action: "clock_out",
      entity: "attendance_record",
      entityId: updated.id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async markAttendance(data: {
    employeeId: string;
    date: string;
    status: string;
    shiftId?: string;
    checkInTime?: string;
    checkOutTime?: string;
    notes?: string;
  }, actorId: string) {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    let workHours: number | undefined;
    if (data.checkInTime && data.checkOutTime) {
      const checkIn = new Date(data.checkInTime);
      const checkOut = new Date(data.checkOutTime);
      workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    }

    const record = await this.attendanceRepo.upsertAttendanceRecord(
      data.employeeId,
      date,
      {
        employeeId: data.employeeId,
        date,
        status: data.status as AttendanceStatus,
        shiftId: data.shiftId,
        checkInTime: data.checkInTime ? new Date(data.checkInTime) : undefined,
        checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : undefined,
        workHours,
        notes: data.notes,
      },
      {
        status: data.status as AttendanceStatus,
        shiftId: data.shiftId,
        checkInTime: data.checkInTime ? new Date(data.checkInTime) : undefined,
        checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : undefined,
        workHours,
        notes: data.notes,
      }
    );

    await writeAuditLog({
      userId: actorId,
      action: "mark_attendance",
      entity: "attendance_record",
      entityId: record.id,
      after: record,
    });

    return record;
  }

  async listAttendance(filters: {
    employeeId?: string;
    from?: string;
    to?: string;
    status?: string;
  }) {
    const where: Prisma.AttendanceRecordWhereInput = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status as AttendanceStatus;
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) where.date.gte = new Date(filters.from);
      if (filters.to) where.date.lte = new Date(filters.to);
    }
    return this.attendanceRepo.findManyAttendanceRecords(where);
  }

  async requestAttendanceCorrection(
    employeeId: string,
    data: {
      date: string;
      requestedStatus: string;
      requestedCheckIn?: string;
      requestedCheckOut?: string;
      reason: string;
    },
    actorId: string
  ) {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    const attendanceRecord = await this.attendanceRepo.findAttendanceRecord(employeeId, date);

    const request = await this.attendanceRepo.createAttendanceCorrectionRequest({
      attendanceRecordId: attendanceRecord?.id,
      employeeId,
      date,
      requestedStatus: data.requestedStatus as AttendanceStatus,
      requestedCheckIn: data.requestedCheckIn ? new Date(data.requestedCheckIn) : undefined,
      requestedCheckOut: data.requestedCheckOut ? new Date(data.requestedCheckOut) : undefined,
      reason: data.reason,
      status: "PENDING",
    });

    await writeAuditLog({
      userId: actorId,
      action: "request_correction",
      entity: "attendance_correction_request",
      entityId: request.id,
      after: request,
    });

    return request;
  }

  async reviewAttendanceCorrection(
    id: string,
    data: { status: "APPROVED" | "REJECTED"; reviewNotes?: string },
    actorId: string
  ) {
    const request = await this.attendanceRepo.findAttendanceCorrectionRequestById(id);
    if (!request) {
      throw new AppError("CORRECTION_REQUEST_NOT_FOUND", "Correction request not found", 404);
    }

    if (request.status !== "PENDING") {
      throw new AppError("CORRECTION_ALREADY_REVIEWED", "Correction request already reviewed", 400);
    }

    const updated = await this.attendanceRepo.updateAttendanceCorrectionRequest(id, {
      status: data.status,
      reviewedById: actorId,
      reviewedAt: new Date(),
      reviewNotes: data.reviewNotes,
    });

    if (data.status === "APPROVED") {
      await this.markAttendance(
        {
          employeeId: request.employeeId,
          date: request.date.toISOString().split("T")[0],
          status: request.requestedStatus,
          checkInTime: request.requestedCheckIn?.toISOString(),
          checkOutTime: request.requestedCheckOut?.toISOString(),
          notes: `Corrected: ${request.reason}`,
        },
        actorId
      );
    }

    await writeAuditLog({
      userId: actorId,
      action: "review_correction",
      entity: "attendance_correction_request",
      entityId: id,
      before: request,
      after: updated,
    });

    return updated;
  }

  async listAttendanceCorrections(filters: {
    employeeId?: string;
    status?: string;
  }) {
    const where: Prisma.AttendanceCorrectionRequestWhereInput = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status as AttendanceCorrectionStatus;
    return this.attendanceRepo.findManyAttendanceCorrectionRequests(where);
  }

  async getAttendanceStats(employeeId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const present = await this.attendanceRepo.countAttendanceByStatus(employeeId, fromDate, toDate, "PRESENT");
    const absent = await this.attendanceRepo.countAttendanceByStatus(employeeId, fromDate, toDate, "ABSENT");
    const halfDay = await this.attendanceRepo.countAttendanceByStatus(employeeId, fromDate, toDate, "HALF_DAY");
    const leave = await this.attendanceRepo.countAttendanceByStatus(employeeId, fromDate, toDate, "LEAVE");

    return {
      present,
      absent,
      halfDay,
      leave,
      total: present + absent + halfDay + leave,
    };
  }
}
