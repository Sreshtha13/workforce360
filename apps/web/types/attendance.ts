// Phase 3: Attendance & Leave Management Types

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  HALF_DAY = "HALF_DAY",
  LATE = "LATE",
  ON_LEAVE = "ON_LEAVE",
  HOLIDAY = "HOLIDAY",
  WEEKEND = "WEEKEND",
}

export enum LeaveType {
  ANNUAL = "ANNUAL",
  SICK = "SICK",
  CASUAL = "CASUAL",
  MATERNITY = "MATERNITY",
  PATERNITY = "PATERNITY",
  UNPAID = "UNPAID",
  COMPENSATORY = "COMPENSATORY",
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  hours?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface LeavePolicy {
  id: string;
  leaveType: LeaveType;
  name: string;
  annualQuota: number;
  carryForward: boolean;
  maxCarryForward?: number;
  requiresApproval: boolean;
  applicableToAll: boolean;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveApplication {
  id: string;
  userId: string;
  policyId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedAt?: string;
  reviewedById?: string;
  reviewNotes?: string;
  approvalId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  policy?: LeavePolicy;
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TimesheetEntry {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  date: string;
  hours: number;
  description?: string;
  billable: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

export interface LeaveBalance {
  policyId: string;
  policyName: string;
  leaveType: LeaveType;
  annualQuota: number;
  used: number;
  pending: number;
  available: number;
}

// Input types
export interface CheckInInput {
  date: string;
  checkIn: string;
  notes?: string;
}

export interface CheckOutInput {
  id: string;
  checkOut: string;
}

export interface CreateLeaveApplicationInput {
  policyId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ReviewLeaveApplicationInput {
  status: "APPROVED" | "REJECTED";
  reviewNotes?: string;
}

export interface CreateTimesheetEntryInput {
  projectId?: string;
  taskId?: string;
  date: string;
  hours: number;
  description?: string;
  billable?: boolean;
}

export interface UpdateTimesheetEntryInput {
  projectId?: string;
  taskId?: string;
  hours?: number;
  description?: string;
  billable?: boolean;
}
