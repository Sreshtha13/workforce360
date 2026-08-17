import { FinanceRepository } from "../repositories/finance.repository";
import type { PaginationQuery } from "../lib/pagination";
import { ApprovalService } from "./approval.service";
import { paymentGatewayService } from "./payment-gateway.service";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { sendEmail } from "../lib/email";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { Prisma, type InvoiceStatus } from "@prisma/client";

type LineItemInput = { description: string; quantity: number; unitPrice: number };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeInvoiceTotals(lineItems: LineItemInput[], taxAmount: number, discountAmount: number) {
  const subtotal = round2(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const totalAmount = round2(subtotal + taxAmount - discountAmount);
  if (totalAmount < 0) {
    throw new AppError("INVALID_INVOICE_TOTAL", "Invoice total cannot be negative", 400);
  }
  return { subtotal, totalAmount };
}

const EDITABLE_INVOICE_STATUSES = new Set(["DRAFT", "REJECTED"]);

export class FinanceService {
  private financeRepo = new FinanceRepository();
  private approvalService = new ApprovalService();

  // ==========================================================================
  // CLIENTS
  // ==========================================================================

  async createClient(data: Record<string, unknown>, actorId: string) {
    const client = await this.financeRepo.createClient({ ...data, createdById: actorId } as Prisma.ClientUncheckedCreateInput);
    await writeAuditLog({ userId: actorId, action: "create", entity: "client", entityId: client.id, after: client });
    return client;
  }

  async updateClient(id: string, data: Record<string, unknown>, actorId: string) {
    const existing = await this.financeRepo.findClientById(id);
    if (!existing) throw new AppError("CLIENT_NOT_FOUND", "Client not found", 404);
    const updated = await this.financeRepo.updateClient(id, data as Prisma.ClientUncheckedUpdateInput);
    await writeAuditLog({ userId: actorId, action: "update", entity: "client", entityId: id, before: existing, after: updated });
    return updated;
  }

  async deleteClient(id: string, actorId: string) {
    const existing = await this.financeRepo.findClientById(id);
    if (!existing) throw new AppError("CLIENT_NOT_FOUND", "Client not found", 404);
    await this.financeRepo.softDeleteClient(id);
    await writeAuditLog({ userId: actorId, action: "delete", entity: "client", entityId: id, before: existing });
  }

  async listClients(filters: { status?: string; search?: string }) {
    const where: Prisma.ClientWhereInput = {};
    if (filters.status) where.status = filters.status as Prisma.ClientWhereInput["status"];
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return this.financeRepo.findManyClients(where);
  }

  async getClientById(id: string) {
    const client = await this.financeRepo.findClientById(id);
    if (!client) throw new AppError("CLIENT_NOT_FOUND", "Client not found", 404);
    return client;
  }

  // ==========================================================================
  // INVOICES
  // ==========================================================================

  private async generateInvoiceNumber(year: number): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const count = await this.financeRepo.countInvoicesForYear(year);
      const candidate = `INV-${year}-${String(count + 1 + attempt).padStart(4, "0")}`;
      const clash = await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } });
      if (!clash) return candidate;
    }
    return `INV-${year}-${Date.now()}`;
  }

  async createInvoice(
    data: {
      clientId: string;
      issueDate: string;
      dueDate: string;
      currency: string;
      taxAmount: number;
      discountAmount: number;
      notes?: string;
      lineItems: LineItemInput[];
    },
    actorId: string,
  ) {
    const client = await this.financeRepo.findClientById(data.clientId);
    if (!client) throw new AppError("CLIENT_NOT_FOUND", "Client not found", 404);

    const issueDate = new Date(data.issueDate);
    const dueDate = new Date(data.dueDate);
    if (dueDate < issueDate) {
      throw new AppError("INVALID_DUE_DATE", "Due date must be on or after the issue date", 400);
    }

    const { subtotal, totalAmount } = computeInvoiceTotals(data.lineItems, data.taxAmount, data.discountAmount);
    const invoiceNumber = await this.generateInvoiceNumber(issueDate.getFullYear());

    const invoice = await this.financeRepo.createInvoice({
      invoiceNumber,
      clientId: data.clientId,
      issueDate,
      dueDate,
      currency: data.currency,
      subtotal,
      taxAmount: data.taxAmount,
      discountAmount: data.discountAmount,
      totalAmount,
      amountPaid: 0,
      status: "DRAFT",
      notes: data.notes,
      createdById: actorId,
      lineItems: {
        create: data.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: round2(item.quantity * item.unitPrice),
        })),
      },
    });

    await writeAuditLog({ userId: actorId, action: "create", entity: "invoice", entityId: invoice.id, after: invoice });
    return invoice;
  }

  async updateInvoice(
    id: string,
    data: {
      dueDate?: string;
      currency?: string;
      taxAmount?: number;
      discountAmount?: number;
      notes?: string;
      lineItems?: LineItemInput[];
    },
    actorId: string,
  ) {
    const existing = await this.financeRepo.findInvoiceById(id);
    if (!existing) throw new AppError("INVOICE_NOT_FOUND", "Invoice not found", 404);
    if (!EDITABLE_INVOICE_STATUSES.has(existing.status)) {
      throw new AppError("INVOICE_NOT_EDITABLE", "Only draft or rejected invoices can be edited", 400);
    }

    const lineItems = data.lineItems ?? existing.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: Number(li.unitPrice),
    }));
    const taxAmount = data.taxAmount ?? Number(existing.taxAmount);
    const discountAmount = data.discountAmount ?? Number(existing.discountAmount);
    const { subtotal, totalAmount } = computeInvoiceTotals(lineItems, taxAmount, discountAmount);

    if (data.lineItems) {
      await this.financeRepo.replaceInvoiceLineItems(
        id,
        data.lineItems.map((item) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: round2(item.quantity * item.unitPrice),
        })),
      );
    }

    const updated = await this.financeRepo.updateInvoice(id, {
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      currency: data.currency,
      taxAmount,
      discountAmount,
      subtotal,
      totalAmount,
      notes: data.notes,
      status: "DRAFT",
    });

    await writeAuditLog({ userId: actorId, action: "update", entity: "invoice", entityId: id, before: existing, after: updated });
    return updated;
  }

  async submitInvoiceForApproval(id: string, approverIds: string[], actorId: string) {
    const invoice = await this.financeRepo.findInvoiceById(id);
    if (!invoice) throw new AppError("INVOICE_NOT_FOUND", "Invoice not found", 404);
    if (invoice.status !== "DRAFT") {
      throw new AppError("INVOICE_NOT_DRAFT", "Only draft invoices can be submitted for approval", 400);
    }

    const approvalRequest = await this.approvalService.createApprovalRequest(
      { entityType: "invoice", entityId: id, requesterId: actorId, approverIds },
      actorId,
    );

    const updated = await this.financeRepo.updateInvoice(id, {
      status: "PENDING_APPROVAL",
      approvalRequestId: approvalRequest.id,
    });

    await writeAuditLog({ userId: actorId, action: "submit_for_approval", entity: "invoice", entityId: id, after: updated });
    return updated;
  }

  async decideInvoiceApproval(
    id: string,
    decision: "APPROVE" | "REJECT",
    approverId: string,
    notes?: string,
  ) {
    const invoice = await this.financeRepo.findInvoiceById(id);
    if (!invoice) throw new AppError("INVOICE_NOT_FOUND", "Invoice not found", 404);
    if (invoice.status !== "PENDING_APPROVAL" || !invoice.approvalRequestId) {
      throw new AppError("INVOICE_NOT_PENDING_APPROVAL", "Invoice is not pending approval", 400);
    }

    const approvalRequest =
      decision === "APPROVE"
        ? await this.approvalService.approveRequest(invoice.approvalRequestId, approverId, notes, approverId)
        : await this.approvalService.rejectRequest(invoice.approvalRequestId, approverId, notes ?? "Rejected", approverId);

    let newStatus: InvoiceStatus = invoice.status;
    if (approvalRequest?.status === "APPROVED") newStatus = "APPROVED";
    else if (approvalRequest?.status === "REJECTED") newStatus = "REJECTED";

    const updated = await this.financeRepo.updateInvoice(id, { status: newStatus });
    await writeAuditLog({
      userId: approverId,
      action: decision === "APPROVE" ? "approve" : "reject",
      entity: "invoice",
      entityId: id,
      after: updated,
    });
    return updated;
  }

  async sendInvoice(id: string, actorId: string) {
    const invoice = await this.financeRepo.findInvoiceById(id);
    if (!invoice) throw new AppError("INVOICE_NOT_FOUND", "Invoice not found", 404);
    if (!["DRAFT", "APPROVED"].includes(invoice.status)) {
      throw new AppError("INVOICE_NOT_SENDABLE", "Only draft or approved invoices can be sent", 400);
    }

    const updated = await this.financeRepo.updateInvoice(id, { status: "SENT", sentAt: new Date() });

    const clientEmail = invoice.client?.email;
    if (clientEmail) {
      const viewUrl = `${env.APP_PUBLIC_BASE_URL}/finance/invoices/${id}`;
      await sendEmail({
        to: clientEmail,
        subject: `Invoice ${invoice.invoiceNumber} from Workforce 360`,
        html: `
          <p>Hello ${invoice.client?.name ?? "there"},</p>
          <p>Your invoice <strong>${invoice.invoiceNumber}</strong> is ready.</p>
          <p>Amount due: <strong>${invoice.currency} ${Number(invoice.totalAmount).toFixed(2)}</strong></p>
          <p>Due date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><a href="${viewUrl}">View invoice</a></p>
        `,
        text: `Invoice ${invoice.invoiceNumber} — amount due ${invoice.currency} ${Number(invoice.totalAmount).toFixed(2)}. View: ${viewUrl}`,
      });
    }

    await writeAuditLog({ userId: actorId, action: "send", entity: "invoice", entityId: id, after: updated });
    return updated;
  }

  async cancelInvoice(id: string, actorId: string) {
    const invoice = await this.financeRepo.findInvoiceById(id);
    if (!invoice) throw new AppError("INVOICE_NOT_FOUND", "Invoice not found", 404);
    if (["PAID", "CANCELLED"].includes(invoice.status)) {
      throw new AppError("INVOICE_NOT_CANCELLABLE", "Paid or already-cancelled invoices cannot be cancelled", 400);
    }

    const updated = await this.financeRepo.updateInvoice(id, { status: "CANCELLED" });
    await writeAuditLog({ userId: actorId, action: "cancel", entity: "invoice", entityId: id, after: updated });
    return updated;
  }

  async getInvoiceById(id: string) {
    const invoice = await this.financeRepo.findInvoiceById(id);
    if (!invoice) throw new AppError("INVOICE_NOT_FOUND", "Invoice not found", 404);
    return invoice;
  }

  async listInvoices(filters: {
    clientId?: string;
    status?: string;
    from?: string;
    to?: string;
    pagination?: PaginationQuery;
  }) {
    const where: Prisma.InvoiceWhereInput = {};
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.status) where.status = filters.status as Prisma.InvoiceWhereInput["status"];
    if (filters.from || filters.to) {
      where.issueDate = {};
      if (filters.from) where.issueDate.gte = new Date(filters.from);
      if (filters.to) where.issueDate.lte = new Date(filters.to);
    }
    return this.financeRepo.findManyInvoices(where, filters.pagination);
  }

  async markOverdueInvoices(actorId?: string) {
    const ids = await this.financeRepo.findOverdueInvoiceIds();
    for (const id of ids) {
      await this.financeRepo.updateInvoice(id, { status: "OVERDUE" });
      await writeAuditLog({ userId: actorId, action: "mark_overdue", entity: "invoice", entityId: id });
    }
    return { updatedCount: ids.length };
  }

  private async applyPaymentToInvoice(invoiceId: string, amount: number) {
    const invoice = await this.financeRepo.findInvoiceById(invoiceId);
    if (!invoice) return;

    const amountPaid = round2(Number(invoice.amountPaid) + amount);
    const totalAmount = Number(invoice.totalAmount);
    const status = amountPaid >= totalAmount ? "PAID" : "PARTIALLY_PAID";

    await this.financeRepo.updateInvoice(invoiceId, { amountPaid, status });
  }

  // ==========================================================================
  // PAYMENTS
  // ==========================================================================

  async recordManualPayment(
    data: { invoiceId?: string; amount: number; currency: string; method?: string; paidAt?: string; notes?: string },
    actorId: string,
  ) {
    if (data.invoiceId) {
      const invoice = await this.financeRepo.findInvoiceById(data.invoiceId);
      if (!invoice) throw new AppError("INVOICE_NOT_FOUND", "Invoice not found", 404);
    }

    const payment = await this.financeRepo.createPayment({
      invoiceId: data.invoiceId,
      amount: data.amount,
      currency: data.currency,
      provider: "MANUAL",
      status: "SUCCEEDED",
      method: data.method,
      recordedById: actorId,
      paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      notes: data.notes,
    });

    if (data.invoiceId) {
      await this.applyPaymentToInvoice(data.invoiceId, data.amount);
    }

    await writeAuditLog({ userId: actorId, action: "record_payment", entity: "payment", entityId: payment.id, after: payment });
    return payment;
  }

  async createCheckoutSession(invoiceId: string, provider: "STRIPE" | "RAZORPAY", actorId: string) {
    const invoice = await this.financeRepo.findInvoiceById(invoiceId);
    if (!invoice) throw new AppError("INVOICE_NOT_FOUND", "Invoice not found", 404);

    const amountDue = round2(Number(invoice.totalAmount) - Number(invoice.amountPaid));
    if (amountDue <= 0) {
      throw new AppError("INVOICE_ALREADY_PAID", "This invoice has no outstanding balance", 400);
    }

    const session =
      provider === "STRIPE"
        ? await paymentGatewayService.createStripeCheckoutSession({
            invoiceId,
            amount: amountDue,
            currency: invoice.currency,
            description: `Invoice ${invoice.invoiceNumber}`,
          })
        : await paymentGatewayService.createRazorpayOrder({
            invoiceId,
            amount: amountDue,
            currency: invoice.currency,
          });

    const payment = await this.financeRepo.createPayment({
      invoiceId,
      amount: amountDue,
      currency: invoice.currency,
      provider,
      status: "PENDING",
      providerSessionId: session.sessionId,
      recordedById: actorId,
    });

    await writeAuditLog({ userId: actorId, action: "create_checkout_session", entity: "payment", entityId: payment.id, after: payment });

    return { payment, session };
  }

  async handleStripeCheckoutCompleted(sessionId: string, providerPaymentId?: string) {
    const payment = await this.financeRepo.findPaymentByProviderSessionId(sessionId);
    if (!payment || payment.status === "SUCCEEDED") return;

    const updated = await this.financeRepo.updatePayment(payment.id, {
      status: "SUCCEEDED",
      providerPaymentId,
      paidAt: new Date(),
    });

    if (payment.invoiceId) {
      await this.applyPaymentToInvoice(payment.invoiceId, Number(payment.amount));
    }

    await writeAuditLog({ action: "webhook_payment_succeeded", entity: "payment", entityId: payment.id, after: updated });
    const { dispatchWebhookEvent } = await import("../lib/webhook-dispatcher");
    await dispatchWebhookEvent("payment.succeeded", {
      paymentId: updated.id,
      invoiceId: payment.invoiceId,
      amount: Number(payment.amount),
      provider: payment.provider,
    });
    return updated;
  }

  async handleStripeCheckoutFailed(sessionId: string) {
    const payment = await this.financeRepo.findPaymentByProviderSessionId(sessionId);
    if (!payment || payment.status !== "PENDING") return;
    const updated = await this.financeRepo.updatePayment(payment.id, { status: "FAILED" });
    await writeAuditLog({ action: "webhook_payment_failed", entity: "payment", entityId: payment.id, after: updated });
    return updated;
  }

  async handleRazorpayPaymentCaptured(orderId: string, providerPaymentId?: string) {
    const payment = await this.financeRepo.findPaymentByProviderSessionId(orderId);
    if (!payment || payment.status === "SUCCEEDED") return;

    const updated = await this.financeRepo.updatePayment(payment.id, {
      status: "SUCCEEDED",
      providerPaymentId,
      paidAt: new Date(),
    });

    if (payment.invoiceId) {
      await this.applyPaymentToInvoice(payment.invoiceId, Number(payment.amount));
    }

    await writeAuditLog({ action: "webhook_payment_succeeded", entity: "payment", entityId: payment.id, after: updated });
    const { dispatchWebhookEvent } = await import("../lib/webhook-dispatcher");
    await dispatchWebhookEvent("payment.succeeded", {
      paymentId: updated.id,
      invoiceId: payment.invoiceId,
      amount: Number(payment.amount),
      provider: payment.provider,
    });
    return updated;
  }

  async handleRazorpayPaymentFailed(orderId: string) {
    const payment = await this.financeRepo.findPaymentByProviderSessionId(orderId);
    if (!payment || payment.status !== "PENDING") return;
    const updated = await this.financeRepo.updatePayment(payment.id, { status: "FAILED" });
    await writeAuditLog({ action: "webhook_payment_failed", entity: "payment", entityId: payment.id, after: updated });
    return updated;
  }

  async listPayments(filters: { invoiceId?: string; status?: string; provider?: string }) {
    const where: Prisma.PaymentWhereInput = {};
    if (filters.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters.status) where.status = filters.status as Prisma.PaymentWhereInput["status"];
    if (filters.provider) where.provider = filters.provider as Prisma.PaymentWhereInput["provider"];
    return this.financeRepo.findManyPayments(where);
  }

  getPublicPaymentConfig() {
    return paymentGatewayService.getPublicConfig();
  }

  // ==========================================================================
  // REIMBURSEMENTS
  // ==========================================================================

  async createReimbursement(
    employeeId: string,
    data: {
      category: string;
      description: string;
      amount: number;
      currency: string;
      expenseDate: string;
      receiptFileId?: string;
      approverIds?: string[];
    },
    actorId: string,
  ) {
    let reimbursement = await this.financeRepo.createReimbursement({
      userId: employeeId,
      category: data.category,
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      receiptFileId: data.receiptFileId,
      status: "PENDING",
      notes: `Expense date: ${data.expenseDate}`,
    } as Prisma.ReimbursementUncheckedCreateInput);

    if (data.approverIds && data.approverIds.length > 0) {
      const approval = await this.approvalService.createApprovalRequest(
        {
          entityType: "reimbursement",
          entityId: reimbursement.id,
          requesterId: actorId,
          approverIds: data.approverIds,
          metadata: { amount: data.amount, category: data.category },
        },
        actorId,
      );
      reimbursement = await this.financeRepo.updateReimbursement(reimbursement.id, {
        approvalRequestId: approval.id,
      });
    }

    await writeAuditLog({ userId: actorId, action: "create", entity: "reimbursement", entityId: reimbursement.id, after: reimbursement });
    return reimbursement;
  }

  async reviewReimbursement(id: string, data: { status: "APPROVED" | "REJECTED"; reviewNotes?: string }, actorId: string) {
    const existing = await this.financeRepo.findReimbursementById(id);
    if (!existing) throw new AppError("REIMBURSEMENT_NOT_FOUND", "Reimbursement not found", 404);
    if (existing.status !== "PENDING") {
      throw new AppError("REIMBURSEMENT_ALREADY_REVIEWED", "Reimbursement already reviewed", 400);
    }

    const updated = await this.financeRepo.updateReimbursement(id, {
      status: data.status,
      reviewedById: actorId,
      reviewedAt: new Date(),
      reviewNotes: data.reviewNotes,
    });

    await writeAuditLog({ userId: actorId, action: "review", entity: "reimbursement", entityId: id, before: existing, after: updated });
    return updated;
  }

  async markReimbursementPaid(id: string, data: { paymentReference?: string }, actorId: string) {
    const existing = await this.financeRepo.findReimbursementById(id);
    if (!existing) throw new AppError("REIMBURSEMENT_NOT_FOUND", "Reimbursement not found", 404);
    if (existing.status !== "APPROVED") {
      throw new AppError("REIMBURSEMENT_NOT_APPROVED", "Only approved reimbursements can be marked as paid", 400);
    }

    const updated = await this.financeRepo.updateReimbursement(id, {
      status: "PAID",
      paidAt: new Date(),
      paymentReference: data.paymentReference,
    });

    await writeAuditLog({ userId: actorId, action: "mark_paid", entity: "reimbursement", entityId: id, before: existing, after: updated });
    return updated;
  }

  async listReimbursements(filters: { employeeId?: string; status?: string }) {
    const where: Prisma.ReimbursementWhereInput = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status as Prisma.ReimbursementWhereInput["status"];
    return this.financeRepo.findManyReimbursements(where);
  }

  async getReimbursementById(id: string) {
    const reimbursement = await this.financeRepo.findReimbursementById(id);
    if (!reimbursement) throw new AppError("REIMBURSEMENT_NOT_FOUND", "Reimbursement not found", 404);
    return reimbursement;
  }

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  async getFinanceDashboard() {
    const [invoiceTotals, paymentTotals, receivables, pendingReimbursements, recentInvoices] = await Promise.all([
      this.financeRepo.sumInvoiceTotalsByStatus(),
      this.financeRepo.sumPaymentsByProvider(),
      this.financeRepo.sumOutstandingReceivables(),
      this.financeRepo.countPendingReimbursements(),
      this.financeRepo.findManyInvoices(),
    ]);

    const outstandingReceivables = round2(
      Number(receivables._sum.totalAmount ?? 0) - Number(receivables._sum.amountPaid ?? 0),
    );

    return {
      invoicesByStatus: invoiceTotals.map((row) => ({
        status: row.status,
        count: row._count._all,
        totalAmount: Number(row._sum.totalAmount ?? 0),
        amountPaid: Number(row._sum.amountPaid ?? 0),
      })),
      paymentsByProvider: paymentTotals.map((row) => ({
        provider: row.provider,
        status: row.status,
        count: row._count._all,
        totalAmount: Number(row._sum.amount ?? 0),
      })),
      outstandingReceivables,
      pendingReimbursements,
      recentInvoices: recentInvoices.slice(0, 10),
    };
  }
}

export const financeService = new FinanceService();
