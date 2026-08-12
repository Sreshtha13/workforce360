import { Router } from "express";
import { FinanceController } from "../controllers/finance.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createClientSchema,
  updateClientSchema,
  listClientsQuerySchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  submitInvoiceApprovalSchema,
  listInvoicesQuerySchema,
  recordManualPaymentSchema,
  createCheckoutSessionSchema,
  listPaymentsQuerySchema,
  createReimbursementSchema,
  reviewReimbursementSchema,
  markReimbursementPaidSchema,
  listReimbursementsQuerySchema,
} from "../schemas/phase4.schema";
import { approveRequestSchema, rejectRequestSchema } from "../schemas/phase3.schema";

const financeRouter = Router();
const controller = new FinanceController();

// -- Dashboard ----------------------------------------------------------------
financeRouter.get(
  "/dashboard",
  requireAuth,
  requirePermission("finance.dashboard.read"),
  controller.getDashboard,
);

// -- Public payment config (publishable keys only) -----------------------------
financeRouter.get(
  "/payment-config",
  requireAuth,
  controller.getPublicPaymentConfig,
);

// -- Clients --------------------------------------------------------------------
financeRouter.post(
  "/clients",
  requireAuth,
  requirePermission("client.manage"),
  validate(createClientSchema),
  controller.createClient,
);
financeRouter.get(
  "/clients",
  requireAuth,
  requirePermission("client.read", "client.manage"),
  validate(listClientsQuerySchema, "query"),
  controller.listClients,
);
financeRouter.get(
  "/clients/:id",
  requireAuth,
  requirePermission("client.read", "client.manage"),
  controller.getClient,
);
financeRouter.put(
  "/clients/:id",
  requireAuth,
  requirePermission("client.manage"),
  validate(updateClientSchema),
  controller.updateClient,
);
financeRouter.delete(
  "/clients/:id",
  requireAuth,
  requirePermission("client.manage"),
  controller.deleteClient,
);

// -- Invoices ---------------------------------------------------------------------
financeRouter.post(
  "/invoices",
  requireAuth,
  requirePermission("invoice.manage"),
  validate(createInvoiceSchema),
  controller.createInvoice,
);
financeRouter.get(
  "/invoices",
  requireAuth,
  requirePermission("invoice.read", "invoice.manage", "invoice.approve"),
  validate(listInvoicesQuerySchema, "query"),
  controller.listInvoices,
);
financeRouter.post(
  "/invoices/mark-overdue",
  requireAuth,
  requirePermission("invoice.manage"),
  controller.markOverdueInvoices,
);
financeRouter.get(
  "/invoices/:id",
  requireAuth,
  requirePermission("invoice.read", "invoice.manage", "invoice.approve"),
  controller.getInvoice,
);
financeRouter.put(
  "/invoices/:id",
  requireAuth,
  requirePermission("invoice.manage"),
  validate(updateInvoiceSchema),
  controller.updateInvoice,
);
financeRouter.post(
  "/invoices/:id/submit",
  requireAuth,
  requirePermission("invoice.manage"),
  validate(submitInvoiceApprovalSchema),
  controller.submitInvoiceForApproval,
);
financeRouter.post(
  "/invoices/:id/approve",
  requireAuth,
  requirePermission("invoice.approve"),
  validate(approveRequestSchema),
  controller.approveInvoice,
);
financeRouter.post(
  "/invoices/:id/reject",
  requireAuth,
  requirePermission("invoice.approve"),
  validate(rejectRequestSchema),
  controller.rejectInvoice,
);
financeRouter.post(
  "/invoices/:id/send",
  requireAuth,
  requirePermission("invoice.manage"),
  controller.sendInvoice,
);
financeRouter.post(
  "/invoices/:id/cancel",
  requireAuth,
  requirePermission("invoice.manage"),
  controller.cancelInvoice,
);

// -- Payments ---------------------------------------------------------------------
financeRouter.post(
  "/payments/manual",
  requireAuth,
  requirePermission("payment.manage"),
  validate(recordManualPaymentSchema),
  controller.recordManualPayment,
);
financeRouter.post(
  "/payments/checkout-session",
  requireAuth,
  requirePermission("payment.manage"),
  validate(createCheckoutSessionSchema),
  controller.createCheckoutSession,
);
financeRouter.get(
  "/payments",
  requireAuth,
  requirePermission("payment.read", "payment.manage"),
  validate(listPaymentsQuerySchema, "query"),
  controller.listPayments,
);

// -- Reimbursements -----------------------------------------------------------------
financeRouter.post(
  "/reimbursements",
  requireAuth,
  validate(createReimbursementSchema),
  controller.createReimbursement,
);
financeRouter.get(
  "/reimbursements",
  requireAuth,
  requirePermission("reimbursement.read", "reimbursement.review"),
  validate(listReimbursementsQuerySchema, "query"),
  controller.listReimbursements,
);
financeRouter.get(
  "/reimbursements/:id",
  requireAuth,
  requirePermission("reimbursement.read", "reimbursement.review"),
  controller.getReimbursement,
);
financeRouter.post(
  "/reimbursements/:id/review",
  requireAuth,
  requirePermission("reimbursement.review"),
  validate(reviewReimbursementSchema),
  controller.reviewReimbursement,
);
financeRouter.post(
  "/reimbursements/:id/mark-paid",
  requireAuth,
  requirePermission("reimbursement.review"),
  validate(markReimbursementPaidSchema),
  controller.markReimbursementPaid,
);

export { financeRouter };
