import { z } from "zod";
import { optionalPaginationQuerySchema } from "../lib/pagination";

const dateOnly = () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)");
const money = () => z.number().min(0);

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  companyName: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  billingAddress: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  taxId: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const listClientsQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  search: z.string().optional(),
});

// ============================================================================
// INVOICES
// ============================================================================

export const invoiceLineItemInputSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive().default(1),
  unitPrice: money(),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1),
  issueDate: dateOnly(),
  dueDate: dateOnly(),
  currency: z.string().length(3).default("USD"),
  taxAmount: money().default(0),
  discountAmount: money().default(0),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(invoiceLineItemInputSchema).min(1),
});

export const updateInvoiceSchema = z.object({
  dueDate: dateOnly().optional(),
  currency: z.string().length(3).optional(),
  taxAmount: money().optional(),
  discountAmount: money().optional(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(invoiceLineItemInputSchema).min(1).optional(),
});

export const submitInvoiceApprovalSchema = z.object({
  approverIds: z.array(z.string().min(1)).min(1),
});

export const listInvoicesQuerySchema = optionalPaginationQuerySchema.extend({
  clientId: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// ============================================================================
// PAYMENTS
// ============================================================================

export const recordManualPaymentSchema = z.object({
  invoiceId: z.string().min(1).optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  method: z.string().max(100).optional(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export const createCheckoutSessionSchema = z.object({
  invoiceId: z.string().min(1),
  provider: z.enum(["STRIPE", "RAZORPAY"]),
});

export const listPaymentsQuerySchema = z.object({
  invoiceId: z.string().optional(),
  status: z.string().optional(),
  provider: z.string().optional(),
});

// ============================================================================
// REIMBURSEMENTS
// ============================================================================

export const createReimbursementSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  expenseDate: dateOnly(),
  receiptFileId: z.string().optional(),
  approverIds: z.array(z.string().min(1)).min(1).optional(),
});

export const reviewReimbursementSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().max(1000).optional(),
});

export const markReimbursementPaidSchema = z.object({
  paymentReference: z.string().max(200).optional(),
});

export const listReimbursementsQuerySchema = z.object({
  employeeId: z.string().optional(),
  status: z.string().optional(),
});

// ============================================================================
// SALARY STRUCTURE (versioned)
// ============================================================================

export const createSalaryStructureSchema = z.object({
  employeeId: z.string().min(1),
  effectiveFrom: dateOnly(),
  currency: z.string().length(3).default("USD"),
  basic: money(),
  hra: money().default(0),
  conveyanceAllowance: money().default(0),
  medicalAllowance: money().default(0),
  specialAllowance: money().default(0),
  otherAllowances: money().default(0),
  providentFund: money().default(0),
  professionalTax: money().default(0),
  incomeTax: money().default(0),
  otherDeductions: money().default(0),
  revisionReason: z.string().max(500).optional(),
});

export const listSalaryStructuresQuerySchema = z.object({
  employeeId: z.string().optional(),
});

// ============================================================================
// SALARY REVISION WORKFLOW
// ============================================================================

export const requestSalaryRevisionSchema = z.object({
  employeeId: z.string().min(1),
  proposedBasic: money(),
  proposedHra: money().default(0),
  proposedConveyanceAllowance: money().default(0),
  proposedMedicalAllowance: money().default(0),
  proposedSpecialAllowance: money().default(0),
  proposedOtherAllowances: money().default(0),
  effectiveFrom: dateOnly(),
  reason: z.string().min(1).max(1000),
  approverIds: z.array(z.string().min(1)).min(1),
});

export const reviewSalaryRevisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().max(1000).optional(),
});

export const listSalaryRevisionsQuerySchema = z.object({
  employeeId: z.string().optional(),
  status: z.string().optional(),
});

// ============================================================================
// PAYROLL RUN
// ============================================================================

export const createPayrollRunSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  payPeriodStart: dateOnly(),
  payPeriodEnd: dateOnly(),
});

export const submitPayrollRunApprovalSchema = z.object({
  approverIds: z.array(z.string().min(1)).min(1),
});

export const listPayrollRunsQuerySchema = z.object({
  year: z.string().optional(),
  status: z.string().optional(),
});

export const listPayslipsQuerySchema = z.object({
  employeeId: z.string().optional(),
  year: z.string().optional(),
});
