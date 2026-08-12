// Phase 4: Finance Module Types

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  SENT = "SENT",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  BANK_TRANSFER = "BANK_TRANSFER",
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  CASH = "CASH",
  CHEQUE = "CHEQUE",
  ONLINE = "ONLINE",
}

export enum ReimbursementStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAID = "PAID",
}

export interface FinanceClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  currency: string;
  notes?: string;
  terms?: string;
  submittedAt?: string;
  approvedAt?: string;
  sentAt?: string;
  approvalId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  client?: FinanceClient;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lineItems?: InvoiceLineItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt: string;
  createdById: string;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Reimbursement {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  receiptFileId?: string;
  status: ReimbursementStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedById?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Input types
export interface CreateFinanceClientInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: number;
  notes?: string;
}

export interface UpdateFinanceClientInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: number;
  notes?: string;
}

export interface CreateInvoiceLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceInput {
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  notes?: string;
  terms?: string;
  lineItems: CreateInvoiceLineItemInput[];
}

export interface UpdateInvoiceInput {
  clientId?: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  lineItems?: CreateInvoiceLineItemInput[];
}

export interface RecordPaymentInput {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt: string;
}

export interface CreateReimbursementInput {
  amount: number;
  currency?: string;
  category: string;
  description: string;
  receiptFileId?: string;
}

export interface ReviewReimbursementInput {
  status: "APPROVED" | "REJECTED";
  notes?: string;
}
