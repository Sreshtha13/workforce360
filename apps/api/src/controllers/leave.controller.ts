import { Request, Response, NextFunction } from "express";
import { LeaveService } from "../services/leave.service";
import { sendSuccess } from "../lib/response";

export class LeaveController {
  private leaveService = new LeaveService();

  createLeaveType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leaveType = await this.leaveService.createLeaveType(req.body, req.user!.userId);
      return sendSuccess(res, leaveType, 201);
    } catch (error) {
      next(error);
    }
  };

  updateLeaveType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leaveType = await this.leaveService.updateLeaveType(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, leaveType);
    } catch (error) {
      next(error);
    }
  };

  deleteLeaveType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.leaveService.deleteLeaveType(req.params.id, req.user!.userId);
      return sendSuccess(res, { message: "Leave type deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  listLeaveTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
      const leaveTypes = await this.leaveService.listLeaveTypes({ isActive });
      return sendSuccess(res, leaveTypes);
    } catch (error) {
      next(error);
    }
  };

  getLeaveType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leaveType = await this.leaveService.getLeaveTypeById(req.params.id);
      return sendSuccess(res, leaveType);
    } catch (error) {
      next(error);
    }
  };

  initializeLeaveBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const balance = await this.leaveService.initializeLeaveBalance(req.body, req.user!.userId);
      return sendSuccess(res, balance, 201);
    } catch (error) {
      next(error);
    }
  };

  adjustLeaveBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const balance = await this.leaveService.adjustLeaveBalance(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, balance);
    } catch (error) {
      next(error);
    }
  };

  getLeaveBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, leaveTypeId, year } = req.query;
      const balance = await this.leaveService.getLeaveBalance(
        employeeId as string,
        leaveTypeId as string,
        parseInt(year as string)
      );
      return sendSuccess(res, balance);
    } catch (error) {
      next(error);
    }
  };

  listLeaveBalances = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, leaveTypeId, year } = req.query;
      const balances = await this.leaveService.listLeaveBalances({
        employeeId: employeeId as string,
        leaveTypeId: leaveTypeId as string,
        year: year ? parseInt(year as string) : undefined,
      });
      return sendSuccess(res, balances);
    } catch (error) {
      next(error);
    }
  };

  applyLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.params.employeeId || req.user!.userId;
      const application = await this.leaveService.applyLeave(employeeId, req.body, req.user!.userId);
      return sendSuccess(res, application, 201);
    } catch (error) {
      next(error);
    }
  };

  reviewLeaveApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const application = await this.leaveService.reviewLeaveApplication(
        req.params.id,
        req.body,
        req.user!.userId
      );
      return sendSuccess(res, application);
    } catch (error) {
      next(error);
    }
  };

  cancelLeaveApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const application = await this.leaveService.cancelLeaveApplication(
        req.params.id,
        req.user!.userId,
        req.body.reason
      );
      return sendSuccess(res, application);
    } catch (error) {
      next(error);
    }
  };

  listLeaveApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, leaveTypeId, status, from, to } = req.query;
      const applications = await this.leaveService.listLeaveApplications({
        employeeId: employeeId as string,
        leaveTypeId: leaveTypeId as string,
        status: status as string,
        from: from as string,
        to: to as string,
      });
      return sendSuccess(res, applications);
    } catch (error) {
      next(error);
    }
  };

  getLeaveApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const application = await this.leaveService.getLeaveApplicationById(req.params.id);
      return sendSuccess(res, application);
    } catch (error) {
      next(error);
    }
  };

  getLeaveStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, year } = req.query;
      const stats = await this.leaveService.getLeaveStats(
        employeeId as string,
        parseInt(year as string)
      );
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
