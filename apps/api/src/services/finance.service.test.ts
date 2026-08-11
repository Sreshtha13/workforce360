import { describe, it, expect, beforeEach, vi } from "vitest";
import { FinanceService } from "./finance.service";
import { FinanceRepository } from "../repositories/finance.repository";
import { ApprovalService } from "./approval.service";
import { AppError } from "../lib/app-error";

vi.mock("../repositories/finance.repository");
vi.mock("./approval.service");
vi.mock("./payment-gateway.service", () => ({
  paymentGatewayService: {
    createStripeCheckoutSession: vi.fn(),
    createRazorpayOrder: vi.fn(),
    getPublicConfig: vi.fn(),
  },
}));
vi.mock("../lib/audit");
vi.mock("../lib/prisma", () => ({
  prisma: {
    invoice: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));

describe("FinanceService", () => {
  let financeService: FinanceService;
  let financeRepo: FinanceRepository;
  let approvalService: ApprovalService;

  beforeEach(() => {
    financeService = new FinanceService();
    financeRepo = (financeService as any).financeRepo;
    approvalService = (financeService as any).approvalService;
  });

  describe("Invoice total calculation", () => {
    const mockClient = { id: "client-1", name: "Acme Corp" };

    it("computes subtotal and total from line items, tax, and discount", async () => {
      vi.spyOn(financeRepo, "findClientById").mockResolvedValue(mockClient as any);
      vi.spyOn(financeRepo, "countInvoicesForYear").mockResolvedValue(0);
      vi.spyOn(financeRepo, "createInvoice").mockImplementation(async (data: any) => data as any);

      const result = await financeService.createInvoice(
        {
          clientId: "client-1",
          issueDate: "2024-01-01",
          dueDate: "2024-01-31",
          currency: "USD",
          taxAmount: 50,
          discountAmount: 20,
          lineItems: [
            { description: "Consulting", quantity: 10, unitPrice: 100 },
            { description: "Support", quantity: 2, unitPrice: 25 },
          ],
        },
        "actor-1",
      );

      // subtotal = 10*100 + 2*25 = 1050; total = 1050 + 50 - 20 = 1080
      expect(result.subtotal).toBe(1050);
      expect(result.totalAmount).toBe(1080);
      expect(result.amountPaid).toBe(0);
      expect(result.status).toBe("DRAFT");
    });

    it("rounds fractional line-item totals to 2 decimals", async () => {
      vi.spyOn(financeRepo, "findClientById").mockResolvedValue(mockClient as any);
      vi.spyOn(financeRepo, "countInvoicesForYear").mockResolvedValue(0);
      vi.spyOn(financeRepo, "createInvoice").mockImplementation(async (data: any) => data as any);

      const result = await financeService.createInvoice(
        {
          clientId: "client-1",
          issueDate: "2024-01-01",
          dueDate: "2024-01-31",
          currency: "USD",
          taxAmount: 0,
          discountAmount: 0,
          lineItems: [{ description: "Item", quantity: 3, unitPrice: 10.005 }],
        },
        "actor-1",
      );

      expect(result.subtotal).toBe(30.02);
      expect(result.totalAmount).toBe(30.02);
    });

    it("rejects a negative invoice total", async () => {
      vi.spyOn(financeRepo, "findClientById").mockResolvedValue(mockClient as any);

      await expect(
        financeService.createInvoice(
          {
            clientId: "client-1",
            issueDate: "2024-01-01",
            dueDate: "2024-01-31",
            currency: "USD",
            taxAmount: 0,
            discountAmount: 1000,
            lineItems: [{ description: "Item", quantity: 1, unitPrice: 100 }],
          },
          "actor-1",
        ),
      ).rejects.toThrow(AppError);
    });

    it("rejects a due date earlier than the issue date", async () => {
      vi.spyOn(financeRepo, "findClientById").mockResolvedValue(mockClient as any);

      await expect(
        financeService.createInvoice(
          {
            clientId: "client-1",
            issueDate: "2024-01-31",
            dueDate: "2024-01-01",
            currency: "USD",
            taxAmount: 0,
            discountAmount: 0,
            lineItems: [{ description: "Item", quantity: 1, unitPrice: 100 }],
          },
          "actor-1",
        ),
      ).rejects.toThrow("Due date must be on or after the issue date");
    });

    it("throws when the client does not exist", async () => {
      vi.spyOn(financeRepo, "findClientById").mockResolvedValue(null);

      await expect(
        financeService.createInvoice(
          {
            clientId: "missing-client",
            issueDate: "2024-01-01",
            dueDate: "2024-01-31",
            currency: "USD",
            taxAmount: 0,
            discountAmount: 0,
            lineItems: [{ description: "Item", quantity: 1, unitPrice: 100 }],
          },
          "actor-1",
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe("Invoice approval workflow", () => {
    it("marks the invoice APPROVED when the approval request is approved", async () => {
      const invoice = { id: "inv-1", status: "PENDING_APPROVAL", approvalRequestId: "req-1" };
      vi.spyOn(financeRepo, "findInvoiceById").mockResolvedValue(invoice as any);
      vi.spyOn(approvalService, "approveRequest").mockResolvedValue({ status: "APPROVED" } as any);
      vi.spyOn(financeRepo, "updateInvoice").mockImplementation(async (_id, data: any) => ({ ...invoice, ...data }) as any);

      const result = await financeService.decideInvoiceApproval("inv-1", "APPROVE", "approver-1");

      expect(result.status).toBe("APPROVED");
    });

    it("marks the invoice REJECTED when the approval request is rejected", async () => {
      const invoice = { id: "inv-1", status: "PENDING_APPROVAL", approvalRequestId: "req-1" };
      vi.spyOn(financeRepo, "findInvoiceById").mockResolvedValue(invoice as any);
      vi.spyOn(approvalService, "rejectRequest").mockResolvedValue({ status: "REJECTED" } as any);
      vi.spyOn(financeRepo, "updateInvoice").mockImplementation(async (_id, data: any) => ({ ...invoice, ...data }) as any);

      const result = await financeService.decideInvoiceApproval("inv-1", "REJECT", "approver-1", "Missing details");

      expect(result.status).toBe("REJECTED");
    });

    it("rejects deciding on an invoice that is not pending approval", async () => {
      vi.spyOn(financeRepo, "findInvoiceById").mockResolvedValue({ id: "inv-1", status: "DRAFT" } as any);

      await expect(financeService.decideInvoiceApproval("inv-1", "APPROVE", "approver-1")).rejects.toThrow(AppError);
    });
  });

  describe("Invoice cancellation guard", () => {
    it("prevents cancelling a paid invoice", async () => {
      vi.spyOn(financeRepo, "findInvoiceById").mockResolvedValue({ id: "inv-1", status: "PAID" } as any);

      await expect(financeService.cancelInvoice("inv-1", "actor-1")).rejects.toThrow(AppError);
    });

    it("allows cancelling a sent invoice", async () => {
      vi.spyOn(financeRepo, "findInvoiceById").mockResolvedValue({ id: "inv-1", status: "SENT" } as any);
      vi.spyOn(financeRepo, "updateInvoice").mockResolvedValue({ id: "inv-1", status: "CANCELLED" } as any);

      const result = await financeService.cancelInvoice("inv-1", "actor-1");
      expect(result.status).toBe("CANCELLED");
    });
  });

  describe("Payment tracking (accounts receivable)", () => {
    it("marks the invoice PARTIALLY_PAID when a manual payment covers only part of the balance", async () => {
      const invoice = { id: "inv-1", totalAmount: 1000, amountPaid: 0 };
      vi.spyOn(financeRepo, "findInvoiceById").mockResolvedValue(invoice as any);
      vi.spyOn(financeRepo, "createPayment").mockResolvedValue({ id: "pay-1" } as any);
      const updateSpy = vi.spyOn(financeRepo, "updateInvoice").mockResolvedValue({} as any);

      await financeService.recordManualPayment(
        { invoiceId: "inv-1", amount: 400, currency: "USD" },
        "actor-1",
      );

      expect(updateSpy).toHaveBeenCalledWith("inv-1", { amountPaid: 400, status: "PARTIALLY_PAID" });
    });

    it("marks the invoice PAID once the full balance is covered", async () => {
      const invoice = { id: "inv-1", totalAmount: 1000, amountPaid: 400 };
      vi.spyOn(financeRepo, "findInvoiceById").mockResolvedValue(invoice as any);
      vi.spyOn(financeRepo, "createPayment").mockResolvedValue({ id: "pay-2" } as any);
      const updateSpy = vi.spyOn(financeRepo, "updateInvoice").mockResolvedValue({} as any);

      await financeService.recordManualPayment(
        { invoiceId: "inv-1", amount: 600, currency: "USD" },
        "actor-1",
      );

      expect(updateSpy).toHaveBeenCalledWith("inv-1", { amountPaid: 1000, status: "PAID" });
    });
  });
});
