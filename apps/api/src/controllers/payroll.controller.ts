import { Request, Response, NextFunction } from "express";
import { payrollService } from "../services/payroll.service";
import { sendSuccess } from "../lib/response";

export class PayrollController {
  // -- Salary Structures ------------------------------------------------------

  createSalaryStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const structure = await payrollService.createSalaryStructure(req.body, req.user!.userId);
      return sendSuccess(res, structure, 201);
    } catch (error) {
      next(error);
    }
  };

  listSalaryStructures = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.query;
      const structures = await payrollService.listSalaryStructures({ employeeId: employeeId as string });
      return sendSuccess(res, structures);
    } catch (error) {
      next(error);
    }
  };

  getActiveSalaryStructure = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const structure = await payrollService.getActiveSalaryStructure(req.params.employeeId);
      return sendSuccess(res, structure);
    } catch (error) {
      next(error);
    }
  };

  // -- Salary Revisions ---------------------------------------------------------

  requestSalaryRevision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const revision = await payrollService.requestSalaryRevision(req.body, req.user!.userId);
      return sendSuccess(res, revision, 201);
    } catch (error) {
      next(error);
    }
  };

  approveSalaryRevision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const revision = await payrollService.decideSalaryRevision(req.params.id, "APPROVE", req.user!.userId, req.body.reviewNotes);
      return sendSuccess(res, revision);
    } catch (error) {
      next(error);
    }
  };

  rejectSalaryRevision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const revision = await payrollService.decideSalaryRevision(req.params.id, "REJECT", req.user!.userId, req.body.reviewNotes);
      return sendSuccess(res, revision);
    } catch (error) {
      next(error);
    }
  };

  listSalaryRevisions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, status } = req.query;
      const revisions = await payrollService.listSalaryRevisions({
        employeeId: employeeId as string,
        status: status as string,
      });
      return sendSuccess(res, revisions);
    } catch (error) {
      next(error);
    }
  };

  getSalaryRevision = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const revision = await payrollService.getSalaryRevisionById(req.params.id);
      return sendSuccess(res, revision);
    } catch (error) {
      next(error);
    }
  };

  // -- Payroll Runs ---------------------------------------------------------------

  createPayrollRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await payrollService.createPayrollRun(req.body, req.user!.userId);
      return sendSuccess(res, run, 201);
    } catch (error) {
      next(error);
    }
  };

  calculatePayrollRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await payrollService.calculatePayrollRun(req.params.id, req.user!.userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  submitPayrollRunForApproval = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await payrollService.submitPayrollRunForApproval(req.params.id, req.body.approverIds, req.user!.userId);
      return sendSuccess(res, run);
    } catch (error) {
      next(error);
    }
  };

  approvePayrollRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await payrollService.decidePayrollRunApproval(req.params.id, "APPROVE", req.user!.userId, req.body.notes);
      return sendSuccess(res, run);
    } catch (error) {
      next(error);
    }
  };

  rejectPayrollRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await payrollService.decidePayrollRunApproval(req.params.id, "REJECT", req.user!.userId, req.body.notes);
      return sendSuccess(res, run);
    } catch (error) {
      next(error);
    }
  };

  processPayrollRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await payrollService.processPayrollRun(req.params.id, req.user!.userId);
      return sendSuccess(res, run);
    } catch (error) {
      next(error);
    }
  };

  markPayrollRunPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await payrollService.markPayrollRunPaid(req.params.id, req.user!.userId);
      return sendSuccess(res, run);
    } catch (error) {
      next(error);
    }
  };

  cancelPayrollRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await payrollService.cancelPayrollRun(req.params.id, req.user!.userId);
      return sendSuccess(res, run);
    } catch (error) {
      next(error);
    }
  };

  listPayrollRuns = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, status } = req.query;
      const runs = await payrollService.listPayrollRuns({
        year: year ? parseInt(year as string) : undefined,
        status: status as string,
      });
      return sendSuccess(res, runs);
    } catch (error) {
      next(error);
    }
  };

  getPayrollRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = await payrollService.getPayrollRunById(req.params.id);
      return sendSuccess(res, run);
    } catch (error) {
      next(error);
    }
  };

  // -- Payslips (admin) ---------------------------------------------------------

  listPayslips = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, year } = req.query;
      const payslips = await payrollService.listPayslips({
        employeeId: employeeId as string,
        year: year ? parseInt(year as string) : undefined,
      });
      return sendSuccess(res, payslips);
    } catch (error) {
      next(error);
    }
  };
}
