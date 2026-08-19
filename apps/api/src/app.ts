import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env, isAllowedCorsOrigin } from "./lib/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { apiRouter } from "./routes";

import { StorageController } from "./controllers/storage.controller";
import { PaymentWebhookController } from "./controllers/payment-webhook.controller";

const storageController = new StorageController();
const paymentWebhookController = new PaymentWebhookController();

export function createApp() {
  const app = express();

  // Scalar API docs load from jsDelivr; relax CSP in dev and allow the CDN in production.
  app.use(
    helmet({
      contentSecurityPolicy:
        env.NODE_ENV === "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:", "https:"],
                fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
                connectSrc: ["'self'"],
              },
            }
          : false,
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
  // Stripe/Razorpay webhooks need the raw body for signature verification —
  // must be registered before express.json() consumes the stream.
  app.post(
    "/api/payment-webhooks/stripe",
    express.raw({ type: "application/json", limit: "1mb" }),
    paymentWebhookController.stripeWebhook,
  );
  app.post(
    "/api/payment-webhooks/razorpay",
    express.raw({ type: "application/json", limit: "1mb" }),
    paymentWebhookController.razorpayWebhook,
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestLogger);

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
