import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./lib/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) => {
    res.json({
      data: {
        name: "Workforce 360 ERP API",
        version: "0.1.0",
        docs: "/api/health",
      },
      error: null,
      meta: null,
    });
  });

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
