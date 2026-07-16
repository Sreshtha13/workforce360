import { Router } from "express";
import { healthController } from "../controllers/health.controller";

const healthRouter = Router();

/**
 * GET /api/health
 * Public health check that queries Postgres via Prisma (repository layer).
 * Proves DB access lives only in the API — never in /apps/web.
 */
healthRouter.get("/", (req, res, next) =>
  healthController.getHealth(req, res, next),
);

export { healthRouter };
