import * as Sentry from "@sentry/node";
import { env } from "./env";

let initialized = false;

export function initSentry(): void {
  if (initialized || !env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 0,
    enabled: env.NODE_ENV !== "test",
  });
  initialized = true;
}

export { Sentry };
