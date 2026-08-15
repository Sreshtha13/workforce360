import { Router } from "express";
import { healthRouter } from "./health.routes";
import { authRouter } from "./auth.routes";
import { organizationRouter } from "./organization.routes";
import { userRouter } from "./user.routes";
import { roleRouter } from "./role.routes";
import { swaggerRouter } from "./swagger.routes";
import { careersRouter } from "./careers.routes";
import { recruitmentRouter } from "./recruitment.routes";
import { hrRouter } from "./hr.routes";
import { portalRouter } from "./portal.routes";
import { storageRouter } from "./storage.routes";
import { dashboardRouter } from "./dashboard.routes";
import bdRouter from "./bd.routes";
import pmRouter from "./pm.routes";
import { attendanceRouter } from "./attendance.routes";
import { leaveRouter } from "./leave.routes";
import { approvalRouter } from "./approval.routes";
import { assetRouter } from "./asset.routes";
import { financeRouter } from "./finance.routes";
import { payrollRouter } from "./payroll.routes";
import { notificationRouter } from "./notification.routes";
import { helpdeskRouter } from "./helpdesk.routes";
import { documentRouter } from "./document.routes";
import { reportRouter } from "./report.routes";
import { auditRouter } from "./audit.routes";
import {
  settingsRouter,
  templateRouter,
  adminExtrasRouter,
} from "./settings.routes";
import { securityRouter } from "./security.routes";
import { integrationRouter } from "./integration.routes";
import engineeringRouter from "./engineering.routes";

const apiRouter = Router();

apiRouter.use("/docs", swaggerRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/organization", organizationRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/roles", roleRouter);
apiRouter.use("/careers", careersRouter);
apiRouter.use("/recruitment", recruitmentRouter);
apiRouter.use("/hr", hrRouter);
apiRouter.use("/portal", portalRouter);
apiRouter.use("/storage", storageRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/bd", bdRouter);
apiRouter.use("/pm", pmRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/leave", leaveRouter);
apiRouter.use("/approvals", approvalRouter);
apiRouter.use("/assets", assetRouter);
apiRouter.use("/finance", financeRouter);
apiRouter.use("/payroll", payrollRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/helpdesk", helpdeskRouter);
apiRouter.use("/documents", documentRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/audit-logs", auditRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/notification-templates", templateRouter);
apiRouter.use("/admin", adminExtrasRouter);
apiRouter.use("/security-events", securityRouter);
apiRouter.use("/integrations", integrationRouter);
apiRouter.use("/engineering", engineeringRouter);

export { apiRouter };
