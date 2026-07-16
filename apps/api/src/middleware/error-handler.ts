import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { sendError } from "../lib/response";

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, {
    code: "NOT_FOUND",
    message: "Route not found",
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    sendError(res, 400, {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: err.flatten(),
    });
    return;
  }

  console.error(err);
  sendError(res, 500, {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  });
}
