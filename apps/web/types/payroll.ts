// Phase 4: Payroll Module Types

export enum PayrollRunStatus {
  DRAFT = "DRAFT",
  CALCULATING = "CALCULATING",
  CALCULATED = "CALCULATED",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  PROCESSING = "PROCESSING",
  PROCESSED = "PROCESSED",
  PAID = "PAID",
  FAILED = "FAILED",
}

export interface SalaryComponent {
  id: string;
  structureId: string;
  name: string;
  type: string;
  amount: number;
  isFixed: boolean;
  isTaxable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructure {
  id: string;
  userId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  currency: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
  };
  components?: SalaryComponent[];
}

export interface Payslip {
  id: string;
  runId: string;
  userId: string;
  structureId: string;
  period: string;
  workingDays: number;
  paidDays: number;
  lopDays: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  fileId?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
  };
  structure?: SalaryStructure;
}

export interface PayrollRun {
  id: string;
  title: string;
  period: string;
  startDate: string;
  endDate: string;
  status: PayrollRunStatus;
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  calculatedAt?: string;
  approvedAt?: string;
  processedAt?: string;
  paidAt?: string;
  approvalId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  payslips?: Payslip[];
}

export interface SalaryRevision {
  employeeId: string;
  employeeName: string;
  currentStructureId?: string;
  currentGross?: number;
  newGross: number;
  increasePercent: number;
  effectiveFrom: string;
  reason?: string;
}

// Input types
export interface CreateSalaryComponentInput {
  name: string;
  type: string;
  amount: number;
  isFixed?: boolean;
  isTaxable?: boolean;
  sortOrder?: number;
}

export interface CreateSalaryStructureInput {
  userId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  currency?: string;
  notes?: string;
  components: CreateSalaryComponentInput[];
}

export interface UpdateSalaryStructureInput {
  effectiveTo?: string;
  notes?: string;
  components?: CreateSalaryComponentInput[];
}

export interface CreatePayrollRunInput {
  title: string;
  period: string;
  startDate: string;
  endDate: string;
}

export interface UpdatePayrollRunInput {
  title?: string;
}
