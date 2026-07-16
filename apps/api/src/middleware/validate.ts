import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject, ZodEffects, ZodTypeAny } from "zod";
import { sendError } from "../lib/response";

type Schema = AnyZodObject | ZodEffects<AnyZodObject> | ZodTypeAny;

/**
 * Zod validation middleware — authoritative input validation layer.
 * Apply after auth/RBAC on protected routes.
 */
export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      sendError(res, 400, {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: result.error.flatten(),
      });
      return;
    }

    next();
  };
}
