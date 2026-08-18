import { Request, Response, NextFunction } from "express";
import { financeService } from "../services/finance.service";
import { sendSuccess } from "../lib/response";
import { paginationMeta, resolveOptionalPagination } from "../lib/pagination";

export class FinanceController {
  // -- Clients ------------------------------------------------------------

  createClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await financeService.createClient(req.body, req.user!.userId);
      return sendSuccess(res, client, 201);
    } catch (error) {
      next(error);
    }
  };

  updateClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await financeService.updateClient(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, client);
    } catch (error) {
      next(error);
    }
  };

  deleteClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await financeService.deleteClient(req.params.id, req.user!.userId);
      return sendSuccess(res, { message: "Client deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  listClients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, search } = req.query;
      const clients = await financeService.listClients({ status: status as string, search: search as string });
      return sendSuccess(res, clients);
    } catch (error) {
      next(error);
    }
  };

  getClient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await financeService.getClientById(req.params.id);
      return sendSuccess(res, client);
    } catch (error) {
      next(error);
    }
  };

  // -- Invoices -------------------------------------------------------------

  createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await financeService.createInvoice(req.body, req.user!.userId);
      return sendSuccess(res, invoice, 201);
    } catch (error) {
      next(error);
    }
  };

  updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await financeService.updateInvoice(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  };

  submitInvoiceForApproval = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await financeService.submitInvoiceForApproval(req.params.id, req.body.approverIds, req.user!.userId);
      return sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  };

  approveInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await financeService.decideInvoiceApproval(req.params.id, "APPROVE", req.user!.userId, req.body.notes);
      return sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  };

  rejectInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await financeService.decideInvoiceApproval(req.params.id, "REJECT", req.user!.userId, req.body.notes);
      return sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  };

  sendInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await financeService.sendInvoice(req.params.id, req.user!.userId);
      return sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  };

  cancelInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await financeService.cancelInvoice(req.params.id, req.user!.userId);
      return sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  };

  listInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { clientId, status, from, to, page, pageSize } = req.query;
      const pagination = resolveOptionalPagination({
        page: page !== undefined ? Number(page) : undefined,
        pageSize: pageSize !== undefined ? Number(pageSize) : undefined,
      });
      const result = await financeService.listInvoices({
        clientId: clientId as string,
        status: status as string,
        from: from as string,
        to: to as string,
        pagination: pagination ?? undefined,
      });
      return sendSuccess(
        res,
        result.rows,
        200,
        pagination ? paginationMeta(pagination, result.total) : null,
      );
    } catch (error) {
      next(error);
    }
  };

  getInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await financeService.getInvoiceById(req.params.id);
      return sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  };

  markOverdueInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await financeService.markOverdueInvoices(req.user!.userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // -- Payments -------------------------------------------------------------

  recordManualPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await financeService.recordManualPayment(req.body, req.user!.userId);
      return sendSuccess(res, payment, 201);
    } catch (error) {
      next(error);
    }
  };

  createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await financeService.createCheckoutSession(req.body.invoiceId, req.body.provider, req.user!.userId);
      return sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  };

  listPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { invoiceId, status, provider } = req.query;
      const payments = await financeService.listPayments({
        invoiceId: invoiceId as string,
        status: status as string,
        provider: provider as string,
      });
      return sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  };

  getPublicPaymentConfig = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const config = financeService.getPublicPaymentConfig();
      return sendSuccess(res, config);
    } catch (error) {
      next(error);
    }
  };

  // -- Reimbursements --------------------------------------------------------

  createReimbursement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.body.employeeId ?? req.user!.userId;
      const reimbursement = await financeService.createReimbursement(employeeId, req.body, req.user!.userId);
      return sendSuccess(res, reimbursement, 201);
    } catch (error) {
      next(error);
    }
  };

  reviewReimbursement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reimbursement = await financeService.reviewReimbursement(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, reimbursement);
    } catch (error) {
      next(error);
    }
  };

  markReimbursementPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reimbursement = await financeService.markReimbursementPaid(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, reimbursement);
    } catch (error) {
      next(error);
    }
  };

  listReimbursements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, status } = req.query;
      const reimbursements = await financeService.listReimbursements({
        employeeId: employeeId as string,
        status: status as string,
      });
      return sendSuccess(res, reimbursements);
    } catch (error) {
      next(error);
    }
  };

  getReimbursement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reimbursement = await financeService.getReimbursementById(req.params.id);
      return sendSuccess(res, reimbursement);
    } catch (error) {
      next(error);
    }
  };

  // -- Dashboard --------------------------------------------------------------

  getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const dashboard = await financeService.getFinanceDashboard();
      return sendSuccess(res, dashboard);
    } catch (error) {
      next(error);
    }
  };
}
