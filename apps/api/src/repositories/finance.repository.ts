import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";
import type { PaginationQuery } from "../lib/pagination";

const invoiceInclude = {
  client: true,
  lineItems: true,
  payments: { orderBy: { createdAt: "desc" as const } },
  approvalRequest: { include: { steps: true } },
};

export class FinanceRepository {
  // -- Clients --------------------------------------------------------------

  async createClient(data: Prisma.ClientUncheckedCreateInput) {
    return prisma.client.create({ data });
  }

  async findClientById(id: string) {
    return prisma.client.findFirst({ where: { id, deletedAt: null } });
  }

  async findManyClients(where?: Prisma.ClientWhereInput) {
    return prisma.client.findMany({
      where: { ...where, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateClient(id: string, data: Prisma.ClientUncheckedUpdateInput) {
    return prisma.client.update({ where: { id }, data });
  }

  async softDeleteClient(id: string) {
    return prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // -- Invoices ---------------------------------------------------------------

  async countInvoicesForYear(year: number): Promise<number> {
    return prisma.invoice.count({
      where: {
        invoiceNumber: { startsWith: `INV-${year}-` },
      },
    });
  }

  async createInvoice(data: Prisma.InvoiceUncheckedCreateInput) {
    return prisma.invoice.create({ data, include: invoiceInclude });
  }

  async findInvoiceById(id: string) {
    return prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: invoiceInclude,
    });
  }

  async findManyInvoices(where?: Prisma.InvoiceWhereInput, pagination?: PaginationQuery) {
    const baseWhere = { ...where, deletedAt: null };
    if (pagination) {
      const skip = (pagination.page - 1) * pagination.pageSize;
      const [total, rows] = await Promise.all([
        prisma.invoice.count({ where: baseWhere }),
        prisma.invoice.findMany({
          where: baseWhere,
          include: invoiceInclude,
          orderBy: { createdAt: "desc" },
          skip,
          take: pagination.pageSize,
        }),
      ]);
      return { rows, total };
    }
    const rows = await prisma.invoice.findMany({
      where: baseWhere,
      include: invoiceInclude,
      orderBy: { createdAt: "desc" },
    });
    return { rows, total: rows.length };
  }

  async updateInvoice(id: string, data: Prisma.InvoiceUncheckedUpdateInput) {
    return prisma.invoice.update({ where: { id }, data, include: invoiceInclude });
  }

  async replaceInvoiceLineItems(
    invoiceId: string,
    lineItems: Prisma.InvoiceLineItemUncheckedCreateInput[],
  ) {
    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId } });
    await prisma.invoiceLineItem.createMany({ data: lineItems });
  }

  async findOverdueInvoiceIds(): Promise<string[]> {
    const rows = await prisma.invoice.findMany({
      where: {
        deletedAt: null,
        dueDate: { lt: new Date() },
        status: { in: ["SENT", "APPROVED", "PARTIALLY_PAID"] },
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  // -- Payments ---------------------------------------------------------------

  async createPayment(data: Prisma.PaymentUncheckedCreateInput) {
    return prisma.payment.create({ data });
  }

  async findPaymentById(id: string) {
    return prisma.payment.findFirst({ where: { id, deletedAt: null } });
  }

  async findPaymentByProviderSessionId(sessionId: string) {
    return prisma.payment.findFirst({ where: { providerSessionId: sessionId, deletedAt: null } });
  }

  async findPaymentByProviderPaymentId(paymentId: string) {
    return prisma.payment.findFirst({ where: { providerPaymentId: paymentId, deletedAt: null } });
  }

  async updatePayment(id: string, data: Prisma.PaymentUncheckedUpdateInput) {
    return prisma.payment.update({ where: { id }, data });
  }

  async findManyPayments(where?: Prisma.PaymentWhereInput) {
    return prisma.payment.findMany({
      where: { ...where, deletedAt: null },
      include: { invoice: { include: { client: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  // -- Reimbursements -----------------------------------------------------------

  async createReimbursement(data: Prisma.ReimbursementUncheckedCreateInput) {
    return prisma.reimbursement.create({ data });
  }

  async findReimbursementById(id: string) {
    return prisma.reimbursement.findFirst({
      where: { id, deletedAt: null },
      include: {
        receiptFile: true,
        approvalRequest: { include: { steps: true } },
        employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
  }

  async findManyReimbursements(where?: Prisma.ReimbursementWhereInput) {
    return prisma.reimbursement.findMany({
      where: { ...where, deletedAt: null },
      include: {
        receiptFile: true,
        employee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateReimbursement(id: string, data: Prisma.ReimbursementUncheckedUpdateInput) {
    return prisma.reimbursement.update({ where: { id }, data });
  }

  // -- Dashboard aggregates -----------------------------------------------------

  async sumInvoiceTotalsByStatus() {
    return prisma.invoice.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _sum: { totalAmount: true, amountPaid: true },
      _count: { _all: true },
    });
  }

  async sumPaymentsByProvider() {
    return prisma.payment.groupBy({
      by: ["provider", "status"],
      where: { deletedAt: null },
      _sum: { amount: true },
      _count: { _all: true },
    });
  }

  async sumOutstandingReceivables() {
    const result = await prisma.invoice.aggregate({
      where: {
        deletedAt: null,
        status: { in: ["SENT", "APPROVED", "PARTIALLY_PAID", "OVERDUE"] },
      },
      _sum: { totalAmount: true, amountPaid: true },
    });
    return result;
  }

  async countPendingReimbursements() {
    return prisma.reimbursement.count({ where: { status: "PENDING", deletedAt: null } });
  }
}
