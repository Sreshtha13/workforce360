import { Router } from "express";
import { AttendanceController } from "../controllers/attendance.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createShiftSchema,
  updateShiftSchema,
  createHolidaySchema,
  updateHolidaySchema,
  clockInSchema,
  clockOutSchema,
  markAttendanceSchema,
  requestAttendanceCorrectionSchema,
  reviewAttendanceCorrectionSchema,
  listAttendanceQuerySchema,
  listAttendanceCorrectionsQuerySchema,
} from "../schemas/phase3.schema";

const attendanceRouter = Router();
const controller = new AttendanceController();

attendanceRouter.post(
  "/shifts",
  requireAuth,
  requirePermission("attendance.manage"),
  validate(createShiftSchema),
  controller.createShift
);

attendanceRouter.put(
  "/shifts/:id",
  requireAuth,
  requirePermission("attendance.manage"),
  validate(updateShiftSchema),
  controller.updateShift
);

attendanceRouter.delete(
  "/shifts/:id",
  requireAuth,
  requirePermission("attendance.manage"),
  controller.deleteShift
);

attendanceRouter.get(
  "/shifts",
  requireAuth,
  requirePermission("attendance.read"),
  controller.listShifts
);

attendanceRouter.get(
  "/shifts/:id",
  requireAuth,
  requirePermission("attendance.read"),
  controller.getShift
);

attendanceRouter.post(
  "/holidays",
  requireAuth,
  requirePermission("attendance.manage"),
  validate(createHolidaySchema),
  controller.createHoliday
);

attendanceRouter.put(
  "/holidays/:id",
  requireAuth,
  requirePermission("attendance.manage"),
  validate(updateHolidaySchema),
  controller.updateHoliday
);

attendanceRouter.delete(
  "/holidays/:id",
  requireAuth,
  requirePermission("attendance.manage"),
  controller.deleteHoliday
);

attendanceRouter.get(
  "/holidays",
  requireAuth,
  requirePermission("attendance.read"),
  controller.listHolidays
);

attendanceRouter.post(
  "/clock-in",
  requireAuth,
  validate(clockInSchema),
  controller.clockIn
);

attendanceRouter.post(
  "/clock-out",
  requireAuth,
  validate(clockOutSchema),
  controller.clockOut
);

attendanceRouter.post(
  "/records",
  requireAuth,
  requirePermission("attendance.manage"),
  validate(markAttendanceSchema),
  controller.markAttendance
);

attendanceRouter.get(
  "/records",
  requireAuth,
  requirePermission("attendance.read"),
  validate(listAttendanceQuerySchema, "query"),
  controller.listAttendance
);

attendanceRouter.post(
  "/corrections",
  requireAuth,
  validate(requestAttendanceCorrectionSchema),
  controller.requestAttendanceCorrection
);

attendanceRouter.post(
  "/corrections/:id/review",
  requireAuth,
  requirePermission("attendance.approve"),
  validate(reviewAttendanceCorrectionSchema),
  controller.reviewAttendanceCorrection
);

attendanceRouter.get(
  "/corrections",
  requireAuth,
  requirePermission("attendance.read", "attendance.approve"),
  validate(listAttendanceCorrectionsQuerySchema, "query"),
  controller.listAttendanceCorrections
);

attendanceRouter.get(
  "/stats",
  requireAuth,
  requirePermission("attendance.read"),
  controller.getAttendanceStats
);

export { attendanceRouter };
