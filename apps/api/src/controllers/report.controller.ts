import type { Request, Response } from "express";
import type { ReportFormat, ReportType } from "@prisma/client";
import { sendSuccess, sendError } from "../lib/response";
import { AppError } from "../lib/app-error";
import { reportService } from "../services/report.service";
import type {
  CreateReportScheduleInput,
  ReportFiltersInput,
  UpdateReportScheduleInput,
} from "../schemas/report.schema";

function handleError(res: Response, error: unknown, fallback: string): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, { code: error.code, message: error.message });
    return;
  }
  sendError(res, 500, {
    code: "REPORT_ERROR",
    message: error instanceof Error ? error.message : fallback,
  });
}

export class ReportController {
  getKpis = async (req: Request, res: Response): Promise<void> => {
    try {
      const scope = (req.params.scope || "executive") as
        | "executive"
        | "hr"
        | "finance"
        | "payroll"
        | "project";
      const filters = req.query as ReportFiltersInput;
      const data = await reportService.getDashboardKpis(scope, filters);
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to load KPIs");
    }
  };

  getReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const type = String(req.params.type).toUpperCase() as ReportType;
      const filters = req.query as ReportFiltersInput;
      const data = await reportService.getReportData(type, filters);
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to load report");
    }
  };

  exportReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const type = String(req.params.type).toUpperCase() as ReportType;
      const format = String(req.query.format || "csv").toUpperCase() as ReportFormat;
      const filters = req.query as ReportFiltersInput;
      const exported = await reportService.exportReport(type, format, filters);

      res.setHeader("Content-Type", exported.contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${exported.filename}"`,
      );
      res.send(exported.buffer);
    } catch (error) {
      handleError(res, error, "Failed to export report");
    }
  };

  listSchedules = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await reportService.listSchedules();
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to list schedules");
    }
  };

  createSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateReportScheduleInput;
      const data = await reportService.createSchedule(body, req.user!.userId);
      sendSuccess(res, data, 201);
    } catch (error) {
      handleError(res, error, "Failed to create schedule");
    }
  };

  updateSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as UpdateReportScheduleInput;
      const data = await reportService.updateSchedule(
        req.params.id,
        body,
        req.user!.userId,
      );
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to update schedule");
    }
  };

  deleteSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await reportService.deleteSchedule(req.params.id, req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to delete schedule");
    }
  };

  runDue = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await reportService.runDueSchedules();
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to run schedules");
    }
  };
}
