import { Router } from "express";
import { healthRouter } from "./health.routes";
import { authRouter } from "./auth.routes";
import { organizationRouter } from "./organization.routes";
import { userRouter } from "./user.routes";
import { roleRouter } from "./role.routes";
import { swaggerRouter } from "./swagger.routes";

const apiRouter = Router();

apiRouter.use("/docs", swaggerRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/organization", organizationRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/roles", roleRouter);

export { apiRouter };
