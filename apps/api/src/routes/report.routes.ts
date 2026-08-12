import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createReportScheduleSchema,
  reportFiltersSchema,
  updateReportScheduleSchema,
} from "../schemas/report.schema";

const reportRouter = Router();
const controller = new ReportController();

reportRouter.use(requireAuth);

reportRouter.get(
  "/kpis/:scope",
  requirePermission("report.read", "dashboard.read", "dashboard.executive.read"),
  validate(reportFiltersSchema, "query"),
  controller.getKpis,
);

reportRouter.get(
  "/schedules",
  requirePermission("report.schedule.manage"),
  controller.listSchedules,
);

reportRouter.post(
  "/schedules",
  requirePermission("report.schedule.manage"),
  validate(createReportScheduleSchema),
  controller.createSchedule,
);

reportRouter.patch(
  "/schedules/:id",
  requirePermission("report.schedule.manage"),
  validate(updateReportScheduleSchema),
  controller.updateSchedule,
);

reportRouter.delete(
  "/schedules/:id",
  requirePermission("report.schedule.manage"),
  controller.deleteSchedule,
);

reportRouter.post(
  "/schedules/run-due",
  requirePermission("report.schedule.manage"),
  controller.runDue,
);

reportRouter.get(
  "/:type/export",
  requirePermission("report.export", "report.read"),
  validate(reportFiltersSchema, "query"),
  controller.exportReport,
);

reportRouter.get(
  "/:type",
  requirePermission("report.read"),
  validate(reportFiltersSchema, "query"),
  controller.getReport,
);

export { reportRouter };
