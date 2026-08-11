import { Request, Response, NextFunction } from "express";
import { AttendanceService } from "../services/attendance.service";
import { sendSuccess } from "../lib/response";

export class AttendanceController {
  private attendanceService = new AttendanceService();

  createShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shift = await this.attendanceService.createShift(req.body, req.user!.userId);
      return sendSuccess(res, shift, 201);
    } catch (error) {
      next(error);
    }
  };

  updateShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shift = await this.attendanceService.updateShift(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, shift);
    } catch (error) {
      next(error);
    }
  };

  deleteShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.attendanceService.deleteShift(req.params.id, req.user!.userId);
      return sendSuccess(res, { message: "Shift deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  listShifts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
      const shifts = await this.attendanceService.listShifts({ isActive });
      return sendSuccess(res, shifts);
    } catch (error) {
      next(error);
    }
  };

  getShift = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shift = await this.attendanceService.getShiftById(req.params.id);
      return sendSuccess(res, shift);
    } catch (error) {
      next(error);
    }
  };

  createHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const holiday = await this.attendanceService.createHoliday(req.body, req.user!.userId);
      return sendSuccess(res, holiday, 201);
    } catch (error) {
      next(error);
    }
  };

  updateHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const holiday = await this.attendanceService.updateHoliday(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, holiday);
    } catch (error) {
      next(error);
    }
  };

  deleteHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.attendanceService.deleteHoliday(req.params.id, req.user!.userId);
      return sendSuccess(res, { message: "Holiday deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  listHolidays = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from, to } = req.query;
      const holidays = await this.attendanceService.listHolidays({
        from: from as string,
        to: to as string,
      });
      return sendSuccess(res, holidays);
    } catch (error) {
      next(error);
    }
  };

  clockIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.params.employeeId || req.user!.userId;
      const record = await this.attendanceService.clockIn(employeeId, req.body, req.user!.userId);
      return sendSuccess(res, record, 201);
    } catch (error) {
      next(error);
    }
  };

  clockOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.params.employeeId || req.user!.userId;
      const record = await this.attendanceService.clockOut(employeeId, req.body, req.user!.userId);
      return sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  markAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await this.attendanceService.markAttendance(req.body, req.user!.userId);
      return sendSuccess(res, record, 201);
    } catch (error) {
      next(error);
    }
  };

  listAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, from, to, status } = req.query;
      const records = await this.attendanceService.listAttendance({
        employeeId: employeeId as string,
        from: from as string,
        to: to as string,
        status: status as string,
      });
      return sendSuccess(res, records);
    } catch (error) {
      next(error);
    }
  };

  requestAttendanceCorrection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.params.employeeId || req.user!.userId;
      const request = await this.attendanceService.requestAttendanceCorrection(
        employeeId,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, request, 201);
    } catch (error) {
      next(error);
    }
  };

  reviewAttendanceCorrection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await this.attendanceService.reviewAttendanceCorrection(
        req.params.id,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  listAttendanceCorrections = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, status } = req.query;
      const requests = await this.attendanceService.listAttendanceCorrections({
        employeeId: employeeId as string,
        status: status as string,
      });
      return sendSuccess(res, requests);
    } catch (error) {
      next(error);
    }
  };

  getAttendanceStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, from, to } = req.query;
      const stats = await this.attendanceService.getAttendanceStats(
        employeeId as string,
        from as string,
        to as string
      );
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
