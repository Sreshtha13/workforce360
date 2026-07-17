import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject, ZodEffects, ZodTypeAny } from "zod";
import { sendError } from "../lib/response";

type Schema = AnyZodObject | ZodEffects<AnyZodObject> | ZodTypeAny;

type ValidateTarget = "body" | "query" | "params";

/**
 * Zod validation middleware — authoritative input validation layer.
 * By default validates `req.body` (matches Phase 1 schema shapes).
 * Apply after auth/RBAC on protected routes.
 */
export function validate(schema: Schema, target: ValidateTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      sendError(res, 400, {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: result.error.flatten(),
      });
      return;
    }

    // Replace with parsed/coerced values
    (req as Request & Record<ValidateTarget, unknown>)[target] = result.data;
    next();
  };
}
