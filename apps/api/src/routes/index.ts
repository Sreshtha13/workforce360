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

export { apiRouter };
