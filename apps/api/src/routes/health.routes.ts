import { Router } from "express";
import { healthController } from "../controllers/health.controller";

const healthRouter = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check (includes DB connectivity)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service and database status
 *       503:
 *         description: Service degraded (DB unreachable)
 */
healthRouter.get("/", (req, res, next) =>
  healthController.getHealth(req, res, next),
);

export { healthRouter };
