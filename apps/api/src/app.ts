import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env, isAllowedCorsOrigin } from "./lib/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes";

import { StorageController } from "./controllers/storage.controller";

const storageController = new StorageController();

export function createApp() {
  const app = express();

  // Relax CSP for Swagger UI assets in development
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedCorsOrigin(origin)) {
          callback(null, origin ?? true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    }),
  );
  // Local dev file uploads must run before express.json() consumes the body
  app.put(
    "/api/storage/upload/:uploadToken",
    express.raw({ type: "*/*", limit: "10mb" }),
    storageController.localUpload,
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/", (_req, res) => {
    res.json({
      data: {
        name: "Workforce 360 ERP API",
        version: "0.1.0",
        docs: "/api/docs",
        openapi: "/api/docs/openapi.json",
        health: "/api/health",
        endpoints: {
          auth: "/api/auth",
          users: "/api/users",
          roles: "/api/roles",
          organization: "/api/organization",
        },
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
