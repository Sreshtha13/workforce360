/** Phase 4 — Finance & Payroll types (backend is source of truth). */

export type ApprovalStep = {
  id: string;
  approverId: string;
  status: string;
  decidedAt?: string | null;
  notes?: string | null;
};

export type ApprovalRequestSummary = {
  id: string;
  status: string;
  steps?: ApprovalStep[];
};

// ============================================================================
// FINANCE — Clients
// ============================================================================

export type ClientStatus = "ACTIVE" | "INACTIVE";

export type Client = {
  id: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  billingAddress?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxId?: string | null;
  notes?: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateClientInput = {
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  notes?: string;
};

export type UpdateClientInput = Partial<CreateClientInput> & { status?: ClientStatus };

// ============================================================================
// FINANCE — Invoices
// ============================================================================

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  status: InvoiceStatus;
  notes?: string | null;
  sentAt?: string | null;
  approvalRequestId?: string | null;
  approvalRequest?: ApprovalRequestSummary | null;
  lineItems: InvoiceLineItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
};

export type InvoiceLineItemInput = { description: string; quantity: number; unitPrice: number };

export type CreateInvoiceInput = {
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  taxAmount: number;
  discountAmount: number;
  notes?: string;
  lineItems: InvoiceLineItemInput[];
};

export type UpdateInvoiceInput = Partial<Omit<CreateInvoiceInput, "clientId">>;

// ============================================================================
// FINANCE — Payments
// ============================================================================

export type PaymentProvider = "STRIPE" | "RAZORPAY" | "MANUAL";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";

export type Payment = {
  id: string;
  invoiceId?: string | null;
  invoice?: Invoice;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  method?: string | null;
  providerSessionId?: string | null;
  providerPaymentId?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type RecordManualPaymentInput = {
  invoiceId?: string;
  amount: number;
  currency: string;
  method?: string;
  paidAt?: string;
  notes?: string;
};

export type PublicPaymentConfig = {
  stripe: { enabled: boolean; publishableKey?: string | null };
  razorpay: { enabled: boolean; keyId?: string | null };
};

// ============================================================================
// FINANCE — Reimbursements
// ============================================================================

export type ReimbursementStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export type Reimbursement = {
  id: string;
  employeeId: string;
  employee?: { employeeCode: string; user?: { firstName: string; lastName: string; email: string } | null };
  category: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  receiptFileId?: string | null;
  status: ReimbursementStatus;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  paidAt?: string | null;
  paymentReference?: string | null;
  createdAt: string;
};

export type CreateReimbursementInput = {
  category: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  receiptFileId?: string;
};

// ============================================================================
// FINANCE — Dashboard
// ============================================================================

export type FinanceDashboard = {
  invoicesByStatus: { status: string; count: number; totalAmount: number; amountPaid: number }[];
  paymentsByProvider: { provider: string; status: string; count: number; totalAmount: number }[];
  outstandingReceivables: number;
  pendingReimbursements: number;
  recentInvoices: Invoice[];
};

// ============================================================================
// PAYROLL — Salary Structure
// ============================================================================

export type SalaryStructureStatus = "ACTIVE" | "SUPERSEDED";

export type SalaryStructure = {
  id: string;
  employeeId: string;
  employee?: { employeeCode: string; user?: { firstName: string; lastName: string; email: string } | null } | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  currency: string;
  basic: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  providentFund: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: SalaryStructureStatus;
  revisionReason?: string | null;
  createdAt: string;
};

export type CreateSalaryStructureInput = {
  employeeId: string;
  effectiveFrom: string;
  currency: string;
  basic: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
  providentFund: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
  revisionReason?: string;
};

// ============================================================================
// PAYROLL — Salary Revision
// ============================================================================

export type SalaryRevisionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SalaryRevision = {
  id: string;
  employeeId: string;
  employee?: { employeeCode: string; user?: { firstName: string; lastName: string; email: string } | null };
  currentSalaryStructureId?: string | null;
  currentSalaryStructure?: SalaryStructure | null;
  resultingSalaryStructureId?: string | null;
  resultingSalaryStructure?: SalaryStructure | null;
  proposedBasic: number;
  proposedHra: number;
  proposedConveyanceAllowance: number;
  proposedMedicalAllowance: number;
  proposedSpecialAllowance: number;
  proposedOtherAllowances: number;
  effectiveFrom: string;
  reason: string;
  status: SalaryRevisionStatus;
  approvalRequestId?: string | null;
  approvalRequest?: ApprovalRequestSummary | null;
  reviewNotes?: string | null;
  createdAt: string;
};

export type RequestSalaryRevisionInput = {
  employeeId: string;
  proposedBasic: number;
  proposedHra: number;
  proposedConveyanceAllowance: number;
  proposedMedicalAllowance: number;
  proposedSpecialAllowance: number;
  proposedOtherAllowances: number;
  effectiveFrom: string;
  reason: string;
  approverIds: string[];
};

// ============================================================================
// PAYROLL — Payroll Run
// ============================================================================

export type PayrollRunStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PROCESSED"
  | "PAID"
  | "CANCELLED";

export type PayrollRunItem = {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employee?: { employeeCode: string; user?: { firstName: string; lastName: string; email: string } | null };
  salaryStructureId: string;
  workingDays: number;
  paidDays: number;
  lopDays: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  breakdown?: Record<string, number>;
  payslip?: Payslip | null;
};

export type PayrollRun = {
  id: string;
  month: number;
  year: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  status: PayrollRunStatus;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  approvalRequestId?: string | null;
  approvalRequest?: ApprovalRequestSummary | null;
  processedAt?: string | null;
  paidAt?: string | null;
  items: PayrollRunItem[];
  createdAt: string;
};

export type CreatePayrollRunInput = {
  month: number;
  year: number;
  payPeriodStart: string;
  payPeriodEnd: string;
};

// ============================================================================
// PAYROLL — Payslips
// ============================================================================

export type PayslipStatus = "GENERATED" | "PUBLISHED";

export type Payslip = {
  id: string;
  payrollRunItemId: string;
  employeeId: string;
  month: number;
  year: number;
  fileId: string;
  status: PayslipStatus;
  publishedAt?: string | null;
  createdAt: string;
  file?: { id: string; originalName: string; mimeType: string; sizeBytes: number };
};
