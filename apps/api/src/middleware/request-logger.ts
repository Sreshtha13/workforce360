import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { env } from "../lib/env";

export type RequestLogContext = {
  requestId: string;
  startMs: number;
};

/**
 * Lightweight structured request logging (no external APM required).
 * Logs one JSON line per request with latency and status.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = crypto.randomUUID();
  const startMs = Date.now();
  (req as Request & { logContext?: RequestLogContext }).logContext = { requestId, startMs };

  res.on("finish", () => {
    const durationMs = Date.now() - startMs;
    const log = {
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      type: "http_request",
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
    };
    if (res.statusCode >= 500) {
      console.error(JSON.stringify(log));
    } else if (env.NODE_ENV !== "test") {
      console.info(JSON.stringify(log));
    }
  });

  next();
}
