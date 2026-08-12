import { z } from "zod";

// ============================================================================
// ATTENDANCE SCHEMAS
// ============================================================================

export const createShiftSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(50).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  description: z.string().optional(),
});

export const updateShiftSchema = createShiftSchema.partial();

export const createHolidaySchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  description: z.string().optional(),
  isOptional: z.boolean().optional(),
});

export const updateHolidaySchema = createHolidaySchema.partial();

export const clockInSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
  shiftId: z.string().optional(),
  checkInTime: z.string().datetime().optional(),
});

export const clockOutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
  checkOutTime: z.string().datetime().optional(),
});

export const markAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY", "WEEKEND"]),
  shiftId: z.string().optional(),
  checkInTime: z.string().datetime().optional(),
  checkOutTime: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const requestAttendanceCorrectionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  requestedStatus: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY", "WEEKEND"]),
  requestedCheckIn: z.string().datetime().optional(),
  requestedCheckOut: z.string().datetime().optional(),
  reason: z.string().min(1).max(1000),
});

export const reviewAttendanceCorrectionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().max(1000).optional(),
});

export const listAttendanceQuerySchema = z.object({
  employeeId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.string().optional(),
});

export const listAttendanceCorrectionsQuerySchema = z.object({
  employeeId: z.string().optional(),
  status: z.string().optional(),
});

// ============================================================================
// LEAVE SCHEMAS
// ============================================================================

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  defaultBalance: z.number().int().min(0).optional(),
  carryForward: z.boolean().optional(),
  maxCarryForwardDays: z.number().int().min(0).optional(),
  requiresApproval: z.boolean().optional(),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();

export const initializeLeaveBalanceSchema = z.object({
  employeeId: z.string().min(1),
  leaveTypeId: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  allocated: z.number().min(0),
  carriedOver: z.number().min(0).optional(),
});

export const adjustLeaveBalanceSchema = z.object({
  allocated: z.number().min(0).optional(),
  used: z.number().min(0).optional(),
  carriedOver: z.number().min(0).optional(),
});

export const applyLeaveSchema = z.object({
  leaveTypeId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  reason: z.string().min(1).max(1000),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  { message: "Start date must be before or equal to end date", path: ["endDate"] }
);

export const reviewLeaveApplicationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().max(1000).optional(),
});

export const cancelLeaveApplicationSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const listLeaveApplicationsQuerySchema = z.object({
  employeeId: z.string().optional(),
  leaveTypeId: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const listLeaveBalancesQuerySchema = z.object({
  employeeId: z.string().optional(),
  leaveTypeId: z.string().optional(),
  year: z.string().optional(),
});

// ============================================================================
// ASSET MANAGEMENT SCHEMAS
// ============================================================================

export const createAssetSchema = z.object({
  name: z.string().min(1).max(200),
  tag: z.string().min(1).max(100),
  category: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  notes: z.string().optional(),
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  notes: z.string().optional(),
});

export const assignAssetToEmployeeSchema = z.object({
  employeeId: z.string().min(1),
  notes: z.string().optional(),
});

export const returnAssetSchema = z.object({
  notes: z.string().optional(),
});

export const updateAssetStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"]),
  notes: z.string().optional(),
});

export const listAssetHistoryQuerySchema = z.object({
  assetId: z.string().optional(),
  employeeId: z.string().optional(),
  action: z.string().optional(),
});

// ============================================================================
// APPROVAL WORKFLOW SCHEMAS
// ============================================================================

export const createApprovalRequestSchema = z.object({
  entityType: z.string().min(1).max(100),
  entityId: z.string().min(1),
  requesterId: z.string().min(1),
  approverIds: z.array(z.string().min(1)).min(1),
  metadata: z.record(z.any()).optional(),
});

export const approveRequestSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const rejectRequestSchema = z.object({
  notes: z.string().min(1).max(1000),
});

export const cancelApprovalRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const listApprovalRequestsQuerySchema = z.object({
  entityType: z.string().optional(),
  requesterId: z.string().optional(),
  approverId: z.string().optional(),
  status: z.string().optional(),
});
